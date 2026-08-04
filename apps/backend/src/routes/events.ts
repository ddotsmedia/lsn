import express from 'express';
import type { Pool } from 'pg';
import { authenticate, createResolveAdmin, requireAdmin } from '../middleware/auth.js';
import * as contentController from '../controllers/contentController.js';

export function createEventsRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.get('/', (req, res) => contentController.getEvents(db, req, res));
  router.post('/', authenticate, resolveAdmin, requireAdmin, (req, res) =>
    contentController.createEvent(db, req, res)
  );
  router.delete('/:id', authenticate, resolveAdmin, requireAdmin, (req, res) =>
    contentController.deleteEvent(db, req, res)
  );

  return router;
}
