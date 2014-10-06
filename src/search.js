
var _search=function(elasticSearch,index,type,fields){
    this.elasticSearch=elasticSearch;
    this.index=index;
    this.type=type;
    this.fields=fields;
};

_search.prototype.search=function(q,sort,order,limit,page,cb){
    //get 'from' cursor based on size and page #
    var from=page*limit;

    //create query object
    var query={
        filtered:{}
    };

    /*  ---Build Query---   */

    //query string/text
    if(q){
        query.filtered.query={
            multi_match:{
                query:q,
                fields:this.fields
            }
        }
    }

    //sort and order
    if(sort){
        query.sort=[
            {sort:order}
        ];
    }

    //set pagination params
    query.size=limit;
    query.from=from;

    //DEBUG STUFF
    console.log('QUERY: ',query);

    //do search
    this.elasticSearch.search({
        index:this.index,
        type:this.type,
        body:{
            query:query
        }
    }).then(
        function(resp){
            cb(resp);
        },
        function(err){
            console.trace(err);
            cb(err);
        }
    );
};


_search.property.insert=function(id,doc,cb){
    this.elasticSearch.create({
        index:this.index,
        type:this.type,
        id:id,
        body:doc
    });
};
