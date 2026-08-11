import express from 'express';
import type { Pool } from 'pg';
import { authenticate, createResolveAdmin, requireAdmin } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import * as c from '../../controllers/newsController.js';

export function createAdminNewsRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.use(authenticate, resolveAdmin, requireAdmin);

  router.get('/', (req, res) => c.listNews(db, req as AuthRequest, res));
  router.get('/:id', (req, res) => c.getNews(db, req as AuthRequest, res));
  router.post('/', (req, res) => c.createNews(db, req as AuthRequest, res));
  router.put('/:id', (req, res) => c.updateNews(db, req as AuthRequest, res));
  router.delete('/:id', (req, res) => c.deleteNews(db, req as AuthRequest, res));
  router.post('/:id/restore', (req, res) => c.restoreNews(db, req as AuthRequest, res));

  return router;
}
