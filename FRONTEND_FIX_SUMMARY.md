# Admin Panel Login Fix - Frontend Configuration

## Problem Identified
The frontend was configured to call `http://backend:3011/api/v1` which caused:
1. **Double `/v1` path**: `/v1/auth/login` became `/v1/v1/auth/login` 
2. **Wrong port**: Backend runs on 3001, not 3011
3. **Wrong hostname**: Browser can't access Docker hostname `backend`

## Solution Applied
Removed `NEXT_PUBLIC_API_URL` from docker-compose.prod.yml so the frontend defaults to `/api` relative paths.

### How It Works Now:
1. Frontend calls `/api/v1/auth/login` (relative path)
2. Next.js server-side rewrites handle it
3. Browser requests go through nginx
4. Nginx proxies `/api/v1/*` to `http://localhost:3001/api/v1/*` ✓
5. Backend receives correct requests

## Files Changed
- `docker-compose.prod.yml` - Removed incorrect NEXT_PUBLIC_API_URL
- `rebuild-frontend.sh` - Quick rebuild script

## How to Deploy on VPS

**SSH into your VPS and run:**

```bash
cd /opt/littlesmarties
docker compose -f docker-compose.prod.yml build --no-cache frontend
docker compose -f docker-compose.prod.yml restart frontend
```

**Or use the provided script:**
```bash
cd /opt/littlesmarties
bash rebuild-frontend.sh
```

Wait 10-15 seconds for the frontend to rebuild and start.

## Test the Fix
1. Go to https://admin.lsn.ae
2. Login with: `admin@bayrotna.ae` / `SecureAccess@2k26`
3. Should redirect to dashboard (no more 401 errors)

## Expected Timeline
- Docker build: ~2-3 minutes
- Restart: ~10 seconds
- **Total: ~3 minutes to fix**
