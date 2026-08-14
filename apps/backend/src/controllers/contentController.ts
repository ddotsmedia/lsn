import type { Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';
import type { GalleryImage, NewsEvent, Facility } from '../types/index.js';

const GalleryImageSchema = z.object({
  category_id: z.string().uuid(),
  image_url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
  alt_text: z.string().max(255).optional(),
  sort_order: z.number().int().optional(),
  is_featured: z.boolean().optional(),
});

/** Matches the news_events columns as they exist, not the original 001 shape. */
const NewsEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'event_date must be YYYY-MM-DD'),
  event_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  location: z.string().max(255).optional(),
  image_url: z.string().url().optional(),
  event_type: z.string().max(40).optional(),
  age_groups: z.string().max(255).optional(),
  is_published: z.boolean().optional(),
});

const FacilitySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  image_url: z.string().url().optional(),
  location: z.string().min(1),
});

// Gallery
/** Optional ?category=<slug> filter. LEFT JOIN so uncategorised images still show. */
export async function getGallery(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const params: unknown[] = [];
    let filter = '';

    if (category && category !== 'all') {
      params.push(category);
      filter = `AND gc.slug = $${params.length}`;
    }

    const result = await db.query(
      `SELECT g.*, gc.name AS category_name, gc.slug AS category_slug
       FROM gallery_images g
       LEFT JOIN gallery_categories gc
         ON g.category_id = gc.id AND gc.deleted_at IS NULL
       WHERE g.deleted_at IS NULL ${filter}
       ORDER BY g.is_featured DESC, g.sort_order ASC, g.created_at DESC`,
      params
    );
    res.json(result.rows as GalleryImage[]);
  } catch (error) {
    console.error('getGallery failed', error);
    res.status(500).json({ error: 'Failed to fetch gallery' });
  }
}

export async function getGalleryCategories(
  db: Pool,
  _req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const result = await db.query(
      `SELECT c.id, c.name, c.slug, c.description, c.sort_order,
              COUNT(g.id)::int AS image_count
       FROM gallery_categories c
       LEFT JOIN gallery_images g ON g.category_id = c.id AND g.deleted_at IS NULL
       WHERE c.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY c.sort_order ASC, c.name ASC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('getGalleryCategories failed', error);
    res.status(500).json({ error: 'Failed to fetch gallery categories' });
  }
}

export async function createGalleryImage(
  db: Pool,
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const data = GalleryImageSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO gallery_images
         (category_id, image_url, title, description, alt_text, sort_order, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        data.category_id,
        data.image_url,
        data.title,
        data.description || null,
        data.alt_text || null,
        data.sort_order ?? 0,
        data.is_featured ?? false,
      ]
    );
    res.status(201).json(result.rows[0] as GalleryImage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('createGalleryImage failed', error);
      res.status(500).json({ error: 'Failed to create gallery image' });
    }
  }
}

export async function deleteGalleryImage(
  db: Pool,
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const result = await db.query(
      'UPDATE gallery_images SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Gallery image not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('deleteGalleryImage failed', error);
    res.status(500).json({ error: 'Failed to delete gallery image' });
  }
}

// Events
/**
 * Optional ?scope=upcoming|past. Upcoming is ordered soonest-first and past
 * most-recent-first, which is how each is read.
 */
export async function getEvents(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const scope = typeof req.query.scope === 'string' ? req.query.scope : 'all';
    let where = 'WHERE is_published = TRUE AND deleted_at IS NULL';
    let order = 'event_date DESC NULLS LAST';

    if (scope === 'upcoming') {
      where += ' AND event_date >= CURRENT_DATE';
      // Upcoming is the list admins arrange by hand, so sort_order leads and
      // the date only breaks ties. Migration 026 seeds sort_order from the
      // date order, so this matches what the page showed before.
      order = 'sort_order ASC, event_date ASC NULLS LAST';
    } else if (scope === 'past') {
      where += ' AND event_date < CURRENT_DATE';
    }

    // ?category=Workshop narrows the list. Matched case-insensitively so a
    // filter button does not have to know the stored capitalisation.
    const params: unknown[] = [];
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    if (category && category.toLowerCase() !== 'all') {
      params.push(category);
      where += ` AND lower(event_type) = lower($${params.length})`;
    }

    const result = await db.query(
      `SELECT * FROM news_events ${where}
        ORDER BY ${order}, sort_order ASC, event_time ASC NULLS LAST`,
      params
    );
    res.json(result.rows as NewsEvent[]);
  } catch (error) {
    console.error('getEvents failed', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

/**
 * A single published event, for the detail page. Unpublished and deleted rows
 * are 404 rather than 403: a visitor should not be able to tell the difference
 * between an event that is hidden and one that never existed.
 */
export async function getEventById(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await db.query(
      `SELECT * FROM news_events
        WHERE id = $1 AND is_published = TRUE AND deleted_at IS NULL`,
      [req.params.id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'Event not found' }); return; }
    res.json(result.rows[0] as NewsEvent);
  } catch (error) {
    // An invalid uuid reaches here as a cast error; it is a bad id, not a fault.
    if ((error as { code?: string }).code === '22P02') {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    console.error('getEventById failed', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
}

export async function createEvent(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = NewsEventSchema.parse(req.body);
    const result = await db.query(
      `INSERT INTO news_events
         (title, description, event_date, event_time, end_time, location,
          image_url, event_type, age_groups, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        data.title,
        data.description || null,
        data.event_date,
        data.event_time || null,
        data.end_time || null,
        data.location || null,
        data.image_url || null,
        data.event_type || 'General',
        data.age_groups || null,
        data.is_published ?? true,
      ]
    );
    res.status(201).json(result.rows[0] as NewsEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('createEvent failed', error);
      res.status(500).json({ error: 'Failed to create event' });
    }
  }
}

export async function deleteEvent(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const result = await db.query(
      'UPDATE news_events SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error('deleteEvent failed', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
}

// Facilities
export async function getFacilities(db: Pool, _req: AuthRequest, res: Response): Promise<void> {
  try {
    // Soft-deleted facilities must not keep showing on the public page.
    const result = await db.query(
      'SELECT * FROM facilities WHERE deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC'
    );
    res.json(result.rows as Facility[]);
  } catch (error) {
    console.error('getFacilities failed', error);
    res.status(500).json({ error: 'Failed to fetch facilities' });
  }
}

export async function createFacility(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = FacilitySchema.parse(req.body);
    const result = await db.query(
      'INSERT INTO facilities (name, description, image_url, location) VALUES ($1, $2, $3, $4) RETURNING *',
      [data.name, data.description, data.image_url || null, data.location]
    );
    res.status(201).json(result.rows[0] as Facility);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('createFacility failed', error);
      res.status(500).json({ error: 'Failed to create facility' });
    }
  }
}
