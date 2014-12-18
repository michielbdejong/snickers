var docker = require('docker.io')(),
    spdy = require('spdy'),
    crypto = require('crypto'),
    fs = require('fs'),
    httpProxy = require('http-proxy'),
    proxy = httpProxy.createProxyServer();

var startedContainers = {},
    IDLE_CHECK_FREQ = 0.1*60000,
    IDLE_LIMIT = 0.5*60000;

function getIPAddr(containerName, callback) {
  docker.containers.inspect(containerName, function handler(err, res) {
    var ipaddr = res.NetworkSettings.IPAddress;
    console.log('inspection', ipaddr);
    startedContainers[containerName] = {
      ipaddr: ipaddr,
      lastAccessed: new Date().getTime()
    };
    callback(err, ipaddr);
  });
}
function ensureStarted(containerName, callback) {
  if (startedContainers[containerName]) {
    callback(null, startedContainers[containerName].ipaddr);
  } else {
    console.log('starting', containerName);
    docker.containers.start(containerName, function handler(err, res) {
      if (err) {
        console.log('starting failed', containerName, err);
        callback(err);
      } else {
        getIPAddr(containerName, function(err, ipaddr) {
          console.log('started', containerName, ipaddr);
          callback(err, ipaddr);
        });
      }
    });
  }
}
function updateContainerList() {
  docker.containers.list(function handler(err, res) {
    for (var i=0; i<res.length; i++) {
      if (Array.isArray(res[i].Names) && res[i].Names.length === 1) {
        (function(containerName) {
          getIPAddr(containerName, function(err, ipaddr) {
            console.log('detected running container', containerName, ipaddr);
          });
        })(res[i].Names[0].substring(1));
      }
    }
  });
}

function startSpdy() {
  var options = {
    key: fs.readFileSync(__dirname + '/approved-certs/default.key'),
    cert: fs.readFileSync(__dirname + '/approved-certs/default.cert'),
    ca: fs.readFileSync(__dirname + '/approved-certs/default.ca'),
    SNICallback: function(servername) {
      // console.log('SNIcallback', servername);
      return crypto.createCredentials({
        key: fs.readFileSync(__dirname + '/approved-certs/' + servername + '.key'),
        cert: fs.readFileSync(__dirname + '/approved-certs/' + servername + '.cert'),
        ca: fs.readFileSync(__dirname + '/approved-certs/' + servername + '.ca')
      }).context;
    }
  };

  var server = spdy.createServer(options, function(req, res) {
    var containerName = req.headers.host + '-443';
    ensureStarted(containerName, function(err, ip) {
      if (err) {
        res.writeHead(500);
        res.end('Could not find website on this server: ' + containerName + ' - ' + JSON.stringify(err));
       } else {
         startedContainers[containerName].lastAccessed = new Date().getTime();
         console.log('Proxying ' + containerName + ' to http://' + ip);
         proxy.web(req, res, { target: 'http://' + ip });
       }
    });
  });

  server.listen(443);
}

function stopContainer(containerName) {
  docker.containers.stop(containerName, function(err) {
    if (err) {
      console.log('failed to stop container', containerName, err);
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
