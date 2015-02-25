var fs = require('fs'),
    mkdirp = require('mkdirp');

module.exports.raise = function(str) {
  mkdirp('/data/alarm', function(err) {
    if (err) {
      console.log('CANNOT RAISE ALARM', str);
    }
    fs.writeFile('/data/alarm/'+(new Date().getTime()), str, function(err2) {
      if (err2) {
        console.log('CANNOT RAISE ALARM', str);
      }
    });
  });
};      
