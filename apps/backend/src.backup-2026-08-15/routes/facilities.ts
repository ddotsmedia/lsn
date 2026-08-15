import express from 'express';
import type { Pool } from 'pg';
import { authenticate, createResolveAdmin, requireAdmin } from '../middleware/auth.js';
import * as contentController from '../controllers/contentController.js';
import { listPublicFacilities } from '../controllers/facilitiesController.js';

export function createFacilitiesRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  // Returns features, amenities and images alongside each facility.
  router.get('/', (req, res) => listPublicFacilities(db, req as never, res));
  router.post('/', authenticate, resolveAdmin, requireAdmin, (req, res) =>
    contentController.createFacility(db, req, res)
  );

  return router;
}
