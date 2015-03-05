#!/bin/bash

sed -i "s/yourdomainname.com/`cat /data/hostname`/g" /etc/apache2/sites-enabled/openphoto.conf

if [ ! -L /var/www/openphoto/src/userdata ]; then
  mv /var/www/openphoto/src/userdata /data;
  ln -s /data/userdata /var/www/openphoto/src/userdata;
fi
