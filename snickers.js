var backends = require('./backends'),
    dispatcher = require('./dispatcher'),
    listener = require('./listener'),
    http = require('http');

//...
listener.startSpdy(function(req, res) { // handlerWeb:
  var containerName = req.headers.host + '-443';
  backends.ensureStarted(containerName, function(err, ipaddr) {
    if (err) {
      res.writeHead(500);
      res.end('Could not find website on this server: ' + containerName + ' - ' + JSON.stringify(err));
    } else {
      console.log('Proxying ' + containerName + ' to http://' + ipaddr);
      dispatcher.proxyTo(req, res, ipaddr);
    }
  });
}, function (req, socket, head) { // handlerWs:
  var containerName = req.headers.host + '-443';
  backends.ensureStarted(containerName, function(err, ipaddr) {
    if (err) {
      res.writeHead(500);
      res.end('Could not find website on this server: ' + containerName + ' - ' + JSON.stringify(err));
    } else {
      console.log('Proxying ' + containerName + ' to http://' + ipaddr);
      dispatcher.proxyWsTo(req, socket, head, ipaddr);
    }
  });
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
