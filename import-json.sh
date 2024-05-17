#!/bin/bash

# Connect to MongoDB and check if the database is empty
if [ $(mongo --username root --password example --eval "db.getMongo().getDBNames()" | grep -c your_database_name) -eq 0 ]; then
    # If the database is empty, import the JSON files
    for file in /var/www/database/migrations/*.json; do
        mongoimport --username root --password example --db your_database_name --collection your_collection_name --file "$file" --jsonArray
    done
fi