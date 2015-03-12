#!/bin/bash

# This script is run in the following situations:
# * The domain is new, and data repo is still empty
# * The domain was switched from a different application
# * The domain was reset to initial settings by deleting all its data

ADMIN_PASSWORD=`pwgen 40 1`
URL=https://`hostname`/

# Make sure to set these environment variables in your config.js.
# Because of https://github.com/jpetazzo/nsenter/issues/62 I tend to
# avoid spaces in these:

echo url: $URL
echo title: $TITLE
echo admin user: $ADMIN_USER
echo admin password: $ADMIN_PASSWORD
echo admin email: $ADMIN_EMAIL

echo Unpacking latest WordPress into /data/www-content...
php /root/wp-cli.phar --path="/data/www-content" --allow-root core download
php /root/wp-cli.phar --path="/data/www-content" --allow-root core config --dbname=wordpress --dbuser=root
php /root/wp-cli.phar --path="/data/www-content" --allow-root db create

php /root/wp-cli.phar --path="/data/www-content" --allow-root core install \
	--url="$URL" --title="$TITLE" --admin_user="$ADMIN_USER" --admin_password="$ADMIN_PASSWORD" --admin_email="$ADMIN_EMAIL"
echo "define(\"FS_METHOD\",\"direct\");" >> /data/www-content/wp-config.php
echo "define(\"FS_CHMOD_DIR\", \"0777\");" >> /data/www-content/wp-config.php
echo "define(\"FS_CHMOD_FILE\", \"0777\");" >> /data/www-content/wp-config.php

#TODO: Debug if/why this is necessary:
php /root/wp-cli.phar --path="/data/www-content" --allow-root user update $ADMIN_USER --user_pass="$ADMIN_PASSWORD" 

echo Installing the IndieWeb plugins...
php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin delete akismet
php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin delete hello

php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin install wordpress-https
php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin activate wordpress-https

php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin install indieauth
php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin activate indieauth

php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin install semantic-linkbacks
php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin activate semantic-linkbacks

php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin install webmention
php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin activate webmention

php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin install hum
php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin activate hum

php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin install https://github.com/pfefferle/wordpress-indieweb-press-this/archive/master.zip
php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin activate wordpress-indieweb-press-this-master

php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin install https://github.com/dshanske/indieweb-taxonomy/archive/master.zip
php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin activate indieweb-taxonomy-master

php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin install https://github.com/pfefferle/wordpress-webactions/archive/master.zip
php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin activate wordpress-webactions-master

php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin install https://github.com/pfefferle/wordpress-webmention-for-comments/archive/master.zip
php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin activate wordpress-webmention-for-comments-master

php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin install indieweb
php /root/wp-cli.phar --path="/data/www-content" --allow-root plugin activate indieweb

php /root/wp-cli.phar --path="/data/www-content" --allow-root theme install sempress
php /root/wp-cli.phar --path="/data/www-content" --allow-root theme activate sempress

php /root/wp-cli.phar --path="/data/www-content" --allow-root theme install wpsupercache
php /root/wp-cli.phar --path="/data/www-content" --allow-root theme activate wpsupercache

echo Making some WordPress folders writable for the webserver...
touch /data/www-content/.htaccess
chown -R root:www-data /data/www-content
chmod 770 /data/www-content/.htaccess
chmod -R 770 /data/www-content/wp-content
chmod -R 770 /data/www-content/wp-includes
chmod -R 770 /data/www-content/wp-admin

echo "user: $ADMIN_USER" > /data/login.txt
echo "pass: $ADMIN_PASSWORD" >> /data/login.txt
echo "Done, login details saved to /data/login.txt"
