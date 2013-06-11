var restify = require('restify');
var http = require('http');
var youtube = require('./youtube');
var vimeo = require('./vimeo');

var methods = {
    unshorten:function(l,cb){
        var u = require('url').parse(l,true);
        var options = {method: 'HEAD', host: u.host, port: 80, path: u.path};
        var req = http.request(options, function(res) {
            console.log(JSON.stringify(res.headers));
            cb(res.headers);
        });
        req.end();
    },
    lookup:function(url,cb){
        if (!url){
            cb("NO video url to parse", null);
        } else {
            console.log("-->lookup: " + url );
            // (http://youtu.be/47s570LFHDU
            if (url.indexOf('youtu.be') !== -1){ 
                var video_id = url.split('/')[3];
                youtube.get_info(video_id,cb);
            } else if (((url.indexOf("youtube.com")) != -1) || (url.indexOf("vimeo.com") != -1)){
                // not short, just return   
                console.log("-->not not shortened: "+ url.indexOf("youtube") + " " + url.indexOf("vimeo.com"));
                if (url.indexOf("youtube") !== -1){
                    console.log("resolved url: " + url);
                    var video_id = require('url').parse(url,true).query.v;
                    console.log("video id: " + video_id);
                    youtube.get_info(video_id,cb); 
                } else if (url.indexOf("vimeo") !== -1){
                    var video_id = require('url').parse(url,true).path;
                    console.log("VIMEO VIDEO_ID");
                    console.log(video_id);
                    if (video_id.indexOf("/m/") !== -1){
                      video_id = video_id.split("/")[2];
                    } else {
                      video_id = video_id.substring(1);
                    }
                    console.log("Parsed video_id : "+ video_id + " from: " + url);
                    vimeo.get_info(video_id,cb); 
                }
            } else {
                console.log("-->  unshorten ", url);
               this.unshorten(url,function(obj){
                    console.log(obj);
                    if (obj && obj.location){
                        var r_url = obj.location;
                        if (r_url.indexOf('youtu.be') !== -1){ 
                            var video_id = r_url.split('/')[3];
                            youtube.get_info(video_id,cb);
                        } else if (r_url.indexOf("youtube") !== -1){
                            console.log("resolved url: " + r_url);
                            var video_id = require('url').parse(r_url,true).query.v;
                            youtube.get_info(video_id,cb); 
                        } else if (r_url.indexOf("vimeo") !== -1){
                            var video_id = require('url').parse(r_url,true).path;
                            if (video_id.indexOf("/m/") !== -1){
                              video_id = video_id.split("/")[2];
                            } else {
                              video_id = video_id.substring(1);
                            }
                            vimeo.get_info(video_id,cb); 
                        } else {
                            cb(err,{thumbnail:"",
                                    poster:"",
                                    published:"",
                                    title:""});
                        }
                    } else {     
                        cb(err,{thumbnail:"",
                                poster:"",
                                published:"",
                                title:""});
                    }
                });
            }
        }
    }
}

module.exports = methods;

/*methods.lookup('http://t.co/BrlZTDqu',function(err,results){
        console.log(err);
        console.log(results);
        });*/

methods.lookup('http://www.youtube.com/watch?v=SvksV-uyM28',function(err,results){
        console.log(results);
    });