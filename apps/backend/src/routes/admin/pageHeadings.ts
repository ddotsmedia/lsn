import express from 'express';
import type { Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { authenticate, createResolveAdmin, requireAdmin } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { logActivity } from '../../utils/activityLog.js';

/**
 * The H1 of each public page, editable from the admin panel.
 *
 * Slugs match the ones the frontend media hooks use, so a page reads its
 * heading and its images under the same key.
 */
export const PAGE_SLUGS = [
  'home',
  'nursery',
  'age-groups',
  'facilities',
  'gallery',
  'events',
  'contact',
  'booking',
  'register',
] as const;

export type PageSlug = (typeof PAGE_SLUGS)[number];

/** Human labels for the admin list, so it does not just show raw slugs. */
const PAGE_LABELS: Record<PageSlug, string> = {
  home: 'Home',
  nursery: 'About / Nursery',
  'age-groups': 'Age Groups',
  facilities: 'Facilities',
  gallery: 'Gallery',
  events: 'News & Events',
  contact: 'Contact',
  booking: 'Book a Tour',
  register: 'Register',
};

const headingSchema = z.object({
  // Newlines are allowed — the home hero renders its heading across two lines.
  heading_text: z.string().trim().min(1, 'Heading cannot be empty').max(200, 'Heading must be 200 characters or fewer'),
});

function isPageSlug(value: string): value is PageSlug {
  return (PAGE_SLUGS as readonly string[]).includes(value);
}

interface HeadingRow {
  page_slug: string;
  heading_text: string;
  updated_at: string;
}

// ------------------------------------------------------------------- handlers

/**
 * Every known page, whether or not it has a row yet. A page missing from the
 * table would otherwise be uneditable — the admin could never create it.
 */
export async function listHeadings(db: Pool, _req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await db.query('SELECT page_slug, heading_text, updated_at FROM page_headings');
    const bySlug = new Map<string, HeadingRow>();
    for (const row of result.rows as HeadingRow[]) bySlug.set(row.page_slug, row);

    res.json(
      PAGE_SLUGS.map((slug) => ({
        page_slug: slug,
        label: PAGE_LABELS[slug],
        heading_text: bySlug.get(slug)?.heading_text ?? '',
        updated_at: bySlug.get(slug)?.updated_at ?? null,
      }))
    );
  } catch (error) {
    console.error('listHeadings failed', error);
    res.status(500).json({ error: 'Failed to fetch page headings' });
  }
}

export async function getHeading(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  const slug = String(req.params.slug ?? '');
  if (!isPageSlug(slug)) {
    res.status(404).json({ error: `Unknown page "${slug}"` });
    return;
  }

  try {
    const result = await db.query(
      'SELECT page_slug, heading_text, updated_at FROM page_headings WHERE page_slug = $1',
      [slug]
    );
    const row = result.rows[0] as HeadingRow | undefined;
    if (!row) {
      // Known page, no row yet: report it as empty rather than 404, so the
      // public hook falls back to its built-in text instead of logging an error.
      res.json({ page_slug: slug, heading_text: null, updated_at: null });
      return;
    }
    res.json(row);
  } catch (error) {
    console.error('getHeading failed', error);
    res.status(500).json({ error: 'Failed to fetch page heading' });
  }
}

export async function updateHeading(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  const slug = String(req.params.slug ?? '');
  if (!isPageSlug(slug)) {
    res.status(404).json({ error: `Unknown page "${slug}"` });
    return;
  }

  const parsed = headingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid heading' });
    return;
  }

  try {
    const before = await db.query('SELECT heading_text FROM page_headings WHERE page_slug = $1', [slug]);

    const result = await db.query(
      `INSERT INTO page_headings (page_slug, heading_text, updated_at, updated_by)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
       ON CONFLICT (page_slug) DO UPDATE
         SET heading_text = $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3
       RETURNING page_slug, heading_text, updated_at`,
      [slug, parsed.data.heading_text, req.user?.userId ?? null]
    );

    const row = result.rows[0] as HeadingRow;
    await logActivity(db, req.user?.userId, 'update', 'page_headings', slug, {
      oldValues: before.rows[0] as Record<string, unknown> | undefined,
      newValues: { heading_text: row.heading_text },
      req,
    });

    res.json(row);
  } catch (error) {
    console.error('updateHeading failed', error);
    res.status(500).json({ error: 'Failed to update page heading' });
  }
}

export function createAdminPageHeadingsRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.use(authenticate, resolveAdmin, requireAdmin);

  router.get('/', (req, res) => listHeadings(db, req as AuthRequest, res));
  router.get('/:slug', (req, res) => getHeading(db, req as AuthRequest, res));
  router.put('/:slug', (req, res) => updateHeading(db, req as AuthRequest, res));

  return router;
}

export default createAdminPageHeadingsRouter;
