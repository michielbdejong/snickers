var snickersSpdy = require('./snickers-spdy'),
    configReader = require('./config-reader'),
    snickersHttp = require('./snickers-http'),
    stats = require('./stats');

// This method does four things:
// * Initialize the config reader
// * Initializes the stats
// * Start the SPDY service
// * Start the http service

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
          snickersSpdy.start(function(err3) {
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
