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

mysql < /data/dump.sql
echo FLUSH PRIVILEGES | mysql

source /etc/apache2/envvars
exec apache2 &
/etc/init.d/postfix start

cd /data
git config --local user.email "backup@indiehosters"
git config --local user.name "IndieHosters backup"

while true; do
  mysqldump --all-databases > dump.sql
  git add *
  git commit -am"backup `date`"
  git status
  date
  echo "Next backup in one hour..."
  sleep 3540
done
