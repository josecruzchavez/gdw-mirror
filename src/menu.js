'use strict';

const el = (id) => document.getElementById(id);
const openBlocks = new Set();
let last = null;
let lastHeight = 0;

const CHEV =
  '<svg class="chev" viewBox="0 0 9 9"><path d="M3 1.5l3.5 3L3 7.5" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function optionRow(opt) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'opt' + (opt.on ? ' on' : '') + (opt.multi ? ' square' : '');
  const mark = document.createElement('span');
  mark.className = 'mark';
  const txt = document.createElement('span');
  txt.className = 'txt';
  txt.textContent = opt.label;
  b.appendChild(mark);
  b.appendChild(txt);
  if (opt.sub) {
    const sub = document.createElement('span');
    sub.className = 'sub';
    sub.textContent = opt.sub;
    b.appendChild(sub);
  }
  b.addEventListener('click', () => {
    if (opt.action) window.menu.action(opt.action);
  });
  return b;
}

function switchRow(key, label, on, action, hint) {
  const row = document.createElement('div');
  row.className = 'row';
  const txt = document.createElement('span');
  txt.className = 'txt';
  txt.textContent = label;
  const sw = document.createElement('span');
  sw.className = 'switch' + (on ? ' on' : '');
  row.appendChild(txt);
  row.appendChild(sw);
  row.addEventListener('click', () => window.menu.action(action));
  const wrap = document.createElement('div');
  wrap.appendChild(row);
  if (hint) {
    const h = document.createElement('div');
    h.className = 'hint';
    h.textContent = hint;
    wrap.appendChild(h);
  }
  return wrap;
}

function block(key, label, value, body) {
  const b = document.createElement('div');
  b.className = 'block' + (openBlocks.has(key) ? ' open' : '');
  const head = document.createElement('div');
  head.className = 'block-head';
  const lab = document.createElement('span');
  lab.className = 'label';
  lab.textContent = label;
  const val = document.createElement('span');
  val.className = 'value';
  val.textContent = value || '';
  head.appendChild(lab);
  head.appendChild(val);
  head.insertAdjacentHTML('beforeend', CHEV);
  head.addEventListener('click', () => {
    if (openBlocks.has(key)) openBlocks.delete(key);
    else openBlocks.add(key);
    b.classList.toggle('open', openBlocks.has(key));
    reportHeight();
  });
  const inner = document.createElement('div');
  inner.className = 'block-body';
  body(inner);
  b.appendChild(head);
  b.appendChild(inner);
  return b;
}

let lastSig = null;

function updateLive(s) {
  el('name').textContent = s.hostName || 'GDW Mirror';
  el('dot').className = 'dot' + (s.sharing ? (s.peerConnected ? ' ok' : ' live') : '');

  const status = el('status');
  status.className = 'status' + (s.error ? ' err' : '');
  status.textContent = s.error || s.statusText || '';

  const stats = el('stats');
  stats.innerHTML = '';
  if (s.sharing && s.video) {
    const add = (t) => {
      const c = document.createElement('span');
      c.className = 'chip';
      c.textContent = t;
      stats.appendChild(c);
    };
    const fps = s.video.fps ? ' @ ' + Math.round(s.video.fps) + ' fps' : '';
    add(s.video.width + '×' + s.video.height + fps);
    if (s.stats && s.stats.kbps) add(s.stats.kbps + ' kbps');
    if (s.stats && typeof s.stats.rtt === 'number') add(s.stats.rtt + ' ms');
    if (s.audio) add('audio');
  }

  const share = el('share');
  share.textContent = s.sharing ? 'Detener compartición' : s.starting ? 'Iniciando…' : 'Compartir pantalla';
  share.classList.toggle('stop', !!s.sharing);
  share.disabled = !!s.starting;

  el('ver').textContent = 'GDW Mirror ' + (s.version || '');
  el('login').textContent = 'Abrir al iniciar sesión' + (s.loginItem ? ' · activado' : '');
}

