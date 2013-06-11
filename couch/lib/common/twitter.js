var restify = require('restify');
var client = restify.createJsonClient({
  url: 'http://api.twitter.com',
  version: '*'
});
var finder = require('../common/finder');
var person = require('../models/person');

var twitter_friend_cache = {};

function get_friends(name,cb){
    var cursor = -1;
    var results = [];
    console.log("*****get friends " + name);
    var called_back = false;
    var processing_batch = 0;
    var f_hash = {};
    var twitter_friends = [];

    if (twitter_friend_cache[name]){
        console.log("USE CACHE - TODO EXPIRE IT SMARTLY DAILY");
        use_cache(name,f_hash,cb);
        return;
    }
    
    var done = function(){
        console.log("check done: " + cursor + " " + processing_batch);
        if ((cursor === 0) && (processing_batch === 0)){
            if (!called_back){
                twitter_friend_cache[name] = twitter_friends;
                called_back = true;
                cb(null,results);
            } else {
                console.log("ALREADY RETURNED");
            }
        }
    };

    var doit = function(){
        var url = "/1/statuses/friends.json?screen_name="+name+"&cursor="+cursor;
        console.log(url);
        processing_batch++;
        client.get(url, function(err, req, res, obj) {
            try {
                if (err){
                    console.log(err);
                    cb(err,null);
                }
                var data = JSON.parse(res.body);
                var batch_count = data.users.length;
                var batch_processed = 0;
                data.users.forEach(function(u){
                    // should really filter here in place
                    // filter here
                    twitter_friends.push(u);
                    check_friend(u,f_hash,function(r){
                        if (r){
                            console.log("push: " + JSON.stringify(r));
                            results.push(r);
                        }
                        batch_processed++;
                        if (batch_processed === batch_count){
                            processing_batch--;
                            done();
                        }
                    });

                });
                cursor = data.next_cursor;
                if (cursor != 0){
                    process.nextTick(doit);
                }  else {
                    console.log("we are done: " + batch_count);
                }
            } catch (e){
                console.log("ERROR");
                console.log(e);
                cb(e,null);
            }
        });
    };
    doit();

}

function use_cache(name,f_hash,cb){
    var data = twitter_friend_cache[name];
    var batch_count = data.length;
    var batch_processed = 0;
    var called_back = false;
    var results = [];
    var done = function(){
        if (batch_processed == batch_count){
            if (!called_back){
                cb(null,results);
                called_back = true;
            } else {
                console.log("ALREADY CALLED BACK");
            }
        };
    }
    data.forEach(function(u){
        // should really filter here in place
        // filter here
        check_friend(u,f_hash,function(r){
            if (r){
                console.log("push: " + JSON.stringify(r));
                results.push(r);
            }
            batch_processed++;
            if (batch_processed === batch_count){
                done();
            }
        });
        
    });

}

function check_friend(friend, f_hash, cb){
    if (f_hash[friend.screen_name]){
        return cb(null);
    }
    
    finder.find('name',friend.screen_name,'people',function(e,node){
        if (node) console.log("found: " + friend.screen_name + " " + f_hash[friend.screen_name]);
        if ((node) && (!f_hash[friend.screen_name])){
            var result = {
                screen_name:friend.screen_name,
                name:friend.name,
                profile_image:"https://api.twitter.com/1/users/profile_image?screen_name="+friend.screen_name+"&size=bigger",
            };
            console.log("recommend: " + friend.screen_name);
            cb(result);
        }
        else {
            cb(null);
        }
    });
}

// from all friends, filter out ones we follow and ones who are not on a2c yet
function filter_friends(following, friends,cb){
    // image "https://api.twitter.com/1/users/profile_image?screen_name=%@&size=bigger"
    var friend_count = friends.length;
    console.log("friends: " + friend_count);
    var processed = 0;
    var results = [];
    var done = function(){
        if (++processed == friend_count) { cb(null,results); }
    }
    var f_hash = {};
    if (following){
        following.data.forEach(function(f){
            f_hash[f.name] = f;
        });
    }
    
    friends.forEach(function(friend){
        //console.log(friend.screen_name);
        //console.log(friend.name);
        // stuff in larger twitter picture
        var check = person({name:friend.screen_name})
        finder.find('name',friend.screen_name,'people',function(e,node){
            if (node) console.log("found: " + friend.screen_name);
            if ((node) && (!f_hash[friend.screen_name])){
                person.profile(node,function(profile){
                    var result = {
                        screen_name:friend.screen_name,
                        name:friend.name,
                        profile_image:"https://api.twitter.com/1/users/profile_image?screen_name="+friend.screen_name+"&size=bigger",
                        following:profile.follows,
                        followers:profile.followers,
                        played:profile.played.length
                    };
                    console.log("recommend: " + friend.screen_name);
                    results.push(result);
                    done();
                });
            } else { done(); }

        });
    });
}

module.exports = {
    get_friends:get_friends
}