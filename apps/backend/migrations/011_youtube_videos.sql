-- YouTube videos shown on the gallery page. Additive; 001-003 and 008
-- untouched.

CREATE TABLE IF NOT EXISTS youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  youtube_id VARCHAR(20) NOT NULL,
  thumbnail_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- The same video must not be added twice, but a soft-deleted row must not stop
-- it being re-added later.
CREATE UNIQUE INDEX IF NOT EXISTS idx_youtube_videos_id_live
  ON youtube_videos(youtube_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_youtube_videos_live
  ON youtube_videos(display_order, created_at DESC) WHERE deleted_at IS NULL;
