var Repo = require('git-tools'),
    mkdirp = require('mkdirp'),
    alarm = require('./alarm'),
    configReader = require('./config-reader');

var CHECKOUTS_ROOT = '/data/domains/',
    DEFAULT_PULL_INTERVAL = 60 * 60 * 1000;

var lastPull = {};

module.exports.maybePull = function(domain, interval, callback) {
  var now = new Date().getTime();
  if (!interval) {
    interval = DEFAULT_PULL_INTERVAL;
  }
  if (lastPull[domain] && (now - lastPull[domain] < interval)) {
    if (callback) {
      callback();
    }
    return;
  }
  var repo = new Repo(CHECKOUTS_ROOT + domain);
  repo.exec('pull', function(err, data) {
    if (err) {
      alarm.raise('git pull failed', domain);
      if (callback) {
        callback(err);
      }
    } else {
      lastPull[domain] = now;
      if (callback) {
        callback();
      }
    }
  });
}

module.exports.ensurePresent = function(domain, remotePath, callback) {
  var localPath = CHECKOUTS_ROOT + domain, secondaryPath;
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
        remotePath = backupServer + ':' + domain;
        var secondaryBackupServer = configReader.getBackupServer('secondary');
        if (!secondaryBackupServer) {
          calback('No remotePath specified, and refusing to clone a backed-up repo without a secondary!');
          return;
        }
        secondaryPath = secondaryBackupServer + ':' + domain;
      }
      console.log('cloning', remotePath, localPath);
      Repo.clone({
        repo: remotePath,
        dir: localPath
      }, function(err2, repo) {
        if (err2) {
          callback(err2);
        } else if (secondaryPath) {
          var repo = new Repo(localPath);
          repo.exec('remote', 'add', 'secondary', secondaryPath, function(err, data) {
            callback(err, localPath);
          });
        } else {
          callback(null, localPath);
        }
      });
    }
  });
};
module.exports.pushOutBackup = function(domain, callback) {
  var localPath = CHECKOUTS_ROOT + domain;
  Repo.isRepo(localPath, function(err, isRepo) {
    if (err) {
      callback(err);
    } else if (isRepo) {
      var repo = new Repo(localPath);
      repo.remotes(function(err, remotes) {
        if (err) {
          callback(err);
        } else {
          if (remotes.length != 2) {
            callback('was expecting two remotes on ' + localPath + ' but found: ' + JSON.stringify(remotes));
          } else {
            if (remotes[0].name === 'origin' || remotes[1].name === 'origin') {
              if (remotes[0].name === 'secondary' || remotes[1].name === 'secondary') {
                console.log('backups push 1: add *');
                repo.exec('add', '*', function(err, data) {
                  if (err) {
                    callback('could not add changes to commit on ' + localPath + ': ' + err.toString());
                  } else {
                    console.log(data);
                      console.log('backups push 2: commit');
                    repo.exec('commit', '-am"Snickers backup '+(new Date().toString()), function(err, data) {
                      if (err) {
                        callback('could not commit changes on ' + localPath + ': ' + JSON.stringify(err));
                      } else {
                        console.log(data);
                        console.log('backups push 3: push to origin');
                        repo.exec('push', '-u', 'origin', 'master', function(err, data) {
                          if (err) {
                            callback('could not push to origin ' + localPath + ': ' + err.toString());
                          } else {
                            console.log(data);
                            console.log('backups push 4: push to secondary');
                            repo.exec('push', '-u', 'secondary', 'master', function(err, data) {
                              if (err) {
                                callback('could not push to secondary ' + localPath + ': ' + err.toString());
                              } else {
                                console.log(data);
                                callback(null);
                              } // sorry for the callback hell! :)
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            }
          }
        }
      });
    } else {
      console.log('ALARM! Was expecting ' + localPath + ' to be a git repo');
    }
  });
}
