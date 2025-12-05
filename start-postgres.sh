#!/bin/sh

# Wrapper script to start PostgreSQL
# Waits for init-postgres.sh to complete successfully

set -e
set -x

trap 'echo "Script exited with status $?"' EXIT

SENTINEL_FILE="/var/run/postgresql/init-success"

echo "Waiting for PostgreSQL initialization to complete..."
echo "Checking for sentinel file: $SENTINEL_FILE"

# Wait for the sentinel file created by init-postgres.sh
while [ ! -f "$SENTINEL_FILE" ]; do
    echo "Waiting for init-postgres.sh to finish..."
    sleep 1
done

echo "Initialization complete. Starting PostgreSQL..."
exec /usr/bin/postgres -D /var/lib/postgresql/data
