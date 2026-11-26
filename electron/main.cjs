const { app, BrowserWindow, globalShortcut, ipcMain, Menu, Notification, powerSaveBlocker, session, Tray } = require('electron')
const { join } = require('node:path')

let window
let wakeLock
let backgroundKeys = false
let keepInTray = false
let quitting = false
let tray
const iconPath = join(__dirname, '../build/icon.ico')
const targets = ['workout', 'mobility', 'rehab', 'foam', 'checkin', 'bed', '']
const accelerators = { Space: ' ', Enter: 'enter', Left: 'arrowleft', Right: 'arrowright', M: 'm' }
const appUrl = require('node:url').pathToFileURL(join(__dirname, '../dist/index.html')).href
function bindWorkoutKeys() {
  globalShortcut.unregisterAll()
  if (!backgroundKeys || !window || window.isFocused()) return
  const failed = Object.entries(accelerators).filter(([accelerator, key]) =>
    !globalShortcut.register(accelerator, () => window?.webContents.send('workout:key', key)))
  if (failed.length) {
    globalShortcut.unregisterAll()
    backgroundKeys = false
    window.webContents.send('workout:key-error')
  }
}

function showWindow() {
  if (!window) return
  if (window.isMinimized()) window.restore()
  window.show()
  window.focus()
}
/* Reminders keep working while the app sits in the tray. */
function updateTray() {
  if (keepInTray && !tray) {
    tray = new Tray(iconPath)
    tray.setToolTip('Comeback OS · reminders on')
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: 'Open Comeback OS', click: showWindow },
      { type: 'separator' },
      { label: 'Quit', click: () => { quitting = true; app.quit() } },
    ]))
    tray.on('click', showWindow)
  }
  if (!keepInTray && tray) { tray.destroy(); tray = undefined }
}
const trusted = event => event.sender === window?.webContents && event.senderFrame?.url === appUrl

if (!app.requestSingleInstanceLock()) app.quit()
else {
  app.on('second-instance', showWindow)
  app.setAppUserModelId('local.comebackos.training')
  app.on('before-quit', () => { quitting = true })
  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, answer) => answer(false))
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (_details, answer) => answer({ cancel: true }))
    ipcMain.on('workout:wake', (event, enabled) => {
      if (event.sender !== window?.webContents || event.senderFrame?.url !== appUrl || typeof enabled !== 'boolean') return
      if (enabled && wakeLock === undefined) wakeLock = powerSaveBlocker.start('prevent-display-sleep')
      if (!enabled && wakeLock !== undefined) {
        powerSaveBlocker.stop(wakeLock)
        wakeLock = undefined
      }
    })
    ipcMain.on('workout:background-keys', (event, enabled) => {
      if (event.sender !== window?.webContents || event.senderFrame?.url !== appUrl || typeof enabled !== 'boolean') return
      backgroundKeys = enabled
      bindWorkoutKeys()
    })
    ipcMain.on('reminder:notify', (event, title, body, target) => {
      if (!trusted(event) || typeof title !== 'string' || typeof body !== 'string' || !targets.includes(target) || !Notification.isSupported()) return
      const note = new Notification({ title, body, icon: iconPath, silent: false })
      note.on('click', () => { showWindow(); window?.webContents.send('reminder:open', target) })
      note.show()
    })
    ipcMain.on('app:background', (event, enabled) => {
      if (!trusted(event) || typeof enabled !== 'boolean') return
      keepInTray = enabled
      updateTray()
      if (!enabled && window && !window.isVisible()) window.show()
    })
    ipcMain.on('app:login', (event, enabled) => {
      if (!trusted(event) || typeof enabled !== 'boolean' || !app.isPackaged) return
      app.setLoginItemSettings({ openAtLogin: enabled, args: ['--hidden'] })
    })
    window = new BrowserWindow({
      show: !process.argv.includes('--hidden'),
      width: 1480, height: 900, minWidth: 640, minHeight: 600,
      backgroundColor: '#0B111E', autoHideMenuBar: true,
      icon: join(__dirname, '../build/icon.ico'),
      webPreferences: {
        preload: join(__dirname, 'preload.cjs'), contextIsolation: true,
        nodeIntegration: false, sandbox: true, backgroundThrottling: false,
      },
    })
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
    window.webContents.on('will-navigate', event => event.preventDefault())
    window.on('focus', bindWorkoutKeys)
    window.on('blur', bindWorkoutKeys)
    window.on('close', event => { if (keepInTray && !quitting) { event.preventDefault(); window.hide() } })
    window.on('closed', () => { window = undefined; globalShortcut.unregisterAll() })
    window.loadFile(join(__dirname, '../dist/index.html'))
  })
  app.on('window-all-closed', () => app.quit())
  app.on('will-quit', () => globalShortcut.unregisterAll())
}
