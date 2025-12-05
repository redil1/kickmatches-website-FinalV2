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

# Function to wait for PostgreSQL to be ready
wait_for_postgres_ready() {
    local max_attempts=30
    local attempt=1
    
    log "Waiting for PostgreSQL to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if su-exec postgres pg_isready -d postgres >/dev/null 2>&1; then
            log_success "PostgreSQL is ready!"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: PostgreSQL not ready yet, waiting..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "PostgreSQL failed to become ready within expected time"
    return 1
}

# Function to create user and database with retry logic
create_user_and_database() {
    local max_attempts=3
    local attempt=1
    
    log "Creating application user and database..."
    
    # Create user with retry
    while [ $attempt -le $max_attempts ]; do
        if su-exec postgres psql -c "CREATE USER kickai WITH SUPERUSER PASSWORD 'kickai';" >/dev/null 2>&1; then
            log_success "User kickai created successfully"
            break
        elif su-exec postgres psql -c "SELECT 1 FROM pg_user WHERE usename = 'kickai';" | grep -q "1 row"; then
            log_warning "User kickai already exists, continuing..."
            break
        else
            log_warning "Failed to create user kickai, attempt $attempt/$max_attempts"
            if [ $attempt -lt $max_attempts ]; then
                sleep 2
            fi
        fi
        attempt=$((attempt + 1))
    done
    
    # Create database with retry
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if su-exec postgres psql -c "CREATE DATABASE kickai_matches OWNER kickai;" >/dev/null 2>&1; then
            log_success "Database kickai_matches created successfully"
            break
        elif su-exec postgres psql -lqt | cut -d \| -f 1 | grep -qw kickai_matches; then
            log_warning "Database kickai_matches already exists, continuing..."
            break
        else
            log_warning "Failed to create database kickai_matches, attempt $attempt/$max_attempts"
            if [ $attempt -lt $max_attempts ]; then
                sleep 2
            fi
        fi
        attempt=$((attempt + 1))
    done
}

# Function to load initial schema with error handling
load_initial_schema() {
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if su-exec postgres psql -d kickai_matches -f /app/init.sql >/dev/null 2>&1; then
            log_success "Initial schema loaded successfully"
            return 0
        else
            log_warning "Failed to load initial schema, attempt $attempt/$max_attempts"
            if [ $attempt -lt $max_attempts ]; then
                sleep 2
            fi
        fi
        attempt=$((attempt + 1))
    done
    
    log_error "Failed to load initial schema after $max_attempts attempts"
    return 1
}

log "Starting PostgreSQL initialization..."

# Create PostgreSQL directories if they don't exist
log "Creating PostgreSQL directories..."
mkdir -p "$PGDATA"
mkdir -p /var/run/postgresql
mkdir -p /var/log/postgresql

# Set proper ownership
log "Setting directory ownership..."
chown -R postgres:postgres "$PGDATA"
chown -R postgres:postgres /var/run/postgresql
chown -R postgres:postgres /var/log/postgresql

# Set proper permissions
chmod 700 "$PGDATA"
chmod 755 /var/run/postgresql

# Check if PostgreSQL is already initialized
if [ ! -f "$PGDATA/PG_VERSION" ]; then
    log "Initializing PostgreSQL database..."
    
    # Initialize the database as postgres user
    su-exec postgres initdb -D "$PGDATA" --auth-local=trust --auth-host=md5
    
    log_success "PostgreSQL database initialized"
    
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
exit 0