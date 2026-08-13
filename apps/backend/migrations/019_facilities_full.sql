-- Full facility records: features, amenities and photographs.
--
-- Numbered 019, not the 008 the brief asked for: 008_admin_page_editing.sql
-- already exists and migrations apply in order.
--
-- The public facilities page has been rendering nine richly described
-- facilities from a hardcoded list, while this table held six thinner, unrelated
-- rows that the page never showed. Pointing the page at the API without moving
-- that content across would have replaced nine detailed entries with six empty
-- ones on a live site. The seed below is generated from the page's own data, so
-- switching to the API preserves exactly what visitors see today and makes all
-- of it editable.
--
-- Additive; 001-018 untouched. The six legacy rows are soft-deleted, not
-- dropped, so they can be restored from the recycle bin.

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS detailed_description TEXT;

-- Needed by the seed's ON CONFLICT, and stops two facilities sharing a name.
CREATE UNIQUE INDEX IF NOT EXISTS idx_facilities_name_live
  ON facilities (lower(name)) WHERE deleted_at IS NULL;

-- Bullet points shown on the card (feature) and in the modal (amenity).
CREATE TABLE IF NOT EXISTS facility_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  feature_text VARCHAR(255) NOT NULL,
  -- One table for both lists: they differ only in where they are rendered.
  feature_type VARCHAR(20) NOT NULL DEFAULT 'feature',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_facility_features_facility
  ON facility_features(facility_id, feature_type, display_order);

-- Makes the seed re-runnable without stacking duplicate bullets.
CREATE UNIQUE INDEX IF NOT EXISTS idx_facility_features_unique
  ON facility_features (facility_id, feature_type, lower(feature_text));

CREATE TABLE IF NOT EXISTS facility_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE SET NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_facility_images_facility
  ON facility_images(facility_id, display_order) WHERE deleted_at IS NULL;

-- At most one primary image per facility.
CREATE UNIQUE INDEX IF NOT EXISTS idx_facility_images_primary
  ON facility_images(facility_id) WHERE is_primary AND deleted_at IS NULL;

-- ---------------------------------------------------------------- seed

-- Modern Classrooms
INSERT INTO facilities (name, description, detailed_description, icon, sort_order)
VALUES ('Modern Classrooms', 'Bright, spacious classrooms designed for optimal learning and play', 'Our classrooms are thoughtfully designed to support young learners. Each room is bright and airy with large windows for natural light. Furniture is appropriately sized for each age group, and learning corners encourage independent exploration throughout the day.', '🏫', 0)
ON CONFLICT (lower(name)) WHERE deleted_at IS NULL DO UPDATE
  SET description = EXCLUDED.description,
      detailed_description = COALESCE(facilities.detailed_description, EXCLUDED.detailed_description),
      icon = EXCLUDED.icon,
      sort_order = EXCLUDED.sort_order,
      deleted_at = NULL;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Climate-controlled environment', 'feature', 0 FROM facilities WHERE lower(name) = lower('Modern Classrooms') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Natural lighting', 'feature', 1 FROM facilities WHERE lower(name) = lower('Modern Classrooms') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Learning corners', 'feature', 2 FROM facilities WHERE lower(name) = lower('Modern Classrooms') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Age-appropriate furniture', 'feature', 3 FROM facilities WHERE lower(name) = lower('Modern Classrooms') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Interactive displays', 'feature', 4 FROM facilities WHERE lower(name) = lower('Modern Classrooms') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Individual cubbies for belongings', 'amenity', 0 FROM facilities WHERE lower(name) = lower('Modern Classrooms') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Handwashing stations', 'amenity', 1 FROM facilities WHERE lower(name) = lower('Modern Classrooms') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Floor mats for floor play', 'amenity', 2 FROM facilities WHERE lower(name) = lower('Modern Classrooms') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Storage for materials', 'amenity', 3 FROM facilities WHERE lower(name) = lower('Modern Classrooms') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Windows for outdoor views', 'amenity', 4 FROM facilities WHERE lower(name) = lower('Modern Classrooms') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;

