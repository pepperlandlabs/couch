#!/bin/bash

while [ 1 ] ; do 
    node /tmp/foo.js &
    sleep 10
    kill %1
done
