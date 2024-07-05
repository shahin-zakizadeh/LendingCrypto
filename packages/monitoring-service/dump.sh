#!/bin/sh
echo "backing up in progress..."
mkdir -p $BACKUP_FOLDER
date=$(date "+%d-%m-%y--%H-%M-%S")
PGPASSWORD=$DB_PASSWORD pg_dump -Fc -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME > $BACKUP_FOLDER/dump-$date.sql
