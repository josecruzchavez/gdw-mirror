'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('engine', {
  onStart: (cb) => ipcRenderer.on('engine:start', (_e, payload) => cb(payload)),
  onStop: (cb) => ipcRenderer.on('engine:stop', () => cb()),
  onAnswer: (cb) => ipcRenderer.on('engine:answer', (_e, sdp) => cb(sdp)),
  offer: (payload) => ipcRenderer.send('engine:offer', payload),
  stats: (payload) => ipcRenderer.send('engine:stats', payload),
  state: (payload) => ipcRenderer.send('engine:state', payload),
  error: (message) => ipcRenderer.send('engine:error', String(message)),
});
