require('../lib');
var video_utils = require('../lib/video/utils');

function add_video(url,user,from, cb){
    video_utils.lookup(url,function(err,data){
        data.url = url;
        Couch.models.video.create(data,function(vid){
            Couch.models.person.find(user,function(foobar){
                foobar.queue(vid,from, function(){
                    cb(foobar);
                });
            });
        });
    });
}

exports['from_queue'] = function(test){
    var url = "http://www.youtube.com/watch?v=JfPYVYc0U3M"
    add_video(url,
              "ponorich",{from_name:"gotrich",
                           from_realname:"Got Richie",
                          from_profile_image:"http://asianconnection71.com/DrgnSurfCrmBkZm.jpg"},function(person){
                              console.log("check queue");
                              person.queued(function(q){
                                  console.log(q);
                                  test.done();
                              });
                          });
}

exports['update'] = function(test){
    Couch.models.person.find("gotrich",function(foobar){
        foobar.is_handsome = "of course";
        Couch.models.person.save(foobar,function(e){
            //console.log(e);
            Couch.models.person.find("gotrich",function(foobar){
                //console.log(foobar);
                console.log(foobar.is_handsome);
                
            });
        });
    });
}

exports['create'] = function(test){
    Couch.models.person.create({name:"gotrich"},function(foobar){
        Couch.models.person.create({name:"ponorich"},function(foobar){
            Couch.models.person.find("gotrich",function(foobar){
                console.log("FIND RETURNS GOTRICH");
                Couch.models.person.find("ponorich",function(foobar){
                    console.log("FIND RETURNS PONO");
                    test.notEqual(foobar,null);
                    test.done();
                });
            });
        });
    });
};

exports['profile'] = function(test){
    Couch.models.person.find("ponorich",function(user){
        test.notEqual(user,null);
        if (user){
            user.profile(function(p){
                test.notEqual(p,null);
                test.done();
            });
        } else {
            test.done();
        }
    });
}


exports['get_queue'] = function(test){
   Couch.models.person.find("ponorich",function(foobar){
       foobar.queued(function(q){
               q.forEach(function(v){
                       console.log(v.name);
                       if (v.from)
                           console.log(v.from);
                   });
           test.notEqual(q,null);
       });
       test.done();
   });
}
exports['enqueue'] = function(test){
    var url = "http://www.youtube.com/watch?v=cAGABdvv5u8";
    video_utils.lookup(url,function(err,data){
        test.equal(err,null);
        data.url = url;
        Couch.models.video.create(data,function(vid){
            Couch.models.person.find("foobar",function(foobar){
                foobar.queue(vid,function(){
                    foobar.queued(function(q){
                        q.forEach(function(v){
                            console.log("Queued: " + v.title);
                        });
                    });
                test.done();
                });
            });
        });
    });
}


exports['played'] = function(test){
   Couch.models.person.find("ponorich",function(foobar){
       foobar.played(function(q){
           console.log(q);
       });
       test.done();
   });
}

exports['play'] = function(test){
   Couch.models.person.find("ponorich",function(foobar){
       var url = "http://www.youtube.com/watch?v=cAGABdvv5u8";
       Couch.models.video.find(url, "url",function(vid){
           foobar.play(vid,function(q){
               console.log(q);
           });
           test.done();
       });
   });
}

exports['followers'] = function(test){
   Couch.models.person.find("ponorich",function(foobar){
       foobar.followers(function(q){
           console.log(q);
       });
       test.done();
   });

}
exports['add following'] = function(test){
    Couch.models.person.find("ponorich",function(ponorich){
        ponorich.follow("gotrich",function(err,results){
            console.log(err);
            console.log(results);
            test.done();
        });
    });
}

exports['following'] = function(test){
   Couch.models.person.find("ponorich",function(foobar){
       foobar.following(function(q){
           console.log(q);
       });
       test.done();
   });
}

exports['twitter_friends'] = function(test){
    test.done();
}

