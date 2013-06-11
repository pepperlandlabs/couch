require('../lib');

var video_utils = require('../lib/video/utils');

exports['hash'] = function(test){
    var url = "http://t.co/bNc037XE";
    Couch.models.video.find(url,'url',function(video){
	    console.log(video.name);
	    video.hash("foo",function(){
		    Couch.models.video.findBy("foo",{limit:20},function(err,videos){
			    console.log("foo videos:");
			    videos.forEach(function(video){
				    console.log(video.name);
				});
			});
		});
	});
}

exports['played'] = function(test){
    var url = "http://t.co/bNc037XE";
    Couch.models.video.find(url,'url',function(video){
	    console.log(video);
	    video.played(function(){
		    console.log(video);
		    test.done();
		});
	});
};

exports['popular'] = function(test){
    Couch.models.video.popular(function(err,videos){
	    videos.forEach(function(v){
		    console.log(v.name + " " + v.play_count);
		});
	    test.done();
	});
};

exports['all'] = function(test){
    Couch.models.video.findAll(function(err,videos){
	    console.log("Found: " + videos.length);
	    videos.forEach(function(v){
		    if (!v.play_count){
			v.play_count  = 0;
			console.log("set play count");
			try { Couch.models.video.save(v,function(){});
			} catch (e){
			    console.log(e);
			}
		    }
		});
	    //test.done();
	});
}

exports['create'] = function(test){
    var url = "http://t.co/Bpa8alWQpf";
    //    var url = "http://www.youtube.com/watch?v=cAGABdvv5u8";
//    var url = "http://www.youtube.com/watch?v=QC0_mrnRurw";
//    var url = "http://www.youtube.com/watch?v=OE4AH4DZtEI";
    video_utils.lookup(url,function(err,data){
        test.equal(err,null);
        data.url = url;
        Couch.models.video.create(data,function(err,camero){
            Couch.models.video.find('QC0_mrnRurw','video_id',function(vid){
                console.log(vid.url);
                // add relationships via NODE but hidden on model4j helper methods
                // so queue gets this object but we use vid.node
                test.done();
            });

        });
    });
}
    
