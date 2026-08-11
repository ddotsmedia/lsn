import express from 'express';
import type { Pool } from 'pg';
import { authenticate, createResolveAdmin, requireAdmin } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import * as c from '../../controllers/socialLinksController.js';

export function createAdminSocialLinksRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.use(authenticate, resolveAdmin, requireAdmin);

  router.get('/', (req, res) => c.listSocialLinks(db, req as AuthRequest, res));
  router.post('/', (req, res) => c.createSocialLink(db, req as AuthRequest, res));
  router.put('/:id', (req, res) => c.updateSocialLink(db, req as AuthRequest, res));
  router.delete('/:id', (req, res) => c.deleteSocialLink(db, req as AuthRequest, res));
  router.post('/:id/restore', (req, res) => c.restoreSocialLink(db, req as AuthRequest, res));

  return router;
}
