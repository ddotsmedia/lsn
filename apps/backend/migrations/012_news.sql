-- News as a content type of its own, separate from news_events.
--
-- Until now the site had only news_events, and the public "News" section was
-- just the past-dated rows of it. That conflates two different things: an event
-- has a time, a place and an audience, while a news item is an announcement
-- with a date and a body. They are now stored and managed separately.
--
-- Additive; 001-011 untouched. news_events keeps every row it has.

CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  -- The date the item is *about*, which is what the site orders by. Distinct
  -- from created_at, so a backdated item files itself correctly.
  published_date DATE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Soft delete, matching every other content table: the recycle bin restores
  -- from here rather than the row being lost.
  deleted_at TIMESTAMP
);

-- The public list is always "published, not deleted, newest first"; the admin
-- list is the same minus the is_published filter.
CREATE INDEX IF NOT EXISTS idx_news_public
  ON news(published_date DESC)
  WHERE deleted_at IS NULL AND is_published = TRUE;

CREATE INDEX IF NOT EXISTS idx_news_live
  ON news(published_date DESC)
  WHERE deleted_at IS NULL;
