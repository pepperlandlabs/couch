var restify = require('restify');
var client = restify.createJsonClient({
  url: 'http://vimeo.com',
  version: '*'
});

function get_info(video_id,cb){
  client.get('/api/v2/video/'+video_id+'.json', function(err, req, res, obj) {
    if (obj === null){
      return cb(err,{thumbnails:"none", published:"none", title:null, type:"vimeo",video_id:video_id});
    }  else {
      var vid = obj[0];
      cb(err,{thumbnail:vid.thumbnail_small,
              video_id:video_id,
              t:"vimeo",
                  desc:vid.description,
              duration:vid.duration,
                  author:vid.user_name,
              poster:vid.thumbnail_large,
              published:vid.upload_date,
              title:vid.title});
    }
  });
}

/*get_info('47597940',function(err,vid){
  console.log(vid);
});*/
module.exports.get_info = get_info;

