var dockerActivator = require('docker-activator'),
    indiehosters = require('indiehosters-applications'),
    alarm = require('./alarm'),
    lastCheck = 0,
    MAX_IDLE_TIME = 7 * 24 * 3600 * 1000;

module.exports.init = function() {
  console.log('initializing backends...');
  dockerActivator.init(function(err) {
    console.log('dockerActivator init', err);
  });
}

module.exports.ensureStarted = function(host, config, callback) {
  var now = new Date().getTime();
  var dockerOptions = indiehosters.getDockerOptions(host, config.application, config.backendEnv, 200, '/data/domains/' + host);
  alarm.debug('dockerOptions', host, config, dockerOptions);
  dockerActivator.ensureStarted(dockerOptions, callback);
  if (now - lastCheck > 6000 * 1000) {
    console.log('clean up check');
    lastCheck = now;
    dockerActivator.maybeStopOneContainer(MAX_IDLE_TIME, '', function(err) {
      console.log('clean up', err);
    });
  }
};
