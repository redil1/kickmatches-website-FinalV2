#!/bin/sh

# PostgreSQL configuration script
# This script runs AFTER the main PostgreSQL service starts
# It creates the application user and database

set -e

# Logging functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [CONFIG] $1"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [CONFIG] ✓ $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [CONFIG] ✗ $1" >&2
}

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [CONFIG] ⚠ $1"
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

log "Waiting for PostgreSQL to be available..."

# Wait for PostgreSQL to be ready (started by supervisor)
max_wait=60
wait_count=0
while [ $wait_count -lt $max_wait ]; do
    if su-exec postgres pg_isready -d postgres >/dev/null 2>&1; then
        log_success "PostgreSQL is ready!"
        break
    fi
    
    log "PostgreSQL not ready yet, waiting..."
    sleep 1
    wait_count=$((wait_count + 1))
done

if [ $wait_count -ge $max_wait ]; then
    log_error "PostgreSQL failed to become ready within $max_wait seconds"
    exit 1
fi

# Create application user and database with retry logic
create_user_and_database

# Load initial schema if it exists
if [ -f "/app/init.sql" ]; then
    log "Loading initial database schema..."
    load_initial_schema
fi

log_success "Database configuration completed"
exit 0
