'use strict';

const {
  app, BrowserWindow, Tray, Menu, ipcMain, desktopCapturer, screen, session,
  systemPreferences, dialog, shell, powerSaveBlocker, clipboard,
} = require('electron');
const http = require('http');
const { spawn } = require('child_process');
const dgram = require('dgram');
const os = require('os');
const path = require('path');

const icons = require('./icons');
const { localIPv4 } = require('./net');

const HTTP_PORT = Number(process.env.MIRROR_HTTP_PORT || 47820);
const DISC_PORT = Number(process.env.MIRROR_DISC_PORT || 47821);
const VERSION = require('../package.json').version;
const DEV = process.argv.includes('--dev');

const PROFILES = {
  sharp: {
    key: 'sharp',
    label: 'Nítido · 30 fps · hasta 60 Mbps',
    fps: 30,
    maxBitrate: 60000000,
    contentHint: 'detail',
    degradation: 'maintain-resolution',
  },
  smooth: {
    key: 'smooth',
    label: 'Fluido · 60 fps · hasta 80 Mbps',
    fps: 60,
    maxBitrate: 80000000,
    contentHint: 'detail',
    degradation: 'maintain-resolution',
  },
  high: {
    key: 'high',
    label: 'Alto · 90 fps · hasta 100 Mbps',
    fps: 90,
    maxBitrate: 100000000,
    contentHint: 'motion',
    degradation: 'maintain-resolution',
  },
  eco: {
    key: 'eco',
    label: 'Económico · 30 fps · 12 Mbps',
    fps: 30,
    maxBitrate: 12000000,
    contentHint: 'motion',
    degradation: 'balanced',
  },
};

// Overrides de prueba: ajustan el perfil "Alto" sin tocar código.
if (process.env.MIRROR_FPS) {
  PROFILES.high.fps = Number(process.env.MIRROR_FPS) || PROFILES.high.fps;
}
if (process.env.MIRROR_BITRATE) {
  PROFILES.high.maxBitrate = Number(process.env.MIRROR_BITRATE) || PROFILES.high.maxBitrate;
}

const SCALES = [
  { key: 'native', label: 'Nativa · resolución completa' },
  { key: 'half', label: 'Escalada a la mitad' },
  { key: 'hd', label: 'Escalada a 1080p' },
];

const st = {
  hostName: prettyHost(),
  sharing: false,
  starting: false,
  peerConnected: false,
  displayId: process.env.MIRROR_DISPLAY ? Number(process.env.MIRROR_DISPLAY) : null,
  displayName: null,
  audio: !!process.env.MIRROR_AUDIO,
  requireCode: !!process.env.MIRROR_REQUIRE_CODE,
  profile: PROFILES[process.env.MIRROR_PROFILE] ? process.env.MIRROR_PROFILE : 'sharp',
  scaleMode: process.env.MIRROR_SCALE || 'native',
  code: null,
  offer: null,
  video: null,
  stats: null,
  error: null,
  peers: 0,
};

let tray = null;
let engine = null;
let engineReady = null;
let panelWin = null;
let menuWin = null;
let lastMenuHide = 0;
let httpServer = null;
let discSock = null;
let pendingSource = null;
let sleepBlocker = null;
let rebuildTimer = null;
const failures = new Map();

const WINDOWS_TRAY_ICON = process.platform === 'win32' ? icons.makeWindowsTray() : null;
const ICON_IDLE = WINDOWS_TRAY_ICON || icons.makeMonitor();
const ICON_LIVE = WINDOWS_TRAY_ICON || icons.makeLive();

