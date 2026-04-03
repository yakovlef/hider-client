const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hider', {
  resizeWindow: (width, height) => ipcRenderer.send('resize-window', { width, height }),
  setClickThrough: (enabled) => ipcRenderer.send('set-click-through', enabled),
  closeWindow: () => ipcRenderer.send('close-window'),
});
