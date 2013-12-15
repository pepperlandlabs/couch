var _ = require('lodash');
var config = require('../config');

var getRoomFromHashTags = function(data) {
  var room = _.first(_.pluck(data.entities.hashtags, 'text'));
  return room ? room.toLowerCase() : null;
};

var getSearchTerm = function(data) {
  var result = /"(.*?)"/.exec(data.text);
  return (result && result.length > 0) ? result[0] : null;
};

var COMMANDS = {
  'YOUTUBE': 'youtube',
  'VIMEO': 'vimeo',
  'SEARCH': 'search',
  'SKIP': 'skip',
  'PAUSE': 'pause',
  'CLEAR': 'clear',
  'RANDOM': 'random',
  'UNKNOWN': 'unknown'
};

var sniffCommand = function(data) {
  var searchTerm = getSearchTerm(data);

  if (data.entities.urls.length === 0 && searchTerm) {
    return COMMANDS.SEARCH;
  }

  if (data.text.toLowerCase().indexOf('skip') !== -1) {
    return COMMANDS.SKIP;
  }

  var expanded = _.pluck(data.entities.urls, 'display_url');

  for (var i = 0; i < expanded.length; i++) {
    if (expanded[i].indexOf('youtube.com') !== -1 || expanded[i].indexOf('youtu.be') !== -1) {
      return COMMANDS.YOUTUBE;
    }
    if (expanded[i].indexOf('vimeo.com') !== -1) {
      return COMMANDS.VIMEO;
    }
  }

  return COMMANDS.UNKNOWN;
};

var isKeyValid = function(data) {
  // Make sure tweet is directed to account.
  if (data.text.toLowerCase().indexOf(config.twitter.follow_account) !== 0) {
    return false;
  }

  // Has to have at least one url or a search term.
  if (sniffCommand(data) === COMMANDS.UNKNOWN) {
    return false;
  }

  // Can't be a retweet.
  if (data.retweeted) {
    return false;
  }

  // A hashtag is required.
  if (_.isUndefined(getRoomFromHashTags(data))) {
    return false;
  }
  return true;
};

exports.buildKeyFromStream = function(data) {

  // Basic twitter stream validation.
  if (!data || !data.entities) {
    return null;
  }

  var room = getRoomFromHashTags(data);
  var user_mention = _.first(_.pluck(data.entities && data.entities.user_mentions, 'screen_name'));

  if (!isKeyValid(data)) {
    return null;
  }
  var type = sniffCommand(data);

  // Always, always use id_str or buffer overflow happens.
  var id = data.id_str;

  // key value
  var value = {
    id: id,
    tweet: data.text,
    created_at: data.created_at,
    user: data.user,
    urls: data.entities.urls,
    type: type
  };

  // Extract search term, if one exists.
  if (type === COMMANDS.SEARCH) {
    value.searchTerm = getSearchTerm(data);
  }

  // key name: playlist/:twitter_id
  // room: first hash mentioned
  var keyPath = ['playlist', id].join('/');
  var opts = {
    app_id: config.goinstant.app_name,
    room_id: room,
    key: keyPath,
    value: value,
    expires: config.goinstant.key_expiration_time
  };

  return opts;
};
