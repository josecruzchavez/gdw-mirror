'use strict';

const el = (id) => document.getElementById(id);
const video = el('video');

let pc = null;
let target = null;
let statsTimer = null;
let lastSample = null;
let retries = 0;
let frameCount = 0;
let fpsWindowStart = performance.now();
let currentFps = 0;
let hideTimer = null;
let selectedRequireCode = null;
let disconnectTimer = null;
let retryTimer = null;
let connectionAttempt = 0;

const DISCONNECT_GRACE_MS = 3000;
const RETRY_DELAY_MS = 1500;
const MAX_RETRIES = 6;

function cleanError(err) {
  const raw = err && err.message ? err.message : String(err);
  return raw.replace(/^Error invoking remote method '[^']+':\s*/, '').replace(/^Error:\s*/, '');
}

function setStatus(text, isError) {
  const node = el('status');
  node.textContent = text || '';
  node.className = 'status' + (isError ? ' error' : '');
}

function setOfflineState(title, message) {
  el('offline-title').textContent = title;
  el('offline-message').textContent = message;
  el('offline').classList.add('on');
}

function showStage(on) {
  el('stage').classList.toggle('on', !!on);
  el('connect').style.display = on ? 'none' : 'grid';
  if (on) {
    frameCount = 0;
    fpsWindowStart = performance.now();
    bumpOverlay();
  } else {
    el('overlay').classList.remove('hidden');
  }
}

function bumpOverlay() {
  el('overlay').classList.remove('hidden');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (el('stage').classList.contains('on')) el('overlay').classList.add('hidden');
  }, 2600);
}

function waitForIce(connection, timeoutMs) {
  return new Promise((resolve) => {
    if (connection.iceGatheringState === 'complete') return resolve();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      connection.removeEventListener('icegatheringstatechange', onChange);
      resolve();
    };
    const onChange = () => {
      if (connection.iceGatheringState === 'complete') finish();
    };
    const timer = setTimeout(finish, timeoutMs || 4000);
    connection.addEventListener('icegatheringstatechange', onChange);
  });
}

function stopStats() {
  clearInterval(statsTimer);
  statsTimer = null;
  lastSample = null;
}

function teardown() {
  stopStats();
  clearTimeout(disconnectTimer);
  disconnectTimer = null;
  if (pc) {
    try {
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    } catch (e) {
      /* ignore */
    }
    pc = null;
  }
  if (video.srcObject) {
    video.srcObject.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch (e) {
        /* ignore */
      }
    });
    video.srcObject = null;
  }
}

function startStats() {
  stopStats();
  statsTimer = setInterval(async () => {
    if (!pc || pc.connectionState === 'closed') return;
    let report;
    try {
      report = await pc.getStats();
    } catch (e) {
      return;
    }
    let inbound = null;
    let pair = null;
    report.forEach((r) => {
      if (r.type === 'inbound-rtp' && r.kind === 'video') inbound = r;
      if (r.type === 'candidate-pair' && (r.nominated || r.state === 'succeeded') && r.bytesReceived) pair = r;
    });
    if (!inbound) return;
    if (window.mirror.autoconnect) {
      let audio = null;
      report.forEach((r) => {
        if (r.type === 'inbound-rtp' && r.kind === 'audio') audio = r;
      });
      window.__audioLevel = audio && typeof audio.audioLevel === 'number' ? audio.audioLevel : null;
      window.__audioState = audio ? String(audio.bytesReceived || 0) : 'none';
    }

    const now = performance.now();
    let kbps = 0;
    if (lastSample && now > lastSample.t) {
      kbps = Math.round(((inbound.bytesReceived - lastSample.bytes) * 8) / ((now - lastSample.t) / 1000) / 1000);
    }
    lastSample = { t: now, bytes: inbound.bytesReceived || 0 };

    const width = video.videoWidth || inbound.frameWidth || 0;
    const height = video.videoHeight || inbound.frameHeight || 0;
    el('res').textContent = width && height ? `${width}×${height}` : '—';
    el('bitrate').textContent = `${kbps} kbps`;
    el('fps').textContent = `${currentFps} fps`;
    const rtt =
      pair && typeof pair.currentRoundTripTime === 'number' ? `${Math.round(pair.currentRoundTripTime * 1000)} ms` : '—';
    el('rtt').textContent = rtt;
  }, 1000);
}