-- Outdoor Play Area
INSERT INTO facilities (name, description, detailed_description, icon, sort_order)
VALUES ('Outdoor Play Area', 'Safe, engaging playground with age-appropriate equipment and nature areas', 'Our outdoor space is designed to encourage physical activity and nature exploration. With various play structures for different age groups, shaded areas for rest, and natural elements to investigate, children get the movement and fresh air they need every day.', '🌳', 1)
ON CONFLICT (lower(name)) WHERE deleted_at IS NULL DO UPDATE
  SET description = EXCLUDED.description,
      detailed_description = COALESCE(facilities.detailed_description, EXCLUDED.detailed_description),
      icon = EXCLUDED.icon,
      sort_order = EXCLUDED.sort_order,
      deleted_at = NULL;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Safety-certified equipment', 'feature', 0 FROM facilities WHERE lower(name) = lower('Outdoor Play Area') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Shaded areas', 'feature', 1 FROM facilities WHERE lower(name) = lower('Outdoor Play Area') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Nature exploration zone', 'feature', 2 FROM facilities WHERE lower(name) = lower('Outdoor Play Area') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Sand and water play', 'feature', 3 FROM facilities WHERE lower(name) = lower('Outdoor Play Area') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Grass and soft surfaces', 'feature', 4 FROM facilities WHERE lower(name) = lower('Outdoor Play Area') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Climbers and slides', 'amenity', 0 FROM facilities WHERE lower(name) = lower('Outdoor Play Area') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Swings', 'amenity', 1 FROM facilities WHERE lower(name) = lower('Outdoor Play Area') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Spring riders', 'amenity', 2 FROM facilities WHERE lower(name) = lower('Outdoor Play Area') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Sandbox', 'amenity', 3 FROM facilities WHERE lower(name) = lower('Outdoor Play Area') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Water play table', 'amenity', 4 FROM facilities WHERE lower(name) = lower('Outdoor Play Area') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Garden area', 'amenity', 5 FROM facilities WHERE lower(name) = lower('Outdoor Play Area') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;

-- Art & Craft Studio
INSERT INTO facilities (name, description, detailed_description, icon, sort_order)
VALUES ('Art & Craft Studio', 'Creative space fully equipped with art supplies and inspiration', 'This dedicated art studio is a haven for creative expression. With organized supply stations and a variety of mediums, children can explore their artistic talents freely, and finished work goes straight up on the display wall.', '🎨', 2)
ON CONFLICT (lower(name)) WHERE deleted_at IS NULL DO UPDATE
  SET description = EXCLUDED.description,
      detailed_description = COALESCE(facilities.detailed_description, EXCLUDED.detailed_description),
      icon = EXCLUDED.icon,
      sort_order = EXCLUDED.sort_order,
      deleted_at = NULL;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Easels and painting stations', 'feature', 0 FROM facilities WHERE lower(name) = lower('Art & Craft Studio') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Sculpting materials', 'feature', 1 FROM facilities WHERE lower(name) = lower('Art & Craft Studio') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Collage supplies', 'feature', 2 FROM facilities WHERE lower(name) = lower('Art & Craft Studio') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Display wall for student work', 'feature', 3 FROM facilities WHERE lower(name) = lower('Art & Craft Studio') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Water station for cleanup', 'feature', 4 FROM facilities WHERE lower(name) = lower('Art & Craft Studio') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Paint, markers, colored pencils', 'amenity', 0 FROM facilities WHERE lower(name) = lower('Art & Craft Studio') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Clay and playdough', 'amenity', 1 FROM facilities WHERE lower(name) = lower('Art & Craft Studio') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Scissors and glue', 'amenity', 2 FROM facilities WHERE lower(name) = lower('Art & Craft Studio') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Paper in various colors', 'amenity', 3 FROM facilities WHERE lower(name) = lower('Art & Craft Studio') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Easels', 'amenity', 4 FROM facilities WHERE lower(name) = lower('Art & Craft Studio') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Display boards', 'amenity', 5 FROM facilities WHERE lower(name) = lower('Art & Craft Studio') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;

