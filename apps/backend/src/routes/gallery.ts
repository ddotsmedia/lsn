import express from 'express';
import type { Pool } from 'pg';
import { authenticate, createResolveAdmin, requireAdmin } from '../middleware/auth.js';
import * as contentController from '../controllers/contentController.js';

export function createGalleryRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.get('/', (req, res) => contentController.getGallery(db, req, res));
  router.get('/categories', (req, res) => contentController.getGalleryCategories(db, req, res));
  router.post('/', authenticate, resolveAdmin, requireAdmin, (req, res) =>
    contentController.createGalleryImage(db, req, res)
  );
  router.delete('/:id', authenticate, resolveAdmin, requireAdmin, (req, res) =>
    contentController.deleteGalleryImage(db, req, res)
  );

  return router;
}
