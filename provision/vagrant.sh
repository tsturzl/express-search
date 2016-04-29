#!/bin/bash

curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -

apt-get install -y nodejs openjdk-7-jre-headless

npm install -g mocha

wget https://download.elastic.co/elasticsearch/release/org/elasticsearch/distribution/deb/elasticsearch/2.3.2/elasticsearch-2.3.2.deb

dpkg -i elasticsearch-2.3.2.deb

service elasticsearch start

update-rc.d elasticsearch defaults