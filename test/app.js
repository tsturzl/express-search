var express=require('express');
var search=require('../express-search.js');
var request = require('supertest');
var expect = require('chai').expect;
var app=express();

var configs={
    'host':'localhost:9200'
};

search.connect(configs);

var map={
    index:'test',
    type:'test',
    tags:['tags'],
    mentions:['author'],
    fields:['title','body'],
    project:['*'],
    pageSize:10,
    sort:'asc',
    sortBy:'sort'
};

app.use('/api/search',search.setup(map));

app.listen(3000);

describe('GET /api/search',function(){
    var agent=request.agent(app);
    it('should respond with json',function(done){
        agent
            .get('/api/search?q=test')
            .expect('Content-Type',/json/)
            .expect(200,done)
    });
    it('should have proper paging',function(done){
        agent
            .get('/api/search?q=test')
            .set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(200)
            .end(function(err,res){
                if(err) return done(err);
                var body=res.body;
                expect(body.ok).to.equal(true);
                expect(body.results).to.have.length(3);
                expect(body.pager.page).to.equal(0);
                expect(body.pager.pageSize).to.equal(10);
                expect(body.pager.count).to.equal(3);
                done()
            });
    });
    it('should have proper sorting',function(done){
        agent
            .get('/api/search?q=test')
            .set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(200)
            .end(function(err,res){
                if(err) return done(err);
                var body=res.body;
                expect(body.ok).to.equal(true);
                expect(body).to.have.property('results');
                expect(body.results).to.have.length(3);

                for(var i= 0,len=body.results.length; i<len; i++){
                    expect(body.results[i].sort).to.equal(i+1);
                }

                done();
            });
    });
    it('should search phrase',function(done){
        agent
            .get('/api/search?q="Test 2"')
            .set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(200)
            .end(function(err,res){
                if(err) return done(err);
                var body=res.body;
                expect(body.ok).to.equal(true);
                expect(body).to.have.property('results');
                expect(body.results).to.have.length(1);

                expect(body.results[0].title).to.equal("Test 2");

                done();
            });
    });
    it('should search tag',function(done){
        agent
            .get('/api/search?q=%23apples')
            .set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(200)
            .end(function(err,res){
                if(err) return done(err);
                var body=res.body;
                console.log('BODY: ', body);
                expect(body.ok).to.equal(true);
                expect(body).to.have.property('results');
                expect(body.results).to.have.length(1);
                expect(body.results[0].title).to.equal("Test 1");

                done();
            });
    });
    it('should search mention',function(done){
        agent
            .get('/api/search?q=@Katie')
            .set('Accept','application/json')
            .expect('Content-Type',/json/)
            .expect(200)
            .end(function(err,res){
                if(err) return done(err);
                var body=res.body;
                expect(body.ok).to.equal(true);
                expect(body).to.have.property('results');
                expect(body.results).to.have.length(1);

                expect(body.results[0].title).to.equal("Test 3");

                done();
            });
    });
});