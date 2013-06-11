
// we first look for all http:// in the link
// for each one, we will http get the head to see if
// the link is valid, if it is, we cb with success
function parse(data,cb){
  var reg_url = /(https?:\/\/[^\s]+)/g;
  var r = new RegExp(reg_url);
  var done = false;
  var ret = [];
  while (!done){
    var results = r.exec(data);
    if (results && results.length > 0){
      ret.push(results[0]);
      r.lastIndex += 1;
    } else {
      done = true;
      cb(ret);
    }
  }
}

module.exports.parse = parse;
