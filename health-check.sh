#!/bin/bash

# Health check script for all services
# This script verifies that all services are running and ready

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check PostgreSQL
check_postgresql() {
    log_info "Checking PostgreSQL..."
    
    # Check if PostgreSQL process is running
    if ! pgrep -f "postgres" > /dev/null; then
        log_error "PostgreSQL process not found"
        return 1
    fi
    
    # Check if PostgreSQL is accepting connections
    if ! pg_isready -h localhost -p 5432 -U kickai -d kickai_matches > /dev/null 2>&1; then
        log_error "PostgreSQL is not accepting connections"
        return 1
    fi
    
    # Check if database exists
    if ! psql -h localhost -p 5432 -U kickai -d kickai_matches -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "Cannot connect to kickai_matches database"
        return 1
    fi
    
    log_info "PostgreSQL is healthy"
    return 0
}

# Check Redis
check_redis() {
    log_info "Checking Redis..."
    
    # Check if Redis process is running
    if ! pgrep -f "redis-server" > /dev/null; then
        log_error "Redis process not found"
        return 1
    fi
    
    # Check if Redis is responding
    if ! redis-cli -h localhost -p 6379 ping > /dev/null 2>&1; then
        log_error "Redis is not responding"
        return 1
    fi
    
    log_info "Redis is healthy"
    return 0
}

# Check Next.js application
check_nextjs() {
    log_info "Checking Next.js application..."
    
    # Check if Next.js process is running
    if ! pgrep -f "node.*next" > /dev/null; then
        log_error "Next.js process not found"
        return 1
    fi
    
    # Check if application is responding on port 3000
    if ! curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
        log_warn "Next.js health endpoint not responding (this might be normal if no health endpoint exists)"
        # Try to check if port 3000 is listening
        if ! netstat -ln | grep ":3000 " > /dev/null 2>&1; then
            log_error "Next.js is not listening on port 3000"
            return 1
        fi
    fi
    
    log_info "Next.js application is healthy"
    return 0
}

# Check Worker process
check_worker() {
    log_info "Checking Worker process..."
    
    # Check if worker process is running
    if ! pgrep -f "tsx.*worker" > /dev/null; then
        log_error "Worker process not found"
        return 1
    fi
    
    log_info "Worker process is healthy"
    return 0
}

# Check database tables
check_database_tables() {
    log_info "Checking database tables..."
    
    local expected_tables=("matches" "trial_sessions" "app_users" "referral_credits" "push_subscriptions" "one_time_codes" "rate_events" "metrics")
    
    for table in "${expected_tables[@]}"; do
        if ! psql -h localhost -p 5432 -U kickai -d kickai_matches -c "\dt $table" | grep -q "$table"; then
            log_error "Table '$table' not found"
            return 1
        fi
    done
    
    log_info "All expected database tables exist"
    return 0
}

# Main health check function
main() {
    log_info "Starting comprehensive health check..."
    
    local failed=0
    
    # Run all health checks
    check_postgresql || failed=1
    check_redis || failed=1
    check_nextjs || failed=1
    check_worker || failed=1
    check_database_tables || failed=1
    
    if [ $failed -eq 0 ]; then
        log_info "All services are healthy! 🎉"
        exit 0
    else
        log_error "Some services failed health checks"
        exit 1
    fi
}

# Run main function
main "$@"