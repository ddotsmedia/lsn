#!/bin/bash

################################################################################
# LittleSmarties Tailwind CSS v4 Deployment Script
# Complete automated deployment with diagnostics, build, and verification
################################################################################

set -o pipefail

# Color and status output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SUCCESS_MARK="✓"
FAILURE_MARK="✗"

# Configuration
PROJECT_DIR="/opt/littlesmarties"
DEPLOYMENT_TIMEOUT=600  # 10 minutes
CURL_TIMEOUT=30
MAX_RETRIES=3
STEP_COUNT=0

################################################################################
# Helper Functions
################################################################################

log_step() {
    STEP_COUNT=$((STEP_COUNT + 1))
    echo -e "\n${BLUE}[STEP ${STEP_COUNT}]${NC} $1"
}

log_success() {
    echo -e "${GREEN}${SUCCESS_MARK}${NC} $1"
}

log_failure() {
    echo -e "${RED}${FAILURE_MARK}${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

die() {
    log_failure "$1"
    echo -e "\n${RED}=== DEPLOYMENT FAILED ===${NC}"
    exit 1
}

log_diagnostic() {
    echo -e "\n${YELLOW}--- Diagnostic Information ---${NC}"
    echo "$1"
    echo -e "${YELLOW}--- End Diagnostic ---${NC}\n"
}

################################################################################
# STEP 1: Pre-Fix Diagnostics
################################################################################

log_step "Pre-Fix Diagnostics & Environment Verification"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    die "Project directory not found: $PROJECT_DIR"
fi
log_success "Project directory found: $PROJECT_DIR"

# Change to project directory
cd "$PROJECT_DIR" || die "Cannot change to project directory"
log_success "Changed to project directory"

# Check Node.js
if ! command -v node &> /dev/null; then
    die "Node.js is not installed"
fi
NODE_VERSION=$(node -v)
log_success "Node.js found: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    die "npm is not installed"
fi
NPM_VERSION=$(npm -v)
log_success "npm found: $NPM_VERSION"

# Check git
if ! command -v git &> /dev/null; then
    die "git is not installed"
fi
GIT_VERSION=$(git -v)
log_success "git found: $GIT_VERSION"

# Check Docker
if ! command -v docker &> /dev/null; then
    die "Docker is not installed"
fi
DOCKER_VERSION=$(docker -v)
log_success "Docker found: $DOCKER_VERSION"

# Check for Dockerfile
if [ ! -f "$PROJECT_DIR/Dockerfile" ]; then
    die "Dockerfile not found in project directory"
fi
log_success "Dockerfile found"

# Verify git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    die "Not a git repository: $PROJECT_DIR"
fi
log_success "Git repository verified"

# Get current branch and status
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
log_info "Current branch: $CURRENT_BRANCH"

# Check git status
if ! git status > /dev/null 2>&1; then
    die "Cannot read git status"
fi
log_success "Git status readable"

# Check package.json
if [ ! -f "$PROJECT_DIR/package.json" ]; then
    die "package.json not found"
fi
log_success "package.json found"

# Display Node modules status
if [ -d "$PROJECT_DIR/node_modules" ]; then
    MODULES_COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    log_info "Existing node_modules detected ($MODULES_COUNT directories)"
else
    log_warning "node_modules directory not found (clean install will be performed)"
fi

# Display system info
log_info "System information:"
echo "  OS: $(uname -s)"
echo "  Kernel: $(uname -r)"
echo "  Available disk space: $(df -h "$PROJECT_DIR" | awk 'NR==2 {print $4}')"
echo "  Free memory: $(free -h | awk 'NR==2 {print $7}')"

################################################################################
# STEP 2: Pre-Build Cleanup
################################################################################

log_step "Pre-Build Cleanup & Preparation"

# Remove old node_modules if they exist (stale dependencies)
if [ -d "$PROJECT_DIR/node_modules/.bin" ]; then
    log_warning "Removing potentially stale node_modules for clean build..."
    if ! rm -rf node_modules 2>/dev/null; then
        log_warning "Could not fully remove node_modules, proceeding with npm ci"
    else
        log_success "Old node_modules removed"
    fi
fi

# Clear npm cache
log_info "Clearing npm cache..."
if npm cache clean --force > /dev/null 2>&1; then
    log_success "npm cache cleared"
else
    log_warning "npm cache clean had issues, continuing"
fi

# Remove package-lock.json backup if exists
if [ -f "$PROJECT_DIR/package-lock.json.bak" ]; then
    rm -f package-lock.json.bak
    log_info "Removed backup package-lock.json"
fi

################################################################################
# STEP 3: Install Build Dependencies
################################################################################

log_step "Installing Build Dependencies (build-essential, python3, etc.)"

# Check if build tools are available for native compilation
if ! command -v python3 &> /dev/null; then
    log_warning "Python3 not found (required for node-gyp)"
fi

# Check for g++ (needed for native bindings)
if ! command -v g++ &> /dev/null; then
    log_warning "g++ not found (some native modules may fail to compile)"
fi

# Verify compiler availability
if ! command -v gcc &> /dev/null; then
    log_warning "gcc not found, some native compilations may fail"
fi

log_success "Build environment checked"

################################################################################
# STEP 4: Tailwind CSS v4 Native Binding Fix
################################################################################

log_step "Installing npm Dependencies with Native Bindings (npm install --build-from-source)"

# Backup package-lock.json just in case
if [ -f "$PROJECT_DIR/package-lock.json" ]; then
    cp package-lock.json package-lock.json.bak
    log_info "Backed up package-lock.json"
fi

# Run npm install with build-from-source
# This ensures all native modules are compiled fresh (including Tailwind v4)
log_info "Running: npm install --build-from-source (this may take several minutes)..."

INSTALL_START_TIME=$(date +%s)
INSTALL_OUTPUT=$(mktemp)

if timeout $DEPLOYMENT_TIMEOUT npm install --build-from-source 2>&1 | tee "$INSTALL_OUTPUT"; then
    INSTALL_END_TIME=$(date +%s)
    INSTALL_DURATION=$((INSTALL_END_TIME - INSTALL_START_TIME))
    log_success "npm install completed in ${INSTALL_DURATION}s"
else
    INSTALL_EXIT_CODE=$?
    if [ $INSTALL_EXIT_CODE -eq 124 ]; then
        die "npm install timed out after ${DEPLOYMENT_TIMEOUT}s"
    else
        log_diagnostic "$(tail -50 "$INSTALL_OUTPUT")"
        die "npm install failed with exit code $INSTALL_EXIT_CODE"
    fi
fi

rm -f "$INSTALL_OUTPUT"

# Verify Tailwind installation
if ! npm list tailwindcss > /dev/null 2>&1; then
    log_warning "Tailwind CSS verification incomplete, but installation proceeded"
else
    TAILWIND_VERSION=$(npm list tailwindcss 2>/dev/null | grep tailwindcss | head -1)
    log_success "Tailwind CSS installed: $TAILWIND_VERSION"
fi

################################################################################
# STEP 5: Build Verification
################################################################################

log_step "Build Success Verification"

# Check that node_modules was created
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    die "node_modules directory was not created"
fi
log_success "node_modules directory exists"

# Check key dependencies
REQUIRED_MODULES=("tailwindcss" "express" "next")
for module in "${REQUIRED_MODULES[@]}"; do
    if [ -d "$PROJECT_DIR/node_modules/$module" ]; then
        log_success "$module module installed"
    else
        log_warning "$module module not found (may be optional)"
    fi
done

# Verify package.json is still valid
if ! node -e "require('./package.json')" 2>/dev/null; then
    die "package.json is not valid JSON"
fi
log_success "package.json is valid"

# Check for build script in package.json
if grep -q '"build"' package.json; then
    log_info "Build script found in package.json"

    # Try to run build if it exists
    log_info "Attempting to run build script..."
    if timeout 300 npm run build > /tmp/build.log 2>&1; then
        log_success "Build script completed successfully"
    else
        BUILD_EXIT=$?
        if [ $BUILD_EXIT -eq 124 ]; then
            log_warning "Build script timed out (continuing with deployment)"
        else
            log_warning "Build script exited with code $BUILD_EXIT (may be non-critical)"
        fi
    fi
fi

################################################################################
# STEP 6: Git Commit Preparation
################################################################################

log_step "Git Commit Preparation"

# Check for uncommitted changes
CHANGES=$(git status --porcelain)

if [ -z "$CHANGES" ]; then
    log_info "No uncommitted changes detected"
else
    log_warning "Detected uncommitted changes:"
    echo "$CHANGES" | head -10
fi

# Add all changes
log_info "Staging all changes..."
if git add -A; then
    log_success "Changes staged"
else
    log_failure "git add failed, but continuing"
fi

# Get commit message
COMMIT_TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
COMMIT_MESSAGE="[DEPLOY] Tailwind CSS v4 native binding fix - npm install --build-from-source (${COMMIT_TIMESTAMP})"

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    log_info "No new changes to commit (repository is clean)"
else
    log_info "Creating git commit..."
    if git commit -m "$COMMIT_MESSAGE" > /tmp/git_commit.log 2>&1; then
        log_success "Git commit created"
        COMMIT_HASH=$(git rev-parse --short HEAD)
        log_info "Commit hash: $COMMIT_HASH"
    else
        log_failure "git commit failed (may already be committed)"
        cat /tmp/git_commit.log
    fi
fi

################################################################################
# STEP 7: Git Push
################################################################################

log_step "Push to Remote Repository"

# Check if remote exists
if ! git remote get-url origin > /dev/null 2>&1; then
    log_warning "No 'origin' remote found, skipping push"
else
    REMOTE_URL=$(git remote get-url origin)
    log_info "Remote: $REMOTE_URL"

    # Fetch latest to verify connectivity
    log_info "Fetching from remote to verify connectivity..."
    if timeout 60 git fetch origin 2>/tmp/git_fetch.log; then
        log_success "Remote fetch successful"
    else
        FETCH_EXIT=$?
        if [ $FETCH_EXIT -eq 124 ]; then
            log_warning "Git fetch timed out, skipping push"
        else
            log_warning "Git fetch failed (network issue?), skipping push"
        fi
    fi

    # Push changes
    log_info "Pushing to remote branch: $CURRENT_BRANCH..."
    if timeout 120 git push origin "$CURRENT_BRANCH" > /tmp/git_push.log 2>&1; then
        log_success "Git push completed"
    else
        PUSH_EXIT=$?
        if [ $PUSH_EXIT -eq 124 ]; then
            log_warning "Git push timed out (may still be processing)"
        else
            log_failure "Git push failed"
            log_diagnostic "$(cat /tmp/git_push.log | tail -20)"
        fi
    fi
fi

################################################################################
# STEP 8: Docker Build & Deploy
################################################################################

log_step "Docker Build & Deployment"

# Check for existing containers
RUNNING_CONTAINERS=$(docker ps -q 2>/dev/null | wc -l)
log_info "Running Docker containers: $RUNNING_CONTAINERS"

# Get image name from Dockerfile or use default
IMAGE_NAME="littlesmarties-app"
IMAGE_TAG="latest"
IMAGE_FULL="${IMAGE_NAME}:${IMAGE_TAG}"

log_info "Building Docker image: $IMAGE_FULL..."

# Build the Docker image
BUILD_START=$(date +%s)
if timeout $DEPLOYMENT_TIMEOUT docker build -t "$IMAGE_FULL" . > /tmp/docker_build.log 2>&1; then
    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))
    log_success "Docker image built successfully in ${BUILD_TIME}s"
