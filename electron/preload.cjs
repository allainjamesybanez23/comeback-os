const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktop', {
  keepAwake: enabled => ipcRenderer.send('workout:wake', enabled === true),
  backgroundKeys: enabled => ipcRenderer.send('workout:background-keys', enabled === true),
  onWorkoutKey: callback => {
    const listener = (_event, key) => callback(key)
    ipcRenderer.on('workout:key', listener)
    return () => ipcRenderer.removeListener('workout:key', listener)
  },
  onWorkoutKeyError: callback => {
    const listener = () => callback()
    ipcRenderer.on('workout:key-error', listener)
    return () => ipcRenderer.removeListener('workout:key-error', listener)
  },
  notify: (title, body, target) => ipcRenderer.send('reminder:notify', String(title).slice(0, 120), String(body).slice(0, 300), String(target || '').slice(0, 20)),
  setBackground: enabled => ipcRenderer.send('app:background', enabled === true),
  setLaunchAtLogin: enabled => ipcRenderer.send('app:login', enabled === true),
  onReminderOpen: callback => {
    const listener = (_event, target) => callback(String(target))
    ipcRenderer.on('reminder:open', listener)
    return () => ipcRenderer.removeListener('reminder:open', listener)
  },
})
