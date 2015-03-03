#!/bin/bash

mkdir -p /data/uploads
mkdir -p /data/www-content
touch /data/www-content/.htaccess
touch /data/dump.sql

chown -R root:www-data /data
chmod -R 770 /data/uploads
chmod -R 750 /data/www-content

cd /data
git init
git config --local user.email "backup@IndieHosters"
git config --local user.name "IndieHosters backup"

if [ -f /data/dump.sql ]; then
    mysql < /data/dump.sql
    echo FLUSH PRIVILEGES | mysql
else
    mkdir -p /data;
    mysqldump --all-databases > /data/dump.sql
fi
