-- Editable H1 headings for the public pages.
--
-- One row per public route, keyed on the route name ('events' for /events —
-- note that page_media stores that page's images under 'news-events' instead).
-- page_slug is UNIQUE because a page has exactly one H1; that constraint is
-- also what the route's ON CONFLICT upsert targets.
--
-- Seeded with the headings currently hardcoded in the page components. Shipping
-- this table empty would blank every H1 the moment the pages start reading from
-- it, so the defaults have to be the real text, not placeholders.
--
-- home's heading is deliberately two lines — the hero renders it with
-- whitespace-pre-line so the newline survives as the <br/> it replaces.
--
-- Additive; 001-027 untouched.

CREATE TABLE IF NOT EXISTS page_headings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug VARCHAR(100) NOT NULL UNIQUE,
  heading_text TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT page_headings_text_not_blank CHECK (btrim(heading_text) <> '')
);

INSERT INTO page_headings (page_slug, heading_text) VALUES
  ('home',       E'Welcome to\nLittle Smarties Nursery'),
  ('nursery',    'Little Smarties Nursery'),
  ('age-groups', 'Our Age Groups'),
  ('facilities', 'Our State-of-the-Art Facilities'),
  ('gallery',    'Gallery'),
  ('events',     'Events & Programs'),
  ('contact',    'Get in Touch'),
  ('booking',    'Schedule a Tour'),
  ('register',   'Enroll Your Child')
ON CONFLICT (page_slug) DO NOTHING;
