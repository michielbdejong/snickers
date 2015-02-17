var backends = require('./backends'),
    dispatcher = require('./dispatcher'),
    listener = require('./listener'),
    http = require('http');

//...
listener.startSpdy(function(req, res) {
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
}, function (req, socket, head) {
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
});

http.createServer(function(req, res) {
  res.writeHead(302, {
    Location: 'https://' + req.headers.host + req.url
  });
  res.end('Location: https://' + req.headers.host + req.url);
}).listen(80);
