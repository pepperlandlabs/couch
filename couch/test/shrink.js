var shrink = require('shrink');

exports['test'] = function(test){
    var url = "http://google.com"; //"http://localhost:8889/vids"
    var result = shrink.shorten(url);
    console.log(result);
    test.done();
}


