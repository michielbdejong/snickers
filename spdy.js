var backends = require('./backends'),
    dispatcher = require('./dispatcher'),
    listener = require('./listener'),
    configReader = require('./config-reader'),
    statics = require('./statics'),
    repos = require('./repos'),
    stats = require('./stats');

function handlerWebBackend(host, config, req, res) {
  repos.ensurePresent(host, config.repo, function(err, localRepoPath) {
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
}

function handlerWebStatic(host, config, req, res)
  repos.ensurePresent(host, config.repo, function(err, localRepoPath) {
    if (err) {
      res.writeHead(500);
      console.log('Error fetching statics repo for ' + host + ' - ' + JSON.stringify(err));
      res.end('Snickers says: Error fetching statics repo for ' + host + ' - see stdout logs for details');
    } else {
      statics.serveStatic(localRepoPath + (config.folder ? '/' + config.folder : ''), req, res);
      repos.maybePull(host, config.pullFrequency);
    }
  });
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
         res.end('Location: https://' + redirectHost + req.url);
       } else {
         res.writeHead(404);
         res.end('Snickers says: That site is not configured on this server.');
       }
       stats.inc(host);
    } else {
      res.writeHead(301, {
        Location: 'https://' + host.toLowerCase() + req.url
      }
      req.end('Please specify the host header in lower case');
    }
  } else {
    res.writeHead(406);
    res.end('Cannot serve http request without host header');
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
    console.log('done initializing backends');
  });
  listener.startSpdy(handlerWeb, handlerWs, whitelist);
}
