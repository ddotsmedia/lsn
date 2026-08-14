import express from 'express';
import type { Pool } from 'pg';
import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';

export function createPageContentRouter(db: Pool): express.Router {
  const router = express.Router();

  // GET page content
  router.get('/pages/:pageSlug/content', async (req: AuthRequest, res: Response) => {
    try {
      const { pageSlug } = req.params;
      const result = await db.query(
        'SELECT * FROM page_content WHERE page_id = $1 ORDER BY display_order',
        [pageSlug]
      );
      res.json({ status: 'ok', data: result.rows });
    } catch (error) {
      console.error('Failed to fetch page content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  // GET specific content section
  router.get('/pages/:pageSlug/content/:sectionKey', async (req: AuthRequest, res: Response) => {
    try {
      const { pageSlug, sectionKey } = req.params;
      const result = await db.query(
        'SELECT * FROM page_content WHERE page_id = $1 AND section_key = $2',
        [pageSlug, sectionKey]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Section not found' });
      }
      res.json({ status: 'ok', data: result.rows[0] });
    } catch (error) {
      console.error('Failed to fetch page content:', error);
      res.status(500).json({ error: 'Failed to fetch content' });
    }
  });

  // UPDATE content (admin only)
  router.put('/pages/:pageSlug/content/:sectionKey', async (req: AuthRequest, res: Response) => {
    try {
      const { pageSlug, sectionKey } = req.params;
      const { content_value } = req.body;

      if (!content_value) {
        return res.status(400).json({ error: 'content_value is required' });
      }

      const result = await db.query(
        'UPDATE page_content SET content_value = $1, updated_at = CURRENT_TIMESTAMP WHERE page_id = $2 AND section_key = $3 RETURNING *',
        [content_value, pageSlug, sectionKey]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Section not found' });
      }

      res.json({ status: 'ok', data: result.rows[0], message: 'Content updated' });
    } catch (error) {
      console.error('Failed to update page content:', error);
      res.status(500).json({ error: 'Failed to update content' });
    }
  });

  return router;
}
