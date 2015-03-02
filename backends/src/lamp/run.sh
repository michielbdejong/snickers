#!/bin/bash

exec mysqld_safe &
source /etc/apache2/envvars
exec apache2 &
/etc/init.d/postfix start

if [ !-f /init.done ];
    sh /init/do.sh && touch /init.done
fi
