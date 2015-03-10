#!/bin/bash

mkdir -p /data
mysqldump --all-databases > /data/dump.sql