function scheduleRetry() {
  if (!target || retryTimer !== null) return;
  if (retries >= MAX_RETRIES) {
    setOfflineState('Conexión perdida', 'No se pudo reconectar. Pulsa Desconectar para volver a intentarlo.');
    bumpOverlay();
    teardown();
    return;
  }
  retries += 1;
  setOfflineState('Sin señal', `Intentando reconectar (${retries}/${MAX_RETRIES})…`);
  const saved = target;
  teardown();
  retryTimer = setTimeout(() => {
    retryTimer = null;
    connect(saved, { silent: true }).catch((err) => {
      if (!target) return;
      console.warn('Falló el intento de reconexión:', cleanError(err));
      scheduleRetry();
    });
  }, RETRY_DELAY_MS);
}

async function connect(nextTarget, options) {
  const silent = options && options.silent;
  const attempt = ++connectionAttempt;
  target = nextTarget;
  if (!silent) setStatus(`Conectando con ${nextTarget.host}…`);

  const info = await window.mirror.pair(nextTarget.host, nextTarget.port, nextTarget.code);
  if (attempt !== connectionAttempt) return;
  if (info && info.name) {
    target.name = info.name;
    el('peer').textContent = info.name;
  } else {
    el('peer').textContent = nextTarget.host;
  }

  const connection = new RTCPeerConnection({ iceServers: [] });
  pc = connection;

  connection.ontrack = (event) => {
    if (pc !== connection || attempt !== connectionAttempt) return;
    const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
    video.srcObject = stream;
    video.play().catch(() => {});
    el('offline').classList.remove('on');
    showStage(true);
    retries = 0;
    setStatus('');
  };

  connection.onconnectionstatechange = () => {
    if (pc !== connection || attempt !== connectionAttempt) return;
    const state = connection.connectionState;
    if (state === 'connected') {
      clearTimeout(disconnectTimer);
      disconnectTimer = null;
      el('offline').classList.remove('on');
      retries = 0;
    } else if (state === 'disconnected') {
      setOfflineState('Sin señal', 'Esperando que se recupere la conexión…');
      clearTimeout(disconnectTimer);
      disconnectTimer = setTimeout(() => {
        disconnectTimer = null;
        if (pc === connection && connection.connectionState === 'disconnected') scheduleRetry();
      }, DISCONNECT_GRACE_MS);
    } else if (state === 'failed') {
      clearTimeout(disconnectTimer);
      disconnectTimer = null;
      scheduleRetry();
    } else if (state === 'closed') {
      scheduleRetry();
    }
  };

  try {
    await connection.setRemoteDescription({ type: 'offer', sdp: info.sdp });
    if (attempt !== connectionAttempt || pc !== connection) return;
    const answer = await connection.createAnswer();
    if (attempt !== connectionAttempt || pc !== connection) return;
    await connection.setLocalDescription(answer);
    if (attempt !== connectionAttempt || pc !== connection) return;
    await waitForIce(connection);
    if (attempt !== connectionAttempt || pc !== connection) return;
    await window.mirror.answer(nextTarget.host, nextTarget.port, nextTarget.code, connection.localDescription.sdp);
    if (attempt !== connectionAttempt || pc !== connection) return;
    startStats();
  } catch (err) {
    if (attempt !== connectionAttempt || pc !== connection) return;
    if (pc === connection) teardown();
    throw new Error(cleanError(err));
  }
}

