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
