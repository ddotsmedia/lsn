import express from 'express';
import type { Response } from 'express';
import type { Pool } from 'pg';
import type { AuthRequest } from '../middleware/auth.js';
import { listPublicSections } from '../controllers/pageContentController.js';

/**
 * Public page endpoints, including the images assigned to a page's slots.
 *
 * page_media keys on a slug derived from the page's `path`, not on a page_id:
 * pages.slug says "about" where the route is /nursery, and "news-events" where
 * the route is /events, so the site's own hooks fetch by route name. Resolving
 * through `path` here keeps this endpoint agreeing with them. The lookup also
 * accepts the pages.slug spelling, so both "about" and "nursery" work.
 */

/** '/'-rooted path to the slug page_media stores. '/' becomes 'home'. */
function mediaSlugFromPath(path: string | null, fallback: string): string {
  if (!path) return fallback;
  const trimmed = path.replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? 'home' : trimmed;
}

async function getPageMedia(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { slug } = req.params;

    const page = await db.query(
      `SELECT id, title, slug, path FROM pages
        WHERE deleted_at IS NULL AND (slug = $1 OR path = '/' || $1)
        LIMIT 1`,
      [slug]
    );
    const row = page.rows[0] as { id: string; title: string; slug: string; path: string | null } | undefined;

    // A page with no row is not an error: several routes have image slots but
    // no pages entry, and the slug is a valid key for page_media regardless.
    const mediaSlug = row ? mediaSlugFromPath(row.path, row.slug) : (slug as string);

    const result = await db.query(
      `SELECT m.id, m.url, m.alt_text, m.width, m.height,
              pm.media_section AS slot_name, pm.sort_order
         FROM media m
         JOIN page_media pm ON m.id = pm.media_id
        WHERE pm.page_slug = $1
          AND m.deleted_at IS NULL
          AND pm.deleted_at IS NULL
        ORDER BY pm.media_section ASC, pm.sort_order ASC`,
      [mediaSlug]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching page media:', error);
    res.status(500).json({ error: 'Failed to fetch page media' });
  }
}

/** Published pages, for a nav or sitemap. */
async function listPages(db: Pool, _req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await db.query(
      `SELECT id, title, slug, path, description
         FROM pages
        WHERE deleted_at IS NULL AND status = 'published'
        ORDER BY sort_order ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
}

export function createPagesRouter(db: Pool): express.Router {
  const router = express.Router();
  router.get('/', (req, res) => listPages(db, req as AuthRequest, res));
  router.get('/:slug/media', (req, res) => getPageMedia(db, req as AuthRequest, res));
  // Visible sections that have content. Read-only; edits go through /admin.
  router.get('/:pageId/content', (req, res) => listPublicSections(db, req as AuthRequest, res));
  return router;
}

export default createPagesRouter;
