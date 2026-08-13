import express, { Router } from 'express';
import type { Pool } from 'pg';
import multer from 'multer';
import { authenticate, createResolveAdmin } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';
import {
  uploadToCloudinary,
  saveVideoMetadata,
  getUploadedVideos,
  deleteVideo,
  restoreVideo,
} from '../controllers/videoUploadController.js';

/**
 * 100 MB. memoryStorage buffers the whole file, so without a limit a large
 * upload would sit entirely in the container's memory.
 */
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const ACCEPTED_TYPES = [
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/avi',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO_BYTES },
  fileFilter: (_req, file, cb) => {
    // Some browsers send an empty type, so the extension is a fallback rather
    // than the only check.
    const byType = ACCEPTED_TYPES.includes(file.mimetype);
    const byExtension = /\.(mp4|webm|mov|avi)$/i.test(file.originalname);
    if (byType || byExtension) cb(null, true);
    else cb(new Error('Only MP4, WebM, MOV and AVI videos are allowed'));
  },
});

/** Turns multer's own errors into JSON rather than an HTML stack trace. */
const handleVideoUpload: express.RequestHandler = (req, res, next) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (!err) { next(); return; }
    const message = err instanceof Error ? err.message : 'Upload failed';
    const tooBig = message.includes('File too large');
    res.status(400).json({
      success: false,
      error: tooBig ? 'Video must be 100 MB or smaller' : message,
    });
  });
};

export const createVideoUploadRouter = (db: Pool) => {
  const router = Router();
  const resolveAdmin = createResolveAdmin(db);

  // The controllers all guard on req.isAdmin, but nothing set it: this router
  // mounted no middleware, so req.isAdmin was undefined on every request and
  // every guarded endpoint returned 403 — for admins too. authenticate and
  // resolveAdmin have to run first for those checks to mean anything.
  // Listing stays public: the gallery page shows videos to visitors.
  router.get('/list', (req, res) => getUploadedVideos(db, req as AuthRequest, res));

  router.post('/upload', authenticate, resolveAdmin, handleVideoUpload, (req, res) =>
    uploadToCloudinary(req as AuthRequest, res)
  );
  router.post('/save', authenticate, resolveAdmin, (req, res) =>
    saveVideoMetadata(db, req as AuthRequest, res)
  );
  router.delete('/:id', authenticate, resolveAdmin, (req, res) =>
    deleteVideo(db, req as AuthRequest, res)
  );
  router.post('/:id/restore', authenticate, resolveAdmin, (req, res) =>
    restoreVideo(db, req as AuthRequest, res)
  );

  return router;
};
