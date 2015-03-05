#!/bin/bash

echo "Extracting Known..."
cd /data/www-content
tar xzf /known.tgz
mv Known-0.7.5/* .
mv Known-0.7.5/.* .
rmdir Known-0.7.5

echo "Setting default config..."
cp /config.ini .

echo "Creating uploads folder.."
mkdir -p /data/uploads
chown -R root:www-data /data/uploads
chmod -R 770 /data/uploads

echo "Creating initial database..."
echo "CREATE DATABASE IF NOT EXISTS known" | mysql
mysql known < /data/www-content/schemas/mysql/mysql.sql
mysqldump --all-databases > /data/dump.sql

mv /data/www-content/htaccess.dist /data/www-content/.htaccess

PWD=`pwgen 40 1`
echo "user: " > /data/login.txt
echo "pass: $PWD" >> /data/login.txt
echo "Please use your browser to set up a user, and edit /data/login.txt manually:"
cat /data/login.txt
