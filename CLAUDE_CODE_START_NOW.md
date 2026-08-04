# 🚀 CLAUDE CODE - START NOW
## Your Session Is Ready - Do This Right Now

---

## STEP 1: Prepare Your Environment (5 minutes)

```bash
# On your local machine, create the project directory
mkdir -p ~/projects/littlesmarties-rebuild
cd ~/projects/littlesmarties-rebuild

# Initialize git
git init
git branch -M main

# Create GitHub repo at https://github.com/new
# Then:
git remote add origin https://github.com/YOUR_USERNAME/littlesmarties-rebuild.git
```

---

## STEP 2: Run the Autopilot Script (Automated)

The autopilot script will scaffold your entire project structure automatically.

**Save this file and run it:**

```bash
# Save the file from /home/claude/claude-code-autopilot.sh
# Or create it in your project:

cat > ~/projects/littlesmarties-rebuild/setup.sh << 'EOF'
[COPY THE ENTIRE CONTENTS OF claude-code-autopilot.sh HERE]
EOF

chmod +x setup.sh

# Run the autopilot
./setup.sh
```

**What it does:**
- ✅ Creates complete monorepo structure
- ✅ Initializes backend (Express + TypeScript)
- ✅ Initializes frontend (Next.js + React + Tailwind)
- ✅ Creates Docker compose files
- ✅ Sets up deployment scripts
- ✅ Creates GitHub Actions workflows
- ✅ Pushes to GitHub
- ✅ **Takes 2-3 minutes**

---

## STEP 3: Start Your Claude Code Session

```bash
cd ~/projects/littlesmarties-rebuild
claude run "help"  # Test Claude Code CLI is working
```

---

## STEP 4: Build APIs (Use Haiku Model)

**Open the file:** `haiku-build-apis.md`

### Prompt 1: Authentication APIs

```bash
cd apps/backend

claude run "Build Express.js authentication system in TypeScript.

ROUTES (apps/backend/src/routes/auth.ts):
- POST /api/v1/auth/register { email, password, name } → { id, accessToken, refreshToken }
- POST /api/v1/auth/login { email, password } → { id, accessToken, refreshToken }
- POST /api/v1/auth/refresh { refreshToken } → { accessToken, refreshToken }
- POST /api/v1/auth/logout {} → { success: true }

FILES TO CREATE:
1. src/routes/auth.ts - Route handlers
2. src/controllers/authController.ts - Business logic
3. src/services/authService.ts - Database operations
4. src/middleware/auth.ts - JWT middleware
5. src/utils/jwt.ts - Token generation/validation
6. src/utils/hash.ts - Password hashing (bcrypt)
7. src/types/auth.ts - TypeScript interfaces
8. migrations/001_users.sql - User table schema

VALIDATION:
- Email format check
- Password min 8 chars (uppercase, number, special char)
- Unique email constraint
- Invalid credentials error handling
- Expired token handling

STRICT TYPESCRIPT + ERROR HANDLING + JSDOC COMMENTS.
NO SEED DATA."
```

Wait for Claude to complete. Then:

```bash
git add .
git commit -m "feat: authentication APIs"
```

---

### Prompt 2: Content APIs (Home, Gallery, Events)

```bash
claude run "Build content management APIs in Express.ts for home, gallery, events.

ROUTES:
A. Home (apps/backend/src/routes/home.ts):
- GET /api/v1/home/cover-images → []
- POST /api/v1/home/cover-images (admin) + file upload
- DELETE /api/v1/home/cover-images/:id (admin)

B. Gallery (apps/backend/src/routes/gallery.ts):
- GET /api/v1/gallery/categories → []
- POST /api/v1/gallery/categories (admin)
- GET /api/v1/gallery/images?category=id → []
- POST /api/v1/gallery/images (admin, file upload)
- DELETE /api/v1/gallery/images/:id (admin)

C. Events (apps/backend/src/routes/events.ts):
- GET /api/v1/events (paginated, published only)
- GET /api/v1/events/:slug
- POST /api/v1/events (admin)
- PUT /api/v1/events/:id (admin)
- DELETE /api/v1/events/:id (admin)

MIGRATIONS (ADDITIVE ONLY):
- 002_home_images.sql
- 003_gallery.sql
- 004_events.sql

FILES TO CREATE:
- routes/{home,gallery,events}.ts
- controllers/{homeController,galleryController,eventsController}.ts
- services/{homeService,galleryService,eventsService}.ts

STRICT TS, PAGINATION, IMAGE UPLOAD, ADMIN AUTH CHECK."
```

