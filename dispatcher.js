var httpProxy = require('http-proxy'),
    proxy = httpProxy.createProxyServer();

var PROXY_MAX_TRY = 50,
    PROXY_RETRY_TIME = 300;

function proxyTo(req, res, ipaddr, attempt) {
  if (!attempt) {
    attempt = 0;
  }
  console.log('Proxy attempt ' + attempt + ' of ' + PROXY_MAX_TRY + ' (spaced at ' + PROXY_RETRY_TIME + 'ms)', ipaddr);
  proxy.web(req, res, { target: 'http://' + ipaddr }, function(e) {
    if (attempt > PROXY_MAX_TRY) {
      res.writeHead(500);
      res.end('Could not proxy request: ' + req.headers.host + '-443');
    } else {
      setTimeout(function() {
        proxyTo(req, res, ipaddr, attempt + 1);
      }, PROXY_RETRY_TIME);
    }
  });
}

function proxyWsTo(req, socket, head, ipaddr, attempt) {
  if (!attempt) {
    attempt = 0;
  }
  console.log('Proxy ws attempt ' + attempt + ' of ' + PROXY_MAX_TRY + ' (spaced at ' + PROXY_RETRY_TIME + 'ms)', ipaddr);
  proxy.ws(req, socket, head, { target: 'http://' + ipaddr }, function(e) {
    if (attempt > PROXY_MAX_TRY) {
      socket.close();
    } else if (e) {
      console.log('ws proxy attempt error', e);
      setTimeout(function() {
        proxyWsTo(req, socket, head, ipaddr, attempt + 1);
      }, PROXY_RETRY_TIME);
    } else {
      console.log('ws proxy successful');
    }
  });
}

module.exports.proxyTo = proxyTo;
module.exports.proxyWsTo = proxyWsTo;