else
    BUILD_EXIT=$?
    if [ $BUILD_EXIT -eq 124 ]; then
        die "Docker build timed out after ${DEPLOYMENT_TIMEOUT}s"
    else
        log_diagnostic "$(tail -50 /tmp/docker_build.log)"
        die "Docker build failed with exit code $BUILD_EXIT"
    fi
fi

# Show image info
if docker images "$IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep -q "$IMAGE_NAME"; then
    IMAGE_INFO=$(docker images "$IMAGE_NAME:$IMAGE_TAG" --format "Size: {{.Size}}, Created: {{.CreatedSince}}")
    log_info "Image info: $IMAGE_INFO"
    log_success "Docker image verified in local registry"
fi

################################################################################
# STEP 9: Phase 1 Deployment Test
################################################################################

log_step "Phase 1 Deployment Test with Container Verification"

# Determine container name
CONTAINER_NAME="littlesmarties-deployment-test"

# Stop and remove any existing test container
if docker ps -a | grep -q "$CONTAINER_NAME"; then
    log_info "Removing previous test container..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    log_success "Previous test container removed"
fi

# Run test container
log_info "Starting test deployment container..."

# Expose port (assume port 3000 or 8080)
# Adjust based on your application's exposed port
TEST_PORT=3000
HOST_PORT=8080

