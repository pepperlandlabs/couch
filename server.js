var couch = require('./lib/couch');

// if run as root, downgrade to the owner of this file
if (process.getuid() === 0) {
  require('fs').stat(__filename, function(err, stats) {
    if (err) { return console.error(err); }
    process.setuid(stats.uid);
  });
}

couch.start();

