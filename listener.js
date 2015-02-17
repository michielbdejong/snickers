var spdy = require('spdy'),
    crypto = require('crypto'),
    fs = require('fs');

function startSpdy(handlerWeb, handlerWs) {
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

  var server = spdy.createServer(options, handlerWeb);

  //special case for dealing with websockets:
  server.on('upgrade', handlerWs);

  server.listen(443);
}

module.exports.startSpdy = startSpdy;
