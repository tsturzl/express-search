/*  ElasticSearch Query Builder
 * Build clean queries with a concise
 * queryBuilder pipeline.
 *
 * ex.
 * var dsl=new queryBuilder(client,'redef','users',30); //pass elasticSearch Client, index name, type name, and pageSize(default 10)
 * var query=dsl
 *    .page(0) //get first page of 30 results
 *    .must() //The following must be true
 *     .match("myField.name").text("Marcus Smith") //search full text search
 *     .match("myField.company").phrase("Redef Media") //search full text for phrase
 *     .match("myField.age").exact(20) //filter for exact
 *    .should() //at least one of the following should be true
 *     .match("myField.job").text("tech")
 *     .match("myField.job").text("developer")
 *    .exec(function(err,results){
 *       if(err){
 *         throw err;
 *       }
 *       else{
 *         console.log(results);
 *       }
 *    });
 */

//~Constructor
var queryBuilder=function(client,index,type,pageSize){
    this.pageSize=pageSize || 10;
    this.client=client;
    this.index=index;
    this.type=type;

    //query template
    this.query={
        from: 0,
        size: this.pageSize,
        query:{
            bool:{
                must:[],
                should:[],
                minimum_should_match:1,
                boost:1.0
            }
        }
    };
};


//reusable chaining method for building dsl chain
function _chain(me,method){
    return {
        //chain match to set field
        match:function(field) {

            //sub-chain
            var methods = {

                //exact match
                exact: function (value) {
                    me.query.query.bool[method]=me.query.query.bool[method].concat(
                        me.exact(field, value)
                    );
                    return _chain(me,method);
                },

                //text match
                text: function (text) {
                    me.query.query.bool[method]=me.query.query.bool[method].concat(
                        me.text(field, text)
                    );
                    return _chain(me,method);
                },

                //phrase match
                phrase: function (phrase) {
                    me.query.query.bool[method]=me.query.query.bool[method].concat(
                        me.phrase(field, phrase)
                    );
                    return _chain(me,method);
                }

            };

            return methods;
        },
        should:me.should,
        must:me.must,
        exec:function(){
            return me.exec();
        }
    };
}

//Pager, calculates size/from from pageSize/pageNum
queryBuilder.prototype.page=function(pageNum){
    this.query.from = pageNum===0 ? 0 : pageNum*this.pageSize;
    return this;
};

//Field projection, provide array of fields you'd like in your results
queryBuilder.prototype.project=function(fields){
    this.query._source=fields;
    return this;
};

//Sort by field either ascending or descending
queryBuilder.prototype.sort=function(order){
    order=order ? order : 'desc';
    var me=this;
    return {
        by:function(field){

            var sortObj={};

            //create sort object
            sortObj[field]={
                order: order
            };

            //set sorting
            me.query.sort=[sortObj];
            return me;
        }
    }
};

/**     Occurance Type      **/

//Result MUST match this query, and all other MUST queries [this function is a chain method]
queryBuilder.prototype.must=function(){
    return _chain(this,'must'); //build dsl chain
};

//Result SHOULD match at least one of these queries [this funtion is a chain method]
queryBuilder.prototype.should=function(){
    return _chain(this,'should'); //build dsl chain
};


/**     Query Method      **/

//Query for fields with this exact value
queryBuilder.prototype.exact=function(field,value){
    var terms=[];

    //build term and push to array
    function addTerm(field,values){
        //add "terms" query
        var obj={
            terms:{
                minimum_should_match:1
            }
        };
        obj.terms[field]=values;
        terms.push(obj);
    }

    //convert to an arrays to simplify logic
    value=[].concat(value);
    field=[].concat(field);

    //for each field add a term
    for(var i= 0,len=field.length; i<len; i++){
        addTerm(field[i],value);
    }
    return terms;
};

//Query for fields with this phrase
queryBuilder.prototype.phrase=function(field,phrase){

    //convert to an array to simplify logic
    field=[].concat(field);

    if(typeof phrase === 'object'){
        var queries=[];

        for(var i= 0, len=phrase.length; i<len; i++){
            queries.push({
                multi_match:{
                    query:phrase[i],
                    fields:field,
                    type:'phrase'
                }
            });
        }

        return queries;
    }
    else{
        return {
            multi_match:{
                query:phrase,
                fields:field,
                type:'phrase'
            }
        };
    }
};

//Query for fields containing this text
queryBuilder.prototype.text=function(field,text){
    if(typeof text === 'object'){
        text=text.join(' ');
    }

    //convert to an array to simplify logic
    field=[].concat(field);

    return {
        multi_match:{
            query:text,
            fields:field
        }
    };
};


//Execute Query
queryBuilder.prototype.exec=function(cb){
    var me=this;
    this.client.search({
        index:this.index,
        type:this.type,
        body:this.build()
    },function(err,results){
        if(err){
            cb(err);
        }
        else{
            var response=[];
            var hits=results.hits.hits;
            for(var i= 0,len=hits.length; i<len; i++){
                response.push(hits[i]._source);
            }
            cb(null,response);
        }
    });
};


//Method to build query. Not needed yet, but useful for expansion. Useful for testing/debugging
queryBuilder.prototype.build=function(){
    if(this.query.query.bool.must.length===0){
        delete this.query.query.bool.must;
    }
    if(this.query.query.bool.should.length===0){
        delete this.query.query.bool.should;
    }
    return this.query;
};

//Standard methods
queryBuilder.prototype.toString=function(){return JSON.stringify(this.build())};
queryBuilder.prototype.toJSON=function(){return this.toString()};
queryBuilder.prototype.toObject=function(){return this.build()};

module.exports=queryBuilder;
