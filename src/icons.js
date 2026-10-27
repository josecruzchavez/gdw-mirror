'use strict';

const zlib = require('zlib');
const path = require('path');

let CRC_TABLE = null;

function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function encodePNG(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function inRoundRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function canvas(size, draw) {
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = draw(x + 0.5, y + 0.5);
      if (!px) continue;
      const i = (y * size + x) * 4;
      buf[i] = px[0];
      buf[i + 1] = px[1];
      buf[i + 2] = px[2];
      buf[i + 3] = px[3];
    }
  }
  return encodePNG(size, size, buf);
}

const SIZE = 44;

function monitorIcon() {
  return canvas(SIZE, (x, y) => {
    const outer = inRoundRect(x, y, 5, 10, 39, 33, 5);
    const inner = inRoundRect(x, y, 8.5, 13.5, 35.5, 29.5, 2.5);
    if (outer && !inner) return [0, 0, 0, 255];
    if (inRoundRect(x, y, 19, 32, 25, 37, 1)) return [0, 0, 0, 255];
    if (inRoundRect(x, y, 13, 37, 31, 40.5, 2)) return [0, 0, 0, 255];
    return null;
  });
}

function liveIcon() {
  return canvas(SIZE, (x, y) => {
    const dx = x - 22;
    const dy = y - 22;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d <= 9.5) return [255, 59, 48, 255];
    if (d <= 13) {
      const a = Math.round(140 * (1 - (d - 9.5) / 3.5));
      return [255, 59, 48, Math.max(0, a)];
    }
    return null;
  });
}

function appIcon(size) {
  const k = size / 256;
  return canvas(size, (x0, y0) => {
    const x = x0 / k;
    const y = y0 / k;
    const dx = x - 128;
    const dy = y - 128;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 122) return null;
    const inside = inRoundRect(x, y, 58, 78, 198, 178, 18) && !inRoundRect(x, y, 72, 92, 184, 164, 10);
    if (inside) return [235, 235, 245, 255];
    if (inRoundRect(x, y, 118, 172, 138, 196, 4)) return [235, 235, 245, 255];
    if (inRoundRect(x, y, 92, 194, 164, 206, 6)) return [235, 235, 245, 255];
    if (d <= 108) return [30, 30, 38, 255];
    return null;
  });
}

function appIconPNG(size) {
  return appIcon(size || 1024);
}

module.exports = {
  makeWindowsTray: () => {
    const { nativeImage } = require('electron');
    const imagePath = path.join(__dirname, 'assets', 'windows-tray.png');
    const img = nativeImage.createFromPath(imagePath);
    if (img.isEmpty()) throw new Error(`No se pudo cargar el icono de Windows: ${imagePath}`);
    return img.resize({ width: 32, height: 32 });
  },
  makeMonitor: (scale = 2) => {
    const { nativeImage } = require('electron');
    const img = nativeImage.createFromBuffer(monitorIcon(), { scaleFactor: scale });
    img.setTemplateImage(true);
    return img;
  },
  makeLive: (scale = 2) => {
    const { nativeImage } = require('electron');
    const img = nativeImage.createFromBuffer(liveIcon(), { scaleFactor: scale });
    img.setTemplateImage(false);
    return img;
  },
  makeApp: () => {
    const { nativeImage } = require('electron');
    return nativeImage.createFromBuffer(appIcon(512), { scaleFactor: 2 });
  },
  appIconPNG,
  encodePNG,
  canvas,
};