async function disconnect(notifyHost) {
  const saved = target;
  connectionAttempt += 1;
  target = null;
  retries = 0;
  clearTimeout(retryTimer);
  retryTimer = null;
  teardown();
  el('offline').classList.remove('on');
  showStage(false);
  if (notifyHost && saved) {
    try {
      await window.mirror.bye(saved.host, saved.port, saved.code);
    } catch (e) {
      /* ignore */
    }
  }
}

function renderHosts(list) {
  const box = el('hosts');
  if (!list || !list.length) {
    box.innerHTML = '<div class="empty">Buscando equipos…</div>';
    return;
  }
  box.innerHTML = '';
  for (const host of list) {
    const btn = document.createElement('button');
    btn.className = 'host';
    btn.type = 'button';
    const left = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = host.name;
    const where = document.createElement('div');
    where.className = 'where';
    where.textContent = `${host.address}:${host.port}`;
    left.appendChild(name);
    left.appendChild(where);
    const badge = document.createElement('span');
    badge.className = 'badge' + (host.sharing ? ' live' : '');
    badge.textContent = host.sharing ? 'Remoto · compartiendo' : 'Remoto · inactivo';
    btn.appendChild(left);
    btn.appendChild(badge);
    btn.addEventListener('click', () => {
      el('host').value = host.address;
      el('port').value = String(host.port);
      setCodeRequired(host.requireCode);
      if (host.requireCode === false) {
        el('code').value = '';
        setStatus(host.sharing ? 'Este Mac no requiere código. Pulsa Conectar.' : 'Ese Mac aún no está compartiendo.');
      } else {
        setStatus(host.sharing ? 'Escribe el código que muestra el Mac.' : 'Ese Mac aún no está compartiendo.');
        el('code').focus();
      }
    });
    box.appendChild(btn);
  }
}

function digitsOnly(value) {
  return String(value || '').replace(/\D+/g, '').slice(0, 6);
}

function setCodeRequired(required) {
  selectedRequireCode = required;
  const field = el('code');
  const label = field.closest('div').querySelector('.label');
  if (required === false) {
    field.disabled = true;
    field.placeholder = 'sin código';
    if (label) label.textContent = 'Código (no requerido)';
  } else {
    field.disabled = false;
    field.placeholder = '——————';
    if (label) label.textContent = 'Código de 6 dígitos';
  }
}

async function onConnectClicked() {
  const host = el('host').value.trim();
  const port = Number(el('port').value.trim() || 47820);
  const code = digitsOnly(el('code').value);
  if (!host) return setStatus('Escribe la dirección del Mac.', true);

  const button = el('go');
  button.disabled = true;
  retries = 0;
  try {
    // El Mac es la fuente de verdad sobre si exige código. Lo preguntamos directo
    // para no depender solo del descubrimiento UDP (que falla con IP escrita a mano).
    let requireCode = null;
    try {
      const info = await window.mirror.hello(host, port);
      requireCode = info.requireCode === true;
      setCodeRequired(requireCode);
    } catch (e) {
      requireCode = null; // no pudimos preguntar; dejamos que el host decida
    }

    if (requireCode === true && code.length !== 6) {
      setStatus('Este Mac requiere un código de 6 dígitos.', true);
      return;
    }
    const finalCode = requireCode === false ? '' : code;
    await connect({ host, port, code: finalCode });
  } catch (err) {
    setStatus(cleanError(err), true);
  } finally {
    button.disabled = false;
  }
}

el('go').addEventListener('click', onConnectClicked);
el('code').addEventListener('input', (e) => {
  e.target.value = digitsOnly(e.target.value);
});
el('code').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') onConnectClicked();
});
el('host').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') el('code').focus();
});
el('host').addEventListener('input', () => setCodeRequired(null));
el('port').addEventListener('input', () => setCodeRequired(null));

