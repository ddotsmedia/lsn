import type { Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import type { AuthRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLog.js';

const blankToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const TestimonialSchema = z.object({
  author_name: z.string().trim().min(1, 'Author name is required').max(255),
  author_title: z.preprocess(blankToNull, z.string().trim().max(255).nullable().optional()),
  quote: z.string().trim().min(1, 'Quote is required').max(4000),
  // Nullable: the four home page reviews have no star rating and should not be
  // given a made-up one.
  rating: z.preprocess(
    (v) => (v === '' || v === null ? null : typeof v === 'string' ? Number(v) : v),
    z.number().int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5').nullable().optional()
  ),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
  page_slug: z.preprocess(blankToNull, z.string().trim().max(100).nullable().optional()),
});

const PUBLIC_COLUMNS =
  'id, author_name, author_title, author_image_url, quote, rating, sort_order, created_at';

// ------------------------------------------------------------------- public

export async function listPublicTestimonials(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const page = Math.max(1, Number(req.query.page) || 1);
    const offset = (page - 1) * limit;

    // ?page_slug=home narrows to one page's set; without it every published
    // testimonial is returned, whichever page it was written for.
    const slug = typeof req.query.page_slug === 'string' ? req.query.page_slug : undefined;
    const filter = slug ? 'AND (page_slug = $3 OR page_slug IS NULL)' : '';
    const params: unknown[] = [limit, offset];
    if (slug) params.push(slug);

    const [rows, count] = await Promise.all([
      db.query(
        `SELECT ${PUBLIC_COLUMNS} FROM testimonials
          WHERE is_published = TRUE AND deleted_at IS NULL ${filter}
          ORDER BY sort_order ASC, created_at ASC
          LIMIT $1 OFFSET $2`,
        params
      ),
      db.query(
        `SELECT COUNT(*) AS total FROM testimonials
          WHERE is_published = TRUE AND deleted_at IS NULL ${slug ? 'AND (page_slug = $1 OR page_slug IS NULL)' : ''}`,
        slug ? [slug] : []
      ),
    ]);

    res.json({
      items: rows.rows,
      total: Number((count.rows[0] as { total?: string })?.total ?? 0),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    // The pages fall back to their built-in reviews, so an empty list is safe.
    res.json({ items: [], total: 0, page: 1, limit: 0 });
  }
}

// -------------------------------------------------------------------- admin

export async function listTestimonials(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const showDeleted = req.query.deleted === 'true';
    const result = await db.query(
      `SELECT t.*, u.name AS created_by_name
         FROM testimonials t
         LEFT JOIN users u ON u.id = t.created_by
        WHERE t.deleted_at IS ${showDeleted ? 'NOT NULL' : 'NULL'}
        ORDER BY t.sort_order ASC, t.created_at ASC`
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
}

export async function createTestimonial(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = TestimonialSchema.parse(req.body);

    const next = await db.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM testimonials WHERE deleted_at IS NULL'
    );

    const result = await db.query(
      `INSERT INTO testimonials
         (author_name, author_title, quote, rating, is_published, sort_order, page_slug, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        data.author_name, data.author_title ?? null, data.quote, data.rating ?? null,
        data.is_published ?? false, data.sort_order ?? (next.rows[0] as { next: number }).next,
        data.page_slug ?? null, req.user?.userId ?? null,
      ]
    );

    await logActivity(db, req.user?.userId, 'create', 'testimonial', result.rows[0]?.id as string, {
      newValues: result.rows[0] as Record<string, unknown>, req,
    });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error creating testimonial:', error);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
}

export async function updateTestimonial(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data = TestimonialSchema.partial().parse(req.body);

    const before = await db.query('SELECT * FROM testimonials WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (before.rows.length === 0) { res.status(404).json({ error: 'Testimonial not found' }); return; }

    const sets: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    // Assigned explicitly rather than with COALESCE: COALESCE cannot tell
    // "leave this alone" from "clear this", so clearing a role or removing a
    // rating would have been impossible.
    for (const field of ['author_name', 'author_title', 'quote', 'rating', 'is_published', 'sort_order', 'page_slug'] as const) {
      if (data[field] === undefined) continue;
      sets.push(`${field} = $${idx++}`);
      params.push(data[field] ?? null);
    }
    if (sets.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }
    sets.push(`uploaded_by = $${idx++}`);
    params.push(req.user?.userId ?? null);

    params.push(id);
    const result = await db.query(
      `UPDATE testimonials SET ${sets.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING *`,
      params
    );

    await logActivity(db, req.user?.userId, 'update', 'testimonial', id as string, {
      oldValues: before.rows[0] as Record<string, unknown>,
      newValues: result.rows[0] as Record<string, unknown>,
      req,
    });
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error updating testimonial:', error);
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
}

export async function deleteTestimonial(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE testimonials SET deleted_at = NOW(), uploaded_by = $1
        WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
      [req.user?.userId ?? null, id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Testimonial not found' }); return; }

    await logActivity(db, req.user?.userId, 'delete', 'testimonial', id as string, {
      oldValues: result.rows[0] as Record<string, unknown>, req,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
}

export async function restoreTestimonial(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE testimonials SET deleted_at = NULL, uploaded_by = $1
        WHERE id = $2 AND deleted_at IS NOT NULL RETURNING *`,
      [req.user?.userId ?? null, id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'No deleted testimonial with that id' }); return; }

    await logActivity(db, req.user?.userId, 'restore', 'testimonial', id as string, {
      newValues: result.rows[0] as Record<string, unknown>, req,
    });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error restoring testimonial:', error);
    res.status(500).json({ error: 'Failed to restore testimonial' });
  }
}

const ReorderSchema = z.object({ ids: z.array(z.string().uuid()).min(1).max(200) });

export async function reorderTestimonials(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { ids } = ReorderSchema.parse(req.body);
    // One statement, so a half-applied order is impossible.
    await db.query(
      `UPDATE testimonials AS t
          SET sort_order = v.ord
         FROM (SELECT unnest($1::uuid[]) AS id, generate_subscripts($1::uuid[], 1) AS ord) AS v
        WHERE t.id = v.id AND t.deleted_at IS NULL`,
      [ids]
    );
    res.json({ reordered: ids.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error reordering testimonials:', error);
    res.status(500).json({ error: 'Failed to reorder testimonials' });
  }
}

// ------------------------------------------------------------------- image

export async function uploadAuthorImage(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await db.query(
      'SELECT id, author_name FROM testimonials WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Testimonial not found' }); return; }

    if (!req.file) { res.status(400).json({ error: 'No image provided' }); return; }
    if (!isCloudinaryConfigured()) {
      res.status(503).json({ error: 'Image hosting is not configured. Set CLOUDINARY_URL.' });
      return;
    }

    // A public_id fixed to the testimonial, with overwrite: replacing a photo
    // replaces the file rather than leaving the old one orphaned.
    const uploaded = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'bayrotna/testimonials',
          public_id: `testimonial_${id}`,
          overwrite: true,
          invalidate: true,
          resource_type: 'image',
          tags: ['testimonial'],
          // Square, face-aware: these render as small round avatars.
          transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        },
        (error, result) => {
          if (error || !result) { reject(error ?? new Error('Upload failed')); return; }
          resolve(result as { secure_url: string; public_id: string });
        }
      );
      stream.end(req.file!.buffer);
    });

    const url = cloudinary.url(uploaded.public_id, {
      secure: true, fetch_format: 'auto', quality: 'auto', version: Date.now(),
    });

    const result = await db.query(
      `UPDATE testimonials SET author_image_url = $1, cloudinary_id = $2, uploaded_by = $3
        WHERE id = $4 AND deleted_at IS NULL RETURNING *`,
      [url, uploaded.public_id, req.user?.userId ?? null, id]
    );

    await logActivity(db, req.user?.userId, 'upload', 'testimonial', id as string, {
      details: { action: 'author_image_uploaded', cloudinary_id: uploaded.public_id }, req,
    });
    res.json({ success: true, testimonial: result.rows[0] });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
}

export async function deleteAuthorImage(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await db.query(
      'SELECT cloudinary_id FROM testimonials WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Testimonial not found' }); return; }

    const { cloudinary_id: publicId } = existing.rows[0] as { cloudinary_id: string | null };

    const result = await db.query(
      `UPDATE testimonials SET author_image_url = NULL, cloudinary_id = NULL, uploaded_by = $1
        WHERE id = $2 RETURNING *`,
      [req.user?.userId ?? null, id]
    );

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
      } catch (error) {
        console.error(`cloudinary destroy failed for ${publicId}`, error);
      }
    }

    await logActivity(db, req.user?.userId, 'delete', 'testimonial', id as string, {
      details: { action: 'author_image_removed' }, req,
    });
    res.json({ success: true, testimonial: result.rows[0] });
  } catch (error) {
    console.error('Error removing author image:', error);
    res.status(500).json({ error: 'Failed to remove image' });
  }
}
