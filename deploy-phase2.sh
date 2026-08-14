#!/bin/bash

# Phase 2 Deployment Script - Text Editing System
# Run this script on the VPS in /opt/littlesmarties

set -e  # Exit on any error

echo "======================================"
echo "Phase 2 Deployment - Text Editing System"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Pull Latest Code
echo -e "${YELLOW}[1/6] Pulling latest code from main branch...${NC}"
cd /opt/littlesmarties
git pull origin main
echo -e "${GREEN}✓ Code pulled successfully${NC}"
echo ""

# Step 2: Run Database Migration
echo -e "${YELLOW}[2/6] Running database migration...${NC}"
docker-compose exec -T postgres psql -U lsn -d littlesmarties << 'EOF'
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
echo -e "${GREEN}✓ Database migration completed${NC}"
echo ""

# Step 3: Verify Migration
echo -e "${YELLOW}[3/6] Verifying database migration...${NC}"
RECORD_COUNT=$(docker-compose exec -T postgres psql -U lsn -d littlesmarties -t -c "SELECT COUNT(*) FROM page_content;")
echo -e "${GREEN}✓ Created $RECORD_COUNT content records${NC}"
echo ""

# Step 4: Clear Next.js Cache
echo -e "${YELLOW}[4/6] Clearing Next.js cache...${NC}"
rm -rf apps/frontend/.next
echo -e "${GREEN}✓ Cache cleared${NC}"
echo ""

# Step 5: Build and Deploy
echo -e "${YELLOW}[5/6] Building Docker images and starting containers...${NC}"
docker-compose build
docker-compose up -d
echo -e "${GREEN}✓ Containers started${NC}"
echo ""

# Step 6: Verify Services
echo -e "${YELLOW}[6/6] Verifying services are running...${NC}"
echo ""
echo "Service Status:"
docker-compose ps
echo ""

# Health checks
echo "Health Checks:"
if curl -s http://127.0.0.1:3011/health | grep -q "ok"; then
  echo -e "${GREEN}✓ Backend is healthy${NC}"
else
  echo -e "${RED}✗ Backend health check failed${NC}"
fi

if curl -s http://127.0.0.1:3083/ > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Frontend is responsive${NC}"
else
  echo -e "${RED}✗ Frontend health check failed${NC}"
fi

echo ""
echo "======================================"
echo -e "${GREEN}✓ Phase 2 Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "Next Steps:"
echo "1. Open http://187.127.185.239:3083/admin/text-editor"
echo "2. Navigate to the Content Editor"
echo "3. Test editing and saving content"
echo "4. Verify changes persist in the database"
echo ""
echo "Database verification:"
echo "  docker-compose exec postgres psql -U lsn -d littlesmarties"
echo "  SELECT page_id, section_key, content_value FROM page_content ORDER BY page_id, display_order;"
echo ""
