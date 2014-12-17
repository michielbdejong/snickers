var docker = require('docker.io')({host:"http://localhost", port: "4243", version:'v1.1'}),
    spdy = require('spdy'),
    crypto = require('crypto'),
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
    key: fs.readFileSync(__dirname + '/approved-certs/default.key'),
    cert: fs.readFileSync(__dirname + '/approved-certs/default.cert'),
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
    ensureStarted(req.headers.host);
    proxy.web(req.headers.host+'-backend', req, res);
  });

  server.listen(443);
}

//...
startSpdy();
