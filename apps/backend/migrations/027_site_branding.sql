-- Site-wide typography settings, edited from the admin panel.
--
-- Singleton table: the typography route upserts with ON CONFLICT (id) against a
-- fixed id of 1, so id is the primary key and a CHECK pins it to that one row.
-- A default row is inserted so GET returns settings on a fresh database rather
-- than an empty object the frontend has to special-case.
--
-- The CHECK constraints mirror the zod schema in routes/admin/typography.ts so
-- the database stays valid even if something writes to it outside that route.
--
-- Additive; 001-026 untouched.

CREATE TABLE IF NOT EXISTS site_branding (
  id INTEGER PRIMARY KEY DEFAULT 1,
  font_family VARCHAR(50) NOT NULL DEFAULT 'default',
  base_font_size INTEGER NOT NULL DEFAULT 16,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT site_branding_singleton CHECK (id = 1),
  CONSTRAINT site_branding_font_family_allowed CHECK (
    font_family IN ('default', 'system', 'georgia', 'times', 'arial', 'verdana', 'trebuchet', 'comic')
  ),
  CONSTRAINT site_branding_base_font_size_range CHECK (base_font_size BETWEEN 12 AND 24)
);

INSERT INTO site_branding (id, font_family, base_font_size)
VALUES (1, 'default', 16)
ON CONFLICT (id) DO NOTHING;
