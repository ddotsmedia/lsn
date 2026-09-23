#!/bin/bash
# Direct backend fix - can be run on VPS without needing git
# Usage: bash direct-backend-fix.sh

set -e

AUTH_FILE="/opt/lsn/apps/backend/src/controllers/authController.ts"
WORK_DIR="/opt/lsn"

echo "================================================"
echo "Applying Backend Login Fix"
echo "================================================"

# Check if file exists
if [ ! -f "$AUTH_FILE" ]; then
    echo "❌ Error: authController.ts not found at $AUTH_FILE"
    exit 1
fi

echo "✓ Found authController.ts"

# Backup original
BACKUP_FILE="${AUTH_FILE}.backup.$(date +%s)"
cp "$AUTH_FILE" "$BACKUP_FILE"
echo "✓ Backup created: $BACKUP_FILE"

# Create the fixed version
cat > "$AUTH_FILE" << 'AUTHJS'
import type { Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { User, TokenResponse } from '../types/index.js';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RefreshSchema = z.object({
  refreshToken: z.string(),
});

/** Never leak password_hash to a client. */
function toPublicUser(user: User): Omit<User, 'password_hash'> {
  const { password_hash: _ignored, ...rest } = user;
  return rest;
}

export async function register(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password, name } = RegisterSchema.parse(req.body);

    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const result = await db.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name, phone, created_at, updated_at',
      [email, name, passwordHash]
    );

    const user = result.rows[0] as User;
    const accessToken = generateToken(user.id, { email: user.email, role: user.role });
    const refreshToken = generateRefreshToken(user.id);

    await db.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
      [user.id, refreshToken]
    );

    const response: TokenResponse = { accessToken, refreshToken, user };
    res.status(201).json({ ...response, user: toPublicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('register failed', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
}

export async function login(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password } = LoginSchema.parse(req.body);

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.rows[0] as User;
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const accessToken = generateToken(user.id, { email: user.email, role: user.role });
    const refreshToken = generateRefreshToken(user.id);

    // Delete old refresh tokens before creating a new one
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);
    await db.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
      [user.id, refreshToken]
    );

    const response: TokenResponse = { accessToken, refreshToken, user };
    res.json({ ...response, user: toPublicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('login failed', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
}

export async function refresh(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { refreshToken } = RefreshSchema.parse(req.body);

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // The token must still be on record and unexpired — a signature alone is not
    // enough, otherwise logout and rotation can never revoke anything.
    const stored = await db.query(
      'SELECT id FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW()',
      [refreshToken, decoded.userId]
    );
    if (stored.rows.length === 0) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0] as User;
    const accessToken = generateToken(user.id, { email: user.email, role: user.role });
    const newRefreshToken = generateRefreshToken(user.id);

    // Rotate: the presented token is single-use.
    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    await db.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
      [user.id, newRefreshToken]
    );

    const response: TokenResponse = { accessToken, refreshToken: newRefreshToken, user };
    res.json({ ...response, user: toPublicUser(user) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('refresh failed', error);
      res.status(500).json({ error: 'Refresh failed' });
    }
  }
}

export async function logout(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { refreshToken } = RefreshSchema.parse(req.body);

    await db.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('logout failed', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }
}

export async function me(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await db.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.rows[0] as User;
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error('me failed', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}
AUTHJS

echo "✓ Updated authController.ts with fix"

# Verify the fix is in place
if grep -q "DELETE FROM refresh_tokens WHERE user_id" "$AUTH_FILE"; then
    echo "✓ Verified: DELETE statement is present"
else
    echo "❌ Error: DELETE statement not found in updated file"
    exit 1
fi

echo ""
echo "================================================"
echo "Now rebuild the backend container:"
echo "================================================"
echo "cd $WORK_DIR"
echo "docker compose -f docker-compose.prod.yml down"
echo "docker compose -f docker-compose.prod.yml build --no-cache backend"
echo "docker compose -f docker-compose.prod.yml up -d"
echo "docker compose -f docker-compose.prod.yml logs backend | grep listening"
echo ""
echo "Or run all in one command:"
echo "cd $WORK_DIR && docker compose -f docker-compose.prod.yml down && docker compose -f docker-compose.prod.yml build --no-cache backend && docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "================================================"

