# Phase 2 Deployment - Text Editing System

## Overview
This deployment adds a content management system for non-technical staff to edit page text through an admin dashboard.

## Deployment Checklist

### Step 1: Pull Latest Code on VPS
```bash
cd /opt/littlesmarties
git pull origin main
```

### Step 2: Run Database Migration
Connect to PostgreSQL and execute the migration:

```bash
docker-compose exec postgres psql -U lsn -d littlesmarties << 'EOF'
-- Phase 2 Deployment: Text Editing System
-- Create page_content table for managing editable content

CREATE TABLE IF NOT EXISTS page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id VARCHAR(255) NOT NULL,
  section_key VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) DEFAULT 'text',
  content_value TEXT,
  display_order INTEGER DEFAULT 0,
  is_editable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_page_content_page_id ON page_content(page_id);
CREATE INDEX IF NOT EXISTS idx_page_content_section ON page_content(page_id, section_key);

-- Seed initial home page content sections
INSERT INTO page_content (page_id, section_key, content_type, content_value, display_order, is_editable) VALUES
('home', 'hero_title', 'text', 'Welcome to Little Smarties', 1, true),
('home', 'hero_subtitle', 'text', 'Quality early childhood education and care', 2, true),
('home', 'about_title', 'text', 'About Us', 3, true),
('home', 'about_description', 'text', 'We provide a nurturing environment for children to learn and grow.', 4, true),
('home', 'facilities_title', 'text', 'Our Facilities', 5, true),
('home', 'contact_cta', 'text', 'Get in touch to learn more', 6, true)
ON CONFLICT (page_id, section_key) DO NOTHING;

-- Seed initial about page content sections
INSERT INTO page_content (page_id, section_key, content_type, content_value, display_order, is_editable) VALUES
('about', 'page_title', 'text', 'About Little Smarties', 1, true),
('about', 'mission', 'text', 'Our mission is to provide the highest quality early childhood education.', 2, true),
('about', 'vision', 'text', 'We envision a world where every child has access to quality education.', 3, true)
ON CONFLICT (page_id, section_key) DO NOTHING;

-- Seed initial facilities page content sections
INSERT INTO page_content (page_id, section_key, content_type, content_value, display_order, is_editable) VALUES
('facilities', 'page_title', 'text', 'Our Facilities', 1, true),
('facilities', 'intro', 'text', 'State-of-the-art facilities designed for learning and play.', 2, true)
ON CONFLICT (page_id, section_key) DO NOTHING;

-- Seed initial contact page content sections
INSERT INTO page_content (page_id, section_key, content_type, content_value, display_order, is_editable) VALUES
('contact', 'page_title', 'text', 'Contact Us', 1, true),
('contact', 'intro', 'text', 'We would love to hear from you. Get in touch with us today.', 2, true)
ON CONFLICT (page_id, section_key) DO NOTHING;
EOF
```

### Step 3: Verify Database Migration
```bash
docker-compose exec postgres psql -U lsn -d littlesmarties -c "SELECT page_id, section_key, content_value FROM page_content ORDER BY page_id, display_order;"
```

Expected output: Should show 13 rows with page content sections.

### Step 4: Clear Next.js Cache
```bash
rm -rf apps/frontend/.next
```

### Step 5: Build and Deploy
```bash
docker-compose build
docker-compose up -d
docker-compose ps
```

All three services (postgres, backend, frontend) should be running.

### Step 6: Verify Services Health
```bash
# Check backend health
curl http://127.0.0.1:3011/health

# Check frontend health  
curl -I http://127.0.0.1:3083/
```

### Step 7: Test Admin Dashboard

1. Open browser and go to: http://187.127.185.239:3083/admin/text-editor
2. You should see the Content Editor with page tabs (Home, About, Facilities, Contact)
3. Click on each page tab and verify content loads
4. Try editing a text field:
   - Click "Edit" button
   - Modify the text
   - Click "Save"
   - Verify "✓ Saved!" message appears
   - Refresh the page and confirm changes persist

### Step 8: Verify Content Persistence

Query the database to confirm changes were saved:
```bash
docker-compose exec postgres psql -U lsn -d littlesmarties -c "SELECT page_id, section_key, content_value, updated_at FROM page_content WHERE page_id = 'home' ORDER BY display_order;"
```

## Implementation Details

### New Files Created

1. **Backend Route**: `apps/backend/src/routes/pageContent.ts`
   - GET /api/v1/pages/:pageSlug/content
   - GET /api/v1/pages/:pageSlug/content/:sectionKey
   - PUT /api/v1/pages/:pageSlug/content/:sectionKey

2. **Frontend Hook**: `apps/frontend/hooks/usePageContent.ts`
   - Fetches page content
   - Provides updateContent function
   - Error handling and loading states

3. **Admin Dashboard**: `apps/frontend/app/admin/text-editor/page.tsx`
   - Multi-page content editor
   - Tab navigation for different pages
   - Inline text editing
   - Real-time save feedback
   - Mobile-responsive design

4. **Database Migration**: `migrations/001_create_page_content_table.sql`
   - Creates page_content table
   - Creates indexes for performance
   - Seeds initial content

### API Endpoints

```
GET  /api/v1/pages/:pageSlug/content
     Returns all content sections for a page

GET  /api/v1/pages/:pageSlug/content/:sectionKey  
     Returns a specific content section

PUT  /api/v1/pages/:pageSlug/content/:sectionKey
     Updates a specific content section
     Body: { "content_value": "new content" }
```

### Database Schema

```sql
CREATE TABLE page_content (
  id UUID PRIMARY KEY,
  page_id VARCHAR(255) NOT NULL,
  section_key VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) DEFAULT 'text',
  content_value TEXT,
  display_order INTEGER DEFAULT 0,
  is_editable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(page_id, section_key)
);
```

## Troubleshooting

### Admin dashboard not loading
- Check that backend is running: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`
- Verify API URL in frontend environment variables

### Content not saving
- Check backend logs: `docker-compose logs backend`
- Verify database connection: `docker-compose logs postgres`
- Ensure page_id and section_key exist in database

### Database errors
- Verify PostgreSQL is running: `docker-compose ps postgres`
- Check database logs: `docker-compose logs postgres`
- Re-run migration if needed

## Session Rules Compliance

✓ No pnpm db:seed commands executed
✓ Only additive migrations (new table, no modifications to existing tables)
✓ Only littlesmarties project modified
✓ TypeScript strict mode maintained
✓ Mobile-responsive design implemented
✓ .next cache cleared before build
✓ Full build+commit+push workflow completed
✓ Docker deployment configured

## Rollback Instructions

If issues occur after deployment:

```bash
# Stop containers
docker-compose down

# Revert to previous version
git revert HEAD

# Optionally drop the new table (if needed)
docker-compose exec postgres psql -U lsn -d littlesmarties -c "DROP TABLE IF EXISTS page_content;"

# Rebuild and redeploy
docker-compose build
docker-compose up -d
```

## Next Steps

1. Verify admin dashboard is accessible
2. Test content editing functionality
3. Monitor logs for any errors
4. Train staff on using the text editor
5. Add more pages/sections as needed via database inserts
