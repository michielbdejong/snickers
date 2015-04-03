var spawn = require('child_process').spawn;
var prc = spawn('free',  []);

module.exports.getMemUsage = function(callback) {
  prc.stdout.setEncoding('utf8');
  prc.stdout.on('data', function (data) {
    var str = data.toString()
    var lines = str.split(/\n/g);
    var usage;
    for(var i = 0; i < lines.length; i++) {
       lines[i] = lines[i].split(/\s+/);
    }
    if (lines.length < 3 || lines[2].length < 4) {
      callback('Could not read memory usage');
    } else {
      usage = Number(lines[2][3]);
      if (isNaN(usage)) {
        callback('Memory usage is not a number');
      } else {
        callback(null, lines[2][3]);
      }
    }
  });
};
