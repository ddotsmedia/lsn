-- ADDITIVE MIGRATION: Promotional Video Uploads with Cloudinary
-- Never modify this file once created
-- Created: 2026-08-10
-- Purpose: Add video uploads table and is_video flag for gallery

-- Create video_uploads table for Cloudinary video metadata
CREATE TABLE IF NOT EXISTS video_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  cloudinary_public_id VARCHAR(255) NOT NULL UNIQUE,
  cloudinary_signature VARCHAR(255),
  duration_seconds INT,
  uploaded_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'active',
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Add is_video flag to gallery_images (for future filtering)
ALTER TABLE gallery_images ADD COLUMN IF NOT EXISTS is_video BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_uploads_uploaded_by ON video_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_video_uploads_status ON video_uploads(status);
CREATE INDEX IF NOT EXISTS idx_video_uploads_created_at ON video_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_uploads_cloudinary_id ON video_uploads(cloudinary_public_id);
CREATE INDEX IF NOT EXISTS idx_video_uploads_deleted_at ON video_uploads(deleted_at);
CREATE INDEX IF NOT EXISTS idx_gallery_images_is_video ON gallery_images(is_video) WHERE deleted_at IS NULL;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_video_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_video_uploads_updated_at ON video_uploads;
CREATE TRIGGER trigger_video_uploads_updated_at
BEFORE UPDATE ON video_uploads
FOR EACH ROW
EXECUTE FUNCTION update_video_uploads_updated_at();
