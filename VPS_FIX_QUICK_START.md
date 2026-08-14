# 🔧 VPS Phase 1 Deployment Fix - Quick Start Guide

## 📋 ONE-COMMAND DEPLOYMENT FIX

Run this single command on the VPS to fix Phase 1 deployment:

```bash
ssh root@187.127.185.239 << 'EOF'
cd /opt/littlesmarties
bash fix-phase1-deployment.sh
EOF
```

Or if already SSH'd into the VPS:

```bash
cd /opt/littlesmarties
bash ./fix-phase1-deployment.sh
```

---

## ⏱️ EXPECTED EXECUTION TIME

| Phase | Action | Time |
|-------|--------|------|
| 1 | Diagnosis | 30 sec |
| 2 | Cleanup | 1 min |
| 3 | Git Update | 1 min |
| 4 | npm Install | 2 min |
| 5 | Frontend Build | 2-3 min |
| 6 | Docker Build | 3-5 min |
| 7 | Services Start | 1-2 min |
| 8 | Verification | 1-2 min |
| **TOTAL** | **Complete Rebuild** | **~12-15 minutes** |

---

## 🚀 WHAT THE SCRIPT DOES

### Diagnosis Phase
✓ Verifies Phase 1 components exist  
✓ Checks Docker status  
✓ Reviews git history  

### Cleanup Phase
✓ Stops Docker services  
✓ Clears build caches (.next, node_modules cache, .turbo)  
✓ Removes old Docker images  
✓ Cleans npm cache  

### Build Phase
✓ Updates code from git (pulls main/master)  
✓ Installs dependencies  
✓ Builds frontend with Phase 1 components  
✓ Rebuilds Docker images  

### Deployment Phase
✓ Starts all services  
✓ Waits for services to be ready  
✓ Verifies backend health  
✓ Checks database integrity  
✓ Commits results to git  

---

## ✅ SUCCESS INDICATORS

After the script completes, you should see:

```
╔════════════════════════════════════════════════════════════════╗
║              PHASE 1 DEPLOYMENT COMPLETE ✅                    ║
╚════════════════════════════════════════════════════════════════╝

✅ Deployment Summary:
  Frontend URL:    http://187.127.185.239:3000
  Admin URL:       http://187.127.185.239:3000/admin/login
  Backend API:     http://187.127.185.239:3001/api/v1

✅ Phase 1 Components:
  ✓ Modern design system with Tailwind
  ✓ AdminLayout with sidebar and header
  ✓ Button component with variants
  ✓ Dark mode support
  ✓ Responsive layout
  ✓ Enhanced text editor interface
```

---

## 📝 VERIFICATION AFTER DEPLOYMENT

### 1. Quick Test (3 minutes)
```bash
# Test frontend
curl -s http://187.127.185.239:3000/admin/login | grep -o "<title>.*</title>"

# Test backend
curl -s http://187.127.185.239:3001/api/v1/health

# Check services
docker-compose ps
```

### 2. Visual Test (5 minutes)
1. Open http://187.127.185.239:3000/admin/login in browser
2. Log in with:
   - Username: `admin`
   - Password: `AdminSecret123!`
3. Verify:
   - ✓ Header displays with gradient logo
   - ✓ Sidebar shows pages
   - ✓ Text editor loads
   - ✓ Dark mode toggle works (moon icon)

### 3. Comprehensive Test (30 minutes)
Use the **PHASE1_TESTING_CHECKLIST.md** for full QA testing

---

## 🔍 MONITORING DURING DEPLOYMENT

Watch the build progress:

```bash
# Real-time logs
docker-compose logs -f frontend backend

# Resource usage
watch -n 5 'docker stats --no-stream'

# Git status
cd /opt/littlesmarties
git status
git log -3 --oneline
```

---

## ⚠️ TROUBLESHOOTING

### If script fails during build:

1. **Check disk space**
   ```bash
   df -h /opt/littlesmarties
   # Need at least 2GB free
   ```

2. **Check Docker is running**
   ```bash
   docker-compose ps
   # Should show running containers
   ```

3. **Manual retry**
   ```bash
   cd /opt/littlesmarties
   docker-compose down
   ./fix-phase1-deployment.sh
   ```

### If frontend shows blank page:

1. **Check backend logs**
   ```bash
   docker-compose logs backend | tail -50
   ```

2. **Verify API connection**
   ```bash
   curl -s http://localhost:3001/api/v1/health
   ```

3. **Check browser console**
   - Open developer tools (F12)
   - Look for red error messages
   - Note any CORS or API errors

### If login fails:

1. **Check database**
   ```bash
   docker-compose exec postgres psql -U littlesmarties -d littlesmarties -c \
     "SELECT * FROM admin_users WHERE username='admin';"
   ```

2. **Verify password hash**
   ```bash
   # Should see a bcrypt hash starting with $2a$ or $2b$
   ```

3. **Check backend logs**
   ```bash
   docker-compose logs backend | grep -i "auth\|login" | tail -20
   ```

---

## 🔄 ROLLBACK (IF NEEDED)

If something goes wrong, rollback to previous version:

```bash
cd /opt/littlesmarties
docker-compose down
git reset --hard eebe203  # Previous stable commit
git pull origin main
docker-compose build --no-cache frontend backend
docker-compose up -d
```

---

## 📊 BUILD VERIFICATION

After successful deployment, verify:

```bash
# Check build size
du -sh apps/frontend/.next

# Check Docker images
docker images | grep littlesmarties

# Check services running
docker-compose ps

# Check logs for errors
docker-compose logs --tail=50 frontend backend | grep -i "error"

# Check database
docker-compose exec postgres psql -U littlesmarties -d littlesmarties -c \
  "SELECT COUNT(*) FROM pages; SELECT COUNT(*) FROM page_sections;"
```

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before running the fix script:

- [ ] SSH access to VPS confirmed
- [ ] At least 2GB disk space available
- [ ] Docker daemon is running
- [ ] Previous backup exists (or you're OK with rebuilding)
- [ ] Team notified of maintenance window

---

## 🎯 POST-DEPLOYMENT CHECKLIST

After the script completes:

- [ ] Script completed without errors
- [ ] Services are running (docker-compose ps)
- [ ] Backend API responding (curl health check)
- [ ] Frontend loads in browser
- [ ] Admin login works
- [ ] Text editor page loads
- [ ] Dark mode toggle works
- [ ] No errors in logs

---

## 📞 SUPPORT

If you encounter issues:

1. **Check logs**: `docker-compose logs -f`
2. **Verify build**: `ls -la apps/frontend/.next/`
3. **Test API**: `curl http://localhost:3001/api/v1/health`
4. **Review script output**: Look for any ✗ marks

---

## 🎉 SUCCESS

Once deployed successfully:

✅ Phase 1 Modern UI Framework is live  
✅ AdminLayout and design system active  
✅ Dark mode working  
✅ Text editor with new UI  
✅ Ready for QA testing

Next: Use **PHASE1_TESTING_CHECKLIST.md** for comprehensive testing

---

**Script Version**: 1.0  
**Created**: August 14, 2026  
**Status**: Production Ready
