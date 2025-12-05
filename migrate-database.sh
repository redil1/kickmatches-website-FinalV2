#!/bin/sh

# Database migration script
# This script runs database migrations after PostgreSQL is ready

set -e

# Color codes for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [MIGRATE] $1"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [MIGRATE] ${GREEN}✓${NC} $1"
}

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [MIGRATE] ${YELLOW}⚠${NC} $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [MIGRATE] ${RED}✗${NC} $1" >&2
}

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    local max_attempts=60
    local attempt=1
    
    log "Waiting for PostgreSQL to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h localhost -p 5432 -U kickai -d kickai_matches 2>/dev/null; then
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

# Function to test database connection with retry
test_database_connection() {
    local max_attempts=30
    local attempt=1
    
    log "Testing database connection..."
    
    while [ $attempt -le $max_attempts ]; do
        if psql -h localhost -p 5432 -U kickai -d kickai_matches -c "SELECT 1;" >/dev/null 2>&1; then
            log_success "Database connection successful"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: Database not ready or user/db not created yet, waiting..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "Database connection failed after $max_attempts attempts"
    return 1
}

# Function to run database migrations
run_migrations() {
    local max_attempts=3
    local attempt=1
    
    log "Running database migrations..."
    
    while [ $attempt -le $max_attempts ]; do
        log "Migration attempt $attempt/$max_attempts"
        
        if { echo "n"; echo ""; } | npm run drizzle:push; then
            log_success "Database migrations completed successfully"
            return 0
        else
            log_warning "Migration attempt $attempt failed"
            if [ $attempt -lt $max_attempts ]; then
                log "Retrying in 5 seconds..."
                sleep 5
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    log_error "Database migrations failed after $max_attempts attempts"
    return 1
}

# Function to verify tables exist
verify_tables() {
    log "Verifying database tables..."
    
    local expected_tables="matches trial_sessions app_users referral_credits push_subscriptions one_time_codes rate_events metrics email_notification_history email_templates"
    local missing_tables=""
    
    for table in $expected_tables; do
        if ! psql -h localhost -p 5432 -U kickai -d kickai_matches -c "\dt $table" >/dev/null 2>&1; then
            missing_tables="$missing_tables $table"
        fi
    done
    
    if [ -n "$missing_tables" ]; then
        log_warning "Missing tables:$missing_tables"
        return 1
    else
        log_success "All expected tables exist"
        return 0
    fi
}

# Function to seed email templates
seed_email_templates() {
    local max_attempts=3
    local attempt=1
    
    log "Seeding email templates..."
    
    while [ $attempt -le $max_attempts ]; do
        log "Email template seeding attempt $attempt/$max_attempts"
        
        if npm run seed:email-templates; then
            log_success "Email templates seeded successfully"
            return 0
        else
            log_warning "Email template seeding attempt $attempt failed"
            if [ $attempt -lt $max_attempts ]; then
                log "Retrying in 3 seconds..."
                sleep 3
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    log_error "Email template seeding failed after $max_attempts attempts"
    return 1
}

# Function to populate trending players
populate_trending_players() {
    local max_attempts=3
    local attempt=1
    
    log "Populating trending players from snapshots..."
    
    while [ $attempt -le $max_attempts ]; do
        log "Trending players population attempt $attempt/$max_attempts"
        
        if npm run populate:trending; then
            log_success "Trending players populated successfully"
            return 0
        else
            log_warning "Trending players population attempt $attempt failed"
            if [ $attempt -lt $max_attempts ]; then
                log "Retrying in 3 seconds..."
                sleep 3
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    log_error "Trending players population failed after $max_attempts attempts"
    return 1
}

# Function to seed matches
seed_matches() {
    local max_attempts=3
    local attempt=1
    
    log "Seeding matches from API..."
    
    while [ $attempt -le $max_attempts ]; do
        log "Matches seeding attempt $attempt/$max_attempts"
        
        if npm run seed:matches; then
            log_success "Matches seeded successfully"
            return 0
        else
            log_warning "Matches seeding attempt $attempt failed"
            if [ $attempt -lt $max_attempts ]; then
                log "Retrying in 3 seconds..."
                sleep 3
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    log_warning "Matches seeding failed after $max_attempts attempts"
    return 1
}

# Main execution
log "Starting database migration process..."

# Set working directory
cd /app

# Wait for PostgreSQL to be ready
if ! wait_for_postgres; then
    log_error "PostgreSQL readiness check failed"
    exit 1
fi

# Test database connection
if ! test_database_connection; then
    log_error "Database connection test failed"
    exit 1
fi

# Run migrations
if ! run_migrations; then
    log_error "Database migration failed"
    exit 1
fi

# Verify tables exist
if ! verify_tables; then
    log_warning "Table verification failed, but continuing..."
fi

# Seed email templates
if ! seed_email_templates; then
    log_warning "Email template seeding failed, but continuing..."
fi

# Populate trending players
if ! populate_trending_players; then
    log_warning "Trending players population failed, but continuing..."
fi

# Seed matches
if ! seed_matches; then
    log_warning "Matches seeding failed, but continuing..."
fi

log_success "Database migration process completed successfully"
exit 0