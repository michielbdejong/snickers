var fs = require('fs');

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
