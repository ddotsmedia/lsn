import express from 'express';
import type { Pool } from 'pg';
import type { Request, Response } from 'express';

export const createPagesRouter = (db: Pool) => {
  const router = express.Router();

  // Get all pages
  router.get('/pages', async (req: Request, res: Response) => {
    try {
      const result = await db.query(
        'SELECT id, slug, title, description FROM pages WHERE deleted_at IS NULL ORDER BY sort_order'
      );
      res.json({ status: 'ok', data: result.rows });
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      res.status(500).json({ error: 'Failed to fetch pages' });
    }
  });

  // Get page with sections
  router.get('/pages/:pageSlug', async (req: Request, res: Response) => {
    try {
      const { pageSlug } = req.params;

      const pageResult = await db.query(
        'SELECT id, slug, title, description FROM pages WHERE slug = $1 AND deleted_at IS NULL',
        [pageSlug]
      );

      if (pageResult.rows.length === 0) {
        return res.status(404).json({ error: 'Page not found' });
      }

      const sectionsResult = await db.query(
        'SELECT id, page_id, section_key, section_title, content_text, image_url, section_order FROM page_sections WHERE page_id = $1 ORDER BY section_order',
        [pageResult.rows[0].id]
      );

      res.json({
        status: 'ok',
        page: pageResult.rows[0],
        sections: sectionsResult.rows
      });
    } catch (error) {
      console.error('Failed to fetch page:', error);
      res.status(500).json({ error: 'Failed to fetch page' });
    }
  });

  // Update page metadata
  router.put('/pages/:pageSlug', async (req: Request, res: Response) => {
    try {
      const { pageSlug } = req.params;
      const { title, description } = req.body;

      const result = await db.query(
        'UPDATE pages SET title = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE slug = $3 AND deleted_at IS NULL RETURNING id, slug, title, description',
        [title, description, pageSlug]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Page not found' });
      }

      res.json({ status: 'ok', data: result.rows[0] });
    } catch (error) {
      console.error('Failed to update page:', error);
      res.status(500).json({ error: 'Failed to update page' });
    }
  });

  // Update section
  router.put('/pages/:pageSlug/sections/:sectionKey', async (req: Request, res: Response) => {
    try {
      const { pageSlug, sectionKey } = req.params;
      const { section_title, content_text, image_url } = req.body;

      const pageResult = await db.query(
        'SELECT id FROM pages WHERE slug = $1',
        [pageSlug]
      );

      if (pageResult.rows.length === 0) {
        return res.status(404).json({ error: 'Page not found' });
      }

      const result = await db.query(
        'UPDATE page_sections SET section_title = $1, content_text = $2, image_url = $3, updated_at = CURRENT_TIMESTAMP WHERE page_id = $4 AND section_key = $5 RETURNING *',
        [section_title, content_text, image_url, pageResult.rows[0].id, sectionKey]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Section not found' });
      }

      res.json({ status: 'ok', data: result.rows[0] });
    } catch (error) {
      console.error('Failed to update section:', error);
      res.status(500).json({ error: 'Failed to update section' });
    }
  });

  // Create new section
  router.post('/pages/:pageSlug/sections', async (req: Request, res: Response) => {
    try {
      const { pageSlug } = req.params;
      const { section_key, section_title, content_text, image_url } = req.body;

      const pageResult = await db.query(
        'SELECT id FROM pages WHERE slug = $1',
        [pageSlug]
      );

      if (pageResult.rows.length === 0) {
        return res.status(404).json({ error: 'Page not found' });
      }

      const orderResult = await db.query(
        'SELECT COALESCE(MAX(section_order), 0) + 1 as next_order FROM page_sections WHERE page_id = $1',
        [pageResult.rows[0].id]
      );

      const nextOrder = (orderResult.rows[0] as { next_order: number }).next_order;

      const result = await db.query(
        'INSERT INTO page_sections (page_id, section_key, section_title, content_text, image_url, section_order) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [pageResult.rows[0].id, section_key, section_title, content_text, image_url, nextOrder]
      );

      res.json({ status: 'ok', data: result.rows[0] });
    } catch (error) {
      console.error('Failed to create section:', error);
      res.status(500).json({ error: 'Failed to create section' });
    }
  });

  return router;
};

export default createPagesRouter;
