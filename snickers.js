var Docker = require('dockerode'),
    docker = new Docker(),
    spdy = require('spdy'),
    crypto = require('crypto'),
    fs = require('fs'),
    httpProxy = require('http-proxy'),
    proxy = httpProxy.createProxyServer(),
    http = require('http');

var startedContainers = {},
    IDLE_CHECK_FREQ = 0.1*60000,
    IDLE_LIMIT = 10*60000,
    PROXY_MAX_TRY = 500,
    PROXY_RETRY_TIME = 300;

function inspectContainer(containerName, callback) {
  docker.getContainer(containerName).inspect(function handler(err, res) {
    var ipaddr = res.NetworkSettings.IPAddress;
    console.log('inspection', ipaddr);
    callback(err, {
      ipaddr: ipaddr,
      lastAccessed: new Date().getTime()
    });
  });
}
function ensureStarted(containerName, callback) {
  var startTime = new Date().getTime();
  if (startedContainers[containerName]) {
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
          callback(err, containerObj.ipaddr);
        });
      }
    });
  }
}
function updateContainerList() {
  console.log('updating container list');
  var newList = {}, numDone = 0;
  docker.listContainers(function handler(err, res) {
    console.log('container list', err, res);
    function checkDone() {
      if (numDone ===  res.length) {
        startedContainers = newList;
        console.log('new container list', startedContainers);
      }
    }
    for (var i=0; i<res.length; i++) {
      if (Array.isArray(res[i].Names) && res[i].Names.length === 1) {
        (function(containerName) {
          inspectContainer(containerName, function(err, containerObj) {
            console.log('detected running container', containerName, containerObj);
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

function proxyTo(req, res, ipaddr, attempt) {
  if (!attempt) {
    attempt = 0;
  }
  console.log('Proxy attempt ' + attempt + ' of ' + PROXY_MAX_TRY + ' (spaced at ' + PROXY_RETRY_TIME + 'ms)', ipaddr);
  proxy.web(req, res, { target: 'http://' + ipaddr }, function(e) {
    if (attempt > PROXY_MAX_TRY) {
      res.writeHead(500);
      res.end('Could not proxy request: ' + req.headers.host + '-443');
    } else {
      setTimeout(function() {
        if (attempt % 10 === 0) {
          updateContainerList();
        }
        proxyTo(req, res, ipaddr, attempt + 1);
      }, PROXY_RETRY_TIME);
    }
  });
}

function proxyWsTo(req, socket, head, ipaddr, attempt) {
  if (!attempt) {
    attempt = 0;
  }
  console.log('Proxy ws attempt ' + attempt + ' of ' + PROXY_MAX_TRY + ' (spaced at ' + PROXY_RETRY_TIME + 'ms)', ipaddr);
  proxy.ws(req, socket, head, { target: 'http://' + ipaddr }, function(e) {
    if (attempt > PROXY_MAX_TRY) {
      res.writeHead(500);
      res.end('Could not proxy ws request: ' + req.headers.host + '-443');
    } else {
      setTimeout(function() {
        proxyWsTo(req, socket, head, ipaddr, attempt + 1);
      }, PROXY_RETRY_TIME);
    }
  });
}

function startSpdy() {
  var defaultCert = {
    key: fs.readFileSync(__dirname + '/approved-certs/default.key'),
    cert: fs.readFileSync(__dirname + '/approved-certs/default.cert'),
    ca: fs.readFileSync(__dirname + '/approved-certs/default.ca')
  };
  var options = {
    key: defaultCert.key,
    cert: defaultCert.cert,
    ca: defaultCert.ca,
    SNICallback: function(servername) {
      var cert;
      try {
        cert = {
          key: fs.readFileSync(__dirname + '/approved-certs/' + servername + '.key'),
          cert: fs.readFileSync(__dirname + '/approved-certs/' + servername + '.cert'),
          ca: fs.readFileSync(__dirname + '/approved-certs/' + servername + '.ca')
        };
      } catch (e) {
        console.log('SNIcallback but no cert', servername);
        cert = defaultCert;
      }
      return crypto.createCredentials(cert).context;
    }
  };

  var server = spdy.createServer(options, function(req, res) {
    var containerName = req.headers.host + '-443';
    ensureStarted(containerName, function(err, ipaddr) {
      if (err) {
        res.writeHead(500);
        res.end('Could not find website on this server: ' + containerName + ' - ' + JSON.stringify(err));
      } else {
        startedContainers[containerName].lastAccessed = new Date().getTime();
        console.log('Proxying ' + containerName + ' to http://' + ipaddr);
        proxyTo(req, res, ipaddr);
      }
    });
  });

  //special case for dealing with websockets:
  server.on('upgrade', function (req, socket, head) {
    var containerName = req.headers.host + '-443';
    ensureStarted(containerName, function(err, ipaddr) {
      if (err) {
        res.writeHead(500);
        res.end('Could not find website on this server: ' + containerName + ' - ' + JSON.stringify(err));
      } else {
        startedContainers[containerName].lastAccessed = new Date().getTime();
        console.log('Proxying ' + containerName + ' to http://' + ipaddr);
        proxyWsTo(req, socket, head, ipaddr);
      }
    });
  });

  proxy.on('error', function(e) {
    console.log('proxy error', e);
  });

  server.listen(443);
}

function stopContainer(containerName) {
  docker.getContainer(containerName).stop(function(err) {
    if (err) {
      console.log('failed to stop container', containerName, err);
      updateContainerList();
    } else {
      delete startedContainers[containerName];
      console.log('stopped container', containerName);
    }
  });
}

function checkIdle() {
  console.log('checking for idle containers');
  var thresholdTime = new Date().getTime() - IDLE_LIMIT;
  for (var i in startedContainers) {
    if (startedContainers[i].lastAccessed < thresholdTime) {
      stopContainer(i);
    }
  }
}

//...
updateContainerList();
startSpdy();
setInterval(checkIdle, IDLE_CHECK_FREQ);
http.createServer(function(req, res) {
  res.writeHead(302, {
    Location: 'https://' + req.headers.host + req.url
  });
  res.end('Location: https://' + req.headers.host + req.url);
}).listen(80);
