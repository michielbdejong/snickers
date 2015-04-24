var httpProxy = require('http-proxy'),
    proxy = httpProxy.createProxyServer();

var PROXY_MAX_TRY = 50,
    PROXY_RETRY_TIME = 300;

function proxyTo(req, res, ipaddr, port, attempt) {
  if (!attempt) {
    attempt = 0;
  }
  proxy.web(req, res, { target: 'http://' + ipaddr + ':' + port }, function(e) {
    if (attempt > PROXY_MAX_TRY) {
      res.writeHead(500);
      res.end('Could not proxy request: ' + req.headers.host);
    } else {
      setTimeout(function() {
        proxyTo(req, res, ipaddr, port, attempt + 1);
      }, PROXY_RETRY_TIME);
    }
  });
}

function proxyWsTo(req, socket, head, ipaddr, attempt) {
  if (!attempt) {
    attempt = 0;
  }
  proxy.ws(req, socket, head, { target: 'http://' + ipaddr }, function(e) {
    if (attempt > PROXY_MAX_TRY) {
      socket.close();
    } else if (e) {
      alarm.raise(e);
      setTimeout(function() {
        proxyWsTo(req, socket, head, ipaddr, attempt + 1);
      }, PROXY_RETRY_TIME);
    }
  });
}

module.exports.proxyTo = proxyTo;
module.exports.proxyWsTo = proxyWsTo;
