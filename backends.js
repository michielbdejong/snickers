var Docker = require('dockerode'),
    docker = new Docker();

var startedContainers = {},
    stoppingContainerWaiters = {},
    IDLE_CHECK_FREQ = 0.1*60000,
    IDLE_LIMIT = 0.1*60000,
    BACKUP_FREQ = 0.15*60000;

function inspectContainer(containerName, callback) {
  docker.getContainer(containerName).inspect(function handler(err, res) {
    var ipaddr = res.NetworkSettings.IPAddress;
    //console.log('inspection', ipaddr);
    callback(err, {
      ipaddr: ipaddr,
      lastAccessed: new Date().getTime()
    });
  });
}
function ensureStarted(hostname, image, callback) {
  var containerName = hostname + '-443';
  var startTime = new Date().getTime();
  if (stoppingContainerWaiters[containerName]) {
    stoppingContainerWaiters[containerName].push(callback);
  } else if (startedContainers[containerName]) {
    startedContainers[containerName].lastAccessed = new Date().getTime();
    callback(null, startedContainers[containerName].ipaddr);
  } else {
    console.log('starting', containerName);
    docker.getContainer(containerName).start(function handler(err, res) {
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
  docker.getContainer(containerName).exec({ Cmd: 'sh /backup.sh' }, function(err) {
    console.log('result of sh /backup.sh', err);
    if (callback) {
      callback(err);
    }
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
      docker.getContainer(containerName).stop(function(err) {
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
          ensureStarted(containerName, function(err) {
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

//...
updateContainerList();
setInterval(checkIdle, IDLE_CHECK_FREQ);
setInterval(function() {
  updateContainerList(function() {
    for (var containerName in startedContainers) {
      backupContainer(containerName);
    }
  });
}, BACKUP_FREQ);

module.exports.ensureStarted = ensureStarted;
