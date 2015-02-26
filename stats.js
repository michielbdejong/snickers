var fs = require('fs'),
    mkdirp = require('mkdirp'),
    stats = {};

var SAVE_INTERVAL = 3600*1000,
    SAVE_ROOT = '/data/stats/';

module.exports.inc = function(domain) {
  if (!stats[domain]) {
    stats[domain] = 0;
  }
  stats[domain]++;
};

//...
setInterval(function() {
  mkdirp(SAVE_ROOT, function(err) {
    if (err) {
      alarm.raise('error writing stats '+JSON.stringify(err));
    } else {
      fs.writeFile(SAVE_ROOT + (new Date().getTime()), JSON.stringify(stats), function(err) {
        if (err) {
          alarm.raise('error writing stats '+JSON.stringify(err));
        } else {
          stats = {};
        }
      });
    }
  });
}, SAVE_INTERVAL);
