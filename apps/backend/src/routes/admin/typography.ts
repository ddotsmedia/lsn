import express from 'express';
import type { Pool } from 'pg';
import type { Response } from 'express';
import type { AuthRequest } from '../../middleware/auth.js';
import { authenticate, createResolveAdmin, requireAdmin } from '../../middleware/auth.js';
import { z } from 'zod';

const typographySchema = z.object({
  font_family: z.enum(['default', 'system', 'georgia', 'times', 'arial', 'verdana', 'trebuchet', 'comic']),
  base_font_size: z.number().int().min(12).max(24),
});

async function getTypography(db: Pool, _req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await db.query('SELECT id, font_family, base_font_size, updated_at FROM site_branding LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (error) {
    console.error('Failed to fetch typography:', error);
    res.status(500).json({ error: 'Failed to fetch typography' });
  }
}

async function updateTypography(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  const parsed = typographySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid typography' });
    return;
  }

  try {
    const { font_family, base_font_size } = parsed.data;
    const result = await db.query(
      `INSERT INTO site_branding (id, font_family, base_font_size, updated_at, updated_by)
       VALUES (1, $1, $2, CURRENT_TIMESTAMP, $3)
       ON CONFLICT (id) DO UPDATE SET font_family = $1, base_font_size = $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3
       RETURNING id, font_family, base_font_size, updated_at`,
      [font_family, base_font_size, req.user?.userId ?? null]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update typography:', error);
    res.status(500).json({ error: 'Failed to update typography' });
  }
}

export function createTypographyRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.get('/', (req, res) => getTypography(db, req as AuthRequest, res));
  router.put('/', authenticate, resolveAdmin, requireAdmin, (req, res) =>
    updateTypography(db, req as AuthRequest, res)
  );

  return router;
}

export default createTypographyRouter;
