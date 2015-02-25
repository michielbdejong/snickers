var Repo = require('git-tools'),
    mkdirp = require('mkdirp'),
    alarm = require('./alarm'),
    configReader = require('./config-reader');

var CHECKOUTS_ROOT = '/data/domains/',
    DEFAULT_PULL_INTERVAL = 60 * 60 * 1000;

var lastPull = {};

module.exports.maybePull = function(domain, interval) {
  var now = new Date().getTime();
  if (!interval) {
    interval = DEFAULT_PULL_INTERVAL;
  }
  if (lastPull[domain] && (now - lastPull[domain] < interval)) {
    return;
  }
  var repo = new Repo(CHECKOUTS_ROOT + domain);
  repo.exec('pull', function(err, data) {
    if (err) {
      alarm.raise('git pull failed', domain);
    } else {
      lastPull[domain] = now;
    }
  });
}

module.exports.ensurePresent = function(domain, remotePath, callback) {
  var localPath = CHECKOUTS_ROOT + domain;
  Repo.isRepo(localPath, function(err, isRepo) {
    if (err) {
      callback(err);
    } else if (isRepo) {
      callback(null, localPath);
    } else {
      if (!remotePath) {
        var backupServer = configReader.getBackupServer('origin');
        if (!backupServer) {
          calback('Cannot clone repo! No remotePath specified, and no origin backup server in config');
          return;
        }
        remotePath = backupServer + domain;
      }
      Repo.clone({
        repo: remotePath,
        dir: localPath
      }, function(err2, repo) {
        if (err2) {
          callback(err2);
        } else {
          callback(null, localPath);
        }
      });
    }
  });
};
