-- Partner logos for the homepage "Our Partners" strip.
--
-- A partner is its own record rather than a row in `media`: it carries a name,
-- a website and an ordering that belong to the partner, not to the image. The
-- logo itself still lives in Cloudinary under bayrotna/partners/.
--
-- Additive; 001-015 untouched.

CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(512),
  cloudinary_id VARCHAR(255),
  website_url VARCHAR(512),
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- The public strip is always "active, not deleted, in order", so the index
-- carries sort_order rather than just the flag.
CREATE INDEX IF NOT EXISTS idx_partners_active
  ON partners(is_active, sort_order) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_partners_sort_order ON partners(sort_order);
CREATE INDEX IF NOT EXISTS idx_partners_deleted_at ON partners(deleted_at);
