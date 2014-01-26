var restify = require('restify');
var config = require('../config');
var winston = require('winston');
var jade = require('jade');
var _ = require('underscore');

// Restify server
var server = restify.createServer();

// GoInstant stuff
var GoInstant = require('goinstant-rest').v1;

// GoInstant client
var goinstant = new GoInstant({
  client_id: config.goinstant.client_id,
  client_secret: config.goinstant.client_secret
});


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

  server.get('/', restify.serveStatic({
    directory: __dirname + '/../static',
    default: 'index.html'
  }));


  var renderJadeFile = function(template, locals, cb) {
    jade.renderFile(__dirname + '/../templates/' + template,
      _.extend({moment: require('moment'), pageTitle: "Couch"}, locals), cb);
  };

  // Room overview
  server.get('/rooms', function(req, res, next) {
    goinstant.apps.rooms.all({app_id: parseInt(config.goinstant.app_id, 10)}, function(err, rooms, gi_res) {
      if (err) {
        res.write(500, err);
        return res.end();
      }
      renderJadeFile('rooms.jade', {rooms: rooms}, function(err, html) {
        if (err) {
          res.write(500, err);
          return res.end();
        }
        res.writeHead(200, {
          'Content-Type': 'text/html'
        });
        res.write(html);
        res.end();
      });
    });
  });

  server.get('/rooms/:id', function(req, res, next) {


    goinstant.keys.get({room_id: req.params.id, key: 'playlist', app_id: parseInt(config.goinstant.app_id, 10)}, function(err, key, gi_res) {
      if (err) {
        res.write(500, err);
        return res.end();
      }

      renderJadeFile('room.jade', {id: req.params.id, key: key}, function(err, html) {
        if (err) {
          res.write(500, err);
          return res.end();
        }
        res.writeHead(200, {
          'Content-Type': 'text/html'
        });
        res.write(html);
        res.end();
      });

    });
  });

  var port = process.env.PORT || 8080;

  server.listen(port, function() {
    winston.info('%s listening at %s', server.name, server.url);
  });
};