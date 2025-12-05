#!/bin/sh

# PostgreSQL initialization script
# This script runs before the main PostgreSQL service starts

set -e

# Logging functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INIT] $1"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INIT] ✓ $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INIT] ✗ $1" >&2
}

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INIT] ⚠ $1"
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

# Check for version mismatch if data exists
if [ -f "$PGDATA/PG_VERSION" ]; then
    DB_VERSION=$(cat "$PGDATA/PG_VERSION")
    INSTALLED_VERSION=$(postgres --version | awk '{print $3}' | cut -d. -f1)
    
    log "Checking PostgreSQL version compatibility..."
    log "Data directory version: $DB_VERSION"
    log "Installed PostgreSQL version: $INSTALLED_VERSION"
    
    if [ "$DB_VERSION" != "$INSTALLED_VERSION" ]; then
        log_warning "Version mismatch detected! Data is from Postgres $DB_VERSION but running $INSTALLED_VERSION."
        log_warning "Archiving incompatible data directory to $PGDATA.bak_$(date +%s)..."
        
        # Create backup of incompatible data
        BACKUP_DIR="$PGDATA.bak_$(date +%s)"
        mv "$PGDATA" "$BACKUP_DIR"
        
        # Re-create empty data directory
        mkdir -p "$PGDATA"
        chown -R postgres:postgres "$PGDATA"
        chmod 700 "$PGDATA"
        
        log_success "Incompatible data archived. Proceeding with fresh initialization."
    else
        log_success "PostgreSQL versions match."
    fi
fi

# Check if PostgreSQL is already initialized (might be empty now if we just moved it)
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
    if su-exec postgres initdb -D "$PGDATA" --auth-local=trust --auth-host=md5; then
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