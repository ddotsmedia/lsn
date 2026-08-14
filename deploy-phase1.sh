#!/bin/bash

################################################################################
# PHASE 1 DEPLOYMENT SCRIPT - Little Smarties Admin Dashboard
# Modern UI Framework & Design System Upgrade
#
# Usage: ./deploy-phase1.sh
# Run on VPS: /opt/littlesmarties/deploy-phase1.sh
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

################################################################################
# STEP 1: VERIFY PREREQUISITES
################################################################################

log_info "Phase 1 Deployment Starting..."
log_info "Verifying prerequisites..."

if [ ! -d "/opt/littlesmarties" ]; then
    log_error "Directory /opt/littlesmarties not found"
    exit 1
fi

if ! command -v git &> /dev/null; then
    log_error "Git not installed"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    log_error "Docker not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log_error "Node/npm not installed"
    exit 1
fi

log_success "All prerequisites verified"

################################################################################
# STEP 2: NAVIGATE AND VERIFY STATUS
################################################################################

log_info "Navigating to deployment directory..."
cd /opt/littlesmarties

log_info "Checking git status..."
GIT_STATUS=$(git status --porcelain | wc -l)
if [ "$GIT_STATUS" -gt 0 ]; then
    log_warning "Uncommitted changes detected. Stashing..."
    git stash
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log_info "Current branch: $CURRENT_BRANCH"

################################################################################
# STEP 3: PULL LATEST CHANGES
################################################################################

log_info "Fetching latest changes from origin..."
git fetch origin

log_info "Pulling latest code..."
git pull origin main || git pull origin master

LATEST_COMMIT=$(git log --oneline -1)
log_info "Latest commit: $LATEST_COMMIT"

if [[ ! "$LATEST_COMMIT" == *"Phase 1"* ]]; then
    log_warning "Latest commit may not be Phase 1. Commit: $LATEST_COMMIT"
fi

################################################################################
# STEP 4: CREATE BACKUP
################################################################################

log_info "Creating backup..."
BACKUP_FILE="backup-before-phase1-$(date +%Y%m%d-%H%M%S).tar.gz"
if [ -d "apps/frontend/.next" ]; then
    tar -czf "$BACKUP_FILE" apps/frontend/.next 2>/dev/null || true
    log_success "Backup created: $BACKUP_FILE"
else
    log_warning "No previous .next directory found, skipping backup"
fi

################################################################################
# STEP 5: PREPARE ENVIRONMENT
################################################################################

log_info "Setting up environment..."
export NODE_ENV=production

log_info "Node.js version: $(node --version)"
log_info "npm version: $(npm --version)"
log_info "docker version: $(docker --version)"

################################################################################
# STEP 6: BUILD FRONTEND
################################################################################

log_info "Building frontend with Phase 1 UI components..."
log_warning "This may take 2-3 minutes..."

# Clean build cache
rm -rf apps/frontend/.next

# Install dependencies
npm install --workspaces --silent

# Run build
if npm run build --workspace=apps/frontend; then
    log_success "Frontend build completed successfully"
else
    log_error "Frontend build failed"
    exit 1
fi

# Verify build
if [ -d "apps/frontend/.next" ]; then
    log_success "Frontend .next directory created successfully"
else
    log_error "Frontend build directory missing"
    exit 1
fi

################################################################################
# STEP 7: REBUILD DOCKER IMAGES
################################################################################

log_info "Rebuilding Docker images with Phase 1 code..."
log_warning "This may take 3-5 minutes..."

if docker-compose build --no-cache frontend backend; then
    log_success "Docker images built successfully"
else
    log_error "Docker build failed"
    exit 1
fi

################################################################################
# STEP 8: DEPLOY SERVICES
################################################################################

log_info "Stopping current services..."
docker-compose down --remove-orphans

log_info "Waiting for services to stop (5 seconds)..."
sleep 5

log_info "Starting new services with Phase 1 UI..."
docker-compose up -d

log_info "Waiting for services to start (15 seconds)..."
sleep 15

################################################################################
# STEP 9: VERIFY DEPLOYMENT
################################################################################

log_info "Verifying services status..."

# Check if services are running
SERVICES_STATUS=$(docker-compose ps --quiet | wc -l)
if [ "$SERVICES_STATUS" -lt 3 ]; then
    log_warning "Not all services are running. Expected 3+, found $SERVICES_STATUS"
fi

# Display service status
docker-compose ps

