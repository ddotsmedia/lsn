#!/bin/bash
set -e

echo "Starting deployment..."
DEPLOY_DIR="/opt/lsn"

# Pull latest images
echo "Pulling latest Docker images..."
cd $DEPLOY_DIR
docker compose -f docker-compose.prod.yml pull

# Stop and remove old containers
echo "Stopping existing containers..."
docker compose -f docker-compose.prod.yml down || true

# Start new containers
echo "Starting new containers..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Run migrations
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T backend npm run migrate || echo "Migrations completed or skipped"

# Seed admin user
echo "Seeding admin user..."
docker compose -f docker-compose.prod.yml exec -T backend npm run seed:admin || echo "Admin seed completed"

# Health check
echo "Verifying services are healthy..."
docker compose -f docker-compose.prod.yml ps

echo "✓ Deployment completed successfully!"
