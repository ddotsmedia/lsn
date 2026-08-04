import type { Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';
import type { GalleryImage, NewsEvent, Facility } from '../types/index.js';

const GalleryImageSchema = z.object({
  category_id: z.string(),
  image_url: z.string().url(),
  title: z.string().min(1),
  description: z.string().optional(),
});

const NewsEventSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  image_url: z.string().url().optional(),
  published_at: z.string().datetime().optional(),
});

const FacilitySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  image_url: z.string().url().optional(),
  location: z.string().min(1),
});

// Gallery
export async function getGallery(db: Pool, _req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await db.query(
      'SELECT g.*, gc.name as category_name FROM gallery_images g JOIN gallery_categories gc ON g.category_id = gc.id ORDER BY g.created_at DESC'
    );
    res.json(result.rows as GalleryImage[]);
  } catch (error) {
    console.error('getGallery failed', error);
    res.status(500).json({ error: 'Failed to fetch gallery' });
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
      'INSERT INTO gallery_images (category_id, image_url, title, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [data.category_id, data.image_url, data.title, data.description || null]
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
    const result = await db.query('DELETE FROM gallery_images WHERE id = $1', [id]);
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
export async function getEvents(db: Pool, _req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await db.query('SELECT * FROM news_events ORDER BY published_at DESC');
    res.json(result.rows as NewsEvent[]);
  } catch (error) {
    console.error('getEvents failed', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
}

export async function createEvent(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = NewsEventSchema.parse(req.body);
    const result = await db.query(
      'INSERT INTO news_events (title, slug, content, image_url, published_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [data.title, data.slug, data.content, data.image_url || null, data.published_at || new Date()]
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
    const result = await db.query('DELETE FROM news_events WHERE id = $1', [id]);
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
    const result = await db.query('SELECT * FROM facilities ORDER BY created_at DESC');
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
