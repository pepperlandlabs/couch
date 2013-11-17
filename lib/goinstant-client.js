var winston = require('winston');
var config = require('../config');
var GoInstant = require('goinstant-rest').v1;

// GoInstant client
var goinstant = new GoInstant({
  client_id: config.goinstant.client_id,
  client_secret: config.goinstant.client_secret
});

// set a /playlist/:id key that the browser GoInstant APIs are
// listening for in specific rooms (to queue up the video)
exports.setKey = function(opts) {
  goinstant.keys.update(opts, function(err, value) {
    if (err) {
        winston.error('could not set key %j', opts);
        return console.dir(err);
    }
    winston.info('updated key', opts.key);
  });
}