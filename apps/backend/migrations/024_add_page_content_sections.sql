-- Editable text sections for the public pages.
--
-- Sections are seeded empty on purpose. The pages' existing copy lives in the
-- React components; copying it in here would leave the same words in two places
-- with nothing keeping them in step. A section renders on the public site only
-- once an admin has written something into it, so the site is unchanged until
-- it is edited and the change appears the moment it is saved.
--
-- Two corrections to the brief's seed:
--   * pages has no display_name column, so the title column is used.
--   * three of its eight slugs do not exist: the Nursery page is 'about', the
--     Events page is 'news-events', and there was no Booking row at all. The
--     Booking page is added below so all eight are editable.
--
-- Additive; 001-023 untouched.

CREATE TABLE IF NOT EXISTS page_content_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  section_key VARCHAR(100) NOT NULL,
  title VARCHAR(255),
  content TEXT,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_page_content_sections_page_id ON page_content_sections(page_id);
CREATE INDEX IF NOT EXISTS idx_page_content_sections_deleted ON page_content_sections(deleted_at);

-- The public read is always "this page, live, in order".
CREATE INDEX IF NOT EXISTS idx_page_content_sections_live
  ON page_content_sections(page_id, sort_order) WHERE deleted_at IS NULL;

-- One section per key per page, among live rows only, so a key frees up again
-- after a section is deleted. Also lets the seed below be re-run safely.
CREATE UNIQUE INDEX IF NOT EXISTS idx_page_content_sections_key
  ON page_content_sections(page_id, section_key) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION update_page_content_sections_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS page_content_sections_update_trigger ON page_content_sections;
CREATE TRIGGER page_content_sections_update_trigger BEFORE UPDATE ON page_content_sections
FOR EACH ROW EXECUTE FUNCTION update_page_content_sections_timestamp();

-- The Booking page had no row, so it could not be edited at all.
INSERT INTO pages (title, slug, path, description, status, sort_order) VALUES
  ('Book a Tour', 'booking', '/booking', 'Tour booking form and what to expect on a visit.', 'published', 9)
ON CONFLICT (slug) WHERE deleted_at IS NULL DO NOTHING;

-- Seed an intro and a body section for each of the eight public pages.
-- admin-dashboard is deliberately excluded: it is not a public page.
INSERT INTO page_content_sections (page_id, section_key, title, content, is_visible, sort_order)
SELECT p.id, s.key, p.title || ' — ' || s.label, NULL, TRUE, s.ord
  FROM pages p
 CROSS JOIN (VALUES ('intro', 'Intro', 0), ('body', 'Main Content', 1)) AS s(key, label, ord)
 WHERE p.deleted_at IS NULL
   AND p.slug IN ('home', 'about', 'facilities', 'age-groups', 'gallery', 'news-events', 'contact', 'booking')
ON CONFLICT (page_id, section_key) WHERE deleted_at IS NULL DO NOTHING;
