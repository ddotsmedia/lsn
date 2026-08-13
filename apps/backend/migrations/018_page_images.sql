-- Page image slots.
--
-- Deliberately NOT a new page_images table. Migration 015 already created
-- page_media, which stores exactly this: one media row per (page, section),
-- with a partial unique index making each section a single slot. A second table
-- keyed on page_id would mean two sources of truth for the same thing, and an
-- image uploaded through the Media Library would be invisible to the page
-- editor and vice versa. The new /admin/pages/:id/images endpoints resolve the
-- page id to its slug and read and write page_media.
--
-- This migration reconciles the two naming schemes that had grown up around it.
--
-- Numbered 018, not the 007 the brief asked for: 007_gallery_and_events.sql
-- already exists and migrations apply in order.
--
-- Additive; 001-017 untouched.

-- 1. The pages table is missing two pages that have image slots and are
--    editable in the admin panel. Seeded with the same shape 013 used.
INSERT INTO pages (title, slug, path, description, status, sort_order) VALUES
  ('Facilities', 'facilities', '/facilities', 'Rooms, outdoor areas and safety information.', 'published', 7),
  ('Age Groups', 'age-groups', '/age-groups', 'The six programs and what a day looks like in each.', 'published', 8)
ON CONFLICT (slug) WHERE deleted_at IS NULL DO NOTHING;

-- 2. The brief names slots feature_1/feature_2/feature_3; the Media Library
--    wrote feature1/feature2/feature3. Settle on the underscored form and move
--    any existing rows across, so one image cannot exist under both names.
UPDATE page_media
   SET media_section = 'feature_' || substring(media_section from 8)
 WHERE media_section ~ '^feature[0-9]+$'
   AND deleted_at IS NULL
   -- Skip where the underscored name is already taken, which the partial
   -- unique index would reject.
   AND NOT EXISTS (
     SELECT 1 FROM page_media existing
      WHERE existing.page_slug = page_media.page_slug
        AND existing.media_section = 'feature_' || substring(page_media.media_section from 8)
        AND existing.deleted_at IS NULL
   );

-- 3. Assignments whose image has since been deleted are invisible in every
--    query (they are joined to media) but still hold the slot's unique index,
--    so the slot cannot be filled again. Release them.
UPDATE page_media
   SET deleted_at = CURRENT_TIMESTAMP
 WHERE deleted_at IS NULL
   AND (
     media_id IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM media m WHERE m.id = page_media.media_id AND m.deleted_at IS NULL
     )
   );

-- Same treatment for the age group slots, which have the same shape.
UPDATE age_group_images
   SET deleted_at = CURRENT_TIMESTAMP
 WHERE deleted_at IS NULL
   AND (
     media_id IS NULL
     OR NOT EXISTS (
       SELECT 1 FROM media m WHERE m.id = age_group_images.media_id AND m.deleted_at IS NULL
     )
   );

-- 4. The page editor looks a slot up by page and name on every request.
CREATE INDEX IF NOT EXISTS idx_page_media_slot
  ON page_media(page_slug, media_section) WHERE deleted_at IS NULL;
