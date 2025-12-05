#!/bin/sh

# PostgreSQL initialization script
# This script runs before the main PostgreSQL service starts

set -e

# Direct logging to container stdout (PID 1) to ensure visibility in Coolify
LOG_OUTPUT="/proc/1/fd/1"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INIT] $1" > "$LOG_OUTPUT"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INIT] ✓ $1" > "$LOG_OUTPUT"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INIT] ✗ $1" > "$LOG_OUTPUT"
}

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INIT] ⚠ $1" > "$LOG_OUTPUT"
}

# PostgreSQL data directory
PGDATA="/var/lib/postgresql/data"

log "Starting PostgreSQL initialization..."
log "PGDATA is $PGDATA"

# Create PostgreSQL directories if they don't exist
log "Creating PostgreSQL directories..."
mkdir -p "$PGDATA"
mkdir -p /var/run/postgresql
mkdir -p /var/log/postgresql

# Set proper ownership
log "Setting directory ownership..."
chown -R postgres:postgres /var/lib/postgresql
chown -R postgres:postgres /var/run/postgresql
chown -R postgres:postgres /var/log/postgresql

# Set proper permissions
chmod 700 "$PGDATA"
chmod 755 /var/run/postgresql

# Check if PostgreSQL is already initialized
if [ ! -f "$PGDATA/PG_VERSION" ]; then
    log "Initializing PostgreSQL database..."
    
    # Check if directory is not empty (e.g. lost+found)
    if [ "$(ls -A $PGDATA)" ]; then
        log_warning "Data directory is not empty. Cleaning up..."
        # Be careful here, only remove if we are sure it's not a valid DB
        # But since PG_VERSION is missing, it's likely debris or lost+found
        rm -rf "$PGDATA"/*
    fi
    
    # Initialize the database as postgres user
    if su-exec postgres initdb -D "$PGDATA" --auth-local=trust --auth-host=md5 > "$LOG_OUTPUT" 2>&1; then
        log_success "PostgreSQL database initialized"
    else
        log_error "initdb failed"
        exit 1
    fi
    
    # Configure PostgreSQL
    log "Configuring PostgreSQL..."
    
    # Update postgresql.conf
    echo "listen_addresses = '*'" >> "$PGDATA/postgresql.conf"
    echo "port = 5432" >> "$PGDATA/postgresql.conf"
    echo "max_connections = 100" >> "$PGDATA/postgresql.conf"
    echo "shared_buffers = 128MB" >> "$PGDATA/postgresql.conf"
    echo "log_destination = 'stderr'" >> "$PGDATA/postgresql.conf"
    echo "logging_collector = off" >> "$PGDATA/postgresql.conf"
    
    # Update pg_hba.conf for authentication
    echo "host all all 0.0.0.0/0 md5" >> "$PGDATA/pg_hba.conf"
    echo "local all all trust" >> "$PGDATA/pg_hba.conf"
    
    log_success "PostgreSQL configuration updated"
else
    log "PostgreSQL already initialized, checking application setup..."
fi

log_success "PostgreSQL initialization script finished"
touch /var/run/postgresql/init-success
# Ensure postgres user can read the sentinel file
chown postgres:postgres /var/run/postgresql/init-success
exit 0