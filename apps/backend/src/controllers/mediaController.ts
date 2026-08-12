import type { Response } from 'express';
import type { Pool } from 'pg';
import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLog.js';

/** Where an upload lands in Cloudinary, and how the library filters. */
const CATEGORIES = ['site', 'age-groups', 'pages'] as const;
type Category = (typeof CATEGORIES)[number];

const isCategory = (v: unknown): v is Category =>
  typeof v === 'string' && (CATEGORIES as readonly string[]).includes(v);

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  asset_id?: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
}

/**
 * Turns "bouncing-bunnies-hero.jpg" into "Bouncing bunnies hero" so an image is
 * never left with an empty alt attribute. A human-written alt is always better,
 * which is why the field is editable afterwards.
 */
function altFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!base) return 'Uploaded image';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/**
 * Asks Cloudinary to pick the best format and quality for each visitor. The
 * stored URL is the delivery URL, so callers need no transformation logic.
 */
function optimizedUrl(publicId: string, secureUrl: string): string {
  if (!publicId) return secureUrl;
  return cloudinary.url(publicId, { secure: true, fetch_format: 'auto', quality: 'auto' });
}

// ------------------------------------------------------------------ upload

export async function uploadMedia(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const file = req.file;
    if (!file) { res.status(400).json({ error: 'No file uploaded' }); return; }

    if (!file.mimetype?.startsWith('image/')) {
      res.status(400).json({ error: 'Only image files are allowed' });
      return;
    }

    if (!cloudinary.config().api_key) {
      res.status(503).json({ error: 'Image hosting is not configured. Set CLOUDINARY_URL.' });
      return;
    }

    const body = req.body as Record<string, string | undefined>;
    const category: Category = isCategory(body.category) ? body.category : 'pages';
    const title = (body.title || '').trim() || altFromFilename(file.originalname);
    const altText = (body.alt_text || '').trim() || altFromFilename(file.originalname);

    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `bayrotna/${category}`,
          resource_type: 'image',
          tags: ['media', category],
          // Anything larger than this is a photo nobody needs at full size.
          transformation: [{ width: 2560, height: 2560, crop: 'limit' }],
        },
        (error, uploaded) => {
          if (error || !uploaded) { reject(error ?? new Error('Upload failed')); return; }
          resolve(uploaded as CloudinaryUploadResult);
        }
      );
      // memoryStorage gives a Buffer; there is no .stream to pipe from.
      stream.end(file.buffer);
    });

    const url = optimizedUrl(result.public_id, result.secure_url);

    const inserted = await db.query(
      `INSERT INTO media
         (title, description, url, cloudinary_id, cloudinary_public_id,
          file_size, mime_type, width, height, alt_text, category, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        title, (body.description || '').trim() || null, url,
        result.asset_id ?? null, result.public_id,
        result.bytes ?? file.size ?? null, file.mimetype,
        result.width ?? null, result.height ?? null,
        altText, category, req.userId ?? null,
      ]
    );

    const row = inserted.rows[0] as Record<string, unknown>;
    await logActivity(db, req.userId, 'upload', 'media', row.id as string, {
      newValues: { title, category, public_id: result.public_id },
      req,
    });

    res.status(201).json(row);
  } catch (error) {
    console.error('uploadMedia failed', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
}

// -------------------------------------------------------------------- list

export async function listMedia(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 24));
    const offset = (page - 1) * limit;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const type = req.query.type;

    const conditions = ['deleted_at IS NULL'];
    const params: unknown[] = [];
    let idx = 1;

    if (isCategory(type)) { params.push(type); conditions.push(`category = $${idx++}`); }
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(title) LIKE $${idx} OR LOWER(COALESCE(alt_text,'')) LIKE $${idx})`);
      idx++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const [count, rows] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM media ${where}`, params),
      db.query(
        `SELECT * FROM media ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    const total = Number((count.rows[0] as { count?: string })?.count ?? 0);
    res.json({ data: rows.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('listMedia failed', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
}

// ------------------------------------------------------------------ update

const UpdateSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  alt_text: z.string().trim().max(255).optional(),
  description: z.string().trim().optional(),
});

