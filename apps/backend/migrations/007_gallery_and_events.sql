-- Gallery & Events redesign. Additive only: ADD COLUMN IF NOT EXISTS and
-- CREATE INDEX IF NOT EXISTS, no changes to 001 or 002.

ALTER TABLE gallery_categories ADD COLUMN IF NOT EXISTS slug VARCHAR(120);
ALTER TABLE gallery_categories ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

UPDATE gallery_categories
SET slug = regexp_replace(lower(trim(name)), '[^a-z0-9]+', '-', 'g')
WHERE slug IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_gallery_categories_slug ON gallery_categories(slug);
CREATE INDEX IF NOT EXISTS idx_gallery_categories_sort ON gallery_categories(sort_order, name);

ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS alt_text VARCHAR(255);
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_gallery_images_category ON gallery_images(category_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_gallery_images_featured ON gallery_images(is_featured);

-- The live news_events table was rebuilt with event-shaped columns that differ
-- from 001 (which had slug/content/published_at). Adding them here too makes
-- this migration work on both shapes; every one is a no-op where it exists.
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS event_time TIME;
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS event_type VARCHAR(40) NOT NULL DEFAULT 'General';
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS age_groups VARCHAR(255);
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;

-- 001 declared slug and content NOT NULL for the old article-shaped table. The
-- event-shaped rows have neither, so relax them where they still exist. Guarded
-- because production no longer has these columns at all.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'news_events' AND column_name = 'slug') THEN
    ALTER TABLE news_events ALTER COLUMN slug DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'news_events' AND column_name = 'content') THEN
    ALTER TABLE news_events ALTER COLUMN content DROP NOT NULL;
  END IF;
END $$;

-- Titles are the only stable natural key here, and the seed relies on it to
-- stay re-runnable.
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_events_title ON news_events(title);
CREATE INDEX IF NOT EXISTS idx_news_events_date ON news_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_events_published ON news_events(is_published);
