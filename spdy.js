var backends = require('./backends'),
    dispatcher = require('./dispatcher'),
    listener = require('./listener'),
    configReader = require('./config-reader'),
    statics = require('./statics'),
    repos = require('./repos');

function handlerWeb(req, res) {
  var config = configReader.getConfig(req.headers.host);
  console.log(req.headers.host, config);
  if (config.type === 'backend') {
    repos.ensurePresent(req.headers.host, config.repo, function(err, localRepoPath) {
      if (err) {
        res.writeHead(500);
        console.log('Error fetching statics repo for ' + req.headers.host + ' - ' + JSON.stringify(err));
        res.end('Snickers says: Error fetching statics repo for ' + req.headers.host + ' - see stdout logs for details');
      } else {
        backends.ensureStarted(req.headers.host, localRepoPath, function(err, ipaddr) {
          if (err) {
            res.writeHead(500);
            res.end('Error starting ' + config.application + ' for ' + req.headers.host + ' - ' + JSON.stringify(err));
          } else {
            console.log('Proxying ' + req.headers.host + ' to http://' + ipaddr);
            req.headers['X-Forwarded-Proto'] = 'https';
            dispatcher.proxyTo(req, res, ipaddr, config.port);
          }
        });
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
}

function handlerWs (req, socket, head) {
  var config = configReader.getConfig(req.headers.host);
  if (config.type === 'backend') {
    repos.ensurePresent(req.headers.host, config.repo, function(err, localRepoPath) {
      if (err) {
        res.writeHead(500);
        console.log('Error fetching statics repo for ' + req.headers.host + ' - ' + JSON.stringify(err));
        res.end('Snickers says: Error fetching statics repo for ' + req.headers.host + ' - see stdout logs for details');
      } else {
       backends.ensureStarted(req.headers.host, localRepoPath, function(err, ipaddr) {
         if (err) {
           console.log('Error starting site, closing socket', req.headers.host);
           socket.close();
         } else {
           console.log('Proxying ' + containerName + ' to ws://' + ipaddr);
           req.headers['X-Forwarded-Proto'] = 'https';
           dispatcher.proxyWsTo(req, socket, head, ipaddr, config.port);
         }
       });
      }
    });
  } else {
    console.log('WebSocket to non-configured site, closing socket', req.headers.host);
    socket.close();
  }
}

function whitelist(servername) {
  return (configReader.getConfig(servername).type !== undefined);
}

module.exports.start = function() {
  backends.init(function() {
    listener.startSpdy(handlerWeb, handlerWs, whitelist);
  });
}
