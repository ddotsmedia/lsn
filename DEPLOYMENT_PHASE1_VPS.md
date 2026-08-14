# Phase 1 Deployment Guide - Little Smarties Admin Dashboard
## Modern UI Framework & Design System Upgrade

**Deployment Date**: 2026-08-14  
**VPS IP**: 187.127.185.239  
**Commit**: aa2cf65 (Phase 1: Modern UI Framework & Design System Upgrade)

---

## ✅ STEP 1: SSH INTO VPS AND VERIFY STATUS

```bash
ssh root@187.127.185.239
cd /opt/littlesmarties

# Verify current branch and status
git branch -v
git status

# Check current docker services
docker-compose ps

# Test backend health
curl http://localhost:3001/api/v1/health
```

**Expected Output:**
- Current branch should show `main` or `master`
- Docker services should show `frontend` and `backend` running
- Health endpoint returns `{"status":"ok"}` or similar

---

## ✅ STEP 2: PULL LATEST CHANGES FROM GIT

```bash
cd /opt/littlesmarties

# Fetch latest changes
git fetch origin

# Checkout main branch if not already there
git checkout main

# Pull latest Phase 1 changes (commit aa2cf65)
git pull origin main

# Verify you have the latest commit
git log --oneline -1

# Expected: Phase 1: Modern UI Framework & Design System Upgrade
```

---

## ✅ STEP 3: PREPARE ENVIRONMENT

```bash
cd /opt/littlesmarties

# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Create backup of current deployment
tar -czf backup-before-phase1-$(date +%Y%m%d-%H%M%S).tar.gz apps/frontend/.next apps/backend/dist

# Set production environment
export NODE_ENV=production
```

---

## ✅ STEP 4: BUILD PHASE 1 COMPONENTS

```bash
cd /opt/littlesmarties

# Install dependencies (if needed)
npm install --workspaces

# Clean frontend build cache
rm -rf apps/frontend/.next

# Build frontend with Phase 1 UI components
npm run build --workspace=apps/frontend

# Build backend (if needed)
npm run build --workspace=apps/backend

# Verify builds succeeded
test -d apps/frontend/.next && echo "✓ Frontend built successfully" || echo "✗ Frontend build failed"
test -d apps/backend/dist && echo "✓ Backend built successfully" || echo "✓ Backend build skipped (already compiled)"
```

**Success Indicators:**
- No error messages during build
- `.next` directory exists in apps/frontend/
- All pages compiled successfully

---

## ✅ STEP 5: UPDATE DOCKER IMAGES

```bash
cd /opt/littlesmarties

# Rebuild Docker images with latest code
docker-compose build --no-cache frontend backend

# Monitor build progress
# Note: This may take 2-5 minutes

# Verify images built successfully
docker images | grep littlesmarties

# Expected: Both frontend and backend images should be listed with latest tag
```

---

## ✅ STEP 6: DEPLOY NEW SERVICES

```bash
cd /opt/littlesmarties

# Stop current services gracefully
docker-compose down

# Wait 5 seconds for cleanup
sleep 5

# Start new deployment with Phase 1 UI
docker-compose up -d

# Wait for services to start
sleep 15

# Verify all services are running
docker-compose ps

# Check service logs
docker-compose logs --tail=20 frontend
docker-compose logs --tail=20 backend
docker-compose logs --tail=20 postgres
```

**Expected Output:**
```
NAME                  COMMAND                  SERVICE      STATUS
littlesmarties-postgres-1    "docker-entrypoint.sh postgres"    postgres    Up 2 seconds (healthy)
littlesmarties-backend-1     "node dist/index.js"               backend     Up 1 second (healthy)
littlesmarties-frontend-1    "next start"                       frontend    Up 1 second (healthy)
```

---

## ✅ STEP 7: VERIFY BACKEND ENDPOINTS

```bash
# Test API health endpoint
curl -s http://localhost:3001/api/v1/health | jq .

# Test pages endpoint
curl -s http://localhost:3001/api/v1/pages | jq '.data | length'

# Test auth endpoint
curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"AdminSecret123!"}' | jq '.token' | head -c 20

# Expected outputs:
# - Health: status: "ok" or similar
# - Pages: Shows number of pages (should be > 0)
# - Auth: Shows JWT token (starts with "eyJ")
```

---

## ✅ STEP 8: TEST FRONTEND ACCESS

```bash
# From your local machine or terminal with internet access:

# Test main site
curl -s http://187.127.185.239:3000 | grep -o "<title>.*</title>"

# Test admin login page
curl -s http://187.127.185.239:3000/admin/login | grep -o "<title>.*</title>"

# Test CORS headers
curl -s -I http://187.127.185.239:3000/admin/text-editor \
  -H "Origin: http://187.127.185.239:3000"
```

**Expected:**
- Title tags should show "Little Smarties" content
- CORS headers should include "Access-Control-Allow-Origin"

---

## ✅ STEP 9: VERIFY PHASE 1 UI FEATURES

### Test Dark Mode
1. Open http://187.127.185.239:3000/admin/login in browser
2. Log in with credentials:
   - Username: `admin`
   - Password: `AdminSecret123!`
3. Click moon icon in header → Should toggle dark mode
4. Refresh page → Dark mode preference should persist

