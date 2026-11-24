const { app, BrowserWindow, globalShortcut, ipcMain, powerSaveBlocker, session } = require('electron')
const { join } = require('node:path')

let window
let wakeLock
let backgroundKeys = false
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

if (!app.requestSingleInstanceLock()) app.quit()
else {
  app.on('second-instance', () => {
    if (window?.isMinimized()) window.restore()
    window?.focus()
  })
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
    window = new BrowserWindow({
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
    window.on('closed', () => { window = undefined; globalShortcut.unregisterAll() })
    window.loadFile(join(__dirname, '../dist/index.html'))
  })
  app.on('window-all-closed', () => app.quit())
  app.on('will-quit', () => globalShortcut.unregisterAll())
}
