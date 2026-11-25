'use strict';

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const MAX_LOG_BYTES = 5 * 1024 * 1024;
const writeQueues = new Map();

function diagnosticsDirectory() {
  return path.join(app.getPath('userData'), 'diagnostics');
}

function logPath(source) {
  return path.join(diagnosticsDirectory(), `diagnostics-${source}.jsonl`);
}

function writeDiagnosticLog(source, event, details = {}) {
  const file = logPath(source);
  const line = `${JSON.stringify({
    timestamp: new Date().toISOString(),
    processId: process.pid,
    source,
    event,
    ...details,
  })}\n`;
  const backup = `${file}.1`;

  const write = async () => {
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    let size = 0;
    try {
      size = (await fs.promises.stat(file)).size;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    if (size + Buffer.byteLength(line) > MAX_LOG_BYTES) {
      await fs.promises.rm(backup, { force: true });
      try {
        await fs.promises.rename(file, backup);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    await fs.promises.appendFile(file, line, 'utf8');
  };

  const previous = writeQueues.get(source) || Promise.resolve();
  const next = previous.then(write).catch((error) => {
    console.error(`[diagnostics] Could not write ${file}:`, error);
  });
  writeQueues.set(source, next);
}

module.exports = { diagnosticsDirectory, writeDiagnosticLog };
