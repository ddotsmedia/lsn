-- Testimonials, managed in the admin panel.
--
-- Seeded from the eight reviews already hardcoded on the site: four on the home
-- page and four on the About page, which carry a rating and a location. Making
-- those pages API-driven without moving the reviews across would have replaced
-- real published reviews with an empty carousel — the same trap the facilities
-- page hit. page_slug records where each one was shown so the pages keep their
-- own sets.
--
-- Additive; 001-024 untouched.

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name VARCHAR(255) NOT NULL,
  author_title VARCHAR(255),
  author_image_url VARCHAR(2048),
  cloudinary_id VARCHAR(500),
  quote TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  -- Published by default is wrong for a CMS in general, but the seeded reviews
  -- are already live on the site, so the column default stays false and the
  -- seed sets true explicitly.
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  -- Which page it belongs to. NULL means "any page".
  page_slug VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  -- users(id), not admin_users: an uploader column pointing at admin_users is
  -- what broke video_uploads in migration 021.
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_testimonials_published ON testimonials(is_published);
CREATE INDEX IF NOT EXISTS idx_testimonials_page ON testimonials(page_slug);
CREATE INDEX IF NOT EXISTS idx_testimonials_deleted ON testimonials(deleted_at);
CREATE INDEX IF NOT EXISTS idx_testimonials_sort ON testimonials(sort_order);

-- The public read is always "published, not deleted, in order".
CREATE INDEX IF NOT EXISTS idx_testimonials_live
  ON testimonials(page_slug, sort_order) WHERE deleted_at IS NULL AND is_published;

CREATE OR REPLACE FUNCTION update_testimonials_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS testimonials_update_trigger ON testimonials;
CREATE TRIGGER testimonials_update_trigger BEFORE UPDATE ON testimonials
FOR EACH ROW EXECUTE FUNCTION update_testimonials_timestamp();

-- ------------------------------------------------------------------- seed
-- Guarded on author name so re-running adds nothing.
INSERT INTO testimonials (author_name, author_title, quote, rating, is_published, sort_order, page_slug)
SELECT 'Al Salam St, Abu Dhabi', NULL, 'My son absolutely loved it here! The principal was kind and inspiring, and the teachers were loving and caring. Thank you Little Smarties for setting the perfect foundation for our children.', NULL, TRUE, 0, 'home'
 WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE lower(author_name)=lower('Al Salam St, Abu Dhabi') AND deleted_at IS NULL);
INSERT INTO testimonials (author_name, author_title, quote, rating, is_published, sort_order, page_slug)
SELECT 'Hasnaa Bahajjoub', NULL, 'The kindest staff and great attention to small details and hygiene. My little girl loves it! I especially love how they engage the kids in Arabic culture and language through their curriculum.', NULL, TRUE, 1, 'home'
 WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE lower(author_name)=lower('Hasnaa Bahajjoub') AND deleted_at IS NULL);
INSERT INTO testimonials (author_name, author_title, quote, rating, is_published, sort_order, page_slug)
SELECT 'Nuha Mohammed Abujame', NULL, 'The nursery exceeded all of my expectations. The staff is friendly, knowledgeable, and the facility is clean and well maintained. I highly recommend it to anyone.', NULL, TRUE, 2, 'home'
 WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE lower(author_name)=lower('Nuha Mohammed Abujame') AND deleted_at IS NULL);
INSERT INTO testimonials (author_name, author_title, quote, rating, is_published, sort_order, page_slug)
SELECT 'Fatma Ali', NULL, 'One of the best nurseries in terms of care and education. The location is awesome!', NULL, TRUE, 3, 'home'
 WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE lower(author_name)=lower('Fatma Ali') AND deleted_at IS NULL);
INSERT INTO testimonials (author_name, author_title, quote, rating, is_published, sort_order, page_slug)
SELECT 'Fatima Al-Mansouri', 'Abu Dhabi', 'My daughter has flourished at Little Smarties. The teachers are so caring and professional. I see her learning and growing every single day.', 5, TRUE, 0, 'about'
 WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE lower(author_name)=lower('Fatima Al-Mansouri') AND deleted_at IS NULL);
INSERT INTO testimonials (author_name, author_title, quote, rating, is_published, sort_order, page_slug)
SELECT 'Mohammad Al-Mazrouei', 'Abu Dhabi', 'Best decision we made for our son’s early education. The facilities are amazing and the teachers truly know each child individually.', 5, TRUE, 1, 'about'
 WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE lower(author_name)=lower('Mohammad Al-Mazrouei') AND deleted_at IS NULL);
INSERT INTO testimonials (author_name, author_title, quote, rating, is_published, sort_order, page_slug)
SELECT 'Hana Al-Ketbi', 'Abu Dhabi', 'Little Smarties is a home away from home. My twins are happy, engaged, and learning so much. Highly recommended!', 5, TRUE, 2, 'about'
 WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE lower(author_name)=lower('Hana Al-Ketbi') AND deleted_at IS NULL);
INSERT INTO testimonials (author_name, author_title, quote, rating, is_published, sort_order, page_slug)
SELECT 'Ahmed Al-Suwaidi', 'Abu Dhabi', 'Professional, caring, and educational. Everything we look for in a nursery. Our child looks forward to going every day!', 5, TRUE, 3, 'about'
 WHERE NOT EXISTS (SELECT 1 FROM testimonials WHERE lower(author_name)=lower('Ahmed Al-Suwaidi') AND deleted_at IS NULL);
