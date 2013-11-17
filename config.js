var config = {}

config.dev_port = 8000;

config.twitter = {};
config.twitter.follow_account = '@addtocouch';
config.twitter.consumer_key = 'IU38xvXkXiAKkQEXxQjKDQ';
config.twitter.consumer_secret = 'rzVzCNr9C0EB4NdRvZGZsn5LSdX49qZdytNrdMOHQ';
config.twitter.access_token_key = '892607503-TxGMe4KbReO6RaK6CANg4tspkhetBa7B0qmSAKOY';
config.twitter.access_token_secret = 'pedHQwah50gBq2cYCOqasKQs3juJbsUs981AuYYUzrm4v';

config.goinstant = {};
config.goinstant.client_id = '9IU6q-WMuqSgMN6KJSdhFhFxfSLI9dsoj5YoEwu3OAY';
config.goinstant.client_secret = 'wd34qyhVcCme3aPt9gZa1fBKeUS1OIVoIvNYzy_pTI8';
config.goinstant.app_id = '833';
config.goinstant.app_name = 'couch';
// TTL for key is 12 hours (in ms)
config.goinstant.key_expiration_time = 43200000;

module.exports = config;