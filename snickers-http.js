var http = require('http');

module.exports.start = function(configReader, stats, callback) {
  var server = http.createServer(function(req, res) {
    var host, config, redirectHost;
    host = req.headers.host;
    if (typeof host === 'string') {
      host = host.toLowerCase();
      config = configReader.getConfig(host);
      redirectHost = host;
      if (config.redirectHost) {
        redirectHost = config.redirectHost;
      }
      res.writeHead(301, {
        Location: 'https://' + redirectHost + req.url
      });
      res.end('Location: https://' + redirectHost + req.url);
      stats.inc(host);
    } else {
      res.writeHead(406);
      res.end('Cannot serve http request without host header');
    }
  });

  var listening = false;
  server.on('error', function(err) {
    if (listening) {
      alarm.raise(err);
    } else {
      callback(err);
    }
  });
  server.on('listening', function() {
    listening = true;
    callback(null);
  });
  server.listen(80);
};
