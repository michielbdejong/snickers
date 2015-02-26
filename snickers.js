var http = require('http'),
    spdy = require('./spdy'),
    mail = require('./mail'),
    dns = require('./dns'),
    configReader = require('./config-reader'),
    stats = require('./stats');

//...
spdy.start();
mail.start();
dns.start();

http.createServer(function(req, res) {
  var config = configReader.getConfig(req.headers.host),
      redirectHost = req.headers.host;
  if (config.redirectHost) {
    redirectHost = config.redirectHost;
  }
  res.writeHead(302, {
    Location: 'https://' + redirectHost + req.url
  });
  res.end('Location: https://' + redirectHost + req.url);
  stats.inc(req.headers.host);
}).listen(80);
