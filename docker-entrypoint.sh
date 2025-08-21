#!/bin/sh
set -e

# Color codes for logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ${GREEN}✓${NC} $1"
}

log_warning() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ${YELLOW}⚠${NC} $1"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ${RED}✗${NC} $1"
}

# Function to wait for a service to be ready
wait_for_service() {
    local host=$1
    local port=$2
    local service_name=$3
    local max_attempts=60
    local attempt=1
    
    log "Waiting for $service_name to be ready at $host:$port..."
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z "$host" "$port" 2>/dev/null; then
            log_success "$service_name is ready!"
            return 0
        fi
        
        log "Attempt $attempt/$max_attempts: $service_name not ready yet, waiting..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "$service_name failed to start within expected time"
    return 1
}

# Function to wait for required services
wait_for_services() {
    log "Waiting for required services to be ready..."
    
    # Wait for PostgreSQL to be ready (managed by supervisor)
    wait_for_service localhost 5432 "PostgreSQL"
    
    # Wait for Redis to be ready (managed by supervisor)
    wait_for_service localhost 6379 "Redis"
    
    log_success "All required services are ready"
}





# Signal handlers for graceful shutdown
handle_signal() {
    log "Received shutdown signal, stopping application..."
    
    # Stop Next.js
    if [ ! -z "$NEXTJS_PID" ]; then
        kill $NEXTJS_PID 2>/dev/null || true
    fi
    
    log "Shutdown complete"
    exit 0
}

# Set up signal handlers
trap handle_signal TERM INT

# Main execution
log "Starting Next.js application (PostgreSQL and Redis managed by supervisor)..."

# Wait for required services to be ready
wait_for_services

# Start Next.js application
log "Starting Next.js application..."
exec npm start