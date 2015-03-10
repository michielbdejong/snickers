#!/bin/bash

echo CREATE DATABASE trovebox | mysql

tar -zxvf openphoto.tar.gz > /dev/null 2>&1
mv photo-frontend-*/* /data/www-content
mkdir /data/www-content/src/userdata
chown www-data:www-data /data/www-content/src/userdata
mkdir /data/www-content/src/html/assets/cache 
chown www-data:www-data /data/www-content/src/html/assets/cache
mkdir /data/www-content/src/html/photos
chown www-data:www-data /data/www-content/src/html/photos
cp config.ini `/data/www-content/src/userdata/configs/`hostname`.ini
sed -i "s/##SECRET##/`pwgen 40 1`/g" "s/##EMAIL##/$ADMIN_EMAIL/g" /data/www-content/src/userdata/configs/`hostname`.ini
