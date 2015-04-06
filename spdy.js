var dockerActivator = require('docker-activator'),
    dispatcher = require('./dispatcher'),
    listener = require('./listener'),
    configReader = require('./config-reader'),
    statics = require('./statics'),
    stats = require('./stats');

function handlerWebBackend(host, config, req, res) {
  var localDataPath = '/data/domains/' + host;
  dockerActivator.ensureStarted(host, localDataPath, function(err, ipaddr) {
    if (err) {
      res.writeHead(500);
      res.end('Error starting ' + config.application + ' for ' + host + ' - ' + JSON.stringify(err));
    } else {
      console.log('Proxying ' + host + ' to http://' + ipaddr);
      req.headers['X-Forwarded-Proto'] = 'https';
      dispatcher.proxyTo(req, res, ipaddr, config.port);
    }
  });
  
  
}

function handlerWebStatic(host, config, req, res) {
  statics.serveStatic('/data/domains/' + host + (config.folder ? '/' + config.folder : ''), req, res);
}


function handlerWeb(req, res) {
  var host, config;
  host = req.headers.host;
  if (typeof host === 'string') {
    if (host === host.toLowerCase()) {
      config = configReader.getConfig(host);
      if (config.type === 'backend') {
        handlerWebBackend(host, config, req, res);
       } else if (config.type === 'static') {
         handlerWebStatic(host, config, req, res);
       } else if (config.type === 'redirect') {
         res.writeHead(301, {
           Location: 'https://' + config.redirectHost + req.url
         });
         res.end('Location: https://' + config.redirectHost + req.url);
       } else {
         res.writeHead(404);
         res.end('Snickers says: That site is not configured on this server.');
       }
       stats.inc(host);
    } else {
      res.writeHead(301, {
        Location: 'https://' + host.toLowerCase() + req.url
      });
      req.end('Please specify the host header in lower case');
    }
  } else {
    res.writeHead(406);
    res.end('Cannot serve http request without host header');
  }
}

function handlerWsBackend(host, config, req, socket, head) {
  var localDataPath = '/data/domains/' + host;
  dockerActivator.ensureStarted(host, localDataPath, function(err, ipaddr) {
    if (err) {
      console.log('Error starting site, closing socket', host);
      socket.close();
    } else {
      console.log('Proxying ' + host + ' to ws://' + ipaddr);
      req.headers['X-Forwarded-Proto'] = 'https';
      dispatcher.proxyWsTo(req, socket, head, ipaddr, config.port);
    }
  });
}

function handlerWs (req, socket, head) {
  var host, config;
  host = req.headers.host;
  if (typeof host === 'string') {
    host = host.toLowerCase();
    config = configReader.getConfig(host);
    if (config.type === 'backend') {
      handlerWsBackend(host, config, req, socket, head);
    } else {
      console.log('WebSocket to non-configured site, closing socket', host);
      socket.close();
    }
    stats.inc(host);
  } else {
    res.writeHead(406);
    res.end('Cannot serve upgrade request without host header');
  }
}

function whitelist(servername) {
  return (configReader.getConfig(servername).type !== undefined);
}

module.exports.start = function() {
  dockerActivator.init(function() {
    console.log('done initializing dockerActivator');
  });
  listener.startSpdy(handlerWeb, handlerWs, whitelist);
}
