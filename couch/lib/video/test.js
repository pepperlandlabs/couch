var video_utils = require('./utils');

var link = "http://vimeo.com/m/35770492";
video_utils.lookup(link,function(err,info){
        console.log(err);
        console.log(info);
    });