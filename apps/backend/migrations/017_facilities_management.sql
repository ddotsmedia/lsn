-- Brings the facilities table up to what the admin panel actually queries.
--
-- The admin list ordered by sort_order and the live table has no such column,
-- so every request returned 500 and the page showed "Failed to load
-- facilities". Create and update referenced image_url, location, meta_title,
-- meta_description and updated_at, none of which existed either, and delete was
-- a hard DELETE with no deleted_at to soft-delete into.
--
-- Live table before this migration: id, name, description, icon, created_at.
--
-- Numbered 017, not the 006 the brief asked for: 006_chatbot_analytics.sql
-- already exists and migrations are applied in order, so reusing the number
-- would make the sequence ambiguous.
--
-- Additive; 001-016 untouched, and all six existing rows are preserved.

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- sort_order rather than the brief's display_order: every other orderable table
-- here (gallery_images, page_media, age_group_images, partners) calls it
-- sort_order, and the existing handlers already query that name. Adding
-- display_order as well would leave two columns claiming to define one order.
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Existing rows all share sort_order 0, which would leave their order down to
-- whatever the planner returned. Seed it from the current created_at ordering
-- so the list starts out stable and matches what the site shows today.
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS position
    FROM facilities
   WHERE deleted_at IS NULL
)
UPDATE facilities f
   SET sort_order = ordered.position
  FROM ordered
 WHERE f.id = ordered.id
   AND f.sort_order = 0;

-- The admin list is always "not deleted, in order".
CREATE INDEX IF NOT EXISTS idx_facilities_live
  ON facilities(sort_order, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_facilities_deleted_at ON facilities(deleted_at);
