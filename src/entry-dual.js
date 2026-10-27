'use strict';

// One packaged application supports both roles from the tray and viewer window.
process.env.MIRROR_DUAL_APP = '1';
require('./main');
