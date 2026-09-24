import { Router } from 'express';
import { Pool } from 'pg';
import { login, register, refresh, logout, me } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import type { AuthRequest } from '../middleware/auth.js';

export function createAuthRouter(db: Pool) {
  const router = Router();

  router.post('/login', (req: AuthRequest, res) => login(db, req, res));
  router.get('/login/redirect', async (req: AuthRequest, res) => {
    const { email, password } = req.query;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    req.body = { email, password };
    await login(db, req, res);
  });
  router.post('/register', (req: AuthRequest, res) => register(db, req, res));
  router.post('/refresh', (req: AuthRequest, res) => refresh(db, req, res));
  router.post('/logout', authenticate, (req: AuthRequest, res) => logout(db, req, res));
  router.get('/me', authenticate, (req: AuthRequest, res) => me(db, req, res));

  return router;
}
