/* manages the twitter gobbling process that watches our @addtocouch
 * account for updates. when it's not running, we don't update, but it's
 * easy enough to write one time 'crash recovery' process to just add
 * any tweets that are missing, or from a certain timestamp,etc 
 */
require('../');
var twitter = require('twitter');
var parser = require('../common/parser');
var video_utils = require('../video/utils');

//"entities":{"hashtags":[{"text":"news","indices":[34,39]}]

function setup(cb){
  var twit = new twitter(
    {
      consumer_key: 'E78MKUhIQbnzEHQY4qIecA',
      consumer_secret: 'R6q7I6utFY3U6nOSEdr5IWzYoW1PFawSL0chZnZNkw',
      access_token_key:'892607503-V9ydgmAqEYgKf97L3tevCt0DKquL5oUv1tUKxNlJ',
      //      access_token_key: '892607503-agrcG5kG79hBXA5dNyw0l9HRk7B4FgvkqPPEIt0g',
      //      access_token_secret: 'e7oBTOZ9Rp9zoar5D080JUAEnLc6GsuWxDYphxXkI'
      access_token_secret:'HL30PhBWNea8RpvcziPYBvaehMMaBuLjEkck3LQL1E'
    }
  );
  console.log(twit);
  twit.stream('user', {'with':'user'},function(stream){
          cb(stream);
    stream.on('data',function(data){
      console.log("--->Stream data: %j", data);
      if (data.direct_message){
	  console.log("DIRECT MESSAGE");
	  //console.log(data.direct_message.sender.screen_name);
	  //console.log(data.direct_message.text);
	  console.log(data.direct_message);
	  var hashtags = data.direct_message.entities.hashtags;
	  add(data.direct_message.sender.screen_name,data.direct_message.sender.real_name,data.direct_message.text,[],hashtags);
	  return;
      }
      if (data.user && data.user.screen_name){
        var screen_name = data.user.screen_name;
          var real_name = data.user.name;
          console.log("---> tweet from user: " + screen_name);
          var mentions = data.entities.user_mentions;
	  var hashtags = data.entities.hashtags;
          var others = [];
          console.log(mentions);
          var found_us = false;
          mentions.forEach(function(user){
              if (user.screen_name === 'addtocouch'){
                  found_us = true;
              } else {
                  others.push(user.screen_name);
              }
          });
          if (found_us){
	      add(screen_name,data.user.real_name,data.text,others,hashtags);
              // if we find someone else mentioned we need to see if they 
              // are following the screen_name,a nd if so, add to their queue
             
          }
      }
    });

    stream.on('error',function(error,code){
	    // stupid ntwitter bug
	    console.log("-->ignore error: %j", error);
	    try { stream.destroy(); } catch (e){}
	    setTimeout(function(){
		    process.nextTick(setup);
		},5000);
	});
  });
};


function add(screen_name,real_name, text,others,hashtags){
    console.log("*** add: " + text);
    console.log(screen_name + " " + real_name);
    var person = {name:screen_name,following:0, followers:0,played:0};
    Couch.models.person.create(person,function(p){
	    parser.parse(text,function(results){
		    console.log("PARSER RESULTS: " + results);
		    results.forEach(function(link){
			    console.log("LOOKUP VIDEO LINK: " + link);
			    video_utils.lookup(link,function(err,info){
				    var video = {url:link,thumbnail:info.thumbnail,
						 poster:info.poster,t:info.t || 'undefined',
						 name:info.title || 'undefined',
						 published:info.published,
						 video_id:info.video_id,
						 desc:info.desc,
						 author:info.author,
						 play_count:0,
						 duration:info.duration
				    };
				    Couch.models.video.create(video,function(vid){
					    p.queue(vid,function(err,rel){
						    console.log("added video to queue");
						});
					    others.forEach(function(other){
						    // we put something in the mentioned queue
						    // with our from info - the person who tweeted
						    var from = {from_name:screen_name,
								from_realname:real_name,
								from_profile_image:"https://api.twitter.com/1/users/profile_image?screen_name="+screen_name+"&size=bigger"};
						    Couch.models.person.create({name:other},function(o){ // create or find?
							    o.queue(vid,from,function(err,rel){
								    console.log("added to suggestion to : " + other);
								});
							});
						});
					    if (hashtags){
						hashtags.forEach(function(tag){
							vid.hash(tag.text,function(){});
						    });
					    }
					});
				});
			});
		});
	});
}

process.on('uncaughtException', function(err) {
    console.log("Uncaught");
    console.log(err);
});

function restart(){
    setup(function(stream){
            setTimeout(function(){
                    stream.destroy();
                    //restart();
                    process.exit();
                },(60*1000)*15); // restart stream every 30 minutes since it seems to stick
        });
}

restart();
