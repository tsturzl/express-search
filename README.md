[![Build Status](https://travis-ci.org/tsturzl/express-search.svg)](https://travis-ci.org/tsturzl/express-search) [![Code Climate](https://codeclimate.com/github/tsturzl/express-search/badges/gpa.svg)](https://codeclimate.com/github/tsturzl/express-search)
express-search
==============

A beautifully bootstrapped elasticsearch search middleware for express v4.x.

Allows you to do searches like `Pictures of "Cute Puppies"`
Or
`Recipies by @MarthaStewart`

For example, if you want searches that _MUST_ contain the phrase "Puppies" and you'd prefer them to be wearing hats:
`"Puppies" wearing hats` would return results containing documents that contain "puppies", and try to find documents where the puppies are wearing hats.

If you want to find a person/place you can use mention style tags:
`@hansolo` will return documents where hansolo is mentioned

If you want to search only documents with certain tags you can use hash tags in your search:
`#music top 10` will return documents with the tag "music, and look for a "top 10" document

 You can string them together to make concise yet powerful searches:
 `#music by @paulsimmon "You Can Call Me Al"` Will try to find documents tagged "music", where "paulsimmon" is mentioned, and the phrase "You Can Call Me Al" is found.

 Setup
 -----

 Set up is super simple. You just have to:

  - Provide connection settings for ElasticSearch.
  - Set Index and Type to search.
  - Configure pagination(default page size).
  - Configure Fields to search
    - Fields for general search
    - Fields for tag serach
    - Fields for mentions
  - Fields to return
  - Configure default sorting(optional)
    - Field to sort by
    - Sort order(ascending/descending)

Setup connection settings:

```
var expressSearch=require('express-search');
var express=require('express');

var app=express();

var config={
    'hosts':['localhost:9200']
    //'log':'trace' //handy for debugging
}

var search=new expressSearch(app,configs);
```

Now you can use the expressSearch object to create multiple routes:

```
var mySearch={
   index: "myIndex",
   type: "someType",
   tags: ['tags','twitter.tags'], //fields for tag search
   mentions: ['authors','editors'], //fields for mention search
   fields: ['title','description'], //fields for general search
   projection: ['title','description','authors','editors','tags], //fields to return in results
   pageSize: 10, //default page size
   sort: 'desc',
   sortBy: 'createDate'
};

search.setup('/api/search',mySearch);
```

Now to use it:

```
curl http://localhost/api/search?q=music
```

You can use the expressSearch object to setup as many search endpoints are you desire.

_NOTE:_ Sails users should use `sails.hooks.http.app` to refer to hook the app object.

##Using the end point

There are several parameters you can pass via query string:
 - q (String)
   - the text to search(including mentions/tags/phrases)
 - page(Number)
   - page number starting from 0
 - pageSize(Number)
   - Overwrite default page size
 - sort(String)
   - Either "asc" or "desc"
   - Overwrites default
 - sortBy(String)
   - Set field to sort by
   - Overwrites default