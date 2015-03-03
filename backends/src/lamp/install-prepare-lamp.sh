#!/bin/bash

# This script is run in the following situations:
# * The domain is new, and data repo is still empty
# * The domain was switched to a different application
# * The domain was reset to initial settings by deleting all its data

mkdir -p /data/www-content
touch /data/dump.sql
    
chown -R root:www-data /data
chmod -R 750 /data/www-content

cd /data
git config --local user.email "backup@IndieHosters"
git config --local user.name "IndieHosters backup"
