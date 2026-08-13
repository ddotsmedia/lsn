import express from 'express';
import multer from 'multer';
import type { Pool } from 'pg';
import { authenticate, createResolveAdmin, requireAdmin } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import * as c from '../../controllers/newsController.js';

// 10 MB, as specified. memoryStorage streams the buffer straight to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

/** Turns multer's own errors into JSON rather than an HTML stack trace. */
const handleImage: express.RequestHandler = (req, res, next) => {
  upload.single('image')(req, res, (err: unknown) => {
    if (!err) { next(); return; }
    const message = err instanceof Error ? err.message : 'Upload failed';
    const tooBig = message.includes('File too large');
    res.status(400).json({ error: tooBig ? 'Image must be 10 MB or smaller' : message });
  });
};

export function createAdminNewsRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.use(authenticate, resolveAdmin, requireAdmin);

  router.get('/', (req, res) => c.listNews(db, req as AuthRequest, res));
  router.get('/:id', (req, res) => c.getNews(db, req as AuthRequest, res));
  router.post('/', (req, res) => c.createNews(db, req as AuthRequest, res));
  router.put('/:id', (req, res) => c.updateNews(db, req as AuthRequest, res));
  router.delete('/:id', (req, res) => c.deleteNews(db, req as AuthRequest, res));
  router.post('/:id/restore', (req, res) => c.restoreNews(db, req as AuthRequest, res));

  // Featured image. Kept on the admin router rather than the public /news one,
  // which is unauthenticated and read-only.
  router.post('/:id/image', handleImage, (req, res) => c.uploadNewsImage(db, req as AuthRequest, res));
  router.delete('/:id/image', (req, res) => c.deleteNewsImage(db, req as AuthRequest, res));

  return router;
}
