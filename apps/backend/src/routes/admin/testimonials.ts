import express from 'express';
import type { Pool } from 'pg';
import multer from 'multer';
import { authenticate, createResolveAdmin, requireAdmin } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import * as c from '../../controllers/testimonialsController.js';

// 5 MB is ample for an author portrait. memoryStorage streams the buffer
// straight to Cloudinary, so nothing is written to the container's disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const handleImage: express.RequestHandler = (req, res, next) => {
  upload.single('image')(req, res, (err: unknown) => {
    if (!err) { next(); return; }
    const message = err instanceof Error ? err.message : 'Upload failed';
    const tooBig = message.includes('File too large');
    res.status(400).json({ error: tooBig ? 'Photo must be 5 MB or smaller' : message });
  });
};

export function createAdminTestimonialsRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.use(authenticate, resolveAdmin, requireAdmin);

  router.get('/', (req, res) => c.listTestimonials(db, req as AuthRequest, res));
  // Before /:id so "reorder" is not read as an id.
  router.post('/reorder', (req, res) => c.reorderTestimonials(db, req as AuthRequest, res));
  router.post('/', (req, res) => c.createTestimonial(db, req as AuthRequest, res));
  router.put('/:id', (req, res) => c.updateTestimonial(db, req as AuthRequest, res));
  router.delete('/:id', (req, res) => c.deleteTestimonial(db, req as AuthRequest, res));
  router.post('/:id/restore', (req, res) => c.restoreTestimonial(db, req as AuthRequest, res));
  router.post('/:id/image', handleImage, (req, res) => c.uploadAuthorImage(db, req as AuthRequest, res));
  router.delete('/:id/image', (req, res) => c.deleteAuthorImage(db, req as AuthRequest, res));

  return router;
}
