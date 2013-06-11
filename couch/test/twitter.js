require('../lib');
exports['twitter_friends'] = function(test){
    Couch.models.person.find("ponorich",function(p){
            console.log("found: " + p.name);
            p.queued(function(q){
                    console.log(q);
                        p.network_suggest(function(f){
                                console.log(f);
                                test.done();
                            });
                    });

                });
};