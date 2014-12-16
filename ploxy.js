var docker = require('docker.io')({host:"http://localhost", port: "4243", version:'v1.1'}),
    spdy = require('spdy'),
    fs = require('fs');

var startedContainers = {};

function ensureStarted(containerName, callback) {
  if (startedContainers[containerName]) {
    callback(null);
  } else {
    docker.containers.start(function handler(err, res) {
      if (!err) {
        startedContainers[containerName] = true;
      }
      callback(err, res);
    });
  }
}

function startSpdy() {
  var options = {
    pfx: fs.readFileSync(__dirname + '/approved-certs/default.pem'),
    SNIcallback: function(servername) {
       return crypto.createCredentials({
         pfx: fs.readFileSync(__dirname + '/approved-certs/' + servername + '.pem')
       }).context;
    }  
  };

  var server = spdy.createServer(options, function(req, res) {
    ensureStarted(req.headers.host);
    proxy.web(req.headers.host+'-backend', req, res);
  });

  server.listen(443);
}

//...
startSpdy();
