import express from 'express';
import type { Pool } from 'pg';
import * as authController from '../controllers/authController.js';
import { authenticate, createResolveAdmin } from '../middleware/auth.js';

export function createAuthRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.post('/register', (req, res) => authController.register(db, req, res));
  router.post('/login', (req, res) => authController.login(db, req, res));
  router.post('/refresh', (req, res) => authController.refresh(db, req, res));
  router.post('/logout', (req, res) => authController.logout(db, req, res));
  router.get('/me', authenticate, resolveAdmin, (req, res) => authController.me(db, req, res));

  return router;
}
