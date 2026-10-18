'use strict';

// Cálculo puro del encaje de ventana al aspect ratio de la señal recibida.
// Vive aparte de Electron para poder probarlo sin levantar la app.

const MIN_W = 240;
const MIN_H = 180;
const MAX_FRACTION = 0.92;

// bounds: { x, y, width, height } de la ventana
// workArea: { x, y, width, height } del monitor donde está la ventana
// Devuelve { x, y, width, height, changed } ya recortado al área de trabajo.
function fitBounds(bounds, workArea, ratio) {
  const r = Number(ratio);
  if (!r || !isFinite(r) || r <= 0) return null;

  const maxW = Math.round(workArea.width * MAX_FRACTION);
  const maxH = Math.round(workArea.height * MAX_FRACTION);

  let w = bounds.width;
  let h = Math.round(w / r);
  if (h > maxH) {
    h = maxH;
    w = Math.round(h * r);
  }
  if (w > maxW) {
    w = maxW;
    h = Math.round(w / r);
  }
  w = Math.max(w, MIN_W);
  h = Math.max(h, MIN_H);

  const current = bounds.width / bounds.height;
  if (Math.abs(current - r) < 0.01 && bounds.width <= maxW && bounds.height <= maxH) {
    return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, changed: false };
  }

  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  let x = Math.round(cx - w / 2);
  let y = Math.round(cy - h / 2);
  x = Math.min(Math.max(x, workArea.x), workArea.x + workArea.width - w);
  y = Math.min(Math.max(y, workArea.y), workArea.y + workArea.height - h);

  return { x, y, width: w, height: h, changed: true };
}

module.exports = { fitBounds, MIN_W, MIN_H, MAX_FRACTION };
