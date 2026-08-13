-- One featured image per news item.
--
-- Stored on the row rather than through the media library: the relationship is
-- one-to-one and the image has no life of its own, which is how partners.logo_url
-- and facilities.image_url already work.
--
-- Additive; 001-021 untouched.

ALTER TABLE news ADD COLUMN IF NOT EXISTS image_url VARCHAR(2048);
ALTER TABLE news ADD COLUMN IF NOT EXISTS cloudinary_id VARCHAR(500);
-- users(id), not admin_users: authentication resolves an administrator from
-- users.role, and pointing an uploader column at admin_users is what made
-- video_uploads fail its foreign key in migration 021.
ALTER TABLE news ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Keeps updated_at honest whichever code path writes the row. The controller
-- already sets it on edits; this also covers soft delete, restore and the image
-- endpoints.
CREATE OR REPLACE FUNCTION update_news_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS news_update_trigger ON news;
CREATE TRIGGER news_update_trigger BEFORE UPDATE ON news
FOR EACH ROW EXECUTE FUNCTION update_news_timestamp();
