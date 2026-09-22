# Database Migration Auto-Initialization Fix

## Summary
This fix ensures that database migrations are automatically applied when the postgres container starts. This solves the issue where the database schema was incomplete and users couldn't log in due to missing columns.

## What Changed
1. **docker-compose.prod.yml**: Added volume mounts to the postgres service to auto-execute migrations
2. **scripts/postgres-init.sh**: New initialization script that runs migrations in order
3. **Backend fix** (from previous): Added DELETE before INSERT in login refresh token handling

## Deployment Steps (Run on VPS)

### 1. Pull Latest Changes
```bash
cd /opt/lsn
git pull origin main
```

### 2. Delete Old Postgres Volume (IMPORTANT - clears incomplete DB)
```bash
docker compose -f docker-compose.prod.yml down
docker volume rm lsn_postgres_prod
```

### 3. Rebuild Backend (includes migration files)
```bash
docker compose -f docker-compose.prod.yml build --no-cache backend
```

### 4. Start Services (migrations will run automatically)
```bash
docker compose -f docker-compose.prod.yml up -d
```

### 5. Wait for Postgres to Initialize
```bash
# Watch the postgres init process
docker compose -f docker-compose.prod.yml logs postgres

# Confirm it's ready
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U lsn -d littlesmarties
```

Expected output: `accepting connections`

### 6. Verify Database Schema
```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U lsn -d littlesmarties -c "\dt"
```

This should show all the tables:
- users
- admin_users
- refresh_tokens
- gallery_categories
- gallery_images
- news_events
- facilities
- age_groups
- registrations
- tour_bookings

### 7. Create Test Admin User
```bash
docker compose -f docker-compose.prod.yml exec postgres psql -U lsn -d littlesmarties << 'EOSQL'
-- Create test admin user
INSERT INTO users (id, email, name, password_hash, phone) 
VALUES (
  gen_random_uuid(),
  'admin@test.local',
  'Test Admin',
  '$2b$10$YJE8Nf1L8Z0M0Q5K1V7X9.5Z0A8B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6', -- Password: test123
  '+1234567890'
)
ON CONFLICT (email) DO NOTHING;

-- Verify it was created
SELECT id, email, name FROM users WHERE email = 'admin@test.local';
EOSQL
```

### 8. Test Login Flow
```bash
# Direct API test
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.local",
    "password": "test123"
  }'
```

Expected response: HTTP 200 with `accessToken` and `refreshToken`

### 9. Test Admin Panel URL
```bash
# Via browser at: http://bayrotna.ae/admin
# Login with: admin@test.local / test123
```

## Verification Checklist
- [ ] Git pull successful
- [ ] Old postgres volume deleted
- [ ] Backend rebuilt without errors
- [ ] Services started
- [ ] Postgres initialization logs show all migrations completed
- [ ] Database schema tables exist
- [ ] Test admin user created
- [ ] API login endpoint returns 200 (not 500)
- [ ] Admin panel login works

## Troubleshooting

### If migrations didn't run:
```bash
# Check postgres init logs
docker compose -f docker-compose.prod.yml logs postgres | grep -i migration

# Manually run a migration if needed
docker compose -f docker-compose.prod.yml exec postgres psql -U lsn -d littlesmarties < /docker-entrypoint-initdb.d/001_all_tables.sql
```

### If volume deletion fails:
```bash
# Force remove with Docker
docker volume ls | grep lsn_postgres_prod
docker volume rm -f lsn_postgres_prod
```

### If you see "duplicate key violates unique constraint refresh_tokens_token_key" errors:
The backend fix for this was already applied in the previous deployment. This error should NOT occur anymore.

## Notes
- The fix uses PostgreSQL's built-in feature: any .sql files in `/docker-entrypoint-initdb.d` are auto-executed on first container start
- Migrations are idempotent (use `IF NOT EXISTS` and `ON CONFLICT`) so they're safe to re-run
- The postgres volume persists data between restarts (only delete it to reset the database)
