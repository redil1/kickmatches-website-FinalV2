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
MAX_WAIT=60
WAIT_COUNT=0

while [ ! -f "$SENTINEL_FILE" ]; do
    if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
        echo "Timeout waiting for init-postgres.sh to finish!"
        exit 1
    fi
    
    echo "Waiting for init-postgres.sh to finish... ($WAIT_COUNT/$MAX_WAIT)"
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
done

echo "Initialization complete. Starting PostgreSQL..."
exec /usr/bin/postgres -D /var/lib/postgresql/data