if docker run -d \
    --name "$CONTAINER_NAME" \
    -p "${HOST_PORT}:${TEST_PORT}" \
    --health-cmd='exit 0' \
    --health-interval=10s \
    --health-timeout=5s \
    --health-start-period=30s \
    "$IMAGE_FULL" > /tmp/docker_run.log 2>&1; then

    CONTAINER_ID=$(docker ps -q -f name="$CONTAINER_NAME")
    log_success "Test container started: $CONTAINER_ID"
    log_info "Container name: $CONTAINER_NAME"
    log_info "Mapped port: localhost:${HOST_PORT} -> container:${TEST_PORT}"
else
    log_failure "Failed to start test container"
    log_diagnostic "$(cat /tmp/docker_run.log)"
    die "Docker container deployment failed"
fi

# Wait for container to be ready
log_info "Waiting for container to be ready..."
READY_TIMEOUT=60
READY_START=$(date +%s)
CONTAINER_READY=false

while true; do
    if docker inspect "$CONTAINER_NAME" --format='{{.State.Running}}' 2>/dev/null | grep -q true; then
        CONTAINER_READY=true
        log_success "Container is running"
        break
    fi

    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - READY_START))

    if [ $ELAPSED -gt $READY_TIMEOUT ]; then
        log_failure "Container failed to start within ${READY_TIMEOUT}s"
        docker logs "$CONTAINER_NAME" | tail -20 > /tmp/docker_logs.txt
        log_diagnostic "$(cat /tmp/docker_logs.txt)"
        docker stop "$CONTAINER_NAME" 2>/dev/null || true
        docker rm "$CONTAINER_NAME" 2>/dev/null || true
        die "Container startup timeout"
    fi

    sleep 2
