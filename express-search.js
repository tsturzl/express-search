var elasticsearch=require('elasticsearch');
var _search=require('./src/search.js');

var search=function(options,done){

    //check for and set index and type
    if(options.hasOwnProperty('elasticSearch') && options.elasticSearch.index && options.elasticSearch.type){
        this.index=options.elasticSearch.index;
        this.type=options.elasticSearch.type;
    }
    else{
        done('Check your express-search configs! No index and/or type!');
        return;
    }

    //check for and set host or official es client
    if(options.elasticSearch.hasOwnProperty('hosts')){
        this.elasticSearch=new elasticsearch.Client({
            hosts:options.elasticSearch.hosts,
            log:'trace'
        });
    }
    else if(options.elasticSearch.hasOwnProperty(client)){
        this.elasticSearch=options.elasticSearch.client;
    }
    else{
        done("No elasticSearch client/connection provided!");
    }

    //check for and set search fields
    if(options.elasticSearch.hasOwnProperty('fields')){
        this.fields=[].concat(options.elasticSearch.fields);
    }
    else{
        done("No search field/s provided");
        return;
    }

    //create search object
    this.search=new _search(this.elasticSearch,this.index,this.type,this.fields);

    done(null,this);
};

//Hook default routes
search.prototype.hook=function(app){
    //body-parser? TODO
    app.get('/search',this.get);
    app.post('/search',this.post);
};

//TODO: Implement the ability to load as middleware.
search.prototype.middleware=function(req,res,next){};

//GET to search
search.prototype.get=function(req,res){
    try {
        //send params to search module
        this.search.search(
            req.param('q', null),        //query string or query text (string)
            req.param('sort', null),     //sort field (string)
            req.param('order', 'asc'),   //order (string) either 'asc' or 'desc'
            req.param('limit', 10),      //limit (int)
            req.param('page', 1),        //page (int)
            function (err, resp) {         //callback and respond
                if (err) {
                    res.json({
                        success:false,
                        message:"Search Failed!",
                        error: err
                    });
                }
                else {
                    res.json(resp);
                }
            }
        )
    }
    catch(e){
        res.json({
            success:false,
            message:"Search Failed! Invalid parameters!",
            error:e
        });
    }
};

//POST to insert document
search.prototype.post=function(req,res){
    this.insert(
        res.param('body',null),
        res.param('id',Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10)), //if no id use random string
        function(err,resp){
            if(err){
                res.json({
                    success:false,
                    message:"Insert Failed!",
                    error: err
                });
            }
            else{
                res.json(resp);
            }
        }
    )
};

//Insert document(alias)
search.prototype.insert=function(id,doc,cb){
    try{
        this.search.insert(id,doc,cb);
    }
    catch(e){
        res.json({
            success:false,
            message:"Insert failed! Invalid parameters",
            error:e
        });
    }
};

//export function to init express-search
module.exports=function(options,cb){
    //initialize search object async'ly
    new search(options,function(err,obj){
        if(err){
            cb(err);
        }
        else{
            cb(null,obj);
        }
    });
};