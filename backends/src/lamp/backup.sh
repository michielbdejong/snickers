#!/bin/bash

mkdir -p /data
cd /data
mysqldump --all-databases > dump.sql
git add *
git commit -am"backup `date`"
git status
date