el('btn-exit').addEventListener('click', () => disconnect(true));
el('btn-full').addEventListener('click', () => {
  const active = !el('btn-full').classList.contains('active');
  el('btn-full').classList.toggle('active', active);
  document.body.classList.toggle('fs', active);
  window.mirror.setFullScreen(active);
});
const localBadge = el('local-badge');
if (localBadge && window.mirror.localName) localBadge.textContent = `Este equipo: ${window.mirror.localName}`;
el('btn-ontop').addEventListener('click', () => {
  const active = !el('btn-ontop').classList.contains('active');
  el('btn-ontop').classList.toggle('active', active);
  window.mirror.setAlwaysOnTop(active);
});

document.addEventListener('mousemove', bumpOverlay);
document.addEventListener('keydown', (e) => {
  if (!el('stage').classList.contains('on')) return;
  if (e.key === 'Escape') {
    el('btn-full').classList.remove('active');
    document.body.classList.remove('fs');
    window.mirror.setFullScreen(false);
    bumpOverlay();
  }
  if (e.key === 'f' || e.key === 'F') el('btn-full').click();
});

function fitVideoWindow() {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (w && h && window.mirror.fitAspect) window.mirror.fitAspect(w / h).catch(() => {});
}

video.addEventListener('loadedmetadata', () => {
  el('res').textContent = `${video.videoWidth}×${video.videoHeight}`;
  fitVideoWindow();
});
video.addEventListener('resize', fitVideoWindow);

function countFrames() {
  frameCount += 1;
  video.requestVideoFrameCallback(countFrames);
}
if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(countFrames);

const ICON_MAX =
  '<svg viewBox="0 0 9 9"><rect x="2" y="2" width="5" height="5" stroke="currentColor" stroke-width="1" fill="none"/></svg>';
const ICON_RESTORE =
  '<svg viewBox="0 0 9 9"><rect x="1.8" y="2.8" width="4.4" height="4.4" stroke="currentColor" stroke-width="1" fill="none"/><path d="M3.4 2.8V1.8h3.8v3.8H6.2" stroke="currentColor" stroke-width="1" fill="none"/></svg>';

if (window.mirror.customFrame) {
  document.body.classList.add('custom');
  el('wincontrols').classList.add('on');
  el('wc-min').addEventListener('click', () => window.mirror.minimize());
  el('wc-max').addEventListener('click', () => window.mirror.toggleMaximize());
  el('wc-close').addEventListener('click', () => window.mirror.closeWindow());
  window.mirror.onMaximized((on) => {
    el('wc-max').innerHTML = on ? ICON_RESTORE : ICON_MAX;
    el('wc-max').title = on ? 'Restaurar' : 'Maximizar';
  });
  const syncFocus = () => document.body.classList.toggle('focused', document.hasFocus());
  window.addEventListener('focus', syncFocus);
  window.addEventListener('blur', syncFocus);
  document.addEventListener('visibilitychange', syncFocus);
  syncFocus();
}

setInterval(() => {
  const now = performance.now();
  const seconds = (now - fpsWindowStart) / 1000;
  if (seconds >= 1) {
    currentFps = Math.round(frameCount / seconds);
    frameCount = 0;
    fpsWindowStart = now;
  }
}, 1000);

window.mirror.discover(renderHosts);
window.mirror.startDiscovery();

if (window.mirror.autoconnect) {
  const parts = String(window.mirror.autoconnect).split(':');
  const autoTarget = { host: parts[0], port: Number(parts[1] || 47820), code: parts[2] || '' };
  setTimeout(() => {
    connect(autoTarget).catch((err) => setStatus(cleanError(err), true));
  }, 800);
  setInterval(() => {
    if (!video.srcObject) return;
    const track = video.srcObject.getVideoTracks ? video.srcObject.getVideoTracks()[0] : null;
    if (!track) return;
    console.log(
      `TEST_STATS state=${pc ? pc.connectionState : 'none'} res=${video.videoWidth}x${video.videoHeight} fps=${currentFps} bitrate=${el('bitrate').textContent} audioLevel=${window.__audioLevel} audioBytes=${window.__audioState}`
    );
  }, 3000);
}
