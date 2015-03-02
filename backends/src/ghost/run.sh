#!/bin/bash

if [ ! -L /app/content ]; then
  if [ -e /data/content ]; then
    rm -rf /app/content;
  else
    mv /app/content /data;
  fi
  ln -s /data/content /app/content;
fi

cd /app && npm start --production &

cd /data
while true; do
  git add *
  git commit -am"backup `date`"
  git status
  date
  echo "Next backup in one hour..."
  sleep 3540
done
