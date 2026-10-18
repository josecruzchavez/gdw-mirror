'use strict';

const logEl = document.getElementById('log');
const lines = [];

function log(message, kind) {
  const stamp = new Date().toLocaleTimeString();
  lines.push(`[${stamp}] ${message}`);
  if (lines.length > 40) lines.shift();
  logEl.textContent = lines.join('\n');
  logEl.className = kind || '';
  console.log(message);
}

let pc = null;
let stream = null;
let statsTimer = null;
let lastSample = null;
let applySendParams = null;

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

// El perfil del menú es un techo deseado. Esta función lo adapta a la pantalla
// real que se está compartiendo: resolución de salida, fps físico y coste de codificación.
function effectiveProfile(profile, outW, outH, realFps) {
  const area = outW * outH;
  const out = Object.assign({}, profile);

  // Resolución: más de 2,5 Mpíxeles (≈ 4K o Retina 27-30") necesita más ancho
  // de banda para no quedar con pocos fps. 1080p y menos quedan con los valores
  // originales del perfil. El techo absoluto evita saturar la red local.
  if (area > 2500000) {
    const need = Math.round(110000000 * (area / 2500000));
    out.maxBitrate = Math.max(profile.maxBitrate, Math.min(need, 250000000));
  }

  // Fps físico: getDisplayMedia devuelve el frameRate real de la pantalla. Si
  // el perfil pide más, no tiene sentido forzar un techo que el hardware no
  // alcanza (y que antes hacía que no compartiera nada).
  if (realFps && realFps < out.fps) out.fps = Math.round(realFps);

  return out;
}

// Factor de reducción que aplicará el encoder. El reescalado lo hace la GPU,
// así que "escalada" no cuesta CPU extra ni cambia la captura.
function resolveScale(scaleMode, w, h) {
  if (scaleMode === 'half') return 2;
  if (scaleMode === 'hd') {
    if (w <= 1920 && h <= 1080) return 1;
    return Math.max(1, Math.min(w / 1920, h / 1080));
  }
  return 1;
}

async function teardown() {
  stopStats();
  applySendParams = null;
  if (pc) {
    try {
      pc.onconnectionstatechange = null;
      pc.close();
    } catch (e) {
      /* ignore */
    }
    pc = null;
  }
  if (stream) {
    stream.getTracks().forEach((t) => {
      try {
        t.stop();
      } catch (e) {
        /* ignore */
      }
    });
    stream = null;
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
    let out = null;
    let pair = null;
    report.forEach((r) => {
      if (r.type === 'outbound-rtp' && r.kind === 'video') out = r;
      if (r.type === 'candidate-pair' && (r.nominated || r.state === 'succeeded') && r.bytesSent) pair = r;
    });
    if (!out) return;
    const now = performance.now();
    let kbps = 0;
    let fps = out.framesPerSecond || 0;
    if (lastSample) {
      const seconds = (now - lastSample.t) / 1000;
      if (seconds > 0) {
        kbps = Math.round(((out.bytesSent - lastSample.bytes) * 8) / seconds / 1000);
        if (!fps && typeof out.framesEncoded === 'number') {
          fps = (out.framesEncoded - lastSample.frames) / seconds;
        }
      }
    }
    lastSample = { t: now, bytes: out.bytesSent || 0, frames: out.framesEncoded || 0 };
    const rtt =
      pair && typeof pair.currentRoundTripTime === 'number' ? Math.round(pair.currentRoundTripTime * 1000) : null;
    window.engine.stats({
      kbps,
      fps: Math.round(fps),
      rtt,
      quality: out.qualityLimitationReason || 'none',
      width: out.frameWidth || null,
      height: out.frameHeight || null,
      bytesSent: out.bytesSent || 0,
      framesEncoded: out.framesEncoded || 0,
    });
  }, 1000);
}

