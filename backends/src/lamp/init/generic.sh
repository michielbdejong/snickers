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

for i in `seq 1 10`; do
    DB_CONNECTABLE=$(mysql -e 'status' >/dev/null 2>&1; echo "$?");
    echo "Waiting for database server... $DB_CONNECTABLE";
    if [ $DB_CONNECTABLE -eq 0 ]; then
        break;
    fi
    sleep 1
done

if [ -f /data/dump.sql ];
    mysql < /data/dump.sql
    echo FLUSH PRIVILEGES | mysql
else
    mkdir -p /data;
    mysqldump --all-databases > /data/dump.sql
fi