export async function updateMedia(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = UpdateSchema.parse(req.body);
    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    for (const field of ['title', 'alt_text', 'description'] as const) {
      if (data[field] === undefined) continue;
      sets.push(`${field} = $${idx++}`);
      params.push(data[field]);
    }
    if (params.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }
    sets.push('updated_at = CURRENT_TIMESTAMP');

    params.push(req.params.id);
    const result = await db.query(
      `UPDATE media SET ${sets.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      params
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Media not found' }); return; }

    await logActivity(db, req.userId, 'update', 'media', req.params.id as string, { details: data, req });
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('updateMedia failed', error);
    res.status(500).json({ error: 'Failed to update media' });
  }
}

// ------------------------------------------------------------------ delete

/**
 * Soft-deletes the row and its assignments, and removes the file from
 * Cloudinary. The Cloudinary call is deliberately last and non-fatal: losing
 * the remote file is worse than leaving one orphaned, and the row is what the
 * recycle bin restores.
 */
async function removeOne(db: Pool, req: AuthRequest, id: string): Promise<boolean> {
  const result = await db.query(
    `UPDATE media SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
    [id]
  );
  if (result.rows.length === 0) return false;

  const row = result.rows[0] as { cloudinary_public_id?: string };

  // Detach it everywhere so no page keeps pointing at a deleted image.
  await Promise.all([
    db.query(`UPDATE age_group_images SET deleted_at = CURRENT_TIMESTAMP
               WHERE media_id = $1 AND deleted_at IS NULL`, [id]),
    db.query(`UPDATE page_media SET deleted_at = CURRENT_TIMESTAMP
               WHERE media_id = $1 AND deleted_at IS NULL`, [id]),
    db.query(`DELETE FROM site_media WHERE media_id = $1`, [id]),
  ]);

  await logActivity(db, req.userId, 'delete', 'media', id, { oldValues: result.rows[0] as Record<string, unknown>, req });

  if (row.cloudinary_public_id) {
    try {
      await cloudinary.uploader.destroy(row.cloudinary_public_id);
    } catch (error) {
      console.error(`cloudinary destroy failed for ${row.cloudinary_public_id}`, error);
    }
  }
  return true;
}

