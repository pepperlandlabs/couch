var _ = require('lodash');
var config = require('../config');
var http = require('./http');

var winston = require('winston');
var tweetParser = require('./tweet-parser');
var goinstantClient = require('./goinstant-client');

var ImmortalNTwitter = require('immortal-ntwitter');

// nTwitter streaming client (with automatic restarts)
var twit = ImmortalNTwitter.create({
  consumer_key: config.twitter.consumer_key,
  consumer_secret: config.twitter.consumer_secret,
  access_token_key: config.twitter.access_token_key,
  access_token_secret: config.twitter.access_token_secret
});

exports.start = function() {
  http.startServer();

  twit.immortalStream('statuses/filter', {track: config.twitter.follow_account}, function(immortalStream) {
    immortalStream.on('limit', function(data) {
      console.log('limit reached', data);
    });
    immortalStream.on('data', function(data){
      var newKey = tweetParser.buildKeyFromStream(data);
      if (newKey) {
        goinstantClient.setKey(newKey);
      }
    });
  });
};