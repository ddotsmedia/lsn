import express from 'express';
import type { Pool } from 'pg';
import type { AuthRequest } from '../middleware/auth.js';
import { listPublicSocialLinks } from '../controllers/socialLinksController.js';
import { listPublicYoutubeVideos } from '../controllers/youtubeVideosController.js';
import { listPublicNews } from '../controllers/newsController.js';

/**
 * Read-only endpoints the public site needs: the footer's social links and the
 * gallery's YouTube videos. Deliberately unauthenticated — the admin routes
 * under /api/v1/admin handle every mutation.
 */
export function createPublicContentRouter(db: Pool): express.Router {
  const router = express.Router();

  router.get('/social-links', (req, res) => listPublicSocialLinks(db, req as AuthRequest, res));
  router.get('/youtube-videos', (req, res) => listPublicYoutubeVideos(db, req as AuthRequest, res));
  router.get('/news', (req, res) => listPublicNews(db, req as AuthRequest, res));

  return router;
}
