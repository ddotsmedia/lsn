import { Router } from 'express';
import { Pool } from 'pg';
import multer from 'multer';
import {
  uploadToCloudinary,
  saveVideoMetadata,
  getUploadedVideos,
  deleteVideo,
  restoreVideo
} from '../controllers/videoUploadController.js';

const upload = multer({ storage: multer.memoryStorage() });

export const createVideoUploadRouter = (db: Pool) => {
  const router = Router();

  router.post('/upload', upload.single('file'), (req, res) => uploadToCloudinary(req as any, res));
  router.post('/save', (req, res) => saveVideoMetadata(db, req as any, res));
  router.get('/list', (req, res) => getUploadedVideos(db, req as any, res));
  router.delete('/:id', (req, res) => deleteVideo(db, req as any, res));
  router.post('/:id/restore', (req, res) => restoreVideo(db, req as any, res));

  return router;
};
