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
})
