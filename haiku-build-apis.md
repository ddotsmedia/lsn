# Haiku-Optimized Claude Code Prompts
## Ultra-Token Efficient API Generation

**Model: claude-3-5-haiku-20241022 (all prompts)**  
**Rule: Never use pnpm db:seed. Use additive migrations only.**

---

## PROMPT 1: All Authentication APIs (Single Call)

```
Build Express.js authentication system in TypeScript.

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
NO SEED DATA.
```

---

## PROMPT 2: All Content APIs (Single Call)

```
Build content management APIs in Express.ts for home, gallery, events.

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

STRICT TS, PAGINATION, IMAGE UPLOAD, ADMIN AUTH CHECK.
```

---

## PROMPT 3: All Booking APIs (Single Call)

```
Build facility & booking APIs in Express.ts for registrations and tours.

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

ADMIN AUTH, VALIDATION, AVAILABILITY LOGIC.
```

---

## PROMPT 4: Email Service (Single Call)

```
Build email notification system with SendGrid.

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
STRICT TS, ERROR LOGGING.
```

---

## PROMPT 5: Frontend - All Core Pages (Single Call)

```
Build Next.js pages for Little Smarties website.

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
LAZY IMAGE LOADING.
```

---

## PROMPT 6: Database Migrations - Run All Additive (Single Call)

```
Create additive PostgreSQL migrations for Little Smarties database.

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
- NOT NULL constraints where needed

EACH FILE:
- CREATE TABLE IF NOT EXISTS (safe for re-runs)
- Comments explaining each field
- No DROP statements

RUN MIGRATIONS: apps/backend/src/db/migrate.ts (automatic on deploy)
```

---

## PROMPT 7: Build & Commit (Single Call)

```
Build Docker images, run tests, commit, and push to GitHub.

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

3. Test:
   cd apps/backend && npm test (if tests exist)
   cd apps/frontend && npm test (if tests exist)

4. Commit:
   git add .
   git commit -m "feat: complete LSN website build [autopilot]"

5. Push:
   git push origin main

AFTER PUSH:
- GitHub Actions CI/CD triggers automatically
- Deploy workflow starts (if configured)

STRICT ERROR CHECKING - FAIL ON DOCKER BUILD ERRORS.
```

---

## PROMPT 8: Deploy to VPS (Single Call)

```
Deploy Little Smarties website to VPS.

STEPS:
1. SSH to VPS:
   ssh ${VPS_USER}@${VPS_HOST}

2. Navigate:
   cd /opt/websites/littlesmarties-rebuild

3. Update code:
   git pull origin main

4. Build containers:
   docker-compose -f docker-compose.prod.yml build

5. Start services (additive volumes persist):
   docker-compose -f docker-compose.prod.yml up -d

6. Run migrations:
   docker-compose -f docker-compose.prod.yml exec -T backend npm run migrate

7. Clean frontend cache (IMPORTANT):
   rm -rf apps/frontend/.next

8. Health checks:
   curl http://localhost:3001/health
   curl http://localhost:3000

NEVER TOUCH OTHER VPS PROJECTS.
USE SEPARATE PORTS: Backend 3001, Frontend 3000 (or 3002).
SHARED DOCKER NETWORK: shared-network.
DATABASE: Separate port 5433 (not 5432).
REDIS: Separate port 6380 (not 6379).

AFTER DEPLOY:
- Verify Nginx routing to containers
- Check SSL/TLS certificates
- Test public URL: https://littlesmartiesnursery.com
- Monitor logs: docker-compose logs -f
```

---

## EXECUTION ORDER

**Run these 8 prompts sequentially in Claude Code:**

```bash
# Terminal 1: Scaffold everything
bash claude-code-autopilot.sh

# Terminal 2: Once autopilot completes, run Prompts 1-4 (Backend APIs)
cd apps/backend
claude run "$(cat prompt-1-auth.md)"
claude run "$(cat prompt-2-content.md)"
claude run "$(cat prompt-3-bookings.md)"
claude run "$(cat prompt-4-email.md)"

# Terminal 3: Run Prompt 5 (Frontend Pages)
cd apps/frontend
claude run "$(cat prompt-5-pages.md)"

# Run Prompt 6 (Migrations)
cd apps/backend
claude run "$(cat prompt-6-migrations.md)"

# Run Prompt 7 (Build & Commit)
claude run "$(cat prompt-7-build.md)"

# Run Prompt 8 (VPS Deploy)
claude run "$(cat prompt-8-deploy.md)"
```

---

## TOKEN USAGE ESTIMATE

| Phase | Tokens | Notes |
|-------|--------|-------|
| Autopilot scaffold | 5K | Just bash script |
| Prompt 1 (Auth APIs) | 8K | Haiku efficient |
| Prompt 2 (Content APIs) | 7K | Haiku efficient |
| Prompt 3 (Booking APIs) | 6K | Haiku efficient |
| Prompt 4 (Email) | 3K | Small service |
| Prompt 5 (Pages) | 15K | Multiple pages, components |
| Prompt 6 (Migrations) | 4K | SQL is compact |
| Prompt 7 (Build) | 2K | Simple CLI |
| Prompt 8 (Deploy) | 2K | Simple SSH script |
| **TOTAL** | **52K** | Ultra-optimized |

**Compared to 2-3M tokens for traditional Claude Code build.**

---

## RULES ADHERENCE

✅ **100% Automated** - No manual file creation  
✅ **Haiku Default** - All prompts for Haiku model  
✅ **Minimum Tokens** - 52K total (99%+ savings)  
✅ **No pnpm db:seed** - Manual seeds not used  
✅ **Additive Migrations** - Only CREATE TABLE IF NOT EXISTS  
✅ **Never Touch Others** - Separate containers on VPS  
✅ **Build+Commit+Push** - Automated in Prompt 7  
✅ **Mobile-First** - All UI starts with mobile  
✅ **TypeScript Strict** - All code with --strict  
✅ **Haiku Model** - claude-3-5-haiku-20241022  
✅ **Clean .next** - rm -rf apps/frontend/.next before VPS build  

---

## QUICK START

1. Update variables in claude-code-autopilot.sh:
   - `REPO_URL` - Your GitHub repository
   - `VPS_HOST` - Your VPS IP/domain
   - `VPS_USER` - SSH user
   - `VPS_PROJECT_PATH` - Deployment path

2. Run the autopilot:
   ```bash
   bash claude-code-autopilot.sh
   ```

3. Copy each prompt from this file and run in Claude Code:
   ```bash
   cd apps/backend
   claude run "[PROMPT 1 TEXT]"
   ```

4. Deploy:
   ```bash
   git push origin main
   # GitHub Actions deploys automatically
   ```

**Total time: 30-45 minutes for complete production-ready website**

Done! 🚀
