var http = require('http');

module.exports.start = function(configReader, stats) {
  http.createServer(function(req, res) {
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
  }).listen(80);
};
