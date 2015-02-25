var backends = require('./backends'),
    dispatcher = require('./dispatcher'),
    listener = require('./listener'),
    http = require('http'),
    configReader = require('./config-reader'),
    statics = require('./statics'),
    repos = require('./repos');

//...
listener.startSpdy(function(req, res) { // handlerWeb:
  var config = configReader.getConfig(req.headers.host);
  console.log(req.headers.host, config);
  if (config.type === 'backend') {
    backends.ensureStarted(req.headers.host, config.image, function(err, ipaddr) {
      if (err) {
        res.writeHead(500);
        res.end('Error starting ' + config.image + ' for ' + req.headers.host + ' - ' + JSON.stringify(err));
      } else {
        console.log('Proxying ' + containerName + ' to http://' + ipaddr);
        dispatcher.proxyTo(req, res, ipaddr, config.port);
      }
    });
  } else if (config.type === 'static') {
    repos.ensurePresent(req.headers.host, config.repo, function(err, localRepoPath) {
      if (err) {
        res.writeHead(500);
        console.log('Error fetching statics repo for ' + req.headers.host + ' - ' + JSON.stringify(err));
        res.end('Snickers says: Error fetching statics repo for ' + req.headers.host + ' - see stdout logs for details');
      } else {
        statics.serveStatic(localRepoPath + (config.folder ? '/' + config.folder : ''), req, res);
        repos.maybePull(req.headers.host, config.pullFrequency);
      }
    });
  } else {
    res.writeHead(404);
    res.end('Snickers says: That site is not configured on this server.');
  }
}, function (req, socket, head) { // handlerWs:
  var config = configReader.getConfig(req.headers.host);
  if (config.type === 'backend') {
    backends.ensureStarted(req.headers.host, config.image, function(err, ipaddr) {
      if (err) {
        console.log('Error starting site, closing socket', req.headers.host);
        socket.close();
      } else {
        console.log('Proxying ' + containerName + ' to ws://' + ipaddr);
        dispatcher.proxyWsTo(req, socket, head, ipaddr, config.port);
      }
    });
  } else {
    console.log('WebSocket to non-configured site, closing socket', req.headers.host);
    socket.close();
  }
}, function(servername) { // whitelist:
  console.log('whitelist called for '+servername);
  return true;
});

http.createServer(function(req, res) {
  res.writeHead(302, {
    Location: 'https://' + req.headers.host + req.url
  });
  res.end('Location: https://' + req.headers.host + req.url);
}).listen(80);
