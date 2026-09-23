# Backend Login Fix - Deployment Instructions

## Problem Fixed
**Error**: "duplicate key value violates unique constraint refresh_tokens_token_key"
**Root Cause**: Login function was not deleting old refresh tokens before creating new ones
**Impact**: Users could not log in if they had previously logged in (second login attempt fails)

## Solution Applied
Modified `/apps/backend/src/controllers/authController.ts` in the `login()` function:
- Added: `await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);`
- This deletes all old tokens for the user before creating a new one
- Pattern matches the existing logic in the `refresh()` function (line ~127)

## Git Commit
```
Commit: 54a0044
Message: "Fix: delete old refresh tokens before creating new ones in login"
Branch: main
```

## Deployment - Quick Steps for VPS

### Option 1: Pull from Git (Easiest)
If your VPS has git configured to pull from the repository:
```bash
cd /opt/lsn
git pull origin main
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache backend
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs backend | grep "listening"
```

### Option 2: Direct File Replacement
Copy the fixed authController.ts directly:
```bash
# From your local machine:
scp apps/backend/src/controllers/authController.ts admin@lsn.ae:/opt/lsn/apps/backend/src/controllers/

# Then on the VPS:
cd /opt/lsn
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache backend
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs backend | grep "listening"
```

### Option 3: One-liner Deploy (if git is set up)
```bash
cd /opt/lsn && git pull origin main && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml build --no-cache backend && docker compose -f docker-compose.prod.yml up -d && sleep 5 && docker compose -f docker-compose.prod.yml logs backend | grep "listening"
```

## Verify the Fix
After deployment, test login:
1. Open https://bayrotna.ae/admin
2. Enter credentials
3. If you get redirected to dashboard, login works! ✓
4. Check browser console: should show successful auth/me response

## Rollback (if needed)
```bash
cd /opt/lsn
# A backup was created during deployment
git checkout HEAD~1 -- apps/backend/src/controllers/authController.ts
docker compose -f docker-compose.prod.yml build --no-cache backend
docker compose -f docker-compose.prod.yml up -d
```

## Code Change Summary
```diff
const accessToken = generateToken(user.id, { email: user.email, role: user.role });
const refreshToken = generateRefreshToken(user.id);

+   // Delete old refresh tokens before creating a new one
+   await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);
    await db.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
      [user.id, refreshToken]
    );
```

