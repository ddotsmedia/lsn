#!/bin/bash

set -e

PROJECT_DIR="/opt/littlesmarties"
cd "$PROJECT_DIR" || exit 1

echo "[STEP 1] Clearing npm cache..."
npm cache clean --force

echo "[STEP 2] Removing stale dependencies..."
rm -rf node_modules package-lock.json
rm -rf apps/frontend/node_modules apps/backend/node_modules
rm -rf apps/frontend/.next apps/backend/.next

echo "[STEP 3] Installing dependencies with native bindings..."
npm install --build-from-source

echo "[STEP 4] Building frontend..."
npm run build --workspace=apps/frontend

echo "[STEP 5] Committing changes..."
git add -A
git commit -m "[DEPLOY] Tailwind v4 native binding fix - $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"

echo "[STEP 6] Pushing to remote..."
git push origin main || echo "Push failed, continuing"

echo "[STEP 7] Restarting Docker containers..."
docker-compose down
docker-compose up -d

echo "[STEP 8] Waiting for services..."
sleep 10

echo "[STEP 9] Verifying deployment..."
curl -s http://localhost:3000 > /dev/null && echo "✓ Frontend running on port 3000" || echo "✗ Frontend not responding"
curl -s http://localhost:3001 > /dev/null && echo "✓ Backend running on port 3001" || echo "✗ Backend not responding"

echo ""
echo "=== ✓ DEPLOYMENT COMPLETE ==="
