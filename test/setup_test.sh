#!/bin/bash
set -ev

curl -XPUT 127.0.0.1:9200/test/test/1 -d '
{
    "title":"Test 1",
    "body":"This is a test, test 1 to be exact",
    "tags":["fruit","apples","oranges","bananas"],
    "author":"Mike",
    "sort":1
}
'

curl -XPUT 127.0.0.1:9200/test/test/2 -d '
{
    "title":"Test 2",
    "body":"This is a test, test 2 to be exact",
    "tags":["animals","cats","dogs","horses"],
    "author":"Joe",
    "sort":2
}
'

curl -XPUT 127.0.0.1:9200/test/test/3 -d '
{
    "title":"Test 3",
    "body":"This is a test, test 3 to be exact",
    "tags":["music","hiphop","rock","pop"],
    "author":"Katie",
    "sort":3
}
'