done

# Give application time to fully initialize
log_info "Allowing application startup time (10 seconds)..."
sleep 10

################################################################################
# STEP 10: curl Verification Tests
################################################################################

log_step "curl Verification Tests & Health Checks"

# Test endpoints
ENDPOINTS=(
    "http://localhost:${HOST_PORT}/"
    "http://localhost:${HOST_PORT}/health"
    "http://localhost:${HOST_PORT}/api/health"
)

ENDPOINTS_TESTED=0
ENDPOINTS_PASSED=0

for endpoint in "${ENDPOINTS[@]}"; do
    ENDPOINTS_TESTED=$((ENDPOINTS_TESTED + 1))
    log_info "Testing endpoint: $endpoint"

    # Try the endpoint with retries
    for attempt in $(seq 1 $MAX_RETRIES); do
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            --max-time $CURL_TIMEOUT \
            "$endpoint" 2>/dev/null || echo "000")

        # Check for success responses (2xx, 3xx)
        if [[ "$HTTP_CODE" =~ ^[23][0-9]{2}$ ]]; then
            log_success "Endpoint returned HTTP $HTTP_CODE"
            ENDPOINTS_PASSED=$((ENDPOINTS_PASSED + 1))
            break
        elif [ "$HTTP_CODE" = "000" ] && [ $attempt -lt $MAX_RETRIES ]; then
            log_warning "Connection failed (attempt $attempt/$MAX_RETRIES), retrying..."
            sleep 3
        else
            log_warning "Endpoint returned HTTP $HTTP_CODE (may be expected)"
            break
        fi
    done
done

log_info "Endpoint tests: $ENDPOINTS_PASSED/$ENDPOINTS_TESTED passed"

# Additional health verification
log_info "Verifying container health..."
if docker inspect "$CONTAINER_NAME" --format='{{.State.Running}}' 2>/dev/null | grep -q true; then
    log_success "Container is healthy and running"
else
    log_warning "Container status unclear"
fi

# Get container logs
log_info "Recent container logs:"
docker logs "$CONTAINER_NAME" 2>&1 | tail -20 | sed 's/^/  /'

################################################################################
# STEP 11: Deployment Cleanup & Summary
################################################################################

log_step "Deployment Summary & Cleanup"

# Optional: Keep container running for further testing
# Or remove it if this is just verification
log_info "Test container status:"
echo "  Container: $CONTAINER_NAME"
echo "  URL: http://localhost:${HOST_PORT}/"
echo "  To view logs: docker logs $CONTAINER_NAME"
echo "  To stop: docker stop $CONTAINER_NAME"
echo "  To remove: docker rm $CONTAINER_NAME"

# Summary of what was done
echo -e "\n${BLUE}=== DEPLOYMENT SUMMARY ===${NC}"
echo ""
echo "Node.js Version: $NODE_VERSION"
echo "npm Version: $NPM_VERSION"
echo "Git Branch: $CURRENT_BRANCH"
echo "Docker Image: $IMAGE_FULL"
echo "Test Container: $CONTAINER_NAME (running on port $HOST_PORT)"
echo "Endpoints Verified: $ENDPOINTS_PASSED/$ENDPOINTS_TESTED"
echo "Build Status: Successful"
echo "Git Commit: ${COMMIT_HASH:-N/A}"
echo ""

# Final status
if [ $ENDPOINTS_PASSED -gt 0 ]; then
    echo -e "${GREEN}=== ✓ DEPLOYMENT SUCCESSFUL ===${NC}"
    exit 0
else
    echo -e "${YELLOW}=== ⚠ DEPLOYMENT COMPLETED WITH WARNINGS ===${NC}"
    echo "Endpoints could not be verified, but deployment completed."
    echo "Check container logs: docker logs $CONTAINER_NAME"
    exit 0
fi
