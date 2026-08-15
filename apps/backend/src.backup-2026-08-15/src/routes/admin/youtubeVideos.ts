import express from 'express';
import type { Pool } from 'pg';
import { authenticate, createResolveAdmin, requireAdmin } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import * as c from '../../controllers/youtubeVideosController.js';

export function createAdminYoutubeVideosRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.use(authenticate, resolveAdmin, requireAdmin);

  router.get('/', (req, res) => c.listYoutubeVideos(db, req as AuthRequest, res));
  router.post('/', (req, res) => c.createYoutubeVideo(db, req as AuthRequest, res));
  router.put('/:id', (req, res) => c.updateYoutubeVideo(db, req as AuthRequest, res));
  router.delete('/:id', (req, res) => c.deleteYoutubeVideo(db, req as AuthRequest, res));
  router.post('/:id/restore', (req, res) => c.restoreYoutubeVideo(db, req as AuthRequest, res));

  return router;
}
