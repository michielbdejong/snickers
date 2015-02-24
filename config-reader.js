var fs = require('fs');

var CONFIG_LOAD_FREQ = 60*1000;


var config;

function loadConfig() {
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

function getConfig(domain) {
  if (config && config.domains && config.domains[domain]) {
    return config.domains[domain];
  } else {
    return {};
  }
}

setInterval(loadConfig, CONFIG_LOAD_FREQ);
loadConfig();
module.exports.getConfig = getConfig;
