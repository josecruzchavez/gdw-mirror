'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mirror', {
  autoconnect: process.env.MIRROR_AUTOCONNECT || null,
  discover: (cb) => ipcRenderer.on('disc:found', (_e, hosts) => cb(hosts)),
  startDiscovery: () => ipcRenderer.send('disc:start'),
  stopDiscovery: () => ipcRenderer.send('disc:stop'),
  pair: (host, port, code) => ipcRenderer.invoke('net:pair', { host, port, code }),
  hello: (host, port) => ipcRenderer.invoke('net:hello', { host, port }),
  answer: (host, port, code, sdp) => ipcRenderer.invoke('net:answer', { host, port, code, sdp }),
  bye: (host, port, code) => ipcRenderer.invoke('net:bye', { host, port, code }),
  setFullScreen: (on) => ipcRenderer.send('win:fullscreen', !!on),
  setAlwaysOnTop: (on) => ipcRenderer.send('win:ontop', !!on),
  minimize: () => ipcRenderer.send('win:minimize'),
  fitAspect: (aspect) => ipcRenderer.invoke('win:fit-aspect', aspect),
  toggleMaximize: () => ipcRenderer.send('win:toggle-max'),
  closeWindow: () => ipcRenderer.send('win:close'),
  onMaximized: (cb) => ipcRenderer.on('win:maximized', (_e, on) => cb(!!on)),
  customFrame: process.platform === 'win32' || !!process.env.MIRROR_CUSTOM_FRAME,
  quit: () => ipcRenderer.send('win:quit'),
  localName: process.env.MIRROR_LOCAL_NAME || null,
});
