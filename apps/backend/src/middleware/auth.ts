import type { Pool } from 'pg';
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
    role: string
    type: string
  }
  token?: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

/**
 * Middleware to verify JWT token and extract user info
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' })
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any

    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' })
    }

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      type: decoded.type,
    }
    req.token = token

    next()
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    console.error('Auth middleware error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Middleware to check user role
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}

/**
 * Middleware to require ADMIN role
 */
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  next()
}

/**
 * Middleware for optional authentication
 * Attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      if (decoded.type === 'access') {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          type: decoded.type,
        }
        req.token = token
      }
    }
  } catch (error) {
    // Ignore auth errors, just continue as unauthenticated
  }

  next()
}

/**
 * Middleware for rate limiting by user
 */
export const rateLimitByUser = (
  maxRequests: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
) => {
  const store = new Map<string, { count: number; resetTime: number }>()

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId || req.ip

    if (!userId) {
      return res.status(400).json({ error: 'Cannot identify request source' })
    }

    const now = Date.now()
    const userRecord = store.get(userId)

    if (!userRecord || now > userRecord.resetTime) {
      store.set(userId, { count: 1, resetTime: now + windowMs })
      return next()
    }

    if (userRecord.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((userRecord.resetTime - now) / 1000),
      })
    }

    userRecord.count++
    next()
  }
}

export const createResolveAdmin = (db: Pool) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const result = await db.query(
        'SELECT role FROM users WHERE id = $1',
        [req.user.userId]
      );

      if (result.rows[0]?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    } catch {
      return res.status(500).json({ error: 'Failed to verify administrator access' });
    }
  };
};
