'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('panel', {
  onState: (cb) => ipcRenderer.on('panel:state', (_e, payload) => cb(payload)),
  copy: (text) => ipcRenderer.send('panel:copy', String(text)),
  stop: () => ipcRenderer.send('panel:stop'),
  close: () => ipcRenderer.send('panel:close'),
  ready: () => ipcRenderer.send('panel:ready'),
});
