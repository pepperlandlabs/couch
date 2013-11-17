var _ = require('lodash');
var config = require('../config');

var getRoomFromHashTags = function(data) {
  return _.first(_.pluck(data.entities.hashtags, 'text'));
};

var getSearchTerm = function(data) {
  var result = /(?:^|\s)'([^']*?)'(?:\s|$)/.exec(data.text);
  return (result && result.length > 0) ? result[1] : null;
};

var isKeyValid = function(data) {
  // Make sure tweet is directed to account.
  if (data.text.toLowerCase().indexOf(config.twitter.follow_account) !== 0) {
    return false;
  }

  var searchTerm = getSearchTerm(data);
  // Has to have at least one url or a search term.
  if (data.entities.urls.length === 0 && _.isNull(searchTerm)) {
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

var TYPES = {
  'YOUTUBE': 'youtube',
  'VIMEO': 'vimeo',
  'SEARCH': 'search',
  'UNKNOWN': 'unknown'
};

var sniffType = function(data) {
  var searchTerm = getSearchTerm(data);

  if (data.entities.urls.length === 0 && searchTerm) {
    return TYPES.SEARCH;
  }

  if (data.entities.urls.length === 0) {
    return TYPES.UNKNOWN;
  }

  var expanded = _.pluck(data.entities.urls, 'display');
  for (var i = 0; i < expanded.length; i++) {
    if (expanded.indexOf('youtube.com') > 0 || expanded.indexOf('youtu.be') > 0) {
      return TYPES.YOUTUBE;
    }
    if (expanded.indexOf('vimeo.com') > 0) {
      return TYPES.VIMEO;
    }
  }

  return TYPES.UNKNOWN;
};

exports.buildKeyFromStream = function(data) {
  var room = getRoomFromHashTags(data);
  var user_mention = _.first(_.pluck(data.entities.user_mentions, 'screen_name'));

  if (!isKeyValid(data)) {
    return null;
  }
  var type = sniffType(data);
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
