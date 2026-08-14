-- Admin page editing: audit detail + soft deletes.
--
-- Additive only. Extends the existing admin_activity_log rather than adding a
-- second audit table, so every admin action stays in one history and the
-- Activity Log page keeps working. 001-007 are untouched.
-- Numbered 008: 003 and 005-007 are taken, 004 was never used, and there is no
-- existing 008.

ALTER TABLE admin_activity_log ADD COLUMN IF NOT EXISTS old_values JSONB;
ALTER TABLE admin_activity_log ADD COLUMN IF NOT EXISTS new_values JSONB;
ALTER TABLE admin_activity_log ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE admin_activity_log ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);

-- Soft deletes. Nothing is removed from these tables any more; deleted_at is
-- stamped instead so a mistaken delete can be undone.
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE gallery_categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Partial indexes: every read filters on deleted_at IS NULL, and indexing only
-- the live rows keeps them small.
CREATE INDEX IF NOT EXISTS idx_gallery_images_live
  ON gallery_images(category_id, sort_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_gallery_categories_live
  ON gallery_categories(sort_order) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_news_events_live
  ON news_events(event_date DESC) WHERE deleted_at IS NULL;

-- The unique indexes must not block re-creating a slug/title whose previous
-- owner was soft-deleted, so scope them to live rows only.
--
-- 001 declared `slug VARCHAR(255) UNIQUE`, which creates a full unique
-- CONSTRAINT. A partial index cannot override it: deleting a category and
-- recreating it under the same slug still failed with a duplicate key. Drop the
-- constraint so only the partial index governs uniqueness.
ALTER TABLE gallery_categories DROP CONSTRAINT IF EXISTS gallery_categories_slug_key;

DROP INDEX IF EXISTS idx_gallery_categories_slug;
CREATE UNIQUE INDEX IF NOT EXISTS idx_gallery_categories_slug
  ON gallery_categories(slug) WHERE deleted_at IS NULL;

DROP INDEX IF EXISTS idx_news_events_title;
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_events_title
  ON news_events(title) WHERE deleted_at IS NULL;