### Test AdminLayout
1. After login, verify:
   - ✓ Header with gradient "Little Smarties" logo
   - ✓ Collapsible sidebar on desktop
   - ✓ Mobile hamburger menu (resize browser to < 1024px)
   - ✓ Logout button works

### Test Text Editor Page
1. Navigate to http://187.127.185.239:3000/admin/text-editor
2. Verify:
   - ✓ Modern card-based layout
   - ✓ Page sidebar with all pages (Home, About, Facilities, Contact, Services)
   - ✓ Section editor with proper styling
   - ✓ Image upload with preview
   - ✓ Save/Cancel buttons work
   - ✓ Success notifications appear after saving

### Test Responsive Design
1. Test on multiple viewports:
   - Desktop (1920x1080) - Sidebar visible, 4-col layout
   - Tablet (768x1024) - Sidebar toggles, 1-2 col layout
   - Mobile (375x667) - Full hamburger menu, single column

---

## ✅ STEP 10: VERIFY DATABASE INTEGRITY

```bash
# Connect to database
docker-compose exec postgres psql -U littlesmarties -d littlesmarties -c "
SELECT 
  'pages' as table_name, COUNT(*) as count 
FROM pages
UNION ALL
SELECT 'page_sections', COUNT(*) FROM page_sections;
"

# Expected: pages table ~5 rows, page_sections table ~18+ rows
```

---

## ✅ STEP 11: CHECK PERFORMANCE METRICS

```bash
# Monitor Docker resource usage
docker stats --no-stream

# Check disk space
df -h /opt/littlesmarties

# Check memory usage
free -h

# Expected:
# Frontend: < 200MB memory
# Backend: < 300MB memory
# Database: < 500MB memory
# Disk: > 2GB free space
```

---

## ✅ STEP 12: VERIFY LOGS FOR ERRORS

```bash
# Check for errors in the last 50 lines
docker-compose logs --tail=50 frontend | grep -i error
docker-compose logs --tail=50 backend | grep -i error
docker-compose logs --tail=50 postgres | grep -i error

# If no output, all services are healthy

# For detailed debugging (if issues found)
docker-compose logs --tail=100 frontend
docker-compose logs --tail=100 backend
```

---

## ⚠️ ROLLBACK PROCEDURE (IF NEEDED)

If deployment fails or issues occur:

```bash
cd /opt/littlesmarties

# Stop current deployment
docker-compose down

# Revert to previous commit
git log --oneline -5  # Find the previous stable commit
git reset --hard <commit-hash>

# Rebuild and redeploy previous version
rm -rf apps/frontend/.next
npm run build --workspace=apps/frontend
docker-compose build --no-cache frontend backend
docker-compose up -d
```

---

## 📋 DEPLOYMENT CHECKLIST

- [ ] SSH access verified
- [ ] Git latest changes pulled (commit aa2cf65)
- [ ] Environment variables set
- [ ] Backup created
- [ ] Frontend built successfully
- [ ] Backend built (or already compiled)
- [ ] Docker images rebuilt
- [ ] Services running (all 3 containers healthy)
- [ ] API health endpoint responding
- [ ] Admin login works
- [ ] Dark mode toggle works
- [ ] Text editor loads and functions
- [ ] Mobile responsive design verified
- [ ] Database tables have correct data
- [ ] No error messages in logs

---

## 📞 TROUBLESHOOTING

### Issue: Docker build fails
**Solution:**
```bash
docker-compose build --no-cache --progress=plain frontend 2>&1 | tail -50
# Check output for specific error, usually missing dependency or port in use
```

### Issue: Frontend blank page
**Solution:**
```bash
docker-compose logs frontend | tail -30
# Check for API connection errors, usually CORS or backend not responding
```

### Issue: Login fails
**Solution:**
```bash
# Check backend logs
docker-compose logs backend | grep -i "auth\|login"

# Verify password hash in database
docker-compose exec postgres psql -U littlesmarties -d littlesmarties -c \
  "SELECT username, password_hash FROM admin_users WHERE username='admin';"
```

### Issue: Disk space low
**Solution:**
```bash
# Clean docker images
docker image prune -f

# Clean docker volumes (CAUTION: deletes data!)
docker volume prune -f

# Clear npm cache
npm cache clean --force
```

---

## ✅ PHASE 1 DEPLOYMENT COMPLETE

Once all steps pass:

1. **Document Deployment Time**: Record exact time deployment started/completed
2. **Notify Team**: Share deployment confirmation with team
3. **Monitor for 24h**: Watch logs and performance metrics
4. **Plan Phase 1.5**: Start planning additional UI components

**Deployment Success Indicators:**
- All Docker containers running and healthy
- Admin dashboard accessible at 187.127.185.239:3000/admin/login
- Dark mode working correctly
- Text editor fully functional
- No error messages in logs
- Performance metrics within normal range

---

## 📝 NEXT STEPS

After Phase 1 deployment verification:

1. **Phase 1.5**: Additional UI components (Card, Input, Modal, Tabs, Select)
2. **Phase 2**: Extended admin features and pages
3. **Phase 3**: Performance optimization and PWA support
4. **Phase 4**: Production hardening and security audit

---

**Deployment Guide Created**: 2026-08-14  
**For Issues**: Check logs with `docker-compose logs -f`  
**Rollback Available**: Previous version at prior commits
