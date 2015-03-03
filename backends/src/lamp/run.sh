#!/bin/bash

exec mysqld_safe &

for i in `seq 1 10`; do
    DB_CONNECTABLE=$(mysql -e 'status' >/dev/null 2>&1; echo "$?");
    echo "Waiting for database server... $DB_CONNECTABLE";
    if [ $DB_CONNECTABLE -eq 0 ]; then
        break;
    fi
    sleep 1
done

source /etc/apache2/envvars
exec apache2 &
/etc/init.d/postfix start

if [ ! -f /init.done ]; then
    echo First run!
    sh /init/do.sh && touch /init.done
else
    echo Not first run!
fi

tail -f /var/log/*
