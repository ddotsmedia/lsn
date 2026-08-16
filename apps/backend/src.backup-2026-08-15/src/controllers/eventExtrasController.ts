import type { Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import type { AuthRequest } from '../middleware/auth.js';
import { logActivity } from '../utils/activityLog.js';

/**
 * The parts of event management that sit outside plain CRUD: the image upload,
 * ordering, and capacity.
 *
 * These operate on news_events, the table the site has always used for events.
 * See migration 026 for why there is no separate `events` table.
 */

export async function uploadEventImage(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await db.query(
      'SELECT id, title FROM news_events WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Event not found' }); return; }

    if (!req.file) { res.status(400).json({ error: 'No image provided' }); return; }
    if (!isCloudinaryConfigured()) {
      res.status(503).json({ error: 'Image hosting is not configured. Set CLOUDINARY_URL.' });
      return;
    }

    // A public_id fixed to the event, with overwrite: replacing the picture
    // replaces the file rather than leaving the old one orphaned.
    const uploaded = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'bayrotna/events',
          public_id: `event_${id}`,
          overwrite: true,
          invalidate: true,
          resource_type: 'image',
          tags: ['event'],
          transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
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
      `UPDATE news_events SET image_url = $1, cloudinary_id = $2, uploaded_by = $3
        WHERE id = $4 AND deleted_at IS NULL RETURNING *`,
      [url, uploaded.public_id, req.userId ?? null, id]
    );

    await logActivity(db, req.userId, 'upload', 'news_event', id as string, {
      details: { action: 'image_uploaded', cloudinary_id: uploaded.public_id }, req,
    });
    res.json({ success: true, event: result.rows[0], imageUrl: url });
  } catch (error) {
    console.error('Event image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
}

export async function deleteEventImage(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const existing = await db.query(
      'SELECT cloudinary_id FROM news_events WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    if (existing.rows.length === 0) { res.status(404).json({ error: 'Event not found' }); return; }

    const { cloudinary_id: publicId } = existing.rows[0] as { cloudinary_id: string | null };

    const result = await db.query(
      `UPDATE news_events SET image_url = NULL, cloudinary_id = NULL, uploaded_by = $1
        WHERE id = $2 RETURNING *`,
      [req.userId ?? null, id]
    );

    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
      } catch (error) {
        console.error(`cloudinary destroy failed for ${publicId}`, error);
      }
    }

    await logActivity(db, req.userId, 'delete', 'news_event', id as string, {
      details: { action: 'image_removed' }, req,
    });
    res.json({ success: true, event: result.rows[0] });
  } catch (error) {
    console.error('Error removing event image:', error);
    res.status(500).json({ error: 'Failed to remove image' });
  }
}

/**
 * `start` is the index of the first id within the whole list. The admin table
 * is paginated, so reordering page 2 must write 20..39, not 0..19 — otherwise
 * the two pages would claim the same positions.
 */
const ReorderSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  start: z.number().int().min(0).max(100000).optional(),
});

export async function reorderEvents(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { ids, start } = ReorderSchema.parse(req.body);
    // One statement, so a half-applied order is impossible.
    await db.query(
      `UPDATE news_events AS e
          SET sort_order = v.ord + $3::int, uploaded_by = $2
         FROM (SELECT unnest($1::uuid[]) AS id, generate_subscripts($1::uuid[], 1) AS ord) AS v
        WHERE e.id = v.id AND e.deleted_at IS NULL`,
      [ids, req.userId ?? null, start ?? 0]
    );

    await logActivity(db, req.userId, 'update', 'news_event', ids[0] as string, {
      details: { action: 'reordered', count: ids.length, start: start ?? 0 }, req,
    });
    res.json({ reordered: ids.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Error reordering events:', error);
    res.status(500).json({ error: 'Failed to reorder events' });
  }
}

/**
 * Registers an attendee against an event.
 *
 * The capacity check and the insert run in one transaction with the event row
 * locked, so two people booking the last place at the same moment cannot both
 * succeed. current_registrations is maintained by a trigger (migration 026),
 * not incremented here, so it cannot drift from the actual rows.
 */
const EventRegistrationSchema = z.object({
  child_name: z.string().trim().min(1, 'Child name is required').max(255),
  child_dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be YYYY-MM-DD'),
  parent_name: z.string().trim().min(1, 'Parent name is required').max(255),
  parent_email: z.string().email(),
  parent_phone: z.string().trim().min(7).max(40),
  message: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().max(4000).nullable().optional()
  ),
});

export async function registerForEvent(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  const client = await db.connect();
  try {
    const { id } = req.params;
    const data = EventRegistrationSchema.parse(req.body);

    await client.query('BEGIN');

    // FOR UPDATE holds the row until the transaction ends, so a concurrent
    // booking waits here rather than reading the same free place.
    const event = await client.query(
      `SELECT id, title, capacity, current_registrations, is_published, event_date
         FROM news_events
        WHERE id = $1 AND deleted_at IS NULL AND is_published = TRUE
        FOR UPDATE`,
      [id]
    );
    if (event.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const row = event.rows[0] as { capacity: number | null; current_registrations: number; title: string };
    if (row.capacity !== null && row.current_registrations >= row.capacity) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'This event is fully booked' });
      return;
    }

    const created = await client.query(
      `INSERT INTO registrations
         (child_name, child_dob, parent_name, parent_email, parent_phone, message, event_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING *`,
      [
        data.child_name, data.child_dob, data.parent_name,
        data.parent_email, data.parent_phone, data.message ?? null, id,
      ]
    );

    await client.query('COMMIT');

    // No admin id: this is a visitor booking, not an administrator's action.
    await logActivity(db, undefined, 'create', 'event_registration', created.rows[0]?.id as string, {
      details: { event_id: id, event: row.title }, req,
    });

    res.status(201).json({ success: true, registration: created.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
      return;
    }
    console.error('Event registration failed', error);
    res.status(500).json({ error: 'Failed to register for this event' });
  } finally { client.release(); }
}
