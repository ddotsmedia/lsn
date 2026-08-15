import type { Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import type { AuthRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLog.js';

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width?: number;
  height?: number;
}

/** '' from an untouched form field means "not set", not a value to store. */
const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const PartnerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  website_url: z.preprocess(
    blankToNull,
    z.string().url('Website must be a valid URL, e.g. https://example.com').max(512).nullable().optional()
  ),
  description: z.preprocess(blankToNull, z.string().trim().nullable().optional()),
  // multipart/form-data sends everything as text, so accept the string forms.
  is_active: z.preprocess(
    (v) => (typeof v === 'string' ? v === 'true' : v),
    z.boolean().optional()
  ),
  sort_order: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : v),
    z.number().int().optional()
  ),
});

/** Uploads the buffer and returns the delivery URL plus the public id. */
async function uploadLogo(buffer: Buffer): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'bayrotna/partners',
        resource_type: 'image',
        tags: ['partner', 'logo'],
        // Logos never need to be larger than this on a 6-across strip.
        transformation: [{ width: 800, height: 800, crop: 'limit' }],
      },
      (error, uploaded) => {
        if (error || !uploaded) { reject(error ?? new Error('Upload failed')); return; }
        resolve(uploaded as CloudinaryUploadResult);
      }
    );
    stream.end(buffer);
  });
}

function deliveryUrl(publicId: string, secureUrl: string): string {
  if (!publicId) return secureUrl;
  return cloudinary.url(publicId, { secure: true, fetch_format: 'auto', quality: 'auto' });
}

/** Best effort: an orphaned remote file is better than a failed request. */
async function destroyLogo(publicId: string | null | undefined): Promise<void> {
  if (!publicId) return;
  try {
    // invalidate purges the cached derivative too, so a removed logo stops
    // being served rather than lingering on the CDN.
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    console.error(`cloudinary destroy failed for ${publicId}`, error);
  }
}

// -------------------------------------------------------------------- admin

export async function listPartners(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const conditions = ['deleted_at IS NULL'];
    const params: unknown[] = [];
    let idx = 1;

    if (req.query.active === 'true') conditions.push('is_active = TRUE');
    else if (req.query.active === 'false') conditions.push('is_active = FALSE');

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`LOWER(name) LIKE $${idx++}`);
    }

    // ?sort=name | recent | custom (default)
    const sort = req.query.sort;
    const order =
      sort === 'name' ? 'name ASC'
      : sort === 'recent' ? 'created_at DESC'
      : 'sort_order ASC, created_at DESC';

    const where = `WHERE ${conditions.join(' AND ')}`;
    const [count, rows] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM partners ${where}`, params),
      db.query(
        `SELECT * FROM partners ${where} ORDER BY ${order} LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    const total = Number((count.rows[0] as { count?: string })?.count ?? 0);
    res.json({ data: rows.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('listPartners failed', error);
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
}

export async function createPartner(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = PartnerSchema.parse(req.body);

    let logoUrl: string | null = null;
    let publicId: string | null = null;

    if (req.file) {
      if (!isCloudinaryConfigured()) {
        res.status(503).json({ error: 'Image hosting is not configured. Set CLOUDINARY_URL.' });
        return;
      }
      const uploaded = await uploadLogo(req.file.buffer);
      logoUrl = deliveryUrl(uploaded.public_id, uploaded.secure_url);
      publicId = uploaded.public_id;
    }

    // New partners go to the end of the strip.
    const next = await db.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM partners WHERE deleted_at IS NULL'
    );

    const result = await db.query(
      `INSERT INTO partners (name, logo_url, cloudinary_id, website_url, description, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        data.name, logoUrl, publicId,
        data.website_url ?? null, data.description ?? null,
        data.sort_order ?? (next.rows[0] as { next: number }).next,
        data.is_active ?? true,
      ]
    );

    await logActivity(db, req.userId, 'create', 'partner', result.rows[0]?.id as string, {
      newValues: result.rows[0] as Record<string, unknown>, req,
    });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('createPartner failed', error);
    res.status(500).json({ error: 'Failed to create partner' });
  }
}

export async function updatePartner(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data = PartnerSchema.partial().parse(req.body);

    const before = await db.query('SELECT * FROM partners WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (before.rows.length === 0) { res.status(404).json({ error: 'Partner not found' }); return; }
    const existing = before.rows[0] as { cloudinary_id?: string };

    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const field of ['name', 'website_url', 'description', 'sort_order', 'is_active'] as const) {
      if (data[field] === undefined) continue;
      sets.push(`${field} = $${idx++}`);
      params.push(data[field] ?? null);
    }

    // A new file replaces the old logo; the previous one is removed only after
    // the row has been updated, so a failed upload cannot lose both.
    let replacedPublicId: string | null = null;
    if (req.file) {
      if (!isCloudinaryConfigured()) {
        res.status(503).json({ error: 'Image hosting is not configured. Set CLOUDINARY_URL.' });
        return;
      }
      const uploaded = await uploadLogo(req.file.buffer);
      sets.push(`logo_url = $${idx++}`);
      params.push(deliveryUrl(uploaded.public_id, uploaded.secure_url));
      sets.push(`cloudinary_id = $${idx++}`);
      params.push(uploaded.public_id);
      replacedPublicId = existing.cloudinary_id ?? null;
    }

    if (params.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }
    sets.push('updated_at = CURRENT_TIMESTAMP');

    params.push(id);
    const result = await db.query(
      `UPDATE partners SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    await logActivity(db, req.userId, 'update', 'partner', id as string, {
      oldValues: before.rows[0] as Record<string, unknown>,
      newValues: result.rows[0] as Record<string, unknown>,
      req,
    });

    if (replacedPublicId) await destroyLogo(replacedPublicId);
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('updatePartner failed', error);
    res.status(500).json({ error: 'Failed to update partner' });
  }
}