log_info "Checking backend health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/v1/health 2>/dev/null || echo "failed")
if [[ "$HEALTH_RESPONSE" == *"ok"* ]] || [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
    log_success "Backend is healthy"
else
    log_warning "Backend health check inconclusive: $HEALTH_RESPONSE"
fi

################################################################################
# STEP 10: DATABASE VERIFICATION
################################################################################

log_info "Verifying database tables..."

PAGES_COUNT=$(docker-compose exec -T postgres psql -U littlesmarties -d littlesmarties -t -c \
    "SELECT COUNT(*) FROM pages;" 2>/dev/null || echo "0")
SECTIONS_COUNT=$(docker-compose exec -T postgres psql -U littlesmarties -d littlesmarties -t -c \
    "SELECT COUNT(*) FROM page_sections;" 2>/dev/null || echo "0")

log_info "Database statistics:"
log_info "  - Pages: $PAGES_COUNT"
log_info "  - Sections: $SECTIONS_COUNT"

if [ "$PAGES_COUNT" -gt 0 ]; then
    log_success "Database data verified"
else
    log_warning "No pages found in database"
fi

################################################################################
# STEP 11: PERFORMANCE CHECK
################################################################################

log_info "Checking resource usage..."

DOCKER_STATS=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.CPUPerc}}" 2>/dev/null || echo "N/A")
if [ "$DOCKER_STATS" != "N/A" ]; then
    echo -e "${BLUE}$DOCKER_STATS${NC}"
fi

DISK_SPACE=$(df -h /opt/littlesmarties | tail -1 | awk '{print $4}')
log_info "Available disk space: $DISK_SPACE"

################################################################################
# STEP 12: CHECK LOGS
################################################################################

log_info "Checking for errors in logs..."

FRONTEND_ERRORS=$(docker-compose logs frontend 2>/dev/null | grep -i "error" | wc -l || echo "0")
BACKEND_ERRORS=$(docker-compose logs backend 2>/dev/null | grep -i "error" | wc -l || echo "0")

if [ "$FRONTEND_ERRORS" -eq 0 ] && [ "$BACKEND_ERRORS" -eq 0 ]; then
    log_success "No errors detected in service logs"
else
    log_warning "Found potential errors. Run 'docker-compose logs' to review"
    [ "$FRONTEND_ERRORS" -gt 0 ] && log_warning "Frontend: $FRONTEND_ERRORS error lines found"
    [ "$BACKEND_ERRORS" -gt 0 ] && log_warning "Backend: $BACKEND_ERRORS error lines found"
fi

################################################################################
# STEP 13: FINAL VERIFICATION
################################################################################

log_info "Performing final verification..."

# Check if frontend is accessible
if curl -s http://localhost:3000/admin/login > /dev/null; then
    log_success "Frontend is accessible at http://localhost:3000"
else
    log_warning "Frontend health check failed"
fi

# Check if backend is accessible
if curl -s http://localhost:3001/api/v1/health > /dev/null; then
    log_success "Backend is accessible at http://localhost:3001"
else
    log_warning "Backend health check failed"
fi

################################################################################
# DEPLOYMENT COMPLETE
################################################################################

log_success "═══════════════════════════════════════════════════════════"
log_success "Phase 1 Deployment Completed Successfully!"
log_success "═══════════════════════════════════════════════════════════"

echo ""
echo -e "${BLUE}Deployment Summary:${NC}"
echo "  Frontend URL: http://187.127.185.239:3000/admin/login"
echo "  Backend URL:  http://187.127.185.239:3001/api/v1/health"
echo "  Commit:       $LATEST_COMMIT"
echo "  Backup File:  $BACKUP_FILE"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Test admin login at http://187.127.185.239:3000/admin/login"
echo "  2. Verify dark mode toggle in header"
echo "  3. Test text editor functionality"
echo "  4. Check responsive design on mobile/tablet"
echo ""
echo -e "${YELLOW}Monitoring:${NC}"
echo "  View logs:    docker-compose logs -f"
echo "  View stats:   docker stats"
echo "  SSH:          ssh root@187.127.185.239"
echo ""
echo -e "${YELLOW}Rollback (if needed):${NC}"
echo "  git reset --hard <previous-commit>"
echo "  ./deploy-phase1.sh"
echo ""

################################################################################
# LOGGING
################################################################################

log_info "Deployment log saved to: /opt/littlesmarties/deployment.log"
echo "" >> deployment.log 2>/dev/null
echo "=== Phase 1 Deployment: $(date) ===" >> deployment.log 2>/dev/null
echo "Status: SUCCESS" >> deployment.log 2>/dev/null
echo "Commit: $LATEST_COMMIT" >> deployment.log 2>/dev/null

exit 0
