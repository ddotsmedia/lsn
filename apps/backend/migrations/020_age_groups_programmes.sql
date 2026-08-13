-- Makes age_groups the six programmes the site actually advertises.
--
-- GET /api/v1/age-groups is specified to return "all 6 programmes with UUIDs",
-- selecting image_url and sort_order and filtering on deleted_at. None of those
-- three columns existed, so that query would have failed with
-- 'column "image_url" does not exist'; and the table held four unrelated rows
-- (Babies, Toddlers, Preschool, Pre-K) that the public site has never shown, so
-- it could not have returned six programmes either.
--
-- The six are added with the slugs the images already hang off
-- (age_group_images.age_group_slug), so one row now identifies a programme
-- everywhere: the public page, its images, and this endpoint.
--
-- The four legacy rows are soft-deleted, not dropped: registrations.age_group_id
-- references them, and a soft delete keeps that foreign key intact and the rows
-- recoverable. There are currently no registrations pointing at any of them.
--
-- Additive; 001-019 untouched.

ALTER TABLE age_groups ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE age_groups ADD COLUMN IF NOT EXISTS image_url VARCHAR(512);
ALTER TABLE age_groups ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE age_groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE age_groups ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Unique among live rows only, so a slug frees up if a programme is retired.
CREATE UNIQUE INDEX IF NOT EXISTS idx_age_groups_slug_live
  ON age_groups(slug) WHERE deleted_at IS NULL AND slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_age_groups_live
  ON age_groups(sort_order) WHERE deleted_at IS NULL;

-- The six programmes, matching the public page and the image slugs.
INSERT INTO age_groups (name, slug, description, min_age_months, max_age_months, sort_order) VALUES
  ('Bouncing Bunnies',  'bouncing-bunnies',  'A warm, nurturing introduction to the world.',        0,  12, 0),
  ('Precious Pandas',   'precious-pandas',   'Moving, talking, and exploring with confidence.',    12,  24, 1),
  ('Gentle Giraffes',   'gentle-giraffes',   'Growing minds, creative hearts, independent spirits.', 24, 36, 2),
  ('Dazzling Dolphins', 'dazzling-dolphins', 'Fostering confidence, imagination and cognitive growth.', 36, 48, 3),
  ('Fuzzy Foxes',       'fuzzy-foxes',       'Ready for school, with a focus on independence.',    48,  60, 4),
  ('Cuddly Camels',     'cuddly-camels',     'Confident, curious learners preparing for primary school.', 48, 60, 5)
ON CONFLICT (slug) WHERE deleted_at IS NULL AND slug IS NOT NULL DO UPDATE
  SET description = COALESCE(age_groups.description, EXCLUDED.description),
      min_age_months = EXCLUDED.min_age_months,
      max_age_months = EXCLUDED.max_age_months,
      sort_order = EXCLUDED.sort_order,
      updated_at = CURRENT_TIMESTAMP;

-- Retire the legacy rows. Recoverable, and their foreign key still resolves.
UPDATE age_groups SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
 WHERE deleted_at IS NULL AND slug IS NULL;

-- Carries any image already set as a programme's hero across to the column the
-- endpoint returns, so the two do not disagree on day one.
UPDATE age_groups a
   SET image_url = m.url
  FROM age_group_images agi
  JOIN media m ON m.id = agi.media_id AND m.deleted_at IS NULL
 WHERE agi.age_group_slug = a.slug
   AND agi.image_type = 'hero'
   AND agi.deleted_at IS NULL
   AND a.deleted_at IS NULL
   AND a.image_url IS DISTINCT FROM m.url;