export async function deleteMedia(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const ok = await removeOne(db, req, req.params.id as string);
    if (!ok) { res.status(404).json({ error: 'Media not found' }); return; }
    res.status(204).send();
  } catch (error) {
    console.error('deleteMedia failed', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
}

export async function bulkDeleteMedia(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { ids } = z.object({ ids: z.array(z.string().uuid()).min(1).max(100) }).parse(req.body);
    let deleted = 0;
    for (const id of ids) {
      if (await removeOne(db, req, id)) deleted++;
    }
    res.json({ deleted, requested: ids.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('bulkDeleteMedia failed', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
}

// ------------------------------------------------------------- assignments

const SELECT_MEDIA = `
  m.id, m.url, m.alt_text, m.title, m.width, m.height`;

const AgeGroupAssignSchema = z.object({
  media_id: z.string().uuid(),
  image_type: z.enum(['hero', 'icon', 'banner', 'gallery']).default('gallery'),
});

export async function assignAgeGroupMedia(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { media_id, image_type } = AgeGroupAssignSchema.parse(req.body);
    const slug = req.params.slug as string;

    // hero/icon/banner are single slots: releasing the old one first keeps the
    // partial unique index satisfied and makes assignment behave as "replace".
    if (image_type !== 'gallery') {
      await db.query(
        `UPDATE age_group_images SET deleted_at = CURRENT_TIMESTAMP
          WHERE age_group_slug = $1 AND image_type = $2 AND deleted_at IS NULL`,
        [slug, image_type]
      );
    }

    const next = await db.query(
      `SELECT COALESCE(MAX(sort_order), -1) + 1 AS next
         FROM age_group_images WHERE age_group_slug = $1 AND image_type = $2 AND deleted_at IS NULL`,
      [slug, image_type]
    );

    const result = await db.query(
      `INSERT INTO age_group_images (age_group_slug, media_id, image_type, sort_order)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [slug, media_id, image_type, (next.rows[0] as { next: number }).next]
    );

    await logActivity(db, req.userId, 'update', 'age_group_image', result.rows[0]?.id as string, {
      newValues: { slug, image_type, media_id }, req,
    });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('assignAgeGroupMedia failed', error);
    res.status(500).json({ error: 'Failed to assign image' });
  }
}

/** Shape the brief specified: single slots as objects, gallery as an ordered list. */
export async function getAgeGroupMedia(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const slug = req.params.slug as string;
    const result = await db.query(
      `SELECT a.id AS assignment_id, a.image_type, a.sort_order, ${SELECT_MEDIA}
         FROM age_group_images a
         JOIN media m ON m.id = a.media_id AND m.deleted_at IS NULL
        WHERE a.age_group_slug = $1 AND a.deleted_at IS NULL
        ORDER BY a.sort_order ASC, a.created_at ASC`,
      [slug]
    );

    const images: Record<string, unknown> = { hero: null, icon: null, banner: null, gallery: [] };
    for (const row of result.rows as Record<string, unknown>[]) {
      if (row.image_type === 'gallery') (images.gallery as unknown[]).push(row);
      else images[row.image_type as string] = row;
    }
    res.json({ ageGroup: slug, images });
  } catch (error) {
    console.error('getAgeGroupMedia failed', error);
    res.json({ ageGroup: req.params.slug, images: { hero: null, icon: null, banner: null, gallery: [] } });
  }
}

const PageAssignSchema = z.object({
  media_id: z.string().uuid(),
  media_section: z.string().trim().min(1).max(100).default('hero'),
});

export async function assignPageMedia(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { media_id, media_section } = PageAssignSchema.parse(req.body);
    const slug = req.params.slug as string;

    await db.query(
      `UPDATE page_media SET deleted_at = CURRENT_TIMESTAMP
        WHERE page_slug = $1 AND media_section = $2 AND deleted_at IS NULL`,
      [slug, media_section]
    );

    const result = await db.query(
      `INSERT INTO page_media (page_slug, media_id, media_section) VALUES ($1,$2,$3) RETURNING *`,
      [slug, media_id, media_section]
    );

    await logActivity(db, req.userId, 'update', 'page_media', result.rows[0]?.id as string, {
      newValues: { slug, media_section, media_id }, req,
    });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('assignPageMedia failed', error);
    res.status(500).json({ error: 'Failed to assign image' });
  }
}

export async function getPageMedia(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const slug = req.params.slug as string;
    const result = await db.query(
      `SELECT p.id AS assignment_id, p.media_section, p.sort_order, ${SELECT_MEDIA}
         FROM page_media p
         JOIN media m ON m.id = p.media_id AND m.deleted_at IS NULL
        WHERE p.page_slug = $1 AND p.deleted_at IS NULL
        ORDER BY p.sort_order ASC`,
      [slug]
    );

    const sections: Record<string, unknown> = {};
    for (const row of result.rows as Record<string, unknown>[]) {
      sections[row.media_section as string] = row;
    }
    res.json({ page: slug, sections });
  } catch (error) {
    console.error('getPageMedia failed', error);
    res.json({ page: req.params.slug, sections: {} });
  }
}

const SiteAssignSchema = z.object({
  media_key: z.string().trim().min(1).max(100),
  media_id: z.string().uuid().nullable(),
});

export async function assignSiteMedia(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { media_key, media_id } = SiteAssignSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO site_media (media_key, media_id) VALUES ($1,$2)
       ON CONFLICT (media_key)
       DO UPDATE SET media_id = EXCLUDED.media_id, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [media_key, media_id]
    );
    await logActivity(db, req.userId, 'update', 'site_media', media_key, {
      newValues: { media_key, media_id }, req,
    });
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('assignSiteMedia failed', error);
    res.status(500).json({ error: 'Failed to assign site media' });
  }
}

/** Public: a flat { key: {url, alt_text} } map, which is what a header needs. */
export async function getSiteMedia(db: Pool, _req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await db.query(
      `SELECT s.media_key, ${SELECT_MEDIA}
         FROM site_media s
         JOIN media m ON m.id = s.media_id AND m.deleted_at IS NULL`
    );
    const out: Record<string, unknown> = {};
    for (const row of result.rows as Record<string, unknown>[]) {
      out[row.media_key as string] = row;
    }
    res.json(out);
  } catch (error) {
    console.error('getSiteMedia failed', error);
    // A missing logo must not break the header.
    res.json({});
  }
}

// ----------------------------------------------------------------- reorder

const ReorderSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(200) });

/** Persists drag-to-reorder. Takes assignment ids, not media ids. */
export async function reorderAgeGroupMedia(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { ids } = ReorderSchema.parse(req.body);
    // One statement, so a half-applied order is impossible.
    await db.query(
      `UPDATE age_group_images AS a
          SET sort_order = v.ord, updated_at = CURRENT_TIMESTAMP
         FROM (SELECT unnest($1::uuid[]) AS id, generate_subscripts($1::uuid[], 1) AS ord) AS v
        WHERE a.id = v.id AND a.age_group_slug = $2`,
      [ids, req.params.slug]
    );
    res.json({ reordered: ids.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('reorderAgeGroupMedia failed', error);
    res.status(500).json({ error: 'Failed to reorder' });
  }
}

/** Removes an assignment without deleting the underlying image. */
export async function unassign(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const table = req.params.kind === 'age-group' ? 'age_group_images' : 'page_media';
    const result = await db.query(
      `UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Assignment not found' }); return; }
    res.status(204).send();
  } catch (error) {
    console.error('unassign failed', error);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
}
