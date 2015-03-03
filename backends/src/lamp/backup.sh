#!/bin/bash

mkdir -p /data
cd /data
mysqldump --all-databases > dump.sql
git config --local user.email "backup@IndieHosters"
git config --local user.name "IndieHosters backup"
git add *
git commit -am"backup `date`"
git status
