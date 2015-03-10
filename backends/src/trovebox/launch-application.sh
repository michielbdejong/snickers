#!/bin/bash

cp /data/src/configs/openphoto-vhost.conf /etc/apache2/sites-available/openphoto.conf
sed 's/\/path\/to\/openphoto\/html\/directory/\/data\/www-content\/src\/html/g' /data/src/configs/openphoto-vhost.conf > /etc/apache2/sites-available/openphoto.conf
a2dissite 000-default
a2ensite openphoto
sed -i "s/yourdomainname.com/`hostname`/g" /etc/apache2/sites-enabled/openphoto.conf
