'use strict';

const http = require('http');
const os = require('os');

function postJson(host, port, path, body, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const payload = Buffer.from(JSON.stringify(body || {}), 'utf8');
    const req = http.request(
      {
        host,
        port,
        path,
        method: 'POST',
        timeout: timeoutMs,
        headers: { 'content-type': 'application/json', 'content-length': payload.length },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          let data = null;
          try {
            data = text ? JSON.parse(text) : null;
          } catch (e) {
            data = { error: 'Respuesta inválida del host' };
          }
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
          else reject(new Error((data && data.error) || 'Error HTTP ' + res.statusCode));
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('Tiempo de espera agotado')));
    req.on('error', (err) => reject(err));
    req.end(payload);
  });
}

function getJson(host, port, path, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host, port, path, timeout: timeoutMs }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (e) {
          reject(new Error('Respuesta inválida del host'));
        }
      });
    });
    req.on('timeout', () => req.destroy(new Error('Tiempo de espera agotado')));
    req.on('error', (err) => reject(err));
  });
}

function localIPv4(preferred) {
  const ifaces = os.networkInterfaces();
  const all = [];
  for (const name of Object.keys(ifaces)) {
    for (const ni of ifaces[name] || []) {
      if (ni.family === 'IPv4' && !ni.internal) all.push({ name, address: ni.address });
    }
  }
  if (preferred) {
    const hit = all.find((a) => a.name === preferred);
    if (hit) return hit.address;
  }
  const priv = all.find((a) => /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(a.address));
  return (priv || all[0] || { address: '127.0.0.1' }).address;
}

module.exports = { postJson, getJson, localIPv4 };
