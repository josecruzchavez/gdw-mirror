'use strict';

const { app, BrowserWindow, Menu, ipcMain, shell, dialog, screen } = require('electron');
const dgram = require('dgram');
const os = require('os');
const path = require('path');

const { postJson, getJson } = require('./net');
const { fitBounds } = require('./fit');

const DISC_PORT = Number(process.env.MIRROR_DISC_PORT || 47821);
const DEV = process.argv.includes('--dev');

let win = null;
let discSock = null;
let discTimer = null;
const hosts = new Map();
const localName = os.hostname().replace(/\.local$/i, '').replace(/-/g, ' ');

function broadcastAddresses() {
  const list = ['255.255.255.255'];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const ni of ifaces[name] || []) {
      if (ni.family !== 'IPv4' || ni.internal) continue;
      const octets = ni.address.split('.').map(Number);
      const mask = ni.netmask.split('.').map(Number);
      if (octets.length !== 4 || mask.length !== 4) continue;
      const b = octets.map((o, i) => (o & mask[i]) | (~mask[i] & 255));
      list.push(b.join('.'));
    }
  }
  return Array.from(new Set(list));
}

function emitHosts() {
  if (!win || win.isDestroyed()) return;
  const sorted = Array.from(hosts.values()).sort((a, b) => a.name.localeCompare(b.name));
  win.webContents.send('disc:found', sorted);
}

function startDiscovery() {
  if (discSock) return;
  discSock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  discSock.on('error', () => {});
  discSock.on('message', (msg, rinfo) => {
    let data;
    try {
      data = JSON.parse(msg.toString('utf8'));
    } catch (e) {
      return;
    }
    if (!data || (data.app !== 'gdwmirror' && data.app !== 'macmirror')) return;
    const key = `${rinfo.address}:${data.port || 47820}`;
    hosts.set(key, {
      key,
      address: rinfo.address,
      port: data.port || 47820,
      name: data.name || rinfo.address,
      sharing: !!data.sharing,
      seen: Date.now(),
    });
    emitHosts();
  });
  discSock.bind(0, () => {
    try {
      discSock.setBroadcast(true);
    } catch (e) {
      /* ignore */
    }
    const probe = Buffer.from('MIRROR_DISCOVER');
    discTimer = setInterval(() => {
      for (const addr of broadcastAddresses()) {
        try {
          discSock.send(probe, DISC_PORT, addr);
        } catch (e) {
          /* ignore */
        }
      }
      const cutoff = Date.now() - 8000;
      let changed = false;
      for (const [key, value] of hosts) {
        if (value.seen < cutoff) {
          hosts.delete(key);
          changed = true;
        }
      }
      if (changed) emitHosts();
    }, 1500);
  });
}

function stopDiscovery() {
  clearInterval(discTimer);
  discTimer = null;
  if (discSock) {
    try {
      discSock.close();
    } catch (e) {
      /* ignore */
    }
    discSock = null;
  }
  hosts.clear();
}

function createWindow() {
  const customFrame = process.platform === 'win32' || process.platform === 'darwin' || !!process.env.MIRROR_CUSTOM_FRAME;
  const frameOpts = customFrame
    ? {
        frame: false,
        thickFrame: true,
        autoHideMenuBar: true,
      }
    : {};

  win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 240,
    minHeight: 180,
    backgroundColor: '#0b0c11',
    title: 'GDW Mirror',
    show: false,
    ...frameOpts,
    webPreferences: {
      preload: path.join(__dirname, 'preload-viewer.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
    },
  });
  win.loadFile(path.join(__dirname, 'viewer.html'));
  win.once('ready-to-show', () => {
    win.show();
    if (DEV) win.webContents.openDevTools({ mode: 'detach' });
  });
  win.webContents.on('console-message', function () {
    const first = arguments[0];
    if (first && typeof first === 'object' && typeof first.message === 'string') {
      console.log('[viewer-renderer]', first.message);
    } else if (typeof arguments[2] === 'string') {
      console.log('[viewer-renderer]', arguments[2]);
    }
  });
  win.on('closed', () => {
    win = null;
  });

  const sendMax = () => {
    if (win && !win.isDestroyed()) win.webContents.send('win:maximized', win.isMaximized());
  };
  win.on('maximize', sendMax);
  win.on('unmaximize', sendMax);
  win.webContents.once('did-finish-load', sendMax);
}

function buildAppMenu() {
  const template = [
    ...(process.platform === 'darwin'
      ? [
          {
            label: 'GDW Mirror',
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'hide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'Ver',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function viewerStart() {
  process.env.MIRROR_LOCAL_NAME = localName;
  app.setName('GDW Mirror');
  app.whenReady().then(() => {
    buildAppMenu();
    createWindow();

    ipcMain.on('disc:start', () => startDiscovery());
    ipcMain.on('disc:stop', () => stopDiscovery());

    ipcMain.handle('net:pair', async (_e, { host, port, code }) => {
      return postJson(host, port || 47820, '/offer', { code });
    });

    ipcMain.handle('net:hello', async (_e, { host, port }) => {
      return getJson(host, port || 47820, '/hello', 3000);
    });

    ipcMain.handle('net:answer', async (_e, { host, port, code, sdp }) => {
      return postJson(host, port || 47820, '/answer', { code, sdp });
    });

    ipcMain.handle('net:bye', async (_e, { host, port, code }) => {
      try {
        return await postJson(host, port || 47820, '/bye', { code });
      } catch (e) {
        return { ok: false, error: e.message };
      }
    });

    ipcMain.on('win:fullscreen', (_e, on) => {
      if (!win || win.isDestroyed()) return;
      win.setFullScreen(!!on);
      win.setMenuBarVisibility(!on);
    });

    ipcMain.on('win:ontop', (_e, on) => {
      if (!win || win.isDestroyed()) return;
      win.setAlwaysOnTop(!!on, 'screen-saver');
    });

    ipcMain.handle('win:fit-aspect', (_e, aspect) => {
      if (!win || win.isDestroyed()) return { ok: false };
      if (win.isFullScreen() || win.isMaximized()) return { ok: false };
      const bounds = win.getBounds();
      const workArea = screen.getDisplayMatching(bounds).workArea;
      const next = fitBounds(bounds, workArea, aspect);
      if (!next) return { ok: false };
      if (!next.changed) return { ok: true, changed: false };
      win.setBounds({ x: next.x, y: next.y, width: next.width, height: next.height });
      if (process.env.MIRROR_LOG_FIT) {
        console.log(`[fit] ratio=${Number(aspect).toFixed(3)} ${bounds.width}x${bounds.height} -> ${next.width}x${next.height}`);
      }
      return { ok: true, changed: true, width: next.width, height: next.height };
    });

    ipcMain.on('win:minimize', () => {
      if (win && !win.isDestroyed()) win.minimize();
    });

    ipcMain.on('win:toggle-max', () => {
      if (!win || win.isDestroyed()) return;
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
    });

    ipcMain.on('win:close', () => {
      if (win && !win.isDestroyed()) win.close();
    });

    ipcMain.on('win:quit', () => app.quit());

    win.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    app.on('activate', () => {
      if (!win) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    stopDiscovery();
    app.quit();
  });
}

module.exports = { viewerStart };
