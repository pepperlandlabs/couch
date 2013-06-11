var restify = require('restify');
var fs = require('fs');
var controller = require('./controller');
var vimeo_hack = require('../video/vimeo_hack'); // for vimeo links
var redis = require('redis');
var shrtn = require('shrtn');

shrtn.config.set('redis client', redis.createClient());

var server = restify.createServer({
    name: 'a2c',
    version: '0.0.1',
    formatters: {
        'application/json': function(req, res, body){
            if(req.params.callback){
                var callbackFunctionName = req.params.callback.replace(/[^A-Za-z0-9_\.]/g, '');
                return callbackFunctionName + "(" + JSON.stringify(body) + ");";
            } else {
                return JSON.stringify(body);
            }
        },
        'text/html': function(req, res, body){
            return body;
        }
    }
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

//var short_server = "http://localhost:8890/";
var short_server = "http://s.addtocouch.com/";
server.get('/share/:name/:video_id',function(req,res,next){
    // create a short link for this name/video
    // the link always goes to s.werhi.com/[shortcode]
        console.log("share: " + req.params.name + " " + req.params.video_id);
    var url = req.params.name+"&"+req.params.video_id;
    shrtn.shorten("http://dev.werhi.com/"+url,function(resp){
        console.log("shortend: " + url);
        console.log(resp);
        res.send(short_server+resp.id);
        return next();
    });
});

server.post('/:name/queue/:video_id', function(req,res,next){
        console.log("add to queue");
        // add friend from info, if we have
        controller.queue(req.params.name,req.params.video_id,function(data){
                console.log("queue: " + JSON.stringify(data));
                res.send(data);
                return next();
            });
    });

var popular = null;
var hot = null;

setInterval(function(){
        popular = null;
        hot = null;
    },60*60*1000);

server.get('popular',function(req,res,next){
        if (popular != null){
            res.send(popular);
            return;
        }
	controller.popular(function(data){
		res.send(data);

                popular = data;
		return next();
	    });
    });

server.get('/tag/:name',function(req,res,next){
        if (req.params.name === "hot"){
            if (hot !== null){
                console.log("hot cached.");
                return res.send(hot);
            }
        }

	controller.tags(req.params.name,function(data){
		res.send(data);

                if (req.params.name === "hot"){
                    hot = data;
                }
		return next();
	    });
    });

server.get('/hot/:name',function(req,res,next){
        controller.hot(req.params.name,function(data){
                res.send(data);
                return next();
            });
    });

var queued_long_polling = {};
var played_long_polling = {};

server.get('/:name/queued', function (req, res, next) {
        try {
        console.log("get queued: "+ req.params.name);
        if (req.params.lp == "bubba"){
            console.log("check long pooll: " + queued_long_polling);
            if (queued_long_polling[req.params.name]){
                var res = queued_long_polling[req.params.name];
                res.send(204);
                delete queued_long_polling[req.params.name];
                console.log("only allow on LP check ata  time");
                return next();
            }
            queued_long_polling[req.params.name] = res;

            var count = -1;
            var checks = 0;
            var _queued = null;

            var check = function(){
                checks++;
                console.log("long poll check: " + req.params.name + " " + checks + " " + req.id);
                if (checks > 30){
                    res.send(_queued);
                    delete queued_long_polling[req.params.name];
                    return next();
                }
                console.log("check queued:" + count);
                controller.queued(req.params.name,function(data){
                        if (_queued == null){
                            _queued = data;
                            count = _queued && _queued.data && _queued.data.length;
                            setTimeout(check,2000);
                        } else {
                            new_count = data && data.data && data.data.length;
                            console.log("check queued:" + new_count);
                            if (new_count > count){
                                res.send(data);
                                delete queued_long_polling[req.params.name];
                                return next();
                            } else {
                                setTimeout(check,2000);
                            }
                        }
                    });
            };
            setTimeout(check,1000);
        } else {
            console.log("no long poll");
            controller.queued(req.params.name,function(data){
                    res.send(data);
                    return next();
                });
        }
        } catch (e){
            console.log("error: " + e);
            console.log(e.stack);
        }
});


server.get('/:name/profile',function(req,res,next){
    controller.profile(req.params.name,function(p){
        res.send(p);
        return next();
    });
});

server.get('/:name/followers',function(req,res,next){
    controller.followers(req.params.name,function(f){
        res.send(f);return next();
    });
});

server.get('/:name/following/queue',function(req,res,next){
        // get timestamped following queue
    controller.following_queue(req.params.name,function(q){
        res.send(q);return next();
    });
});

server.get('/:name/followers/queue',function(req,res,next){
    controller.followers_queue(req.params.name,function(q){
        res.send(q);return next();
    });
});

server.get('/:name/following',function(req,res,next){
    controller.following(req.params.name,function(data){
        res.send(data);return next();
    });
});

server.post('/:name/follow',function(req,res,next){
    controller.follow(req.params.name,req.params.f,function(data){
        res.send(data);return next();
    });
});

server.get('/:name/played', function (req, res, next) {
        if (req.params.lp == "bubba"){
            console.log("long poll played");
            var played_count = -1;
            var checks = 0;
            var _played = null;

            if (played_long_polling[req.params.name]){
                var res = played_long_polling[req.params.name];
                res.send(204);
                delete played_long_polling[req.params.name];
                return;
            }
            played_long_polling[req.params.name] = res;
            var check = function(){
                checks++;
                if (checks > 50){
                    res.send(_played);
                    delete played_long_polling[req.params.name];
                    return next();
                }
                controller.played(req.params.name,function(played){
                        if (_played == null){
                            _played = played;
                            played_count = _played && _played.data && _played.data.length;
                            setTimeout(check,1000);
                        } else {
                            new_count = played && played.data && played.data.length;
                            if (new_count > played_count){
                                res.send(played);
                                delete played_long_polling[req.params.name];
                                return next();
                            } else {
                                setTimeout(check,1000);
                            }
                        }
                    });
            };

            setTimeout(check,1000);

        } else {
            controller.played(req.params.name,function(played){
                    res.send(played);
                    return next();
                });
        }
});

server.post('/:name/played', function (req, res, next) {
        console.log("post play");
    controller.play(req.params.name,req.params.id,function(r){
            try { res.end(r);
              } catch (e){
                  console.log(e);
              }
    });
});

server.get('/video/:id',function(req,res,next){
    vimeo_hack(req.params.id,function(url){
        res.send(url);
    });
});

server.get('/:name/suggest/network',function(req,res,next){
    controller.suggest_network(req.params.name,function(suggest){
        res.send(suggest);
        return next();
    });
});
    

var port = process.env.PORT || 8889;
server.listen(port, function () {
    console.log('%s listening at %s', server.name, server.url);
});


process.on('uncaughtException',function(err){
        console.log(err);
        setTimeout(function(){
                process.exit(1);
            },1000);
    });

setTimeout(function(){
        process.exit(1);
    },1000*60*60);