var restify = require('restify');
var client = restify.createJsonClient({
  url: 'https://gdata.youtube.com',
  version: '*'
});

var DEV_KEY="AIzaSyAbzjnRPbbG3e4DQr2lqQbsHRCaPIhTqjA";
function get_info(video_id,cb){
    console.log("youtube get video info: " + video_id);
  client.get('/feeds/api/videos/'+video_id+'?v=2&alt=jsonc&key='+DEV_KEY, function(err, req, res, obj) {
          if (err){
              console.log(err);
          }
          if (res && res.body){
              console.log(res.body);
          }

    if (obj === null){
        return cb(err,
                  {thumbnails:"none", published:"none", title:null, 
                   t:"youtube",video_id:video_id});
    }  else {
        cb(err,{thumbnail:obj.data.thumbnail.sqDefault,
                video_id:video_id,duration:obj.data.duration,
                t:"youtube",
                desc:obj.data.description,author:obj.data.uploader,
                poster:obj.data.thumbnail.hqDefault,
                published:obj.data.uploaded,
                title:obj.data.title});
    }
  });
}

/*get_info('kpZhZAr1cQU',function(err,vid){
  console.log(vid);
});*/
module.exports.get_info = get_info;

