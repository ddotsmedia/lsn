-- ============================================================================
-- Little Smarties - 002_admin_extras
--
-- Additive only. Every statement is guarded so the file is safe to re-run:
-- CREATE TABLE / CREATE INDEX / ADD COLUMN use IF NOT EXISTS.
-- No DROP, no destructive ALTER of existing columns.
-- ============================================================================

-- Activity log: every mutating action taken from the admin panel.
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255),
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user_id ON admin_activity_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_entity ON admin_activity_log(entity_type, entity_id);

-- Manual ordering support for gallery images/categories and facilities.
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE gallery_categories ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_gallery_images_sort_order ON gallery_images(sort_order);
CREATE INDEX IF NOT EXISTS idx_gallery_categories_sort_order ON gallery_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_facilities_sort_order ON facilities(sort_order);

-- Full-text-ish search helpers on the tables the admin panel searches most.
CREATE INDEX IF NOT EXISTS idx_registrations_name
  ON registrations (LOWER(first_name), LOWER(last_name));
CREATE INDEX IF NOT EXISTS idx_tour_bookings_visitor_name
  ON tour_bookings (LOWER(visitor_name));
