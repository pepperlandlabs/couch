// this is a real hack, because we need to get the hidden vimeo urls to support airplay. otherwise
// we'd have to vimeo embed the html, and play, which works well, but vimeo doesn't support airplay that
// way. so , we have to use a 3rd party service (keepvid.com) which isn't an api, it's a webpage that we
// scrape. the other api service on the web sucked and was always down

var net = require('net');
var http = require('http');
var select = require('soupselect').select;
var htmlparser = require("htmlparser");
var restify = require('restify');
var client = restify.createClient({
  url: 'http://keepvid.com',
  version: '*'
});

// look for the last href in the dl div
function soup(body,cb){
    console.log("soup: " + body.length);
    var handler = new htmlparser.DefaultHandler(function(err, dom) {
        var info = select(dom,'div[id="dl"]');
        var links = select(info,'a');
        if (links && links.length > 0){
            var high_res = links[links.length-1].attribs.href;
            cb(high_res);
        } else {
            cb(null);
        }
    });
    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(body);
}

function get_url(url,cb){
    console.log(url);
    console.log(encodeURIComponent(url));
    client.get('/?url='+encodeURIComponent(url),function(err,req){
        req.on('result', function(err, res) {
            res.body = '';
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                res.body += chunk;
            });

            res.on('end', function() {
                soup(res.body,cb);
            });
        });
    });
}

function get(video_id,cb){
    client.get('/?url=http%3A%2F%2Fvimeo.com%2F'+video_id,function(err,req){
        req.on('result', function(err, res) {
            res.body = '';
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                res.body += chunk;
            });

            res.on('end', function() {
                soup(res.body,cb);
            });
        });
    });
}

module.exports = get;

/*get(55073825,function(results){
    console.log(results);
    });*/

/*get_url("http://www.youtube.com/watch?v=gYFlq7s6BrY",function(results){
        console.log(results);
        });*/