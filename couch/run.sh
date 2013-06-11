#!/bin/bash

while [ 1 ] ; do 
    node lib/web/app.js > APP.log
    sleep 1;
done;