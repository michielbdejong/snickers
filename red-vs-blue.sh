#!/bin/bash
while (true); do
  echo letting the blue team play:
  cd /root/snickers-blue/;
  node snickers;
  echo letting the red team play:
  cd /root/snickers-red/;
  node snickers;
done