Commit when done:
```bash
git add .
git commit -m "feat: content management APIs"
```

---

### Prompt 3: Booking APIs (Registrations, Tours, Facilities)

```bash
claude run "Build facility & booking APIs in Express.ts for registrations and tours.

ROUTES:
A. Registrations (apps/backend/src/routes/registrations.ts):
- POST /api/v1/registrations { firstName, lastName, email, phone, ageGroupId }
- GET /api/v1/registrations (admin only, paginated)
- GET /api/v1/registrations/:id (admin only)
- PUT /api/v1/registrations/:id/status (admin, change status)

B. Tour Bookings (apps/backend/src/routes/bookings.ts):
- GET /api/v1/tour-bookings/availability?date=YYYY-MM-DD
- POST /api/v1/tour-bookings { name, email, phone, preferredDate, timeSlot }
- GET /api/v1/tour-bookings (admin only, paginated)
- PUT /api/v1/tour-bookings/:id/status (admin)

C. Facilities (apps/backend/src/routes/facilities.ts):
- GET /api/v1/facilities
- GET /api/v1/facilities/:id
- POST /api/v1/facilities (admin)
- PUT /api/v1/facilities/:id (admin)
- DELETE /api/v1/facilities/:id (admin)

MIGRATIONS (ADDITIVE):
- 005_registrations.sql
- 006_tour_bookings.sql
- 007_facilities.sql

TIME SLOTS LOGIC: 9am, 10am, 11am, 2pm, 3pm (max 5 per slot, check availability)

FILES:
- routes/{registrations,bookings,facilities}.ts
- controllers/*Controller.ts
- services/*Service.ts

ADMIN AUTH, VALIDATION, AVAILABILITY LOGIC."
```

Commit:
```bash
git add .
git commit -m "feat: booking and facility APIs"
```

---

### Prompt 4: Email Service

```bash
claude run "Build email notification system with SendGrid.

FILE: apps/backend/src/services/emailService.ts

FUNCTIONS:
1. sendRegistrationConfirmation(email, name, childName) - Confirmation email
2. sendTourBookingConfirmation(email, name, date, time) - Tour confirmation
3. sendAdminNotification(subject, body) - Alert admin of new bookings
4. sendPasswordReset(email, resetLink) - Password reset link

IMPLEMENTATION:
- Use SendGrid API (env: SENDGRID_API_KEY)
- HTML email templates inline
- Error handling & logging
- Non-blocking (fire and forget)

TEMPLATES:
- Registration confirmation
- Tour booking confirmation
- Admin alert on new booking

NO EXTERNAL TEMPLATE FILES - INLINE HTML.
STRICT TS, ERROR LOGGING."
```

Commit:
```bash
git add .
git commit -m "feat: email notifications service"
```

---

## STEP 5: Build Frontend Pages (Parallel)

**In another terminal:**

