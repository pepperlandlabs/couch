/*
  What this provides is a nomenclature around
  model search that's standard (find({}),findAll, (avoiding 300 findByFooAndBar and findBlahBlah)
  but providing a familar model-based view hanging off a model "static" method
   
  So there are two finder methods: find(), findAll(). With no args, find will find by
   whatever the models primary key is by default, so, assuming name is the primary key:
   
   person.find("rich")  would in a db world do select * from persons where name = 'rich'

   But, If you want more finding powers, you pass in a hash of values: 
   person.find({name:"Rich", looks:"handsome"});

   TOOD: update finder to be more agnostic to finding, ie hook into postgres
   
*/

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase(process.env.NEO4J_URL || 'http://localhost:7474');

function find(key,value,category,cb){
    var query= "start n=node:"+category+"("+key+"='"+value+"') return n";
    //    console.log("Find called: " + query);
    db.query(query,null,function(err,results){
        if (results && results.length > 0){
            //            console.log("--->found results: " + results.length);
            // log node already exists, and return it
            var node_url = results[0].n._data.self;
            db.getNode(node_url, function(err,n){
                cb(err,n);
            });
        } else {
            //            console.log("--->not found");
            cb(err,null);
        }
    });
}

function findAll(category,options,cb){
    if (typeof(options) == 'function'){
	cb = options;
	options = {};
    }
    var query = "START root=node(0) MATCH root-[rp:"+category+"]->item RETURN item ";
    if (options.order_by){
	query += " ORDER BY item." + options.order_by + " DESC ";
    };
    if (options.limit){
	query += " LIMIT " + options.limit;
    }
    //    console.log(query);
    db.query(query,null,function(err,results){
        if (results && results.length > 0){
            var done = 0,nodes = [], lookups = results.length;

	    var lookup = function(i,cb){
		if (i < results.length){
		    var result = results[i];
		    var node_url = result.item._data.self;
		    db.getNode(node_url, function(err,n){
                            //			    console.log('found: ' + node_url);
			    nodes.push(n);
			    lookup(++i,cb);
			});
		} else {
		    cb(null,nodes);
		}

	    };
	    lookup(0,cb);
	    /*            results.forEach(function(result){
                var node_url = result.item._data.self;
                db.getNode(node_url, function(err,n){
                    nodes.push(n);
                    if (++done === lookups){ cb(err,nodes);}
                });
		});*/
        } else {
            cb(err,null);
        }
    });
}



var finder = (function(){
    return {
        find:find,
        findAll:findAll,
        getNode:function(url,cb){
            db.getNode(url,cb);
        }
    };
})();

module.exports = finder;
