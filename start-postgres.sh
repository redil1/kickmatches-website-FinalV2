#!/bin/sh

# Wrapper script to start PostgreSQL
# Waits for init-postgres.sh to complete successfully

set -e

SENTINEL_FILE="/var/run/postgresql/init-success"

echo "Waiting for PostgreSQL initialization to complete..."

# Wait for the sentinel file created by init-postgres.sh
while [ ! -f "$SENTINEL_FILE" ]; do
    echo "Waiting for init-postgres.sh to finish..."
    sleep 1
done

echo "Initialization complete. Starting PostgreSQL..."
exec /usr/bin/postgres -D /var/lib/postgresql/data
