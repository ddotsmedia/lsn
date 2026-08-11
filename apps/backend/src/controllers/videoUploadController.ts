import { Request, Response } from 'express';
import { Pool } from 'pg';
import cloudinary from 'cloudinary';

interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
  ip: string;
  file?: any;
}

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadToCloudinary = async (req: AuthRequest, res: Response) => {
  if (!req.isAdmin) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file provided' });
  }

  try {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
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
          return res.status(500).json({ success: false, error: 'Upload failed' });
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

    req.file.stream.pipe(uploadStream);
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

    await db.query(
      `INSERT INTO admin_activity_log (admin_id, action, entity_type, entity_id, new_values, ip_address, created_at)
       VALUES ($1, 'CREATE', 'video_upload', $2, $3, $4, CURRENT_TIMESTAMP)`,
      [req.userId, result.rows[0].id, JSON.stringify(result.rows[0]), req.ip || 'unknown']
    );

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

    await db.query(
      `INSERT INTO admin_activity_log (admin_id, action, entity_type, entity_id, old_values, ip_address, created_at)
       VALUES ($1, 'DELETE', 'video_upload', $2, $3, $4, CURRENT_TIMESTAMP)`,
      [req.userId, id, JSON.stringify(oldResult.rows[0]), req.ip || 'unknown']
    );

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

    await db.query(
      `INSERT INTO admin_activity_log (admin_id, action, entity_type, entity_id, new_values, ip_address, created_at)
       VALUES ($1, 'RESTORE', 'video_upload', $2, $3, $4, CURRENT_TIMESTAMP)`,
      [req.userId, id, JSON.stringify(result.rows[0]), req.ip || 'unknown']
    );

    return res.json({ success: true, message: 'Video restored', data: result.rows[0] });
  } catch (error) {
    console.error('Error restoring video:', error);
    res.status(500).json({ success: false, error: 'Failed to restore video' });
  }
};
