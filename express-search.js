var QueryDSL = require('./src/queryDSL.js'),
    elasticsearch = require('elasticsearch');


//search constructor
var search = {};

/*    Query String parser     */

//define these regexps ahead of time for reuse
var regexp = /"[^"]*"/g;
var _replace = /@|#|"/g;
var mentionReg = /(^|\W)@\w+/g;
var tagReg = /(^|\W)#\w+/g;

//parse a queryString
function queryString(qs) {
    "use strict";
    //phrase filtering
    var matches = _filter(qs, qs.match(regexp));
    qs = matches.qs;
    matches = matches.match;

    //"@" tag filtering
    var mentions = _filter(qs, qs.match(mentionReg));
    qs = mentions.qs;
    mentions = mentions.match;

    //"#" tag filtering
    var tags = _filter(qs, qs.match(tagReg));
    qs = tags.qs;
    tags = tags.match;

    var debug={
        text: qs, //String of search text
        phrases: matches, //Array of phrases
        tags: tags,
        mentions: mentions
    };
    console.log(debug);
    return debug;
}

//regex filter
function _filter(qs, arr) {
    "use strict";
    if(arr) {
        var len = arr.length;
        for (var i = 0; i < len; i++) {
            qs = qs.replace(arr[i], '');
            arr[i] = arr[i].trim().replace(_replace, '');
        }
    }
    return {
        qs:qs,
        match:arr
    };
}

//Route factory
search.routeFactory = function (config, cb) {
    "use strict";

    //pass client to queryDSL
    config.client=search.client;

    //construct queryDSL
    var dsl = new QueryDSL(config);

    //parse query string
    var qs = queryString(config.qs);

    dsl
        .page(config.page)              //Which page to query
        .project(config.projection);    //project fields(source filtering)

    //sorting
    if (config.sort) {
        dsl
            .sort(config.sort)  //sort order ('asc' or 'desc')
            .by(config.sortBy); //field to sort by
    }

    //build query
    dsl
        .must()                     //results must match
        .match(config.fields)       //this field
            .phrase(qs.phrases)     //with this phrase
        .should()
        .match(config.fields)
            .text(qs.text)
        .must()
        .match(config.mentions)
            .phrase(qs.mentions)
        .must()
        .match(config.tags)
            .text(qs.tags);

    //run query and callback results `cb(err,results)`
    dsl.exec(cb);
};

//configure a route to be searchable
/* config ex:
 {
 index: String,
 type: String,
 tags: Array,
 mentions: Array,
 fields: Array,
 projection: Array
 //these are added from query params
 page: Number,
 qs: String,
 //can be provided or overwritten by query param
 pageSize: Number,
 sort: String,
 sortBy: String
 }
 */
search.setup=function (config) {
    "use strict";
    var me = this;

    //return function which can be routed
    return function (req, res, next) {
        if (req.method === 'GET') {
            //make sure these are numbers
            config.page = req.query.page ? Number(req.query.page) : 0;
            config.pageSize = req.query.pageSize ? Number(req.query.pageSize) : config.pageSize;

            //setup sort config
            config.sort = req.query.sort || config.sort;
            config.sortBy = req.query.sortBy || config.sortBy;

            //get queryString
            config.qs = req.query.q;

            //make sure queryString was provided
            if (!config.qs) {
                res.json({ok: 0, error: "Missing queryString(qs)!", _debug: config});
            }
            else {
                me.routeFactory(config, function (err, results) {
                    if (err) {
                        res.json({ok: false, error: err.message});
                    }
                    else {
                        res.json({
                            ok: true,
                            results: results,
                            pager: {
                                page: config.page,
                                pageSize: config.pageSize,
                                count: results.length
                            }
                        });
                    }
                    if (next) {
                        next();
                    }
                });
            }
        }
        else{
            res.send("Cannot " + req.method + " " + req.originalUrl + "\n");
            next();
        }
    };
};

var _export = function(){};

_export.prototype.connect=function(config) {
    "use strict";
    search.client = new elasticsearch.Client(config);

    this.setup = function(conf) {
        return search.setup(conf);
    };
};


module.exports = new _export();