-- Music Room
INSERT INTO facilities (name, description, detailed_description, icon, sort_order)
VALUES ('Music Room', 'Dedicated space for musical exploration with instruments and audio equipment', 'Our music room introduces children to the joy of sound and movement. With a carefully curated collection of instruments and equipment, children can explore rhythm, melody, and dance in a space built to take the noise.', '🎵', 3)
ON CONFLICT (lower(name)) WHERE deleted_at IS NULL DO UPDATE
  SET description = EXCLUDED.description,
      detailed_description = COALESCE(facilities.detailed_description, EXCLUDED.detailed_description),
      icon = EXCLUDED.icon,
      sort_order = EXCLUDED.sort_order,
      deleted_at = NULL;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Variety of instruments', 'feature', 0 FROM facilities WHERE lower(name) = lower('Music Room') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Sound system and speakers', 'feature', 1 FROM facilities WHERE lower(name) = lower('Music Room') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Dance floor', 'feature', 2 FROM facilities WHERE lower(name) = lower('Music Room') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Recording area', 'feature', 3 FROM facilities WHERE lower(name) = lower('Music Room') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Acoustic treatment', 'feature', 4 FROM facilities WHERE lower(name) = lower('Music Room') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Percussion instruments', 'amenity', 0 FROM facilities WHERE lower(name) = lower('Music Room') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Xylophone', 'amenity', 1 FROM facilities WHERE lower(name) = lower('Music Room') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Drums', 'amenity', 2 FROM facilities WHERE lower(name) = lower('Music Room') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Piano keyboard', 'amenity', 3 FROM facilities WHERE lower(name) = lower('Music Room') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Music CDs', 'amenity', 4 FROM facilities WHERE lower(name) = lower('Music Room') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Microphone', 'amenity', 5 FROM facilities WHERE lower(name) = lower('Music Room') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;

-- Library Corner
INSERT INTO facilities (name, description, detailed_description, icon, sort_order)
VALUES ('Library Corner', 'Cozy reading space with 1000+ books and comfortable seating', 'Our library is designed to foster a love of reading. With books in multiple languages and diverse stories, children can discover new worlds and expand their imagination, either alongside a teacher or curled up on their own.', '📚', 4)
ON CONFLICT (lower(name)) WHERE deleted_at IS NULL DO UPDATE
  SET description = EXCLUDED.description,
      detailed_description = COALESCE(facilities.detailed_description, EXCLUDED.detailed_description),
      icon = EXCLUDED.icon,
      sort_order = EXCLUDED.sort_order,
      deleted_at = NULL;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Diverse book collection', 'feature', 0 FROM facilities WHERE lower(name) = lower('Library Corner') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Reading nooks', 'feature', 1 FROM facilities WHERE lower(name) = lower('Library Corner') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Comfortable seating', 'feature', 2 FROM facilities WHERE lower(name) = lower('Library Corner') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Quiet atmosphere', 'feature', 3 FROM facilities WHERE lower(name) = lower('Library Corner') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Book rotation program', 'feature', 4 FROM facilities WHERE lower(name) = lower('Library Corner') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Picture books', 'amenity', 0 FROM facilities WHERE lower(name) = lower('Library Corner') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Early readers', 'amenity', 1 FROM facilities WHERE lower(name) = lower('Library Corner') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Interactive books', 'amenity', 2 FROM facilities WHERE lower(name) = lower('Library Corner') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Cushioned seats', 'amenity', 3 FROM facilities WHERE lower(name) = lower('Library Corner') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Soft lighting', 'amenity', 4 FROM facilities WHERE lower(name) = lower('Library Corner') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Book displays', 'amenity', 5 FROM facilities WHERE lower(name) = lower('Library Corner') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;

