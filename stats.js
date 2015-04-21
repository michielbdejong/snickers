//TODO: make this an object instead of a singleton
var fs = require('fs'),
    mkdirp = require('mkdirp'),
    stats = {},
    timer;

var SAVE_INTERVAL = 3600*1000,
    SAVE_ROOT = '/data/stats/';

module.exports.inc = function(domain) {
  if (!stats[domain]) {
    stats[domain] = 0;
  }
  stats[domain]++;
};

module.exports.init = function(callback) {
  mkdirp(SAVE_ROOT, function(err1) {
    if (err1) {
      callback(err1);
    } else {
      timer = setInterval(function() {
        mkdirp(SAVE_ROOT, function(err2) {
          if (err2) {
            alarm.raise('error writing stats '+JSON.stringify(err2));
          } else {
            fs.writeFile(SAVE_ROOT + (new Date().getTime()), JSON.stringify(stats), function(err3) {
              if (err3) {
                alarm.raise('error writing stats '+JSON.stringify(err3));
              } else {
                stats = {};
              }
            });
          }
        });
      }, SAVE_INTERVAL);
      callback(null);
    }
  });
};
module.exports.exit = function() {
  clearInterval(timer);
};