window.engine.onStart(async ({ audio, profile, scaleMode, capture }) => {
  await teardown();
  lastSample = null;
  try {
    log(`Iniciando captura · ${profile.label} · audio ${audio ? 'sí' : 'no'}`);
    const constraints = {
      video: { frameRate: { ideal: profile.fps } },
      // Chromium activa autoGainControl/noiseSuppression/echoCancellation por
      // defecto, pensado para micrófonos. En audio de sistema el AGC bombea el
      // nivel de forma impredecible (medido: 100% del volumen podía sonar más
      // bajo que 73%), así que se desactivan.
      audio: audio
        ? { autoGainControl: false, noiseSuppression: false, echoCancellation: false }
        : false,
    };
    stream = await navigator.mediaDevices.getDisplayMedia(constraints);

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) throw new Error('La captura no devolvió ninguna pista de video.');
    videoTrack.contentHint = profile.contentHint;
    videoTrack.addEventListener('ended', () => {
      log('La captura se detuvo desde el sistema.', 'err');
      window.engine.error('La captura de pantalla se detuvo.');
      teardown();
    });

    const settings = videoTrack.getSettings();
    log(`Fuente: "${videoTrack.label}" · modo ${scaleMode}`);
    // settings.width/height no son fiables con captura de pantalla en macOS:
    // reportan la resolución física de otra pantalla. Preferimos los datos de
    // la pantalla elegida que envía el proceso principal.
    const capW = (capture && capture.width) || settings.width || 0;
    const capH = (capture && capture.height) || settings.height || 0;
    const capFps = (capture && capture.fps) || settings.frameRate || 0;
    const scale = resolveScale(scaleMode, capW, capH);
    const outW = Math.round(capW / scale);
    const outH = Math.round(capH / scale);
    const eff = effectiveProfile(profile, outW, outH, capFps);
    log(`Captura ${capW}×${capH} @ ${capFps} fps → envío ${outW}×${outH}`);
    if (eff.maxBitrate !== profile.maxBitrate) {
      log(`Resolución alta: bitrate techo subido a ${Math.round(eff.maxBitrate / 1e6)} Mbps`, 'ok');
    }
    if (eff.fps !== profile.fps) {
      log(`La pantalla no alcanza ${profile.fps} fps; techo de fps reducido a ${eff.fps}`, 'ok');
    }

    const audioTrack = stream.getAudioTracks()[0] || null;
    if (audio && !audioTrack) log('El sistema no entregó audio del sistema.', 'err');

    pc = new RTCPeerConnection({ iceServers: [] });
    pc.onconnectionstatechange = () => {
      log(`Conexión: ${pc.connectionState}`, pc.connectionState === 'connected' ? 'ok' : '');
      window.engine.state(pc.connectionState);
      if (pc.connectionState === 'connected') {
        if (applySendParams) applySendParams();
      }
      if (pc.connectionState === 'failed') {
        window.engine.error('La conexión WebRTC falló. Revisa la red/firewall.');
        teardown();
      }
    };

    const videoTransceiver = pc.addTransceiver(videoTrack, {
      direction: 'sendonly',
      streams: [stream],
    });

    applySendParams = async () => {
      try {
        const params = videoTransceiver.sender.getParameters();
        params.degradationPreference = eff.degradation;
        params.encodings = [{ maxBitrate: eff.maxBitrate, maxFramerate: eff.fps, scaleResolutionDownBy: scale }];
        await videoTransceiver.sender.setParameters(params);
      } catch (e) {
        log(`No se pudieron aplicar los parámetros de envío: ${e.message}`, 'err');
      }
    };

    await applySendParams();
    log(`Envío limitado a ${Math.round(eff.maxBitrate / 1e6)} Mbps · ${eff.degradation} · escala ${scale}×`);
    try {
      const sp = videoTransceiver.sender.getParameters();
      const e0 = (sp.encodings && sp.encodings[0]) || {};
      log(`Sender: maxBitrate=${e0.maxBitrate} maxFps=${e0.maxFramerate} scaleDownBy=${e0.scaleResolutionDownBy}`);
    } catch (e) {
      log(`Sender params: ${e.message}`, 'err');
    }

    if (audioTrack) pc.addTransceiver(audioTrack, { direction: 'sendonly', streams: [stream] });

    try {
      const caps = RTCRtpSender.getCapabilities('video');
      if (caps && caps.codecs && caps.codecs.length) {
        const codecs = caps.codecs.slice();
        const low = (c) => (c.mimeType || '').toLowerCase();
        const h264 = codecs.findIndex((c) => low(c) === 'video/h264');
        const ordered = [];
        if (h264 >= 0) {
          ordered.push(codecs[h264]);
          if (codecs[h264 + 1] && low(codecs[h264 + 1]) === 'video/rtx') ordered.push(codecs[h264 + 1]);
          for (const c of codecs) {
            if (low(c) === 'video/red' || low(c) === 'video/ulpfec') ordered.push(c);
          }
        }
        for (const c of codecs) if (ordered.indexOf(c) === -1) ordered.push(c);
        videoTransceiver.setCodecPreferences(ordered);
        log(`Códecs: ${ordered.filter((c) => low(c).indexOf('video/') === 0 && low(c).indexOf('video/rtx') !== 0).map((c) => low(c).replace('video/', '')).slice(0, 3).join(' > ')}`);
      }
    } catch (e) {
      log(`No se pudieron fijar los códecs: ${e.message}`, 'err');
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIce(pc);

    window.engine.offer({
      sdp: pc.localDescription.sdp,
      video: {
        width: outW,
        height: outH,
        capturedWidth: capW,
        capturedHeight: capH,
        fps: eff.fps,
        audio: !!audioTrack,
      },
    });
    log('Oferta lista, esperando al receptor…', 'ok');
    startStats();
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    log(`Error: ${message}`, 'err');
    window.engine.error(message);
    await teardown();
  }
});

window.engine.onAnswer(async (sdp) => {
  if (!pc) {
    log('Respuesta recibida sin conexión activa.', 'err');
    return;
  }
  try {
    await pc.setRemoteDescription({ type: 'answer', sdp });
    log('Respuesta aplicada, negociando…', 'ok');
  } catch (err) {
    log(`Respuesta inválida: ${err.message}`, 'err');
    window.engine.error('No se pudo aplicar la respuesta del receptor.');
  }
});

window.engine.onStop(async () => {
  log('Compartición detenida.');
  await teardown();
  window.engine.state('closed');
});