export async function deletePartner(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE partners SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
      [id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Partner not found' }); return; }

    const row = result.rows[0] as { cloudinary_id?: string };
    await logActivity(db, req.userId, 'delete', 'partner', id as string, {
      oldValues: result.rows[0] as Record<string, unknown>, req,
    });
    await destroyLogo(row.cloudinary_id);

    res.json({ success: true });
  } catch (error) {
    console.error('deletePartner failed', error);
    res.status(500).json({ error: 'Failed to delete partner' });
  }
}

export async function restorePartner(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await db.query(
      `UPDATE partners SET deleted_at = NULL
        WHERE id = $1 AND deleted_at IS NOT NULL RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'No deleted partner with that id' }); return; }
    await logActivity(db, req.userId, 'restore', 'partner', req.params.id as string, {
      newValues: result.rows[0] as Record<string, unknown>, req,
    });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('restorePartner failed', error);
    res.status(500).json({ error: 'Failed to restore partner' });
  }
}

const ReorderSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(200) });

/**
 * Whole-list reorder. The brief specified PUT :id/reorder with a single
 * sort_order, but setting one row's position leaves every other row's number
 * untouched, so two partners can end up sharing a position and the order comes
 * out arbitrary. Sending the full order is the only way to make it exact.
 * The single-row form is still accepted below for compatibility.
 */
export async function reorderPartners(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { ids } = ReorderSchema.parse(req.body);
    await db.query(
      `UPDATE partners AS p
          SET sort_order = v.ord, updated_at = CURRENT_TIMESTAMP
         FROM (SELECT unnest($1::uuid[]) AS id, generate_subscripts($1::uuid[], 1) AS ord) AS v
        WHERE p.id = v.id AND p.deleted_at IS NULL`,
      [ids]
    );
    res.json({ reordered: ids.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('reorderPartners failed', error);
    res.status(500).json({ error: 'Failed to reorder partners' });
  }
}

export async function setPartnerOrder(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { sort_order } = z.object({ sort_order: z.number().int() }).parse(req.body);
    const result = await db.query(
      `UPDATE partners SET sort_order = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
      [sort_order, req.params.id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Partner not found' }); return; }
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('setPartnerOrder failed', error);
    res.status(500).json({ error: 'Failed to set order' });
  }
}

// ------------------------------------------------------------------- public

export async function listPublicPartners(db: Pool, _req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await db.query(
      `SELECT id, name, logo_url, website_url, description
         FROM partners
        WHERE deleted_at IS NULL AND is_active = TRUE
        ORDER BY sort_order ASC, created_at DESC`
    );
    // The brief asked for an hour. A flat max-age=3600 means a browser that has
    // already loaded the homepage keeps showing the old strip for an hour, so a
    // partner added in the admin panel appears not to exist — verified against
    // production. s-maxage keeps the full hour where it is actually worth
    // having, on shared caches, while browsers revalidate after a minute;
    // stale-while-revalidate means that revalidation is never blocking.
    res.set('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400');
    res.json({ partners: result.rows });
  } catch (error) {
    console.error('listPublicPartners failed', error);
    // An empty strip is better than a broken homepage.
    res.json({ partners: [] });
  }
}
