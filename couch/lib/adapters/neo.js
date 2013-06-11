/* an adapter implementation represents a binding between data and a specific
   persistence layer. the interface should be common (CRUD), but can augment
   and extend to provide specific functional, and even polyglot facade
*/
   
var finder = require('../common/finder');
var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var async = require('async');
// we can use root node as 0 or add an index to it
var ROOT_NODE = null;
getRoot(function(err,results){});

function get_outgoing(rel,node,cb){
    var results = [];
    node.outgoing(rel,function(err,rels){
        if (rels){
            async.forEach(rels,function(rel,cb){
                finder.getNode(rel._data.end,function(err,r){
                    //console.log(r);
                    //console.log(rel);
                    if (rel._data && rel._data.data){
                        if (rel._data.data.from_name){
                            r._data.data.from = {
                                user:rel._data.data.from_name,
                                name:rel._data.data.from_realname,
                                profile_image:rel._data.data.from_profile_image
                            };
                        }
                        if (!r._data.data.name && r._data.data.title){
                            r._data.data.name = r._data.data.title;
                        }
                        results.push(r._data.data);
                    }
                    cb();
                });
            },function(err){
                cb(results);
            });
        } else { cb({});}
    });
}

function get_rel(rel,order,node,cb){
    var results = [];
    var query = "START user=node({USER_ID}) MATCH user-[rp:"+rel+"]->video RETURN rp,video ORDER BY rp.timestamp "+order;
    var params = {"USER_ID":node.id};
    //    console.log(query+" "+node.id);
    db.query(query,params,function(err,rels){
        if (rels){
            async.forEach(rels,function(result,cb){
                    var video_node = result.video;
                    var rel = result.rp;
                    if (rel._data.data.from_name){
                        video_node._data.data.from = {
                            user:rel._data.data.from_name,
                            name:rel._data.data.from_realname,
                            profile_image:rel._data.data.from_profile_image
                        }
                    }
                    results.push(video_node._data.data);

                });
        }
        cb(results);
        });
}

function get_incoming(rel,node,cb){
    var results = [];
    node.incoming(rel,function(err,rels){
        async.forEach(rels,function(rel,cb){
            finder.getNode(rel._data.end,function(err,r){
                results.push(r._data.data);
                cb();
            });
        },function(err){
            cb(results);
        });
    });
}

function rel_exists(a,b,rel,cb){
    var query = [
        'START user=node({userId}), other=node({otherId})',
        'MATCH (user) -[rel?:'+rel+']-> (other)',
        'RETURN rel'
    ].join('\n');
    if ((!a)  || (!b)){
        return cb(null,null);
    }

    var params = {
        userId: a.id,
        otherId: b.id,
    };
    db.query(query, params, function (err, results) {
        if (err) return cb(err);
        var rel = results[0] && results[0]['rel'];
        if  (rel && rel != null){
            cb(null, rel);
        } else {
            cb(null,null);
        }
    });
}

function del_rel(a,b,rel_type,cb){
    rel_exists(a,b,rel_type,function(err,rel){
        if (rel){
            rel.delete(cb);
        } else {
            cb(null,null);
        }
    });
}

function add_rel(a,b,rel_type,props, cb){
    // don't dupe
    if (typeof(props) === 'function'){
        cb = props;
        props = null;
    }
    rel_exists(a,b,rel_type,function(err,rel){
        if (!rel){
            var info = {timestamp: new Date().getTime()};
            if (props != null){
                info = props;
                info.timestamp = new Date().getTime();
            }
            a.createRelationshipTo(b,rel_type,info,function(err,r){
                cb(err,r);
            });
        } else { cb(err,rel);}
    });
}

// we internally add all new nodes by index/category to root
function getRoot(cb){
    if (!ROOT_NODE){
        var query = 'start root=node(0) return root';
        db.query(query,null,function(err,results){
            db.getNode(results[0].root._data.self,function(err,n){
                ROOT_NODE = n;
                cb(null,ROOT_NODE);
            });
        });
        
    } else {
        cb(null, ROOT_NODE);
    }
}

// todo: update to allow multiple indexes
function create(data, key,category, cb){
    if (!ROOT_NODE){
        setTimeout(function(){
            create(data,key,category,cb);
        },150);
        return;
    }
    var fkey = key, value = data[key];
    if (typeof(key) == 'object'){
        fkey = key[0];value=data[fkey];
    }
     finder.find(fkey,value,category,function(err,results){
        if (results){
            console.log("----->Found existing node in create " + category);
            cb(null,results);
        } else {
            var node = db.createNode(data);
            node.save(function(err){
                if (err){ console.log("SAVE ERROR");
                          console.log(err);}
                if (err) { return cb(err,null);}
                add_rel(ROOT_NODE,node,category,function(err){
                    if (err) { console.log("add to root relationship failed " + err);}
                    if (typeof(key) == 'object'){
                        var len = key.length;
                        var done = 0;
                        key.forEach(function(k){
                            node.index(category,k,data[k],function(err){
                                
                                if (err) { 
                                    console.log("add index failed: "+  err);
                                    console.log(err.stack);
                                }
                                if (++done === len) {
                                    cb(err,node);
                                }

                            });
                        });
                    } else {
                        node.index(category,key,data[key],function(err){
                            if (err) { 
                                console.log("add index failed: "+  err);
                                console.log(err.stack);
                            }
                            cb(err,node);
                        });
                    }
                
                });
            });
        }
    });
}

function save(obj,cb){
    if (obj.node){
        obj.node.save(function(err){
            cb(err);
        });
    } else {
        cb("Not a valid neo4j object node found");
    }
}
function del(){}

function update(){}



var neo = (function(){
    return {
        save:save,
        create:create,
        del:del,
        update:update,
        add_rel:add_rel,
        del_rel:del_rel,
        get_rel:get_rel,
        get_incoming:get_incoming,
        get_outgoing:get_outgoing,
	get_root:getRoot
    }
})();

module.exports = neo;
