import type { Request, Response, NextFunction } from 'express';
import type { Pool } from 'pg';
import { verifyToken } from '../utils/jwt.js';

export interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  req.userId = decoded.userId;
  next();
}

/**
 * Resolves `req.isAdmin` from the admin_users table.
 *
 * `authenticate` only proves *who* the caller is — it never sets `isAdmin`.
 * Without this middleware in front of it, `requireAdmin` rejects every request,
 * so admin routes mount it as `authenticate -> resolveAdmin -> requireAdmin`.
 */
export function createResolveAdmin(db: Pool) {
  return async function resolveAdmin(
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> {
    if (!req.userId) {
      req.isAdmin = false;
      next();
      return;
    }

    try {
      const result = await db.query('SELECT role FROM admin_users WHERE user_id = $1', [req.userId]);
      req.isAdmin = result.rows.length > 0;
    } catch {
      // Fail closed: a lookup error must never grant admin.
      req.isAdmin = false;
    }

    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