function prettyHost() {
  return os
    .hostname()
    .replace(/\.local$/i, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function newCode() {
  if (process.env.MIRROR_TEST_CODE) return String(process.env.MIRROR_TEST_CODE);
  return String(Math.floor(100000 + Math.random() * 900000));
}

function ip() {
  return localIPv4();
}

function statePayload() {
  return {
    hostName: st.hostName,
    sharing: st.sharing,
    starting: st.starting,
    peerConnected: st.peerConnected,
    code: st.code,
    requireCode: st.requireCode,
    ip: ip(),
    port: HTTP_PORT,
    displayName: st.displayName,
    video: st.video,
    audio: st.audio,
    profile: PROFILES[st.profile].label,
    scaleMode: st.scaleMode,
    stats: st.stats,
    error: st.error,
    version: VERSION,
  };
}

function pushPanelState() {
  if (panelWin && !panelWin.isDestroyed()) panelWin.webContents.send('panel:state', statePayload());
  pushMenuState();
}

function scaleLabel(key) {
  const found = SCALES.find((s) => s.key === key);
  return found ? found.label.split(' · ')[0] : key;
}

function menuPayload() {
  const displays = displayList();
  const current = displays.find((d) => d.id === (st.displayId != null ? st.displayId : screen.getPrimaryDisplay().id));
  return {
    hostName: st.hostName,
    sharing: st.sharing,
    starting: st.starting,
    peerConnected: st.peerConnected,
    statusText: statusLabel(),
    error: st.error,
    video: st.video,
    stats: st.stats,
    audio: st.audio,
    requireCode: st.requireCode,
    code: st.code,
    profile: st.profile,
    profileLabel: PROFILES[st.profile].label,
    profiles: Object.keys(PROFILES).map((k) => ({ key: k, label: PROFILES[k].label })),
    scaleMode: st.scaleMode,
    scaleLabel: scaleLabel(st.scaleMode),
    scales: SCALES,
    displayId: current ? current.id : null,
    displayValue: current ? current.short : '—',
    displays: displays.map((d) => ({ id: d.id, label: d.short })),
    loginItem: loginItemEnabled(),
    version: VERSION,
  };
}

function pushMenuState() {
  if (menuWin && !menuWin.isDestroyed()) menuWin.webContents.send('menu:state', menuPayload());
}

function scheduleMenuRefresh() {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(rebuildMenu, 250);
}

function rebuildMenu() {
  if (!tray) return;
  tray.setImage(st.sharing ? ICON_LIVE : ICON_IDLE);
  tray.setToolTip(
    st.sharing
      ? `GDW Mirror · compartiendo ${st.video ? st.video.width + '×' + st.video.height : 'pantalla'}`
      : 'GDW Mirror · sin compartir'
  );
  if (process.platform === 'darwin') {
    tray.setTitle(st.sharing && st.video ? `${st.video.width}×${st.video.height}` : '');
  }
  // Use the same custom menu on macOS and Windows so controls do not close
  // unexpectedly after each native menu selection.
  pushMenuState();
  if (tray && process.platform !== 'darwin') tray.setContextMenu(null);
}

function statusLabel() {
  if (st.starting) return 'Iniciando captura…';
  if (!st.sharing) return 'Sin compartir';
  if (st.peerConnected) return 'Compartiendo · conectado';
  return 'Compartiendo · esperando conexión';
}

function buildMenuTemplate() {
  const template = [
    { label: st.hostName, enabled: false },
    { label: statusLabel(), enabled: false },
  ];
  if (st.sharing && st.video) {
    const fps = st.video.fps ? ` @ ${Math.round(st.video.fps)} fps` : '';
    template.push({ label: `${st.video.width}×${st.video.height}${fps}${st.audio ? ' · con audio' : ''}`, enabled: false });
  }
  if (st.sharing && st.stats) {
    template.push({ label: `${st.stats.kbps} kbps · ${st.stats.rtt} ms · ${st.stats.lost}% pérdida`, enabled: false });
  }
  if (st.error) template.push({ label: `⚠︎ ${st.error}`, enabled: false });
  template.push({ type: 'separator' });
  template.push({
    label: st.sharing ? 'Detener compartición' : 'Compartir pantalla',
    click: () => {
      if (st.sharing) stopSharing();
      else startSharing();
    },
  });
  template.push({ label: 'Pantalla a compartir', submenu: displayItems() });
  template.push({
    label: 'Incluir audio del sistema',
    type: 'checkbox',
    checked: st.audio,
    click: (item) => {
      st.audio = item.checked;
      if (st.sharing) restartSharing();
      else rebuildMenu();
    },
  });
  template.push({
    label: 'Perfil de calidad',
    submenu: Object.keys(PROFILES).map((key) => ({
      label: PROFILES[key].label,
      type: 'radio',
      checked: st.profile === key,
      click: () => {
        st.profile = key;
        if (st.sharing) restartSharing();
        else rebuildMenu();
      },
    })),
  });
  template.push({
    label: 'Resolución enviada',
    submenu: [
      { key: 'native', label: 'Nativa · resolución completa' },
      { key: 'half', label: 'Escalada a la mitad' },
      { key: 'hd', label: 'Escalada a 1080p' },
    ].map((opt) => ({
      label: opt.label,
      type: 'radio',
      checked: st.scaleMode === opt.key,
      click: () => {
        st.scaleMode = opt.key;
        if (st.sharing) restartSharing();
        else rebuildMenu();
      },
    })),
  });
  template.push({ type: 'separator' });
  template.push({
    label: 'Requerir código de conexión',
    type: 'checkbox',
    checked: st.requireCode,
    click: (item) => {
      st.requireCode = item.checked;
      if (st.requireCode) st.code = st.code || newCode();
      else st.code = null;
      rebuildMenu();
      pushPanelState();
    },
  });
  template.push({
    label: st.sharing && st.code ? `Código de conexión: ${st.code}` : 'Detalles de conexión…',
    click: () => openPanel(),
  });
  template.push({ type: 'separator' });
  template.push({
    label: 'Abrir al iniciar sesión',
    type: 'checkbox',
    checked: loginItemEnabled(),
    click: (item) => setLoginItem(item.checked),
  });
  if (process.platform === 'darwin') {
    template.push({ type: 'separator' });
    template.push({
      label: 'Permisos de grabación de pantalla…',
      click: () => shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'),
    });
  }
  template.push({ type: 'separator' });
  template.push({ label: `GDW Mirror ${VERSION}`, enabled: false });
  template.push({
    label: 'Salir',
    click: () => {
      app.isQuitting = true;
      app.quit();
    },
  });
  return template;
}

function displayList() {
  return screen.getAllDisplays().map((d, i) => {
    const physW = Math.round(d.bounds.width * d.scaleFactor);
    const physH = Math.round(d.bounds.height * d.scaleFactor);
    const scaled = d.scaleFactor > 1;
    const detail = scaled ? ` · vista ${d.bounds.width}×${d.bounds.height}` : '';
    return {
      id: d.id,
      short: `Pantalla ${i + 1} · ${physW}×${physH}`,
      label: `Pantalla ${i + 1} · ${physW}×${physH}${detail}`,
    };
  });
}

function displayItems() {
  const current = st.displayId != null ? st.displayId : screen.getPrimaryDisplay().id;
  return displayList().map((d) => ({
    label: d.label,
    type: 'radio',
    checked: d.id === current,
    click: () => {
      st.displayId = d.id;
      if (st.sharing) restartSharing();
      else rebuildMenu();
    },
  }));
}

function loginItemEnabled() {
  if (!app.isPackaged) return app.getLoginItemSettings().openAtLogin;
  return app.getLoginItemSettings().openAtLogin;
}

function setLoginItem(enabled) {
  app.setLoginItemSettings({ openAtLogin: enabled, openAsHidden: true });
  rebuildMenu();
}

function ensureEngine() {
  if (engine && !engine.isDestroyed()) return engineReady;
  engine = new BrowserWindow({
    show: DEV,
    width: 900,
    height: 640,
    title: 'GDW Mirror · motor de captura',
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload-host.js'),
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  engineReady = new Promise((resolve) => engine.webContents.once('did-finish-load', resolve));
  engine.webContents.on('console-message', function () {
    const first = arguments[0];
    if (first && typeof first === 'object' && typeof first.message === 'string') {
      console.log('[host-renderer]', first.message);
    } else if (typeof arguments[2] === 'string') {
      console.log('[host-renderer]', arguments[2]);
    }
  });
  engine.loadFile(path.join(__dirname, 'host.html'));
  engine.on('closed', () => {
    engine = null;
    engineReady = null;
  });
  return engineReady;
}

async function startSharing() {
  if (st.sharing || st.starting) return;

  if (process.platform === 'darwin') {
    let status = systemPreferences.getMediaAccessStatus('screen');
    if (status !== 'granted') {
      // Pide el permiso con la API nativa. Esto dispara el prompt del sistema y
      // hace que la app aparezca en Ajustes → Grabación de pantalla, en vez de
      // obligar a agregarla a mano.
      let asked = false;
      try {
        asked = await systemPreferences.askForMediaAccess('screen');
      } catch (e) {
        asked = false;
      }
      status = systemPreferences.getMediaAccessStatus('screen');
      if (!asked && status !== 'granted') {
        st.error = 'Falta el permiso de grabación de pantalla.';
        rebuildMenu();
        dialog
          .showMessageBox({
            type: 'warning',
            buttons: ['Abrir Ajustes', 'Cancelar'],
            defaultId: 0,
            message: 'GDW Mirror necesita permiso para grabar la pantalla',
            detail:
              'Actívalo en Ajustes del Sistema → Privacidad y seguridad → Grabación de pantalla y vuelve a intentarlo. Puede que tengas que reiniciar la app después de concederlo.',
          })
          .then((r) => {
            if (r.response === 0)
              shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
          });
        return;
      }
    }
  }

  st.starting = true;
  st.error = null;
  st.stats = null;
  st.peerConnected = false;
  rebuildMenu();
  pushPanelState();

  try {
    await ensureEngine();
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } });
    const wanted = st.displayId != null ? String(st.displayId) : null;
    const chosen = (wanted && sources.find((s) => String(s.display_id) === wanted)) || sources[0];
    if (!chosen) throw new Error('No se encontró ninguna pantalla para compartir.');

    pendingSource = chosen;
    st.displayName = chosen.name;
    st.code = st.requireCode ? newCode() : null;
    st.offer = null;
    st.video = null;

    // getSettings() del track de captura reporta la resolución física de otra
    // pantalla, no la que realmente se captura. La fuente de verdad es la
    // pantalla elegida, así que se la pasamos al motor.
    const chosenDisplay = screen.getAllDisplays().find((d) => String(d.id) === String(chosen.display_id));
    const capture = chosenDisplay
      ? {
          width: Math.round(chosenDisplay.bounds.width * chosenDisplay.scaleFactor),
          height: Math.round(chosenDisplay.bounds.height * chosenDisplay.scaleFactor),
          fps: Math.round(chosenDisplay.displayFrequency || 0),
        }
      : null;

    startHttpServer();
    startDiscovery();
    engine.webContents.send('engine:start', {
      audio: st.audio,
      profile: PROFILES[st.profile],
      scaleMode: st.scaleMode,
      capture,
    });
  } catch (err) {
    st.starting = false;
    st.error = err && err.message ? err.message : String(err);
    rebuildMenu();
    pushPanelState();
    dialog.showErrorBox('No se pudo iniciar la compartición', st.error);
  }
}

async function stopSharing(options) {
  const silent = options && options.silent;
  if (engine && !engine.isDestroyed()) engine.webContents.send('engine:stop');
  st.sharing = false;
  st.starting = false;
  st.peerConnected = false;
  st.offer = null;
  st.video = null;
  st.stats = null;
  st.displayName = null;
  if (sleepBlocker != null) {
    powerSaveBlocker.stop(sleepBlocker);
    sleepBlocker = null;
  }
  if (!silent) st.error = null;
  rebuildMenu();
  pushPanelState();
  await new Promise((r) => setTimeout(r, 250));
}

async function restartSharing() {
  await stopSharing({ silent: true });
  await startSharing();
}

function ensureMenu() {
  if (menuWin && !menuWin.isDestroyed()) return menuWin;
  menuWin = new BrowserWindow({
    width: 322,
    height: 440,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    transparent: true,
    hasShadow: true,
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload-menu.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  menuWin.loadFile(path.join(__dirname, 'menu.html'));
  menuWin.setVisibleOnAllWorkspaces(true);
  menuWin.on('blur', () => hideMenu());
  menuWin.on('closed', () => {
    menuWin = null;
  });
  menuWin.webContents.once('did-finish-load', pushMenuState);
  return menuWin;
}

function positionMenu() {
  if (!menuWin || menuWin.isDestroyed() || !tray) return;
  const b = menuWin.getBounds();
  let tb;
  try {
    tb = tray.getBounds();
  } catch (e) {
    tb = null;
  }
  if (!tb || !tb.width) {
    const d = screen.getPrimaryDisplay();
    tb = { x: d.workArea.x + d.workArea.width - 40, y: d.workArea.y, width: 24, height: 24 };
  }
  const area = screen.getDisplayMatching(tb).workArea;
  let x = Math.round(tb.x + tb.width / 2 - b.width / 2);
  let y = Math.round(tb.y + tb.height + 6);
  x = Math.min(Math.max(x, area.x + 8), area.x + area.width - b.width - 8);
  if (y + b.height > area.y + area.height - 8) {
    y = Math.max(area.y + 8, Math.round(tb.y - b.height - 6));
  }
  menuWin.setBounds({ x, y, width: b.width, height: b.height });
}

function showMenu() {
  const w = ensureMenu();
  pushMenuState();
  positionMenu();
  w.show();
  w.focus();
}

function hideMenu() {
  if (menuWin && !menuWin.isDestroyed() && menuWin.isVisible()) {
    lastMenuHide = Date.now();
    menuWin.hide();
  }
}

function toggleMenu() {
  if (menuWin && !menuWin.isDestroyed() && menuWin.isVisible()) {
    hideMenu();
    return;
  }
  if (Date.now() - lastMenuHide < 300) return;
  showMenu();
}

function openPanel() {
  if (panelWin && !panelWin.isDestroyed()) {
    panelWin.show();
    panelWin.focus();
    pushPanelState();
    return;
  }
  panelWin = new BrowserWindow({
    width: 480,
    height: 600,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    title: 'Conectar un equipo',
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload-panel.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  panelWin.loadFile(path.join(__dirname, 'pairing.html'));
  panelWin.on('closed', () => {
    panelWin = null;
  });
  panelWin.webContents.once('did-finish-load', pushPanelState);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 262144) {
        reject(new Error('Cuerpo demasiado grande'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function failuresFor(remote) {
  const entry = failures.get(remote);
  if (!entry) return 0;
  if (entry.until && Date.now() < entry.until) return 1000;
  if (entry.until && Date.now() >= entry.until) {
    failures.delete(remote);
    return 0;
  }
  return entry.count;
}

function registerFailure(remote) {
  const entry = failures.get(remote) || { count: 0 };
  entry.count += 1;
  if (entry.count >= 8) entry.until = Date.now() + 30000;
  failures.set(remote, entry);
}

function handleRequest(req, res) {
  const json = (code, obj) => {
    res.writeHead(code, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    });
    res.end(JSON.stringify(obj));
  };

  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch (e) {
    return json(400, { error: 'Solicitud inválida.' });
  }

  if (req.method === 'GET' && url.pathname === '/hello') {
    return json(200, { app: 'gdwmirror', version: VERSION, name: st.hostName, sharing: st.sharing, requireCode: st.requireCode });
  }

  if (req.method !== 'POST') return json(404, { error: 'Ruta desconocida.' });

  const remote = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  if (failuresFor(remote) >= 1000) return json(429, { error: 'Demasiados intentos. Espera 30 segundos.' });

  readBody(req)
    .then((body) => {
      const code = String(body.code || '');
      if (!st.sharing || !st.offer) return json(409, { error: 'El Mac no está compartiendo pantalla.' });
      if (st.requireCode) {
        if (!code) return json(401, { error: 'Se requiere un código de conexión.' });
        if (code !== st.code) {
          registerFailure(remote);
          return json(403, { error: 'Código incorrecto.' });
        }
      }
      if (url.pathname === '/offer') {
        return json(200, {
          sdp: st.offer,
          video: st.video,
          audio: st.audio,
          profile: st.profile,
          name: st.hostName,
          display: st.displayName,
        });
      }
      if (url.pathname === '/answer') {
        if (!body.sdp) return json(400, { error: 'Falta la respuesta SDP.' });
        if (engine && !engine.isDestroyed()) engine.webContents.send('engine:answer', String(body.sdp));
        return json(200, { ok: true });
      }
      if (url.pathname === '/bye') {
        setTimeout(() => stopSharing(), 80);
        return json(200, { ok: true });
      }
      return json(404, { error: 'Ruta desconocida.' });
    })
    .catch(() => json(400, { error: 'Solicitud inválida.' }));
}

function startHttpServer() {
  if (httpServer) return;
  httpServer = http.createServer(handleRequest);
  httpServer.on('error', (err) => {
    st.error = `No se pudo usar el puerto ${HTTP_PORT}: ${err.message}`;
    rebuildMenu();
  });
  httpServer.listen(HTTP_PORT, '0.0.0.0');
}

function startDiscovery() {
  if (discSock) return;
  discSock = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  discSock.on('error', () => {});
  discSock.on('message', (msg, rinfo) => {
    if (msg.toString('utf8').trim() !== 'MIRROR_DISCOVER') return;
    const payload = Buffer.from(
      JSON.stringify({ app: 'gdwmirror', version: VERSION, name: st.hostName, port: HTTP_PORT, sharing: st.sharing, requireCode: st.requireCode })
    );
    discSock.send(payload, rinfo.port, rinfo.address);
  });
  discSock.bind(DISC_PORT, () => {
    try {
      discSock.setBroadcast(true);
    } catch (e) {
      /* ignore */
    }
  });
}

function openViewer() {
  if (st.sharing || st.starting) {
    dialog.showMessageBox({
      type: 'info',
      buttons: ['Aceptar'],
      message: 'Detén la compartición antes de ver una pantalla remota.',
    });
    return;
  }
  const env = { ...process.env, MIRROR_MODE: 'viewer', MIRROR_CUSTOM_FRAME: '1' };
  const child = spawn(process.execPath, [app.getAppPath(), '--mode=viewer'], {
    detached: true,
    stdio: 'ignore',
    env,
  });
  child.unref();
}

function wireIpc() {
  ipcMain.on('engine:offer', (_e, payload) => {
    if (!payload || !payload.sdp) return;
    st.offer = payload.sdp;
    st.video = payload.video || null;
    st.sharing = true;
    st.starting = false;
    st.error = null;
    if (sleepBlocker == null) sleepBlocker = powerSaveBlocker.start('prevent-display-sleep');
    rebuildMenu();
    pushPanelState();
  });

  ipcMain.on('engine:stats', (_e, payload) => {
    st.stats = payload;
    if (process.env.MIRROR_LOG_STATS) console.log('[stats]', JSON.stringify(payload));
    scheduleMenuRefresh();
    pushPanelState();
  });

  ipcMain.on('engine:state', (_e, connectionState) => {
    const connected = connectionState === 'connected';
    if (connected !== st.peerConnected) {
      st.peerConnected = connected;
      rebuildMenu();
      pushPanelState();
    }
  });

  ipcMain.on('engine:error', (_e, message) => {
    st.error = message;
    st.sharing = false;
    st.starting = false;
    rebuildMenu();
    pushPanelState();
  });

  ipcMain.on('panel:copy', (_e, text) => clipboard.writeText(text));
  ipcMain.on('panel:stop', () => stopSharing());
  ipcMain.on('panel:close', () => {
    if (panelWin && !panelWin.isDestroyed()) panelWin.close();
  });
  ipcMain.on('panel:ready', pushPanelState);

  ipcMain.on('menu:ready', pushMenuState);

  ipcMain.on('menu:hide', hideMenu);

  ipcMain.on('menu:resize', (_e, height) => {
    if (!menuWin || menuWin.isDestroyed()) return;
    const area = screen.getDisplayMatching(menuWin.getBounds()).workArea;
    const maxH = area.height - 60;
    const h = Math.min(Math.max(Math.round(Number(height) || 400), 180), maxH);
    const b = menuWin.getBounds();
    if (h === b.height) return;
    menuWin.setBounds({ x: b.x, y: b.y, width: b.width, height: h });
    positionMenu();
  });

  ipcMain.on('menu:action', (_e, msg) => {
    const type = msg && msg.type;
    if (!type) return;
    switch (type) {
      case 'toggle-share':
        if (st.starting) break;
        if (st.sharing) stopSharing();
        else startSharing();
        break;
      case 'open-viewer':
        hideMenu();
        openViewer();
        break;
      case 'set-profile':
        if (!PROFILES[msg.value]) break;
        st.profile = msg.value;
        if (st.sharing) restartSharing();
        else rebuildMenu();
        break;
      case 'set-scale':
        if (!SCALES.some((s) => s.key === msg.value)) break;
        st.scaleMode = msg.value;
        if (st.sharing) restartSharing();
        else rebuildMenu();
        break;
      case 'set-display':
        st.displayId = msg.value;
        if (st.sharing) restartSharing();
        else rebuildMenu();
        break;
      case 'toggle-audio':
        st.audio = !st.audio;
        if (st.sharing) restartSharing();
        else rebuildMenu();
        break;
      case 'toggle-code':
        st.requireCode = !st.requireCode;
        if (st.requireCode) st.code = st.code || newCode();
        else st.code = null;
        rebuildMenu();
        break;
      case 'toggle-login':
        setLoginItem(!loginItemEnabled());
        rebuildMenu();
        break;
      case 'details':
        hideMenu();
        openPanel();
        break;
      case 'open-url':
        if (typeof msg.url === 'string' && /^https:\/\//.test(msg.url)) shell.openExternal(msg.url);
        break;
      case 'permissions':
        hideMenu();
        shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
        break;
      case 'quit':
        hideMenu();
        app.isQuitting = true;
        app.quit();
        break;
      default:
        break;
    }
  });
}

function createTray() {
  tray = new Tray(ICON_IDLE);
  tray.on('click', () => toggleMenu());
  tray.on('right-click', () => showMenu());
  rebuildMenu();
}

function hostStart() {
  app.setName('GDW Mirror');
  if (process.platform === 'darwin' && app.dock) app.dock.hide();

  app.whenReady().then(() => {
    session.defaultSession.setDisplayMediaRequestHandler(
      (_request, callback) => {
        if (!pendingSource) return callback({});
        const opts = { video: pendingSource };
        if (st.audio) opts.audio = 'loopback';
        callback(opts);
      },
      { useSystemPicker: false }
    );

    createTray();
    ensureEngine();
    startHttpServer();
    startDiscovery();
    wireIpc();

    screen.on('display-added', scheduleMenuRefresh);
    screen.on('display-removed', scheduleMenuRefresh);
    screen.on('display-metrics-changed', scheduleMenuRefresh);

    app.on('activate', () => openPanel());
    app.on('window-all-closed', () => {
      // App vive en la barra de estado: no cerrar al cerrar ventanas.
    });
    app.on('before-quit', () => {
      app.isQuitting = true;
      if (httpServer) httpServer.close();
      if (discSock) {
        try {
          discSock.close();
        } catch (e) {
          /* ignore */
        }
      }
    });

    if (process.env.MIRROR_AUTOSTART) {
      setTimeout(() => startSharing(), 900);
    }
  });
}

module.exports = { hostStart, statePayload };
