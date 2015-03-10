#!/bin/bash

sed -i "s/yourdomainname.com/`hostname`/g" /etc/apache2/sites-enabled/openphoto.conf
