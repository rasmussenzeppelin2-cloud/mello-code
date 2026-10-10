const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('melloAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  listFiles: (folderPath) => ipcRenderer.invoke('list-files', folderPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),
  getModels: () => ipcRenderer.invoke('get-models'),
  generateText: (request) => ipcRenderer.invoke('generate-text', request)
});
