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

function init(callback) {
  configReader.init(function(err1) {
    if (err1) {
      callback(err1);
    } else {
      stats.init(function(err2) {
        if (err2) {
          configReader.exit();
          callback(err2);
        } else {
          spdy.start(function(err3) {
            if (err3) {
              configReader.exit();
              stats.exit();
              callback(err3);
            } else {
              snickersHttp.start(configReader, stats, function(err4) {
                if (err4) {
                  configReader.exit();
                  stats.exit();
                }
                callback(err4);
              });
            }
          });
        }
      });
    }
  });
}

//...
init(function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log('Listening with SPDY/SNI on port 443 and with http on port 80');
  }
});
