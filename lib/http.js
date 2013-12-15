var restify = require('restify');
var config = require('../config');
var winston = require('winston');

// Restify server
var server = restify.createServer();

exports.startServer = function() {
  server.use(restify.gzipResponse());

  // CORS Headers
  server.use(
    function crossOrigin(req,res,next){
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      return next();
    }
  );

  // Also return index.html for rooms.
  server.get('/room/:id', function(req, res, next) {
    require('fs').readFile(__dirname + '/../static/index.html','utf-8', function(err,data) {
        if (err) {
            console.dir(err)
            return res.send(500,{msg:"There was an error in handling your request"});
        } else {
            res.writeHead(200, {
              'Content-Type': 'text/html'
            });
            res.write(data);
            res.end();
        }
    });
  });

  server.get(/.*/, restify.serveStatic({
    directory: __dirname + '/../static',
    default: 'index.html'
  }));

  var port = process.env.PORT || 8080;

  server.listen(port, function() {
    winston.info('%s listening at %s', server.name, server.url);
  });
};