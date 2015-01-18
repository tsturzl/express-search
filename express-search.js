var queryDSL=require('./src/queryDSL.js');
var elasticsearch=require('elasticsearch');

var search=function(app,config){
   this.app=app;
   this.client=new elasticsearch.Client(config);
};

/*    Query String parser     */

//define these regexps ahead of time for reuse
var regexp = /"[^"]*"/g;
var _replace = /"/g;
var mentionReg = /(^|\W)@\w+/g;
var tagReg = /(^|\W)@\w+/g;

//parse a queryString
function queryString(qs){

   //resuable iterator and length cache
   var i,len;

   //phrase filtering
   var matches=qs.match(regexp);
   if(matches){
      len=matches.length;
      for(i= 0; i<len; i++){
         qs.replace(matches[i],''); //remove phrase from original queryString
         matches[i]=matches[i].replace(_replace, ''); //clean each match
      }
   }
   else{
      matches=null;
   }

   //"@" tag filtering
   var mentions=qs.match(mentionReg);
   if(mentions){
      len=mentions.length;
      for(i= 0; i<len; i++){
         mentions[i]=mentions[i].trim().replace('@','');
      }
   }
   else{
      mentions=null;
   }

   //"#" tag filtering
   var tags=qs.match(tagReg);
   if(tags){
      len=tags.length;
      for(i= 0; i<len; i++){
         tags[i]=tags[i].trim().replace('#','');
      }
   }
   else{
      tags=null;
   }

   return {
      text:qs, //String of search text
      phrases:matches, //Array of phrases
      tags:tags,
      mentions:mentions
   };
}

//Route factory
search.prototype.routeFactory=function(config,cb){
   var dsl=new queryDSL(this.client,config.index,config.type,config.pageSize);

   var qs=queryString(config.qs);

   dsl
       .page(config.page)
       .project(config.projection);

   if(config.sort){
      dsl
          .sort(config.sort || 'desc')
          .by(config.sortBy);
   }

   if(qs.phrases){
      dsl
          .must()
          .match(config.fields).phrase(qs.phrases);
   }

   if(qs.text){
      dsl
          .should()
          .match(config.fields).text(config.text);
   }

   if(qs.mentions && config.mentions){
      dsl
          .must()
          .match(config.mentions).phrase(qs.mentions);
   }

   if(qs.tags && config.tags){
      dsl
          .must()
          .match(config.tags).phrase(qs.tags)
   }
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
   pageSize: Number,
   qs: String,
   //can be provided or overwritten by query param
   sort: String,
   sortBy: String
}
 */
search.prototype.configRoute=function(route,config){
   var me=this;
   this.app.get(route,function(req,res){

      //make sure these are numbers
      config.page=req.params.page ? Number(req.params.page) : 0;
      config.pageSize=req.params.pageSize ? Number(req.params.pageSize) : 10;

      //setup sort config
      config.sort=req.params.sort ? req.params.sort : config.sort;
      config.sortBy=req.params.sortBy ? req.params.sortBy : config.sortBy;

      //get queryString
      config.qs=req.params.qs || null;

      //make sure queryString was provided
      if(!config.qs){
         res.json({ok:0, error:"Missing queryString(qs)!",_debug:config});
      }
      else {
         me.routeFactory(config, function (err, resp) {
            if (err) {
               res.json({ok: 0, error: err, _debug: config});
            }
            else {

            }
         });
      }
   });
};