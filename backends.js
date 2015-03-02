var Docker = require('dockerode'),
    docker = new Docker(),
    configReader = require('./config-reader');

var startedContainers = {},
    stoppingContainerWaiters = {},
    IDLE_CHECK_FREQ = 0.1*60000,
    IDLE_LIMIT = 0.1*60000,
    BACKUP_FREQ = 0.15*60000;

function createContainer(domain, image, localDataPath, callback) {
  docker.buildImage('./backends/tar/' + image + '.tar', {t: image}, function(err, stream) {
    console.log('build err', err);
    stream.pipe(process.stdout);
    stream.on('end', function() {
      console.log('build done, creating container now');
      var volumes = {};
      volumes[localDataPath+'/'+image] = '/data';
      docker.createContainer({
        Image: image,
        Binds: volumes,
        name: domain + '-' + image
      }, callback);
    });
  });
}
function smartStartContainer(domain, image, localDataPath, callback) {
  docker.getContainer(domain + '-' + image).start(function(err, res) {
    if (err && err.statusCode === 404) {
      createContainer(domain, image, function(err, container) {
        if (err) {
          callback(err);
        } else{
          container.start(callback);
        }
      });
    } else {
      callback(err, res);
    }
  });
}

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
function ensureStarted(hostname, image, localDataPath, callback) {
  console.log('ensureStarted', hostname, image, localDataPath, callback);
  var containerName = hostname + '-' + image;
  var startTime = new Date().getTime();
  if (stoppingContainerWaiters[containerName]) {
    stoppingContainerWaiters[containerName].push(callback);
  } else if (startedContainers[containerName]) {
    startedContainers[containerName].lastAccessed = new Date().getTime();
    callback(null, startedContainers[containerName].ipaddr);
  } else {
    console.log('starting', containerName);
    smartStartContainer(hostname, image, function(err, res) {
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

function buildBaseContainers(list, callback) {
  if (list.length === 0) {
    console.log('Done building base containers');
    callback();
    return;
  }
  var image = list.pop();
  docker.buildImage('./backends/tar/' + image + '.tar',
      {t: image},
      function(err, stream) {
    stream.pipe(process.stdout);
    stream.on('end', function() {
      buildBaseContainers(list, callback);
    });
  });
}

//...
module.exports.init = function(callback) {
  buildBaseContainers(configReader.getBaseContainers(), function() {
    setInterval(checkIdle, IDLE_CHECK_FREQ);
    setInterval(function() {
      updateContainerList(function() {
        for (var containerName in startedContainers) {
          backupContainer(containerName);
        }
      });
    }, BACKUP_FREQ);
    updateContainerList(callback);
  });
};
module.exports.ensureStarted = ensureStarted;
