-- Media library: one uploaded image, reused anywhere on the site.
--
-- Deviation from the brief, forced by the existing schema: the brief specified
-- SERIAL primary keys and `uploaded_by INTEGER REFERENCES users(id)`. users.id
-- is UUID, so that foreign key cannot be created — the types are incompatible.
-- Every id here is UUID, matching every other table in this database.
--
-- age_group_images.age_group_slug stays a plain VARCHAR rather than a foreign
-- key: age_groups has no slug column, only a name, and the public page works
-- from hardcoded slugs. A soft reference keeps the two independent.
--
-- Additive; 001-014 untouched.

CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(512) NOT NULL,
  -- Cloudinary returns both; public_id is what delete and transformation calls
  -- need, asset_id is the immutable handle. The brief named both columns.
  cloudinary_id VARCHAR(255),
  cloudinary_public_id VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  alt_text VARCHAR(255),
  -- Which manager uploaded it, for the library filter: 'site' | 'age-groups' | 'pages'
  category VARCHAR(50) NOT NULL DEFAULT 'pages',
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_media_cloudinary_id ON media(cloudinary_public_id);
CREATE INDEX IF NOT EXISTS idx_media_deleted_at ON media(deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_category_live
  ON media(category, created_at DESC) WHERE deleted_at IS NULL;

-- ---------------------------------------------------------------- age groups

CREATE TABLE IF NOT EXISTS age_group_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group_slug VARCHAR(100) NOT NULL,
  media_id UUID REFERENCES media(id) ON DELETE SET NULL,
  image_type VARCHAR(50) NOT NULL DEFAULT 'gallery',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_age_group_images_slug ON age_group_images(age_group_slug);
CREATE INDEX IF NOT EXISTS idx_age_group_images_type ON age_group_images(image_type);
CREATE INDEX IF NOT EXISTS idx_age_group_images_live
  ON age_group_images(age_group_slug, image_type, sort_order) WHERE deleted_at IS NULL;

-- hero, icon and banner are single slots, so assigning one replaces it rather
-- than stacking a second. gallery is excluded: it is a list by definition.
CREATE UNIQUE INDEX IF NOT EXISTS idx_age_group_images_single_slot
  ON age_group_images(age_group_slug, image_type)
  WHERE deleted_at IS NULL AND image_type <> 'gallery';

-- ------------------------------------------------------------------- site

CREATE TABLE IF NOT EXISTS site_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_key VARCHAR(100) UNIQUE NOT NULL,
  media_id UUID REFERENCES media(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------- pages

CREATE TABLE IF NOT EXISTS page_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug VARCHAR(100) NOT NULL,
  media_id UUID REFERENCES media(id) ON DELETE SET NULL,
  media_section VARCHAR(100) NOT NULL DEFAULT 'hero',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_page_media_slug ON page_media(page_slug);
CREATE INDEX IF NOT EXISTS idx_page_media_section ON page_media(media_section);
CREATE INDEX IF NOT EXISTS idx_page_media_live
  ON page_media(page_slug, media_section, sort_order) WHERE deleted_at IS NULL;

-- Every page section is a single slot, so re-assigning replaces.
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_media_single_slot
  ON page_media(page_slug, media_section) WHERE deleted_at IS NULL;
