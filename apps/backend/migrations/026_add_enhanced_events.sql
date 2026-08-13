-- Capacity, ordering and image handling for events.
--
-- Deliberately NOT a new `events` table. One already exists under the name
-- news_events: twelve live events across seven categories, served publicly by
-- GET /api/v1/events, managed on the Events tab of the admin panel and rendered
-- on /events. A second table would mean two Events screens in the admin, with
-- the public page showing one set while the other was being edited, and the
-- twelve existing events invisible in the new one. This adds the missing
-- capabilities to the table that is already in use.
--
-- Mapping from the brief's proposed shape to what exists:
--   start_date / end_date -> event_date + event_time / end_time (already there)
--   category              -> event_type (already there, seven values in use)
--   location              -> location (already there)
--   image_url             -> image_url (already there)
--   capacity, current_registrations, sort_order, cloudinary_id,
--   latitude, longitude   -> added below
--
-- Additive; 001-025 untouched.

ALTER TABLE news_events ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS current_registrations INTEGER NOT NULL DEFAULT 0;
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS cloudinary_id VARCHAR(500);
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
-- users(id), not admin_users: an uploader column pointing at admin_users is
-- what broke video_uploads in migration 021.
ALTER TABLE news_events ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Capacity cannot be negative, and neither can the count against it.
ALTER TABLE news_events DROP CONSTRAINT IF EXISTS news_events_capacity_positive;
ALTER TABLE news_events ADD CONSTRAINT news_events_capacity_positive
  CHECK (capacity IS NULL OR capacity >= 0);

ALTER TABLE news_events DROP CONSTRAINT IF EXISTS news_events_registrations_positive;
ALTER TABLE news_events ADD CONSTRAINT news_events_registrations_positive
  CHECK (current_registrations >= 0);

-- Existing rows all share sort_order 0, which would leave their order to the
-- planner. Seed it from the date ordering the page already uses.
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY event_date ASC NULLS LAST, created_at ASC) - 1 AS position
    FROM news_events
   WHERE deleted_at IS NULL
)
UPDATE news_events e
   SET sort_order = ordered.position
  FROM ordered
 WHERE e.id = ordered.id
   AND e.sort_order = 0;

CREATE INDEX IF NOT EXISTS idx_events_published ON news_events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON news_events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_deleted ON news_events(deleted_at);
CREATE INDEX IF NOT EXISTS idx_events_sort ON news_events(sort_order);

-- The public list is always "published, not deleted, by date".
CREATE INDEX IF NOT EXISTS idx_events_live
  ON news_events(event_date, sort_order) WHERE deleted_at IS NULL AND is_published;

CREATE OR REPLACE FUNCTION update_events_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS events_update_trigger ON news_events;
CREATE TRIGGER events_update_trigger BEFORE UPDATE ON news_events
FOR EACH ROW EXECUTE FUNCTION update_events_timestamp();

-- Links a registration to the event it was made for.
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES news_events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);

-- Keeps current_registrations honest without the application having to
-- remember to increment it. Counting rows on demand would be correct too, but
-- the public list shows the number for every event at once.
CREATE OR REPLACE FUNCTION sync_event_registration_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP <> 'INSERT' AND OLD.event_id IS NOT NULL THEN
    UPDATE news_events SET current_registrations = (
      SELECT COUNT(*) FROM registrations r WHERE r.event_id = OLD.event_id AND COALESCE(r.status, 'pending') <> 'cancelled'
    ) WHERE id = OLD.event_id;
  END IF;

  IF TG_OP <> 'DELETE' AND NEW.event_id IS NOT NULL THEN
    UPDATE news_events SET current_registrations = (
      SELECT COUNT(*) FROM registrations r WHERE r.event_id = NEW.event_id AND COALESCE(r.status, 'pending') <> 'cancelled'
    ) WHERE id = NEW.event_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS registrations_event_count_trigger ON registrations;
-- status is watched as well as event_id: cancelling a booking has to give the
-- place back, and cancelling only changes the status.
CREATE TRIGGER registrations_event_count_trigger
AFTER INSERT OR DELETE OR UPDATE OF event_id, status ON registrations
FOR EACH ROW EXECUTE FUNCTION sync_event_registration_count();

-- Bring any existing counts into line in case rows already reference an event.
UPDATE news_events e
   SET current_registrations = COALESCE((
     SELECT COUNT(*) FROM registrations r
      WHERE r.event_id = e.id AND COALESCE(r.status, 'pending') <> 'cancelled'
   ), 0)
 WHERE e.deleted_at IS NULL;
