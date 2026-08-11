-- Social media links, managed from the admin panel instead of hardcoded in
-- Footer.tsx. Additive; 001-003 and 008 untouched.

CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(30) NOT NULL,
  url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT social_links_platform_check CHECK (platform IN
    ('facebook','instagram','linkedin','tiktok','snapchat','twitter','youtube','whatsapp'))
);

-- One live link per platform; a soft-deleted row must not block re-adding it.
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_links_platform_live
  ON social_links(platform) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_social_links_order
  ON social_links(display_order) WHERE deleted_at IS NULL;

-- Seed the platforms the footer already advertised. url '#' means "not set up
-- yet"; the footer hides those rather than linking nowhere.
INSERT INTO social_links (platform, url, display_order, active) VALUES
  ('facebook',  '#', 1, TRUE),
  ('instagram', '#', 2, TRUE),
  ('linkedin',  '#', 3, TRUE),
  ('tiktok',    '#', 4, TRUE),
  ('snapchat',  '#', 5, TRUE)
ON CONFLICT (platform) WHERE deleted_at IS NULL DO NOTHING;