-- Digital Lab
INSERT INTO facilities (name, description, detailed_description, icon, sort_order)
VALUES ('Digital Lab', 'Modern technology space with tablets, interactive screens, and learning software', 'Our digital lab introduces children to technology in a thoughtful, age-appropriate way. We use carefully selected educational software and interactive content to enhance learning, always in short sessions and alongside a teacher.', '💻', 5)
ON CONFLICT (lower(name)) WHERE deleted_at IS NULL DO UPDATE
  SET description = EXCLUDED.description,
      detailed_description = COALESCE(facilities.detailed_description, EXCLUDED.detailed_description),
      icon = EXCLUDED.icon,
      sort_order = EXCLUDED.sort_order,
      deleted_at = NULL;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Interactive smart displays', 'feature', 0 FROM facilities WHERE lower(name) = lower('Digital Lab') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Educational tablets', 'feature', 1 FROM facilities WHERE lower(name) = lower('Digital Lab') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Learning software', 'feature', 2 FROM facilities WHERE lower(name) = lower('Digital Lab') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Video projection', 'feature', 3 FROM facilities WHERE lower(name) = lower('Digital Lab') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Age-appropriate content', 'feature', 4 FROM facilities WHERE lower(name) = lower('Digital Lab') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Tablets with educational apps', 'amenity', 0 FROM facilities WHERE lower(name) = lower('Digital Lab') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Interactive whiteboard', 'amenity', 1 FROM facilities WHERE lower(name) = lower('Digital Lab') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Laptop for teachers', 'amenity', 2 FROM facilities WHERE lower(name) = lower('Digital Lab') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Projector and screen', 'amenity', 3 FROM facilities WHERE lower(name) = lower('Digital Lab') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Headphones', 'amenity', 4 FROM facilities WHERE lower(name) = lower('Digital Lab') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Charging station', 'amenity', 5 FROM facilities WHERE lower(name) = lower('Digital Lab') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;

-- Science Exploration Center
INSERT INTO facilities (name, description, detailed_description, icon, sort_order)
VALUES ('Science Exploration Center', 'Hands-on space for scientific discovery and experimentation', 'This center sparks curiosity about the natural world. With accessible science equipment and carefully prepared materials, children can conduct their own experiments and investigations, and record what they notice.', '🔬', 6)
ON CONFLICT (lower(name)) WHERE deleted_at IS NULL DO UPDATE
  SET description = EXCLUDED.description,
      detailed_description = COALESCE(facilities.detailed_description, EXCLUDED.detailed_description),
      icon = EXCLUDED.icon,
      sort_order = EXCLUDED.sort_order,
      deleted_at = NULL;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Microscopes and observation tools', 'feature', 0 FROM facilities WHERE lower(name) = lower('Science Exploration Center') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Experiment kits', 'feature', 1 FROM facilities WHERE lower(name) = lower('Science Exploration Center') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Natural specimens', 'feature', 2 FROM facilities WHERE lower(name) = lower('Science Exploration Center') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Magnifying glasses', 'feature', 3 FROM facilities WHERE lower(name) = lower('Science Exploration Center') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Discovery shelves', 'feature', 4 FROM facilities WHERE lower(name) = lower('Science Exploration Center') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Microscopes', 'amenity', 0 FROM facilities WHERE lower(name) = lower('Science Exploration Center') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Magnifying glasses', 'amenity', 1 FROM facilities WHERE lower(name) = lower('Science Exploration Center') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Specimen collection', 'amenity', 2 FROM facilities WHERE lower(name) = lower('Science Exploration Center') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Experiment kits', 'amenity', 3 FROM facilities WHERE lower(name) = lower('Science Exploration Center') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Containers for exploration', 'amenity', 4 FROM facilities WHERE lower(name) = lower('Science Exploration Center') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Natural materials', 'amenity', 5 FROM facilities WHERE lower(name) = lower('Science Exploration Center') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;

