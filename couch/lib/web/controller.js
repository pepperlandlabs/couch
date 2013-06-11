require('../');

//var HOT_ON_COUCH = "hotoncouch";
var HOT_ON_COUCH = "addcouchsurf";

var handle = function(func,obj,cb){
    try {
        if (obj){
            obj[func](function(results){
                if (results && results.length > 0){
                    cb({data:results,length:results.length});
                } else { cb({data:[],length:0});}
            });
        } else {
            cb({err:"Resource Not found",data:[],length:0});
        }
    } catch(e){
        cb({err:e,data:[],length:0});
    }
        
}

var methods = {
    person:function(name,cb){
        Couch.models.person.find(name,cb);
    },
    popular:function(cb){
        Couch.models.video.findAll({order_by:"play_count",limit:10},function(err,results){
                var ret = [];
                if (!results) { return cb({data:ret,length:0})}
		results.forEach(function(vid){
			ret.push({url:vid.url,
                                    thumbnail:vid.thumbnail,
                                    poster:vid.poster,
                                    t:vid.t,
                                    published:vid.published,
                                    duration:vid.duration,
                                    video_id:vid.video_id,
                                    name:vid.name});
		    });
		cb({data:ret,length:ret.length});                
            });
    },
    tags:function(tag,cb){
	Couch.models.video.findBy(tag,function(err,results){
		var ret = [];
                if (!results) { return cb({data:ret,length:0})}
		results.forEach(function(vid){
			ret.push(vid._data.data);
		    });
		cb({data:ret,length:ret.length});
	    });
    },
    video:function(video_id,cb){
        Couch.models.video.find(video_id,'video_id',cb);
    },
    hot:function(name,cb){
        Couch.models.person.find(HOT_ON_COUCH,function(hot){
                Couch.models.person.find(name,function(p){ 
                        console.log(p);
                        if (!p){
                            hot.queued(function(v){
                                    cb({length:v.length,
                                                data:v});
                                })
                            return;
                        }
                        var queued_hash = {};
                        var results = {
                            length:0,
                            data:[]
                        }

                        p.queued(function(vids){
                                vids.forEach(function(q){
                                        queued_hash[q.video_id] = q;
                                    });
                                hot.queued(function(hot_vids){
                                        hot_vids.forEach(function(v){
                                                if (!(queued_hash[v.video_id])){
                                                        results.data.push(v);
                                                    }
                                            });
                                        results.length = results.data.length;
                                        cb(results);
                                    });
                            });
                    });
            });

    },
    queue:function(name,video_id,cb){
        Couch.models.video.find(video_id,'video_id',function(vid){
                Couch.models.person.find(name,function(p){                
                        console.log("controller queue: " + p + " " + vid);
                    //{from_name:"hotoncouch",
                    //from_realname:"Couch",
                    //from_profile_image:"https://api.twitter.com/1/users/profile_image?screen_name=hotoncouch&size=bigger"}
                        if (p){
                            p.queue(vid,cb);
                        } else {
                            console.log("craete new person: " + name);
                            Couch.models.person.create({name:name},function(foobar){
                                    console.log("created: ");
                                    console.log(foobar);
                                    if (foobar){
                                        foobar.queue(vid,cb);
                                    } else {
                                        cb([]);
                                    }
                                });
                        }
                });
        });
    },
    queued:function(name,cb){
        Couch.models.person.find(name,function(p){
            handle('queued',p,cb);
        });
    },
    suggest_network:function(name,cb){
        Couch.models.person.find(name,function(p){
            handle('network_suggest',p,cb);
        });
    },
    profile:function(name,cb){
        Couch.models.person.find(name,function(p){
            if (p){
                p.profile(function(profile){
                    cb(profile);
                });
            } else {
                cb({err:"Resource not found",followers:-1,following:-1,played:{length:-1,last_played:null}});
            }

        });
    },
    followers:function(name,cb){
        Couch.models.person.find(name,function(p){
            handle('followers',p,cb);
        });

    },
    following:function(name,cb){
        Couch.models.person.find(name,function(p){
            handle('following',p,cb);
        });
    },
    following_queue:function(name,cb){
        Couch.models.person.find(name,function(p){
            handle('following_queue',p,cb);
        });
    },
    followers_queue:function(name,cb){
        Couch.models.person.find(name,function(p){
            handle('followers_queue',p,cb);
        });
    },
    follow:function(name,follow_name,cb){
        Couch.models.person.find(name,function(p){
            p.follow(follow_name,cb);
        });
    },
    played:function(name,cb){
        Couch.models.person.find(name,function(p){
            handle('played',p,cb);
        });
    },
    play:function(name,video_id,cb){
        Couch.models.person.find(name,function(p){
            if (p){
                Couch.models.video.find(video_id,'video_id',function(vid){
                    if (vid){
                        p.play(vid,cb);
                    } else {
                        cb({err:"No video found"});
                    }
                });
            } else {
                cb({err:"No person found"});
            }
        });
    },
    
}

module.exports = methods;
