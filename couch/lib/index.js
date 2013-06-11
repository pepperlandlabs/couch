if (!global.Couch) { global.Couch = {}; }

var Couch = global.Couch;

Couch.models = {};
Couch.models.person = require('./models/person');
Couch.models.video = require('./models/video');
