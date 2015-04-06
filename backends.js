var Docker = require('dockerode'),
    docker = new Docker(),
    async = require('async'),
    configReader = require('./config-reader'),
    mkdirp = require('mkdirp');

var startedContainers = {},
    stoppingContainerWaiters = {},
    IDLE_CHECK_INTERVAL = 0.1*60000,
    IDLE_LIMIT = 0.1*60000,
    BACKUP_INTERVAL = 60*60000;
    MEM_LIMIT_BYTES = 300 * 1024 * 1024;

//For now, we only listen on port 443, meaning there can only be one
//container per domain. We'll need to add more parameters to this method
//if we open more ports in the future. However, the local data path is
// already /data/domains/<domain>/<config.application>

function startContainer(domain, localDataPath, callback) {
  var config = configReader.getConfig(domain);
  docker.getContainer(domain).start(function(err, res) {
    if (err) {
      callback(err);
    } else{
      container.start(callback);
    }
  });
}

function inspectContainer(containerName, callback) {
  docker.getContainer(containerName).inspect(function handler(err, res) {
    var ipaddr = res.NetworkSettings.IPAddress;
    callback(err, {
      ipaddr: ipaddr,
      lastAccessed: new Date().getTime()
    });
  });
}
function ensureStarted(hostname, localDataPath, callback) {
  console.log('ensureStarted', hostname, localDataPath, callback);
  var containerName = hostname;
  var startTime = new Date().getTime();
  if (stoppingContainerWaiters[containerName]) {
    stoppingContainerWaiters[containerName].push(callback);
  } else if (startedContainers[containerName]) {
    startedContainers[containerName].lastAccessed = new Date().getTime();
    callback(null, startedContainers[containerName].ipaddr);
  } else {
    console.log('starting', containerName);
    startContainer(hostname, localDataPath, function(err, res) {
      if (err) {
        console.log('starting failed', containerName, err);
        callback(err);
      } else {
        inspectContainer(containerName, function(err, containerObj) {
          console.log('started in ' + (new Date().getTime() - startTime) + 'ms', containerName, containerObj);
          startedContainers[containerName] = containerObj;
          startedContainers[containerName].lastAccessed = new Date().getTime();
          callback(err, containerObj.ipaddr);
        });
      }
    });
  }
}
function updateContainerList(callback) {
  //console.log('updating container list');
  var newList = {}, numDone = 0;
  docker.listContainers(function handler(err, res) {
    //console.log('container list', err, res);
    function checkDone() {
      if (numDone ===  res.length) {
        startedContainers = newList;
        //console.log('new container list', startedContainers);
        if (callback) {
          callback();
        }
      }
    }
    for (var i=0; i<res.length; i++) {
      if (Array.isArray(res[i].Names) && res[i].Names.length === 1) {
        (function(containerName) {
          inspectContainer(containerName, function(err, containerObj) {
            //console.log('detected running container', containerName, containerObj);
            newList[containerName] = containerObj;
            numDone++;
            checkDone()
          });
        })(res[i].Names[0].substring(1));
      } else {
        numDone++;
        checkDone();
      }
    }
    checkDone();
  });
}
function backupContainer(containerName, callback) {
  docker.getContainer(containerName).exec({ Cmd: [ 'sh', '/backup.sh' ] }, function(err, exec) {
    exec.start(function(err, stream) {
      if (err) {
        if (callback) {
          callback(err);
        }
      } else {
        stream.setEncoding('utf8');
        stream.pipe(process.stdout);
        stream.on('end', function() {
          console.log('done with sh /backup.sh inside the container');
          if (callback) {
            callback(null);
          }
        });
      }
    });
  });
}

function stopContainer(containerName) {
  if (stoppingContainerWaiters[containerName]) {
    return;
  } else {
    stoppingContainerWaiters[containerName] = [];
  }

  backupContainer(containerName, function(err) {
    if (err) {
      console.log('backup failed, not stopping this container now');
      delete stoppingContainerWaiters[containerName];
    } else {
      var container = docker.getContainer(containerName);
      container.stop(function(err) {
        var waiters = stoppingContainerWaiters[containerName];
        delete stoppingContainerWaiters[containerName];
        if (err) {
          console.log('failed to stop container', containerName, err);
          updateContainerList();
        } else {
          delete startedContainers[containerName];
          console.log('stopped container', containerName);
        }
        if (waiters.length) {
          container.start(function(err, res) {
            for (var i=0; i<waiters.length; i++) {
              waiters[i](err);
            }
          });
        }
      });
    }
  });
}

function checkIdle() {
  updateContainerList(function() {
    var thresholdTime = new Date().getTime() - IDLE_LIMIT;
    for (var i in startedContainers) {
      if (startedContainers[i].lastAccessed < thresholdTime) {
        stopContainer(i);
      }
    }
  });
}
module.exports.init = function(callback) {
  setInterval(checkIdle, IDLE_CHECK_INTERVAL);
  setInterval(function() {
    updateContainerList(function() {
      for (var containerName in startedContainers) {
        backupContainer(containerName);
      }
    });
  }, BACKUP_INTERVAL);
    
  updateContainerList(callback);
};
module.exports.ensureStarted = ensureStarted;