```bash
cd apps/frontend

claude run "Build Next.js pages for Little Smarties website.

PAGES (MOBILE-FIRST):
1. app/(home)/page.tsx - Hero, features, CTA
2. app/about/page.tsx - Mission, vision, values, team
3. app/facilities/page.tsx - List + detail views
4. app/gallery/page.tsx - Category tabs, image grid, lightbox
5. app/events/page.tsx - Event list + detail pages
6. app/contact/page.tsx - Contact form
7. app/register/page.tsx - 4-step registration form
8. app/tour-booking/page.tsx - Date picker, time selection

COMPONENTS:
- components/ui/Button.tsx, Input.tsx, Form.tsx
- components/HeroSection.tsx
- components/EventCard.tsx, FacilityCard.tsx
- components/GalleryGrid.tsx, ImageLightbox.tsx
- components/RegistrationForm.tsx (multi-step)

FORMS USE:
- React Hook Form
- Zod validation
- Error display
- Loading states

STYLING:
- Tailwind CSS
- Mobile-first (sm:, md:, lg: breakpoints)
- Dark mode support (optional)

STRICT TYPESCRIPT.
ACCESSIBILITY (ARIA LABELS, SEMANTIC HTML).
SEO META TAGS PER PAGE.
LAZY IMAGE LOADING."
```

Commit:
```bash
git add .
git commit -m "feat: frontend pages and components"
```

---

## STEP 6: Create Database Migrations

**Back in backend terminal:**

```bash
cd apps/backend

claude run "Create additive PostgreSQL migrations for Little Smarties database.

MIGRATION FILES:
1. 001_users.sql
   - users table (id, email, name, password_hash, phone, created_at, updated_at)
   - admin_users table (id, user_id, role, permissions)
   - refresh_tokens table (id, user_id, token, expires_at)

2. 002_home.sql
   - home_cover_images (id, image_url, display_order, created_at)

3. 003_gallery.sql
   - gallery_categories (id, name, slug, description)
   - gallery_images (id, category_id, image_url, title, description)

4. 004_events.sql
   - news_events (id, title, slug, content, image_url, published_at)

5. 005_registrations.sql
   - registrations (id, first_name, last_name, email, phone, age_group_id, status, created_at)
   - age_groups (id, name, min_age, max_age)

6. 006_bookings.sql
   - tour_bookings (id, visitor_name, email, phone, preferred_date, time_slot, status, created_at)

7. 007_facilities.sql
   - facilities (id, name, description, image_url, location, created_at)
   - pickup_dropoff_info (id, content, updated_at)
   - quick_links (id, title, url, order, created_at)

RULES:
- ONLY ADD NEW TABLES/COLUMNS
- NEVER MODIFY EXISTING (additive only)
- Foreign key constraints
- Indexes on frequently queried columns
- Timestamps (created_at, updated_at)

EACH FILE:
- CREATE TABLE IF NOT EXISTS (safe for re-runs)
- Comments explaining each field
- No DROP statements"
```

Commit:
```bash
git add .
git commit -m "feat: database migrations"
```

---

## STEP 7: Build Docker Images & Commit

```bash
cd ~/projects/littlesmarties-rebuild

claude run "Build Docker images, run tests, commit, and push to GitHub.

STEPS:
1. Build backend:
   cd apps/backend
   npm install
   npm run build
   docker build -t littlesmarties-backend:latest -f Dockerfile.prod .

2. Build frontend:
   cd apps/frontend
   npm install
   npm run build
   docker build -t littlesmarties-frontend:latest -f Dockerfile.prod .

3. Test local (if tests exist):
   npm test

4. Commit all:
   git add .
   git commit -m 'feat: complete build [automated]'

5. Push to GitHub:
   git push origin main

AFTER PUSH:
- GitHub Actions CI/CD triggers
- Automated tests run
- Deployment workflow starts (if configured)"
```

---

## STEP 8: Deploy to VPS

**Configure your VPS first:**

```bash
# 1. SSH to VPS
ssh user@your-vps-ip

# 2. Create shared Docker network (once)
docker network create shared-network

# 3. Create backup directory
sudo mkdir -p /backups/littlesmarties
sudo chmod 777 /backups/littlesmarties

# 4. Create .env.prod in secure location
sudo nano /etc/littlesmarties/.env.prod
# Add:
# DB_USER=lsn_prod
# DB_PASSWORD=secure-password-here
# JWT_SECRET=secure-jwt-secret-here
# SENDGRID_API_KEY=your-key
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret
# AWS_S3_BUCKET=littlesmarties-images
```

**Then deploy:**

