import { Request, Response } from 'express';
import { Pool } from 'pg';
// Configured centrally. Calling cloudinary.config() here as well used to
// overwrite the credentials the SDK had read from CLOUDINARY_URL.
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
// The shared audit helper. This file used to insert into admin_activity_log by
// hand, writing admin_id — a column whose foreign key points at admin_users,
// which a users-table administrator is not in. That insert threw, and because
// it ran after the video row was already written the request returned 500 with
// the video saved anyway. logActivity writes admin_user_id and swallows its own
// errors, so an audit problem can never fail the operation it is recording.
import { logActivity } from '../utils/activityLog.js';

// `ip` is optional on Express's Request; redeclaring it as required here made
// this local type incompatible with the shared AuthRequest the middleware uses.
// `ip` is optional on Express's Request; redeclaring it as required here made
// this local type incompatible with the shared AuthRequest the middleware uses.
interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
  file?: Express.Multer.File;
}

export const uploadToCloudinary = async (req: AuthRequest, res: Response) => {
  if (!req.isAdmin) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file provided' });
  }

  // Answers plainly rather than letting the SDK fail with an auth error.
  if (!isCloudinaryConfigured()) {
    return res.status(503).json({
      success: false,
      error: 'Video hosting is not configured. Set CLOUDINARY_URL.',
    });
  }

  try {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video',
        folder: 'littlesmarties/videos',
        public_id: `video_${Date.now()}`,
        eager: [
          { width: 320, height: 240, crop: 'fill', format: 'jpg' }
        ]
      },
      (error: any, result: any) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          // Cloudinary's own message ("Unsupported file type mkv", "File size
          // too large") tells the user what to change; "Upload failed" does not.
          const detail = typeof error?.message === 'string' ? error.message : null;
          return res.status(error?.http_code === 400 ? 400 : 500).json({
            success: false,
            error: detail ? `Cloudinary rejected the video: ${detail}` : 'Upload failed',
          });
        }

        res.json({
          success: true,
          data: {
            secure_url: result?.secure_url,
            public_id: result?.public_id,
            duration: result?.duration,
            thumbnail_url: result?.eager?.[0]?.secure_url || result?.secure_url
          }
        });
      }
    );

    // multer.memoryStorage() gives the file as a buffer; there is no .stream on
    // it, so piping one threw "cannot read properties of undefined".
    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
};

export const saveVideoMetadata = async (db: Pool, req: AuthRequest, res: Response) => {
  if (!req.isAdmin) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }

  const { title, description, video_url, cloudinary_public_id, duration_seconds, thumbnail_url } = req.body;

  if (!title || !video_url || !cloudinary_public_id) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  try {
    const result = await db.query(
      `INSERT INTO video_uploads (title, description, video_url, thumbnail_url, cloudinary_public_id, duration_seconds, uploaded_by, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [title, description || '', video_url, thumbnail_url || '', cloudinary_public_id, duration_seconds || 0, req.userId]
    );

    await logActivity(db, req.userId, 'create', 'video_upload', result.rows[0].id, {
      newValues: result.rows[0],
      req: req as never,
    });

    return res.status(201).json({
      success: true,
      message: 'Video saved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving video metadata:', error);
    res.status(500).json({ success: false, error: 'Failed to save video' });
  }
};

export const getUploadedVideos = async (db: Pool, req: AuthRequest, res: Response) => {
  try {
    const result = await db.query(
      `SELECT * FROM video_uploads WHERE deleted_at IS NULL ORDER BY created_at DESC`
    );

    return res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch videos' });
  }
};

export const deleteVideo = async (db: Pool, req: AuthRequest, res: Response) => {
  if (!req.isAdmin) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }

  const { id } = req.params;

  try {
    const oldResult = await db.query('SELECT * FROM video_uploads WHERE id = $1', [id]);
    if (oldResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    await db.query(
      'UPDATE video_uploads SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    await logActivity(db, req.userId, 'delete', 'video_upload', id, {
      oldValues: oldResult.rows[0],
      req: req as never,
    });

    return res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ success: false, error: 'Failed to delete video' });
  }
};

export const restoreVideo = async (db: Pool, req: AuthRequest, res: Response) => {
  if (!req.isAdmin) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }

  const { id } = req.params;

  try {
    const result = await db.query(
      'UPDATE video_uploads SET deleted_at = NULL WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    await logActivity(db, req.userId, 'restore', 'video_upload', id, {
      newValues: result.rows[0],
      req: req as never,
    });

    return res.json({ success: true, message: 'Video restored', data: result.rows[0] });
  } catch (error) {
    console.error('Error restoring video:', error);
    res.status(500).json({ success: false, error: 'Failed to restore video' });
  }
};
