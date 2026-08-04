import express from 'express';
import type { Pool } from 'pg';
import { authenticate, createResolveAdmin, requireAdmin } from '../middleware/auth.js';
import * as bookingController from '../controllers/bookingController.js';

export function createBookingsRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.get('/availability', (req, res) => bookingController.getAvailability(db, req, res));
  router.post('/', (req, res) => bookingController.createBooking(db, req, res));
  router.get('/', authenticate, resolveAdmin, requireAdmin, (req, res) =>
    bookingController.getBookings(db, req, res)
  );

  return router;
}
