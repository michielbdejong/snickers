#!/bin/bash
while (true); do
  echo letting the blue team play > /root/team.txt
  cd /root/snickers-blue/;
  node snickers;
  echo letting the red team play > /root/team.txt
  cd /root/snickers-red/;
  node snickers;
done
