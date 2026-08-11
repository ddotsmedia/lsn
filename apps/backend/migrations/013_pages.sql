-- Brings the pages table into line with what the admin panel needs.
--
-- Background: migration 003 already defines pages, but 003 was never applied to
-- production — the live database has no pages table at all, which is why the
-- dashboard returns 500. This migration therefore has to work in both worlds:
-- create the table from scratch where 003 never ran, and additively extend it
-- where it did. Every statement is guarded, so it is safe to run in either
-- order and safe to re-run.
--
-- Additive; 001-012 untouched.

CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  -- Columns from 003, repeated so a database that never ran 003 still gets the
  -- shape routes/admin/pages.ts and seo.ts query.
  content TEXT,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  og_image TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT,
  path VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- For a database that already had 003's version of the table.
ALTER TABLE pages ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS path VARCHAR(500);
ALTER TABLE pages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 003 declared slug as UNIQUE. A full unique constraint outranks the partial
-- index below, so once a page were soft-deleted its slug could never be reused
-- — the same trap that had to be undone for gallery_categories in 008. Drop the
-- constraint (and any unique index Postgres created for it) and let the partial
-- index be the only rule.
DO $$
DECLARE
  con_name TEXT;
BEGIN
  SELECT conname INTO con_name
    FROM pg_constraint
   WHERE conrelid = 'pages'::regclass
     AND contype = 'u'
     AND pg_get_constraintdef(oid) ILIKE '%(slug)%';
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE pages DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

DROP INDEX IF EXISTS idx_pages_slug;

-- Unique among live rows only, so a slug frees up when a page is soft-deleted.
CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_slug_live
  ON pages(slug) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pages_deleted_at ON pages(deleted_at);

-- Kept from 003 for the admin list ordering.
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_sort_order ON pages(sort_order);

-- Default pages. The predicate on ON CONFLICT has to repeat the one on the
-- index, otherwise Postgres cannot infer which index to arbitrate against.
INSERT INTO pages (title, slug, path, description, status, sort_order) VALUES
  ('Home',            'home',            '/',                'Landing page with intro, age groups and featured video.', 'published', 1),
  ('About',           'about',           '/nursery',         'Mission, vision, values, team and testimonials.',         'published', 2),
  ('Gallery',         'gallery',         '/gallery',         'Photo gallery and YouTube videos.',                       'published', 3),
  ('News & Events',   'news-events',     '/events',          'Upcoming events and news items.',                         'published', 4),
  ('Contact',         'contact',         '/contact',         'Contact details, enquiry form, map and FAQ.',             'published', 5),
  ('Admin Dashboard', 'admin-dashboard', '/admin/dashboard', 'Internal admin overview. Not part of the public site.',   'draft',     6)
ON CONFLICT (slug) WHERE deleted_at IS NULL DO NOTHING;

-- Backfills path for rows that predate the column.
UPDATE pages SET path = '/' || slug WHERE path IS NULL AND deleted_at IS NULL;
