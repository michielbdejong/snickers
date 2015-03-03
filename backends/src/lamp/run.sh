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

if [ -f /init.done ]; then
    echo Container existed but was stopped!
else
    if [ -f /data/dump.sql ] || [ -f /data/www-content ]; then
        echo Creating container from existing data!
        # This part of the script is run in the following situations:
        # * The domain was just migrated to a new server
        # * The container was deleted to trigger a software upgrade
        # * The container was deleted (not just stopped) for whatever other reason
        mysql < /data/dump.sql
        echo FLUSH PRIVILEGES | mysql
        touch /init.done
    else
        echo Creating data for the first time!
        # This part of the script is run in the following situations:
        # * The domain is new, and data repo is still empty
        # * The domain was switched to a different application
        # * The domain was reset to initial settings by deleting all its data
        sh /install-lamp-generic.sh
        if [ -f /install-application.sh ]; then
            sh /install-application.sh
        fi
    fi
fi

tail -f /var/log/*

