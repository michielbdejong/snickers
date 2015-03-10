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

/etc/init.d/postfix start

if [ -f /data/dump.sql ] || [ -f /data/www-content ]; then
    echo Found installed application in /data
else
    echo Installing application!
    # This part of the script is run in the following situations:
    # * The domain is new, and data repo is still empty
    # * The domain was switched to a different application
    # * The domain was reset to initial settings by deleting all its data

    mkdir -p /data/www-content
    touch /data/dump.sql

    chown -R root:www-data /data
    chmod -R 750 /data/www-content

    if [ -f /install-application.sh ]; then
        sh /install-application.sh
    fi
fi

if [ -f /init.done ]; then
    echo Container existed but was stopped!
else
    echo Launching application!
    # This part of the script is run in the following situations:
    # * The domain was just migrated to a new server
    # * The container was deleted to trigger a software upgrade
    # * The container was deleted (not just stopped) for whatever other reason
    mysql < /data/dump.sql
    echo FLUSH PRIVILEGES | mysql

    if [ -f /launch-application.sh ]; then
        sh /launch-application.sh
    fi

    touch /init.done
fi

source /etc/apache2/envvars
exec apache2 &

tail -f /var/log/*/*
