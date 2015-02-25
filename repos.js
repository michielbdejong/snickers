var Repo = require('git-tools'),
    mkdirp = require('mkdirp'),
    configReader = require('./config-reader');

var CHECKOUTS_ROOT = '/data/domains/';

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
