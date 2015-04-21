//This example shows a shared-hosting server which registers missing certificates
// on the fly, while continuing to host the other domains on the same IP address.
//It will save all certificates under /etc/letsencrypt on that server, and use
//them from there for the rest of the deployed server's lifetime.

var spdy = require('spdy'),
    Snitch = require('node-snitch'),
    alarm = require('./alarm');

function startSpdy(handlerWeb, handlerWs, whitelist, callback) {
  var snitch = new Snitch.Store('/etc/snitch', 10 * 60 * 1000, function(err) {
    alarm.raise('snitch error occurred', err);
  }, whitelist);
  var server = spdy.createServer({
    key: Snitch.DEFAULT_KEY,
    cert: Snitch.DEFAULT_CERT,
    SNICallback: function(servername) {
      return snitch.getContext(servername);
    }
  }, function(req, res) {
    if (snitch.handleChallenge(req, res)) {
      //challenge handled
    } else {
      return handlerWeb(req, res);
    }
  });

  //special case for dealing with websockets:
  server.on('upgrade', handlerWs);

  var listening = false;
  server.on('error', function(err) {
    if (listening) {
      alarm.raise(err);
    } else {
      snitch.exit();
      callback(err);
    }
  });
  server.on('listening', function() {
    listening = true;
    callback(null);
  });
  server.listen(443);
}

module.exports.startSpdy = startSpdy;
