-- ============================================================================
-- Little Smarties - 001_all_tables
--
-- Additive only. Every statement is guarded so the file is safe to re-run:
-- CREATE TABLE / CREATE INDEX use IF NOT EXISTS, inserts use ON CONFLICT.
-- No DROP, no ALTER of existing columns.
--
-- Requires PostgreSQL 13+ for the built-in gen_random_uuid().
-- ============================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'moderator',
  permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- Refresh tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Gallery categories table
CREATE TABLE IF NOT EXISTS gallery_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gallery_categories_slug ON gallery_categories(slug);

-- Gallery images table
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES gallery_categories(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_category_id ON gallery_images(category_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at ON gallery_images(created_at);

-- News/events table
CREATE TABLE IF NOT EXISTS news_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_events_slug ON news_events(slug);
CREATE INDEX IF NOT EXISTS idx_news_events_published_at ON news_events(published_at);

-- Facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_facilities_created_at ON facilities(created_at);

-- Age groups table (use SERIAL for integer IDs to match frontend dropdowns)
CREATE TABLE IF NOT EXISTS age_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  min_age INT NOT NULL,
  max_age INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_age_groups_min_age_max_age ON age_groups(min_age, max_age);

-- Lookup rows, not sample data: registrations.age_group_id is a FK and the
-- frontend dropdown posts these exact ids.
INSERT INTO age_groups (id, name, min_age, max_age) VALUES
  (1, '18 months - 2 years', 18, 24),
  (2, '2 - 3 years', 24, 36),
  (3, '3 - 4 years', 36, 48),
  (4, '4 - 5 years', 48, 60)
ON CONFLICT (id) DO NOTHING;

-- Inserting explicit ids does not advance the SERIAL sequence, so the next
-- natural insert would collide on id=1. Fast-forward it past the seeded rows.
SELECT setval(
  pg_get_serial_sequence('age_groups', 'id'),
  GREATEST((SELECT COALESCE(MAX(id), 1) FROM age_groups), 1)
);

-- Registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  age_group_id INT NOT NULL REFERENCES age_groups(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_age_group_id ON registrations(age_group_id);

-- Tour bookings table
CREATE TABLE IF NOT EXISTS tour_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  preferred_date TIMESTAMP NOT NULL,
  time_slot VARCHAR(10) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tour_bookings_email ON tour_bookings(email);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_preferred_date ON tour_bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_tour_bookings_status ON tour_bookings(status);

-- Prevent double-booking same slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_tour_bookings_slot_unique
  ON tour_bookings (DATE(preferred_date), time_slot)
  WHERE status != 'cancelled';
