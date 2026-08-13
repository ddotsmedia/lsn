-- Clears out the last of the two feature-slot spellings.
--
-- The Media Library's Pages tab wrote feature1/feature2/feature3 while the page
-- editor wrote feature_1/feature_2/feature_3. Migration 018 moved the old
-- spelling across, but skipped any row whose underscored name was already
-- taken — and the admin panel carried on writing the old spelling, so more
-- appeared afterwards. An image assigned that way occupies a slot no page reads.
--
-- Both writers now use the underscored form. This migration finishes the job:
-- rename where the target is free, release the assignment where it is not. The
-- image itself is untouched and stays in the media library, so nothing is lost
-- — an affected slot just needs picking again.
--
-- Additive; 001-022 untouched.

-- 1. Rename where the underscored slot is free.
UPDATE page_media
   SET media_section = 'feature_' || substring(media_section from 8),
       updated_at = CURRENT_TIMESTAMP
 WHERE media_section ~ '^feature[0-9]+$'
   AND deleted_at IS NULL
   AND NOT EXISTS (
     SELECT 1 FROM page_media taken
      WHERE taken.page_slug = page_media.page_slug
        AND taken.media_section = 'feature_' || substring(page_media.media_section from 8)
        AND taken.deleted_at IS NULL
   );

-- 2. Release the rest: the underscored slot is already filled, so these are
--    unreachable duplicates holding a name nothing renders.
UPDATE page_media
   SET deleted_at = CURRENT_TIMESTAMP
 WHERE media_section ~ '^feature[0-9]+$'
   AND deleted_at IS NULL;
