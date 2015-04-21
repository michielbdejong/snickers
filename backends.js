var dockerActivator = require('docker-activator'),
    indiehosters = require('indiehosters-applications'),
    alarm = require('./alarm');

module.exports.ensureStarted = function(host, config, callback) {
  var dockerOptions = indiehosters.getDockerOptions(host, config.application, config.backendEnv, 200, '/data/domains/' + host);
  alarm.debug('dockerOptions', host, config, dockerOptions);
  dockerActivator.ensureStarted(dockerOptions, callback);
};
