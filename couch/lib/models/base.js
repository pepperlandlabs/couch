/* The job of the base model is bind and wrap functionality
   around an existing data class. This will add STATIC creational/search
   methods (ie bind a common finder and persistence search), in addition to 
   model properties and class methods, and minimal syntax to "persist" the
   data object. 

   Example: This creates a cat that gets stored into neo4j and can meow

   var cat = {
      index:'name', // primary key to find by if typeof([]) compound key
      category:'animals', // table name
      methods:{
      meow:function(){
      console.log(this.name + " meow ");
      }
      }
   }
   module.exports = model(cat);

   The magic of the model sets up context, scope, etc.
        
   What has happened there is now a global model of "cat" with finder and create class methods: find,findAll,create,save
   in addition to a cat instance that can meow , save, update, etc:
       my_project.cat.create({name:"fluffy"},function(fluffy){
               fluffy.meow();
               fluffy.name = "bunny";
               cat.save(fluffy);
       });

       

*/
   
   
var finder = require('../common/finder');
var neo = require('../adapters/neo');

var creator = function(node,methods){
    try { 
        var obj = function(){
            return {
                node:node
            }
        }();
        Object.keys(node._data.data).forEach(function(k){
            obj[k] = node._data.data[k];
        });
        Object.keys(methods).forEach(function(f){
            obj[f] = methods[f];
        });
        obj.adapter = neo;
        return obj;
    } catch (e){
        console.log(e);
        console.log(e.stack);
        return null;
    }
}

/* get soemthing index, category, and methods and make it good */
var model = function(thing){
    /* expose any core static methods here off.
     * base level should be a consistent finder API
     * additional static methods can be provided in the model
     * via a manager. OR put those in a CONTROLLER
     * instance methods and variables get attached above in create
     * based on the model definition.js file
     */
    var self = {
        save:function(obj,cb){
            var save_data = {};
            for (var prop in obj){
                if (obj.hasOwnProperty(prop)){
                    if ((typeof(obj[prop]) !== 'function')
                        && (typeof(obj[prop]) !== 'object')){ // for now
                        console.log("can save: " + prop);
                        save_data[prop] = obj[prop];
                    }
                }
            }
            obj.node._data.data = save_data;
            neo.save(obj,cb);
        },
        create:function(data,cb){
            neo.create(data,thing.index,thing.category,function(e,node){
                if (e || !node){
                    return cb(null);
                }
                var ret = creator(node,thing.methods);
                cb(ret);
            });
        },
	findBy:function(key,options,cb){
	    finder.findAll(key,options,function(e,nodes){
		    var results = [];
		    nodes.forEach(function(node){
			    results.push(creator(node,thing.methods));
			});
		    cb(e,results);
		});
	},
	findAll:function(options,cb){
	    finder.findAll(thing.category,options,function(e,nodes){
		    var results = [];
		    nodes.forEach(function(node){
			    results.push(creator(node,thing.methods));
			});
		    cb(e,results);
		});
	},
        find:function(name,index, cb){
            try {
                if (typeof(index) == 'function'){
                    cb = index;
                    index = undefined;
                }
                finder.find(index || thing.index,name,thing.category,function(e,node){
                    if (e || !node){
                        return cb(null);
                    }
                    cb(creator(node,thing.methods));
                });
            } catch(e){
                console.log('[base] find error: ');
                console.log(e);
                cb(e,null);
            }
        }
    };
    if (thing.static){
	Object.keys(thing.static).forEach(function(s){
		self[s] = thing.static[s];
	    });
    }
    return self;
}

module.exports = model;
