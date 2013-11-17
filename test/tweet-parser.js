var assert = require('assert');
var tweetParser = require('../lib/tweet-parser');

describe('tweet-parser', function() {
  describe('#buildKeyFromStream()', function() {

    it('should handle bad data', function() {
      assert.equal(tweetParser.buildKeyFromStream(null), null);
    });

    it('should parse the tweet from the streaming api', function() {
        var testData = {
            id_str: '12345678',
            text: '@addtocouch fake tweet #footag #bartag',
            entities:
                {
                    hashtags: [{text: 'footag'}, {text: 'bartag'}],
                    urls: [{display: 'youtu.be/foobar'}]
                }
            };
        var actualKey = tweetParser.buildKeyFromStream(testData);

        assert.equal(actualKey.room_id, 'footag');
        assert.equal(actualKey.key, 'playlist/12345678');
        assert.equal(actualKey.value.type, 'youtube');
    });

    it('should parse a search term from the streaming api', function() {
        var testData = {
            id_str: '12345678',
            text: '@addtocouch "some search" #footag',
            entities:
                {
                    hashtags: [{text: 'footag'}],
                    urls: []
                }
            };
        var actualKey = tweetParser.buildKeyFromStream(testData);

        assert.equal(actualKey.room_id, 'footag');
        assert.equal(actualKey.value.type, 'search');
        assert.equal(actualKey.value.searchTerm, '\"some search\"');
    });


  });
});