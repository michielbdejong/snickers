var fs = require('fs'),
    async = require('async'),
    repos = require('./repos'),
    backends = require('./backends');

var CONFIG_LOAD_INTERVAL = 60*1000;


var config;

function loadConfig(sync) {
  if (sync) {
    try {
      config = JSON.parse(fs.readFileSync('config.json'));
      console.log('loaded config', config);
    } catch(e) {
      console.log('error loading config.json', e);
    }
  } else {
    fs.readFile('config.json', function(err, data) {
      if (err) {
        console.log('error reading config.json', err);
      } else {
        try {
          config = JSON.parse(data.toString());
          console.log('reloaded config', config);
        } catch(e) {
          console.log('error parsing config.json', e);
        }
      }
    });
  }
}

function getConfig(domain) {
  if (config && config.domains && config.domains[domain]) {
    return config.domains[domain];
  } else {
    return {};
  }
}

module.exports.init = function() {
  setInterval(loadConfig, CONFIG_LOAD_INTERVAL);
  loadConfig(true);
};
module.exports.getConfig = getConfig;
module.exports.getBackupServerPath = function(which) {
  if (config && config.backupServerPaths) {
    return config.backupServerPaths[which];
  } else {
    return null;
  }
}

module.exports.getImagesList = function(which) {
  if (config && config.images && config.images[which]) {
    return config.images[which];
  } else {
    return [];
  }
}

function checkDomain(host, config, callback) {
  if (config.type === 'backend') {
    repos.ensurePresent(host, config.repo, function(err, localRepoPath) {
     if (err) {
       callback(err);
     } else {
// starting containers is probably a bad idea here. See also
// https://github.com/michielbdejong/snickers/issues/17 about (re-)creating containers
//       backends.ensureStarted(config, localRepoPath, function(err, ipaddr) {
//         if (err) {
//           callback(err);
//         } else {
           callback(null);
//         }
//       });
      }
    });
  } else if (config.type === 'static') {
    repos.ensurePresent(host, config.repo, function(err, localRepoPath) {
      if (err) {
        callback(err);
      } else {
        repos.maybePull(host, config.pullFrequency, callback);
      }
    });
  } else {
    callback('unknown type ' + JSON.stringify(config));
  }
}
function checkDomains(domains, defaultBackupServerPath, callback) {
  async.each(Object.keys(domains), function(i, doneThis) {
    var thisConf = domains[i];
    if (!thisConf.repo) {
      thisConf.repo = defaultBackupServerPath + i;
    }
    checkDomain(i, thisConf, doneThis);
  }, callback);
}
module.exports.updateConfig = function(confObj) {
  if (typeof confObj === 'object'
      && typeof confObj.domains === 'object'
      && typeof confObj.images === 'object'
      && Array.isArray(confObj.images.upstream)
      && Array.isArray(confObj.images.intermediate)
      && Array.isArray(confObj.images.target)
      && typeof confObj.backupServerPaths === 'object'
      && typeof confObj.backupServerPaths.origin === 'string'
      && typeof confObj.backupServerPaths.secondary === 'string') {
      
    backends.rebuildAll(confObj.images, function(err) {
      if (err) {
        console.log('error rebuilding images', err);
      } else {
        checkDomains(confObj.domains, confObj.backupServerPaths.origin, function(err) {
          if (err) {
            console.log(err);
          } else {
            fs.writeFile('config.json', JSON.stringify(confObj), function(err) {
              if (err) {
                console.log('error writing config.json');
              } else {
                console.log('wrote config.json');
              }
            });
          }
        });
      }
    });
  } else {
    console.log('Please format your config.js file like config.js.sample');
  }
}
