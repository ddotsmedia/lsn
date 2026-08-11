import { Router } from 'express';
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

const upload = multer({ storage: multer.memoryStorage() });

export const createVideoUploadRouter = (db: Pool) => {
  const router = Router();
  const resolveAdmin = createResolveAdmin(db);

  // The controllers all guard on req.isAdmin, but nothing set it: this router
  // mounted no middleware, so req.isAdmin was undefined on every request and
  // every guarded endpoint returned 403 — for admins too. authenticate and
  // resolveAdmin have to run first for those checks to mean anything.
  // Listing stays public: the gallery page shows videos to visitors.
  router.get('/list', (req, res) => getUploadedVideos(db, req as AuthRequest, res));

  router.post('/upload', authenticate, resolveAdmin, upload.single('file'), (req, res) =>
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
