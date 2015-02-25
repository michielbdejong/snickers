var Static = require('node-static'),
  server = {};

module.exports.serveStatic = function(rootPath, req, res) {
  if (!server[rootPath]) {
    server[rootPath] = new(Static.Server)(rootPath);
  }
  server[rootPath].serve(req, res);
}
