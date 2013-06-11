var restify = require('restify');
var redis = require('redis');
var shrtn = require('shrtn');
var controller = require('./controller');
var hbs = require('hbs');
var fs = require('fs');

var source_template = fs.readFileSync(__dirname+"/../../templates/share.html");
var template = hbs.compile(source_template.toString());

setInterval(function(){
source_template = fs.readFileSync(__dirname+"/../../templates/share.html");
template = hbs.compile(source_template.toString());
    },3000);


shrtn.config.set('redis client', redis.createClient());

var server = restify.createServer({
    name: 'shorty',
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

server.get('/:shortcode',function(req,res,next){
    // all of our short links 
    console.log(req.params.shortcode);
    shrtn.expand(req.params.shortcode,function(response){
        console.log("--->expand");
        console.log(response);
        if ((!response) || (response.status=='ERROR')){ 
            return res.send({err:'invalid'});
        }
        var data = response['long'].split("/")[3];
        var user = data.split("&")[0];
        var video_id = data.split("&")[1];
        controller.person(user,function(p){
            controller.video(video_id,function(v){
                console.log(v);
                var link;
                if (v.t =='youtube'){
                    link = "http://www.youtube.com/embed/"+v.video_id+"?wmmode=transparent"
                } else {
                    link = "http://player.vimeo.com/video/"+video_id;
                }
                var data = {user:user,
                            link:link,
                            image:"https://api.twitter.com/1/users/profile_image?screen_name="+user+"&size=bigger",
                            title:v.title};
                var result = template(data);
                res.contentType = 'text/html';
                res.send(result); 
                /*res.send({user:{name:p.name},
                          video:{duration:v.duration,
                                 title:v.title,
                                 thumbnail:v.thumbnail,
                                 poster:v.poster,
                                 url:v.url,
                                 video_id:v.video_id}});*/
            });
        });
    });
    //return res.next();
});

var port = process.env.PORT || 8890;
server.listen(port, function () {
    console.log('%s listening at %s', server.name, server.url);
});
