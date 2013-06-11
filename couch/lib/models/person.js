var model = require('./base');
var twit = require('../common/twitter');
var async = require('async');

var person = {
    index:'name',
    category:'people',
    // todo: put static methods here, manager? controller? proxy? delegate?

    methods: {
        queue:function(video,from, cb){
            if (typeof(from) === 'function'){
                cb = from;
                from = null;
            }
            this.adapter.add_rel(this.node, video.node, 'QUEUED',from, cb);
        },
        queued:function(cb){
            //this.adapter.get_outgoing("QUEUED",this.node,cb);
            this.adapter.get_rel("QUEUED","DESC",this.node,cb);
        },
        play:function(video, cb){
            this.adapter.add_rel(this.node, video.node, 'PLAYED',cb);
            this.adapter.del_rel(this.node, video.node, 'QUEUED',cb);
	    video.played();
        },
        played:function(cb){
            this.adapter.get_rel("PLAYED","DESC",this.node,cb);
            //this.adapter.get_outgoing("PLAYED",this.node,cb);
        },
        following:function(cb){
            this.adapter.get_outgoing("FOLLOWING",this.node,cb);
        },
        followers:function(cb){
            this.adapter.get_incoming("FOLLOWING",this.node,cb);
        },
        profile:function(cb){
            var self = this;
            self.queued(function(queued){
                self.played(function(played){
                    var last_played = {};
                    console.log(played);
                    if (played && played.length != 0){
                        last_played = played[0];
                    }
                    self.followers(function(followers){
                        self.following(function(following){
                            cb({
                                followers:followers.length || 0,
                                following:following.length || 0,
                                played:{length:played.length || 0,
                                        last_played:last_played}
                            });
                        })
                    });
                });
            });
        },
        follow:function(name,cb){
            var self = this;
            try { 
                Couch.models.person.find(name,function(f){
                    if (f){
                        self.adapter.add_rel(self.node,f.node,'FOLLOWING',function(err,r){
                            cb(err,{result:"okay"});
                        });
                    } else {
                        cb({err:name+" Not Found"},null);
                    }
                });
            } catch (e){
                console.log("follow e: " + e);
                cb({err:e},null);
            }
            
        },
        unfollow:function(name,cb){
        },
        network_suggest:function(cb){
	    // bring back the glory
	    // find videos your twitter friends have watched and you haven't, order by
	    // date and most played
            twit.get_friends(this.name,function(err,friends){
                    if (err || !friends){
                        return cb(results);
                    }
                    var results = [];
                    async.forEach(friends,function(friend,cb){
                            Couch.models.person.find(friend.screen_name,function(p){
                                    p.queued(function(vids){
                                            if (!vids) { return cb(results);}
                                            vids.forEach(function(vid){
                                                    if (vid.t != 'undefined'){
                                                        vid.from = {
                                                            user:friend.screen_name,
                                                            profile_image:friend.profile_image
                                                        };
                                                        results.push(vid);
                                                    }
                                                });
                                            cb();
                                        });
                                });
                        },function(err){
                            cb(results);
                        });

                });
	}
    }
};

module.exports = model(person);

/*var _person = model(person);

_person.find('ponorich',function(pono){
    console.log(pono.name);
    pono.profile(function(profile){
        console.log(profile);
    });
    pono.queued(function(d){
        d.forEach(function(q){
            console.log("queued: " + JSON.stringify(q));
        });
    });
});




*/
