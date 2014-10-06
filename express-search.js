var elasticsearch=require('elasticsearch');
var _search=require('./src/search.js');

var search=function(options){

    //check for and set index and type
    if(options.hasOwnProperty('index') && options.hasOwnProperty('type')){
        this.index=options.index;
        this.type=options.type;
    }
    else{
        throw 'Check your express-search configs! No index and/or type!';
    }

    //check for and set host or official es client
    if(options.hasOwnProperty('hosts')){
        this.elasticSearch=new elasticsearch.Client({
            hosts:options.hosts,
            log:'trace'
        });
    }
    else if(options.hasOwnProperty('client')){
        this.elasticSearch=options.client;
    }
    else{
        throw "No elasticSearch client/connection provided!";
    }

    //check for and set search fields
    if(options.hasOwnProperty('fields')){
        this.fields=[].concat(options.fields);
    }
    else{
        throw "No search field/s provided";
        return;
    }

    //create search object
    this.search=new _search(this.elasticSearch,this.index,this.type,this.fields);
};

//Hook default routes
search.prototype.hook=function(app){
    //body-parser? TODO
    var me=this;
    app.get('/search',function(req,res){
        me.get(req,res);
    });
    app.put('/search',function(req,res){
        if(!res){
            console.log("WTF");
        }
        me.put(req,res);
    });
    console.log("HOOKED");
};

//TODO: Implement the ability to load as middleware.
search.prototype.middleware=function(req,res,next){};

//GET to search
search.prototype.get=function(req,res){
    if (!req.body) return res.sendStatus(400);
    try {
        //send params to search module
        this.search.search(
            req.param('q', null),        //query string or query text (string)
            req.param('sort', null),     //sort field (string)
            req.param('order', 'asc'),   //order (string) either 'asc' or 'desc'
            req.param('limit', 10),      //limit (int)
            req.param('page', 0),        //page (int)
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

//create document(alias)
search.create=function(me,id,doc,cb){
    try{
        me.search.create(id,doc,cb);
    }
    catch(e){
        cb(e);
    }
};

//PUT to create document
search.prototype.put=function(req,res){
    if (!req.body) return res.sendStatus(400);
    //try {
    var body=req.body;
    search.create(
        this,
        body.id,
        body,
        function (err, resp) {
            if (err) {
                res.json({
                    success: false,
                    message: "Insert Failed!",
                    error: err
                });
            }
            else {
                res.json(resp);
            }
        }
    );
    /*}
     catch(e){
     res.json({
     success:false,
     message:"Create Failed! Invalid parameters!",
     error:e
     });
     }*/
};

//export function to init express-search
module.exports=function(options){
    //initialize search object async'ly
    return new search(options);
};