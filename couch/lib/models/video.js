var model = require('./base');

var video = {
    index:['video_id', 'url'],
    category:'videos',
    static:{
	popular:function(cb){
	    try { 
		Couch.models.video.findAll({order_by:"play_count",limit:10},cb);
	    }catch (e){
		console.log(e);
		cb(e,null);
	    }
	},
	hot:function(cb){
	}
    },
    methods: {
        get_total_played:function(cb){
        },
        get_total_shares:function(cb){
        },
	hash:function(tag,cb){
	    var self = this;
	    this.adapter.get_root(function(err,root){
		    console.log("add hash to : " + root);
		    self.adapter.add_rel(root, self.node, tag,cb);
		});
	},
	played:function(cb){
	    if (this.play_count){
		this.play_count++;
	    } else {
		this.play_count = 1;
	    }
	    Couch.models.video.save(this,function(e){
		    console.log(e);
		    if (cb) { cb(e);}
		});
	}
    }
};

module.exports = model(video);
