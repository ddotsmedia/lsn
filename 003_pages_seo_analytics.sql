-- ============================================================================
-- Little Smarties - 003_pages_seo_analytics
--
-- Additive only. Every statement is guarded so the file is safe to re-run.
-- Adds: pages (CMS), site_settings (global config), page_analytics (tracking).
-- ============================================================================

-- Pages table — each row is one manageable site page.
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  og_image TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_sort_order ON pages(sort_order);

-- Site-wide settings stored as key → JSONB.
-- Examples: { key: 'seo_defaults', value: { meta_title: '...', meta_description: '...' } }
--           { key: 'analytics',    value: { ga_tracking_id: 'G-XXXXX', gtm_id: 'GTM-YYYY' } }
--           { key: 'robots_txt',   value: { content: 'User-agent: *\nAllow: /' } }
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Lightweight server-side page-view analytics.
CREATE TABLE IF NOT EXISTS page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path VARCHAR(500) NOT NULL,
  visitor_id VARCHAR(255),
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  session_duration INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_analytics_page_path ON page_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_page_analytics_created_at ON page_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_analytics_device_type ON page_analytics(device_type);
CREATE INDEX IF NOT EXISTS idx_page_analytics_visitor_id ON page_analytics(visitor_id);

-- Seed default site settings so the admin panel has rows to update.
INSERT INTO site_settings (key, value) VALUES
  ('seo_defaults', '{"meta_title": "Little Smarties Nursery | Premium Early Learning in Abu Dhabi", "meta_description": "Little Smarties Nursery provides outstanding early years education in Abu Dhabi with British & EYFS curriculum for children aged 18 months to 5 years.", "meta_keywords": "nursery, abu dhabi, early learning, EYFS, british curriculum"}'),
  ('analytics', '{"ga_tracking_id": "", "gtm_id": "", "enable_server_analytics": true}'),
  ('robots_txt', '{"content": "User-agent: *\nAllow: /\nSitemap: https://www.littlesmartiesnursery.com/sitemap.xml"}'),
  ('sitemap', '{"auto_generate": true, "change_frequency": "weekly", "priority_home": 1.0, "priority_pages": 0.8}')
ON CONFLICT (key) DO NOTHING;

-- Add SEO metadata columns to news_events if not present.
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS meta_keywords TEXT;

-- Add SEO metadata columns to facilities if not present.
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS meta_description TEXT;
