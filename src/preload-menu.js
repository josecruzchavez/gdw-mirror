'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('menu', {
  onState: (cb) => ipcRenderer.on('menu:state', (_e, payload) => cb(payload)),
  action: (msg) => ipcRenderer.send('menu:action', msg),
  resize: (height) => ipcRenderer.send('menu:resize', height),
  hide: () => ipcRenderer.send('menu:hide'),
  ready: () => ipcRenderer.send('menu:ready'),
});
