#!/bin/bash

exec mysqld_safe &
source /etc/apache2/envvars
exec apache2 &
/etc/init.d/postfix start

if [ ! -f /init.done ]; then
    echo First run!
    sh /init/do.sh && touch /init.done
else
    echo Not first run!
fi

tail /var/log/*
