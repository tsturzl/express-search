var queryBuilder=require('../src/queryDSL.js');
var expect = require('chai').expect;
var should = require('chai').should();

describe("Query Builder",function(){

    var pageSize=10;

    var dsl=new queryBuilder({
        client: null,
        index: 'test',
        type: 'test',
        pageSize: pageSize
    });

    //pagination component
    describe("#page()",function(){
        it('should query for page 0, with proper pageSize',function() {
            dsl.page(0);
            expect(dsl.query.from).to.equal(0);
            expect(dsl.query.size).to.equal(pageSize);
        });
        it('should query for page 1, with proper pageSize',function() {
            dsl.page(1);
            expect(dsl.query.from).to.equal(10);
            expect(dsl.query.size).to.equal(pageSize);
        });
    });

    //field projection
    describe('#project()',function(){
        var fields=['i.want','these','fields'];
        dsl.project(fields);
        it("Should have field projection in query object",function(){
            expect(dsl.query._source).to.include('i.want');
            expect(dsl.query._source).to.include('these');
            expect(dsl.query._source).to.include('fields');
        });
    });

    //sorting
    describe("#sort().by()",function(){
        it("should specify sort descending by date",function() {
            dsl
                .sort('desc')
                .by('date');
            expect(dsl.query.sort[0].date).to.exist;
            expect(dsl.query.sort[0].date.order).to.equal('desc');
        });
        it("should specify sort ascending by date",function() {
            dsl
                .sort('asc')
                .by('date');
            expect(dsl.query.sort[0].date).to.exist;
            expect(dsl.query.sort[0].date.order).to.equal('asc');
        });
    });

    //bool must, exact(term) matching
    describe('#must().match().exact()',function(){
        dsl
            .must()
            .match('exactTest')
            .exact('exactTest');
        it("should have a must match exact term query in the bool query object",function(done){
            expect(dsl.query.query.bool.must[0].terms.exactTest).to.include.members([ 'exactTest' ]);
            done();
        });
    });

    //bool must, phrase matching
    describe("#must().match().phrase()",function(){
        dsl
            .must()
            .match('mustTest')
            .phrase('mustTest');
        it('should have a must match phrase query in the bool query object',function(done) {
            expect(dsl.query.query.bool.must[1].multi_match.query).to.equal('mustTest');
            expect(dsl.query.query.bool.must[1].multi_match.fields[0]).to.equal('mustTest');
            expect(dsl.query.query.bool.must[1].multi_match.type).to.equal('phrase');
            done();
        });
    });

    //should match full-text
    describe('#should().match().text()',function(){
        dsl
            .should()
            .match('shouldTest')
            .text('shouldTest');
        it('should have have a should match text query in bool query object',function() {
            expect(dsl.query.query.bool.should[0].multi_match.query).to.equal('shouldTest');
            expect(dsl.query.query.bool.should[0].multi_match.fields[0]).to.equal('shouldTest');
        });
    });

    describe('#build()',function(){
        var query=dsl.build();
        it('should build proper query',function() {
            query.from.should.equal(10);
            query.size.should.equal(pageSize);
            query.should.have.property('query');
            query.query.should.have.property('bool');
            query.query.bool.minimum_should_match.should.equal(1);
            query.query.bool.boost.should.equal(1.0);
            expect(query.query.bool).to.have.property('must').with.length(2);
            expect(query.query.bool).to.have.property('should').with.length(1);
            var must = query.query.bool.must[1];
            var exact = query.query.bool.must[0];
            var should = query.query.bool.should[0];

            must.multi_match.query.should.equal('mustTest');
            must.multi_match.fields[0].should.equal('mustTest');
            must.multi_match.type.should.equal('phrase');

            exact.terms.should.have.property('exactTest');
            expect(exact.terms.exactTest).to.include.members(['exactTest']);

            should.multi_match.query.should.equal('shouldTest');
            should.multi_match.fields[0].should.equal('shouldTest');
        });
    });
});