-- Multi-Purpose Hall
INSERT INTO facilities (name, description, detailed_description, icon, sort_order)
VALUES ('Multi-Purpose Hall', 'Large space for assemblies, performances, events, and large group activities', 'Our multi-purpose hall is the heart of community activities. Used for assemblies, performances, celebrations, and group activities, it brings the entire school together in one room.', '🎭', 7)
ON CONFLICT (lower(name)) WHERE deleted_at IS NULL DO UPDATE
  SET description = EXCLUDED.description,
      detailed_description = COALESCE(facilities.detailed_description, EXCLUDED.detailed_description),
      icon = EXCLUDED.icon,
      sort_order = EXCLUDED.sort_order,
      deleted_at = NULL;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Spacious layout', 'feature', 0 FROM facilities WHERE lower(name) = lower('Multi-Purpose Hall') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Stage area', 'feature', 1 FROM facilities WHERE lower(name) = lower('Multi-Purpose Hall') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Sound system', 'feature', 2 FROM facilities WHERE lower(name) = lower('Multi-Purpose Hall') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Flexible seating', 'feature', 3 FROM facilities WHERE lower(name) = lower('Multi-Purpose Hall') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Storage for props', 'feature', 4 FROM facilities WHERE lower(name) = lower('Multi-Purpose Hall') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Stage', 'amenity', 0 FROM facilities WHERE lower(name) = lower('Multi-Purpose Hall') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Projector', 'amenity', 1 FROM facilities WHERE lower(name) = lower('Multi-Purpose Hall') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Sound system', 'amenity', 2 FROM facilities WHERE lower(name) = lower('Multi-Purpose Hall') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Mirrors', 'amenity', 3 FROM facilities WHERE lower(name) = lower('Multi-Purpose Hall') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Props storage', 'amenity', 4 FROM facilities WHERE lower(name) = lower('Multi-Purpose Hall') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Portable seating', 'amenity', 5 FROM facilities WHERE lower(name) = lower('Multi-Purpose Hall') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;

-- Cafeteria
INSERT INTO facilities (name, description, detailed_description, icon, sort_order)
VALUES ('Cafeteria', 'Commercial kitchen and dining area with nutritionist-approved menus', 'Our cafeteria serves fresh, nutritious meals prepared by trained staff. Working with our nutritionist, we ensure all meals support healthy development and accommodate dietary needs and allergies.', '🍽️', 8)
ON CONFLICT (lower(name)) WHERE deleted_at IS NULL DO UPDATE
  SET description = EXCLUDED.description,
      detailed_description = COALESCE(facilities.detailed_description, EXCLUDED.detailed_description),
      icon = EXCLUDED.icon,
      sort_order = EXCLUDED.sort_order,
      deleted_at = NULL;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Professional kitchen equipment', 'feature', 0 FROM facilities WHERE lower(name) = lower('Cafeteria') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'High-chair seating', 'feature', 1 FROM facilities WHERE lower(name) = lower('Cafeteria') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Child-height tables', 'feature', 2 FROM facilities WHERE lower(name) = lower('Cafeteria') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Variety of nutritious meals', 'feature', 3 FROM facilities WHERE lower(name) = lower('Cafeteria') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Allergy management', 'feature', 4 FROM facilities WHERE lower(name) = lower('Cafeteria') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Commercial kitchen', 'amenity', 0 FROM facilities WHERE lower(name) = lower('Cafeteria') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Food service area', 'amenity', 1 FROM facilities WHERE lower(name) = lower('Cafeteria') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Child-sized chairs and tables', 'amenity', 2 FROM facilities WHERE lower(name) = lower('Cafeteria') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'High chairs for infants', 'amenity', 3 FROM facilities WHERE lower(name) = lower('Cafeteria') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Washing station', 'amenity', 4 FROM facilities WHERE lower(name) = lower('Cafeteria') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;
INSERT INTO facility_features (facility_id, feature_text, feature_type, display_order)
SELECT id, 'Allergy-safe practices', 'amenity', 5 FROM facilities WHERE lower(name) = lower('Cafeteria') AND deleted_at IS NULL
ON CONFLICT (facility_id, feature_type, lower(feature_text)) DO NOTHING;

-- The six legacy rows the public page never showed. Soft-deleted so they are
-- recoverable, and only those that are not part of the seeded set.
UPDATE facilities SET deleted_at = CURRENT_TIMESTAMP
 WHERE deleted_at IS NULL
   AND lower(name) NOT IN (
     'modern classrooms','outdoor play area','art & craft studio','music room',
     'library corner','digital lab','science exploration center',
     'multi-purpose hall','cafeteria'
   );