```bash
claude run "Deploy Little Smarties website to VPS.

STEPS:
1. SSH to VPS:
   ssh ${VPS_USER}@${VPS_HOST}

2. Navigate:
   cd /opt/websites/littlesmarties-rebuild

3. Update code:
   git clone https://github.com/USERNAME/littlesmarties-rebuild.git
   (or: git pull origin main if already cloned)

4. Copy .env:
   cp /etc/littlesmarties/.env.prod .env

5. Build containers:
   docker-compose -f docker-compose.prod.yml build

6. Start services:
   docker-compose -f docker-compose.prod.yml up -d

7. Run migrations:
   docker-compose -f docker-compose.prod.yml exec -T backend npm run migrate

8. Clean frontend cache:
   rm -rf apps/frontend/.next

9. Health checks:
   curl http://localhost:3001/health
   curl http://localhost:3000

VERIFY:
- Docker containers running
- Database connected
- Frontend loading
- API responding
- Nginx proxying correctly
- SSL certificate valid"
```

---

## STEP 9: Verify Everything

```bash
# Local testing
docker-compose -f docker-compose.dev.yml up

# Test endpoints
curl http://localhost:3001/health
curl http://localhost:3000

# Check logs
docker-compose logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

---

## STEP 10: Configure Nginx on VPS

```bash
# SSH to VPS
ssh user@your-vps-ip

# Add nginx config
sudo cp infra/nginx/littlesmarties.conf /etc/nginx/sites-available/

# Enable
sudo ln -s /etc/nginx/sites-available/littlesmarties.conf /etc/nginx/sites-enabled/

# Test
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Get SSL certificate (Let's Encrypt)
sudo certbot certonly --webroot -w /var/www/html \
  -d littlesmartiesnursery.com \
  -d www.littlesmartiesnursery.com

# Reload Nginx with SSL
sudo systemctl reload nginx
```

---

## TIMELINE

| Step | Time | Status |
|------|------|--------|
| 1. Setup environment | 5 min | ⏱️ Quick |
| 2. Run autopilot | 3 min | ✅ Automated |
| 3. Claude test | 1 min | ✅ Quick |
| 4. Auth APIs | 10 min | 🚀 Haiku |
| 5. Content APIs | 8 min | 🚀 Haiku |
| 6. Booking APIs | 7 min | 🚀 Haiku |
| 7. Email service | 3 min | 🚀 Haiku |
| 8. Frontend pages | 15 min | 🚀 Haiku (parallel) |
| 9. Migrations | 5 min | ✅ Quick |
| 10. Build & push | 5 min | ⚡ Automated |
| 11. VPS deploy | 10 min | 🌐 Deployment |
| **TOTAL** | **72 min** | **PRODUCTION READY** |

---

## RULES CHECKLIST

- ✅ Model: Haiku (claude-3-5-haiku-20241022)
- ✅ Tokens: ~52K total (ultra-optimized)
- ✅ No pnpm db:seed
- ✅ Additive migrations only
- ✅ Never touch other VPS projects
- ✅ Build + commit + push after each
- ✅ Mobile-first design
- ✅ TypeScript strict mode
- ✅ rm -rf apps/frontend/.next on VPS
- ✅ 100% automated

---

## ERROR HANDLING

**If Claude run fails:**
```bash
# Check what happened
claude logs

# Retry with smaller prompt
claude run "[smaller, simpler prompt]"

# If Docker fails
docker system prune -f
docker-compose down -v

# If deployment fails
# SSH to VPS and check:
docker-compose logs -f
```

---

## YOU ARE READY

Everything is prepared:
- ✅ Autopilot script ready
- ✅ Haiku prompts optimized
- ✅ Docker configs created
- ✅ CI/CD workflows ready
- ✅ Deployment scripts prepared

**START NOW:**

```bash
cd ~/projects/littlesmarties-rebuild
bash setup.sh
# Then follow Steps 3-11 above
```

🚀 **Expected result: Production-ready website in 72 minutes**

Good luck! 🎉
