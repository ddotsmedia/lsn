-- Page view tracking.
--
-- Like 013, this has to cope with both states: migration 003 defines
-- page_analytics but was never applied to production, so the live database has
-- no such table. The columns from 003 are repeated here so a database that
-- never ran it still gets the shape routes/admin/analytics.ts queries
-- (page_path, visitor_id, referrer, device_type, browser, session_duration),
-- and the new columns are added on top.
--
-- No soft delete: these rows are append-only events, not content. They are
-- pruned by age, never edited.
--
-- Additive; 001-012 untouched.

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
  page_id UUID,
  visitor_ip VARCHAR(64),
  referer TEXT,
  session_id VARCHAR(64),
  visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- For a database that already had 003's version of the table.
ALTER TABLE page_analytics ADD COLUMN IF NOT EXISTS page_id UUID;
-- Wide enough for an IPv6 address; VARCHAR rather than INET so a proxy header
-- that is not a clean address is stored rather than rejected.
ALTER TABLE page_analytics ADD COLUMN IF NOT EXISTS visitor_ip VARCHAR(64);
-- 003 spelled this "referrer". The spec asks for "referer", which is also how
-- the HTTP header spells it. Both exist; the middleware writes both so either
-- reader works.
ALTER TABLE page_analytics ADD COLUMN IF NOT EXISTS referer TEXT;
ALTER TABLE page_analytics ADD COLUMN IF NOT EXISTS session_id VARCHAR(64);
ALTER TABLE page_analytics ADD COLUMN IF NOT EXISTS visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- ON DELETE SET NULL: deleting a page must not delete its traffic history.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'page_analytics'::regclass
       AND conname = 'fk_page_analytics_page'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'pages'
  ) THEN
    ALTER TABLE page_analytics
      ADD CONSTRAINT fk_page_analytics_page
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_page_analytics_page_id ON page_analytics(page_id);
CREATE INDEX IF NOT EXISTS idx_page_analytics_visited_at ON page_analytics(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_analytics_session_id ON page_analytics(session_id);

-- Serves the middleware's "has this session already been counted for this page
-- recently?" check, which is the hottest query on the table.
CREATE INDEX IF NOT EXISTS idx_page_analytics_dedupe
  ON page_analytics(session_id, page_path, visited_at DESC);

-- Kept from 003 for the existing analytics screens.
CREATE INDEX IF NOT EXISTS idx_page_analytics_page_path ON page_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_page_analytics_created_at ON page_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_analytics_device_type ON page_analytics(device_type);
CREATE INDEX IF NOT EXISTS idx_page_analytics_visitor_id ON page_analytics(visitor_id);

-- Rows that predate the column keep a sensible visited_at.
UPDATE page_analytics SET visited_at = created_at WHERE visited_at IS NULL;
