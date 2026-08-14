import express from 'express';
import type { Response } from 'express';
import type { Pool } from 'pg';
import type { AuthRequest } from '../middleware/auth.js';

/**
 * Public, read-only media library listing.
 *
 * Only the fields needed to render an image are returned: the internal title,
 * description, uploader and Cloudinary public_id stay behind /api/v1/admin/media,
 * which is where uploads and deletes live. See the note in the route comment
 * about what this endpoint does expose.
 */
async function listMedia(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    // Capped so a caller cannot ask for the whole table in one request.
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(req.query.limit ?? ''), 10) || 20));
    const offset = Math.max(0, Number.parseInt(String(req.query.offset ?? ''), 10) || 0);

    // ?category=site|age-groups|pages narrows the list.
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const allowed = ['site', 'age-groups', 'pages'];
    const filter = category && allowed.includes(category) ? 'AND category = $3' : '';
    const params: unknown[] = [limit, offset];
    if (filter) params.push(category);

    const [rows, count] = await Promise.all([
      db.query(
        `SELECT id, url, alt_text, width, height, file_size, mime_type, category, created_at
           FROM media
          WHERE deleted_at IS NULL ${filter}
          ORDER BY created_at DESC
          LIMIT $1 OFFSET $2`,
        params
      ),
      db.query(
        `SELECT COUNT(*) AS total FROM media WHERE deleted_at IS NULL ${filter ? 'AND category = $1' : ''}`,
        filter ? [category] : []
      ),
    ]);

    const total = Number((count.rows[0] as { total?: string })?.total ?? 0);
    res.json({
      items: rows.rows,
      total,
      limit,
      offset,
      // Saves a caller doing the arithmetic to know whether to ask again.
      hasMore: offset + rows.rows.length < total,
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
}

export function createMediaRouter(db: Pool): express.Router {
  const router = express.Router();
  router.get('/', (req, res) => listMedia(db, req as AuthRequest, res));
  return router;
}

export default createMediaRouter;
