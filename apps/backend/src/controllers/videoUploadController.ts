import type { AuthRequest } from '../middleware/auth.js';
import { Response } from 'express';
import cloudinary from 'cloudinary';

const isCloudinaryConfigured = () => {
  return process.env.CLOUDINARY_URL;
};

export const uploadToCloudinary = async (req: AuthRequest, res: Response) => {
  if (!req.isAdmin) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file provided' });
  }
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
          },
        });
      }
    );
    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error('Upload stream error:', err);
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
};