function render(s) {
  if (!s) return;
  last = s;

  updateLive(s);

  const sig = JSON.stringify([
    s.hostName,
    s.displayId,
    s.displays,
    s.profile,
    s.scaleMode,
    s.requireCode,
    s.code,
    s.audio,
    s.loginItem,
    s.version,
  ]);
  if (sig === lastSig) {
    reportHeight();
    return;
  }
  lastSig = sig;

  const box = el('blocks');
  box.innerHTML = '';

  box.appendChild(
    block('display', 'Pantalla a compartir', s.displayValue, (inner) => {
      (s.displays || []).forEach((d, i) => {
        inner.appendChild(
          optionRow({
            label: d.label,
            on: d.id === s.displayId,
            action: { type: 'set-display', value: d.id },
          })
        );
      });
    })
  );

  box.appendChild(
    block('profile', 'Perfil de calidad', s.profileLabel, (inner) => {
      (s.profiles || []).forEach((p) => {
        inner.appendChild(
          optionRow({
            label: p.label,
            on: p.key === s.profile,
            action: { type: 'set-profile', value: p.key },
          })
        );
      });
    })
  );

  box.appendChild(
    block('scale', 'Resolución enviada', s.scaleLabel, (inner) => {
      (s.scales || []).forEach((p) => {
        inner.appendChild(
          optionRow({
            label: p.label,
            on: p.key === s.scaleMode,
            action: { type: 'set-scale', value: p.key },
          })
        );
      });
    })
  );

  box.appendChild(
    block('audio', 'Audio del sistema', s.audio ? 'activado' : 'desactivado', (inner) => {
      inner.appendChild(switchRow('audio', 'Incluir audio del sistema', s.audio, { type: 'toggle-audio' }));
    })
  );

  box.appendChild(
    block('conn', 'Conexión', s.requireCode ? 'con código' : 'sin código', (inner) => {
      inner.appendChild(
        switchRow(
          'code',
          'Requerir código',
          s.requireCode,
          { type: 'toggle-code' },
          'Si lo desactivas, cualquier equipo de tu red puede conectarse.'
        )
      );
      if (s.requireCode && s.code) {
        const c = document.createElement('div');
        c.className = 'code';
        c.textContent = s.code;
        inner.appendChild(c);
      }
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'link';
      link.textContent = 'Detalles de conexión…';
      link.addEventListener('click', () => window.menu.action({ type: 'details' }));
      inner.appendChild(link);
    })
  );

  box.appendChild(
    block('about', 'Acerca de', 'José Cruz Chávez', (inner) => {
      const who = document.createElement('div');
      who.className = 'about-name';
      who.textContent = 'José Cruz Chávez';
      inner.appendChild(who);

      const tag = document.createElement('div');
      tag.className = 'about-tag';
      tag.textContent = 'Desarrollado con asistencia de IA para compartir la pantalla de una Mac en llamadas y conferencias desde Windows, a resolución nativa y sin instalar servicios ni drivers.';
      inner.appendChild(tag);

      const links = [
        { label: 'josecruzchavez.com', url: 'https://josecruzchavez.com' },
        { label: 'gdw.mx · desarrollos', url: 'https://gdw.mx' },
        { label: 'Invítame un café', url: 'https://www.paypal.com/paypalme/gestiondigitalweb' },
      ];
      links.forEach((l) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'link';
        b.textContent = l.label;
        b.addEventListener('click', () => window.menu.action({ type: 'open-url', url: l.url }));
        inner.appendChild(b);
      });
    })
  );

  reportHeight();
}

function reportHeight() {
  requestAnimationFrame(() => {
    const h = Math.ceil(document.body.scrollHeight);
    if (h && h !== lastHeight) {
      lastHeight = h;
      window.menu.resize(h);
    }
  });
}

el('share').addEventListener('click', () => window.menu.action({ type: 'toggle-share' }));
el('login').addEventListener('click', () => window.menu.action({ type: 'toggle-login' }));
el('perm').addEventListener('click', () => window.menu.action({ type: 'permissions' }));
el('quit').addEventListener('click', () => window.menu.action({ type: 'quit' }));

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.menu.hide();
});

window.menu.onState(render);
window.menu.ready();
