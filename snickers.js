//components to make into npm modules:
// - git stuff
// - jitboot
// - coyote-config-reader
// - http-redirector
// - snitch ('sni transparency can haz')
// - coyote-stats
// - coyote-alarms
// - snickers-applications

var spdy = require('./spdy'),
    configReader = require('./config-reader'),
    snickersHttp = require('./snickers-http'),
    stats = require('./stats');

//...
configReader.init();
spdy.start();
snickersHttp.start(configReader, stats);
