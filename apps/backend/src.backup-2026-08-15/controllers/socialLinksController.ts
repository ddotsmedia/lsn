import type { Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLog.js';

export const SOCIAL_PLATFORMS = [
  'facebook',
  'instagram',
  'linkedin',
  'tiktok',
  'snapchat',
  'twitter',
  'youtube',
  'whatsapp',
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  display_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Only http(s) is accepted. A `javascript:` or `data:` URL here would end up in
 * an href on every page of the public site.
 */
const httpUrl = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine(
    (value) => {
      if (value === '#') return true; // placeholder for "not set up yet"
      try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'URL must start with http:// or https://' }
  );

const CreateSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: httpUrl,
  display_order: z.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

const UpdateSchema = CreateSchema.partial();

/** Live links for the public footer, ordered as configured. */
export async function listPublicSocialLinks(
  db: Pool,
  _req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const result = await db.query(
      `SELECT id, platform, url, display_order
       FROM social_links
       WHERE deleted_at IS NULL AND active = TRUE AND url <> '#'
       ORDER BY display_order ASC, platform ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('listPublicSocialLinks failed', error);
    res.status(500).json({ error: 'Failed to fetch social links' });
  }
}

export async function listSocialLinks(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const showDeleted = req.query.deleted === 'true';
    const result = await db.query(
      `SELECT * FROM social_links
       WHERE deleted_at IS ${showDeleted ? 'NOT NULL' : 'NULL'}
       ORDER BY display_order ASC, platform ASC`
    );
    res.json(result.rows as SocialLink[]);
  } catch (error) {
    console.error('listSocialLinks failed', error);
    res.status(500).json({ error: 'Failed to fetch social links' });
  }
}

export async function createSocialLink(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = CreateSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO social_links (platform, url, display_order, active)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [data.platform, data.url, data.display_order ?? 0, data.active ?? true]
    );
    const row = result.rows[0] as SocialLink;

    await logActivity(db, req.userId, 'create', 'social_link', row.id, {
      newValues: row as unknown as Record<string, unknown>,
      req,
    });
    res.status(201).json(row);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    // Unique violation on the live-platform index.
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'That platform already has a link' });
      return;
    }
    console.error('createSocialLink failed', error);
    res.status(500).json({ error: 'Failed to create social link' });
  }
}

export async function updateSocialLink(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data = UpdateSchema.parse(req.body);

    const existing = await db.query(
      'SELECT * FROM social_links WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Social link not found' });
      return;
    }

    const result = await db.query(
      `UPDATE social_links SET
         platform = COALESCE($2, platform),
         url = COALESCE($3, url),
         display_order = COALESCE($4, display_order),
         active = COALESCE($5, active),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, data.platform ?? null, data.url ?? null, data.display_order ?? null, data.active ?? null]
    );

    await logActivity(db, req.userId, 'update', 'social_link', id, {
      oldValues: existing.rows[0] as Record<string, unknown>,
      newValues: result.rows[0] as Record<string, unknown>,
      req,
    });
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'That platform already has a link' });
      return;
    }
    console.error('updateSocialLink failed', error);
    res.status(500).json({ error: 'Failed to update social link' });
  }
}

export async function deleteSocialLink(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE social_links SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Social link not found' });
      return;
    }
    await logActivity(db, req.userId, 'delete', 'social_link', id, {
      oldValues: result.rows[0] as Record<string, unknown>,
      req,
    });
    res.status(204).send();
  } catch (error) {
    console.error('deleteSocialLink failed', error);
    res.status(500).json({ error: 'Failed to delete social link' });
  }
}

export async function restoreSocialLink(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE social_links SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No deleted social link with that id' });
      return;
    }
    await logActivity(db, req.userId, 'restore', 'social_link', id, {
      newValues: result.rows[0] as Record<string, unknown>,
      req,
    });
    res.json(result.rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ error: 'That platform already has a live link' });
      return;
    }
    console.error('restoreSocialLink failed', error);
    res.status(500).json({ error: 'Failed to restore social link' });
  }
}
