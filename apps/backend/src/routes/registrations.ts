import express from 'express';
import type { Pool } from 'pg';
import { authenticate, createResolveAdmin, requireAdmin } from '../middleware/auth.js';
import * as bookingController from '../controllers/bookingController.js';

export function createRegistrationsRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.post('/', (req, res) => bookingController.createRegistration(db, req, res));
  router.get('/', authenticate, resolveAdmin, requireAdmin, (req, res) =>
    bookingController.getRegistrations(db, req, res)
  );

  return router;
}
