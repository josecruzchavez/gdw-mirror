'use strict';

const { app } = require('electron');

// Evita que Chromium oculte las IPs locales detrás de candidatos mDNS (.local):
// Windows sin Bonjour no puede resolverlos y la conexión fallaría en LAN.
app.commandLine.appendSwitch('disable-features', 'WebRtcHideLocalIpsWithMdns');

const MODE = process.env.MIRROR_MODE || (process.argv.includes('--mode=viewer') ? 'viewer' : 'host');

if (MODE === 'viewer') {
  require('./viewer-main').viewerStart();
} else {
  require('./host-main').hostStart();
}
