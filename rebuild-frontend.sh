#!/bin/bash
# Quick rebuild of frontend container with the fixed docker-compose.prod.yml

set -e

cd /opt/littlesmarties || { echo "Directory not found"; exit 1; }

echo "Building frontend with fixed NEXT_PUBLIC_API_URL configuration..."
docker compose -f docker-compose.prod.yml build --no-cache frontend

echo "Restarting frontend container..."
docker compose -f docker-compose.prod.yml restart frontend

echo "✓ Frontend rebuilt and restarted successfully!"
echo ""
echo "Testing frontend health..."
sleep 3
docker compose -f docker-compose.prod.yml ps frontend

echo ""
echo "Login to admin panel at: https://admin.lsn.ae"
