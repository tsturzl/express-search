var express = require('express');
var bodyParser = require('body-parser');

var app=express();

console.log("Express started!");

//body parser is REQUIRED
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


//setup search
var search=require('./express-search.js')({
    hosts:['localhost:9200'],
    index:"searchjs",
    type:"test",
    fields:'description' //can be string or array
});

search.hook(app);

app.listen(3000); //listen on 3000