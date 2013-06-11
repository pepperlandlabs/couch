require('../lib');

var video_utils = require('../lib/video/utils');
exports['create'] = function(test){
    //    var url = "http://t.co/Bpa8alWQpf";
    var url = "http://www.youtube.com/watch?v=D5PF8ykKUWE";
    //    var url = "http://www.youtube.com/watch?v=cAGABdvv5u8";
//    var url = "http://www.youtube.com/watch?v=QC0_mrnRurw";
//    var url = "http://www.youtube.com/watch?v=OE4AH4DZtEI";
    video_utils.lookup(url,function(err,data){
        test.equal(err,null);
        data.url = url;
        Couch.models.video.create(data,function(err,camero){
            Couch.models.video.find('QC0_mrnRurw','video_id',function(vid){
                    console.log(vid);
                    //xconsole.log(vid.url);
                // add relationships via NODE but hidden on model4j helper methods
                // so queue gets this object but we use vid.node
                test.done();
            });

        });
    });
}
    
