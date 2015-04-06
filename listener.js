//This example shows a shared-hosting server which registers missing certificates
// on the fly, while continuing to host the other domains on the same IP address.
//It will save all certificates under /etc/letsencrypt on that server, and use
//them from there for the rest of the deployed server's lifetime.

var spdy = require('spdy'),
    Snitch = require('snitch');

function startSpdy(handlerWeb, handlerWs, whitelist) {
  var snitch = new Snitch.Store('/etc/snitch', 10 * 60 * 1000, function(err) {
    console.log('snitch error occurred', err);
  });
  var server = spdy.createServer({
    key: Snitch.DEFAULT_KEY,
    cert: Snitch.DEFAULT_CERT,
    SNICallback: snitch.getContext,
  }, function(req, res) {
    if (snitch.handleChallenge(req, res)) {
      //challenge handled
    } else {
      return handlerWeb(req, res);
    }
  });

  //special case for dealing with websockets:
  server.on('upgrade', handlerWs);

  server.listen(443);

  console.log('OK, hit me on https for some domain that points to this server');
}

module.exports.startSpdy = startSpdy;
