import express from 'express';
import type { Pool } from 'pg';
import multer from 'multer';
import { authenticate, createResolveAdmin, requireAdmin } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import * as c from '../../controllers/partnersController.js';

// 5 MB, as specified — a logo has no business being larger.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

/** Turns multer's own errors into JSON rather than an HTML stack trace. */
const handleLogo: express.RequestHandler = (req, res, next) => {
  upload.single('logo')(req, res, (err: unknown) => {
    if (!err) { next(); return; }
    const message = err instanceof Error ? err.message : 'Upload failed';
    const tooBig = message.includes('File too large');
    res.status(400).json({ error: tooBig ? 'Logo must be 5 MB or smaller' : message });
  });
};

export function createAdminPartnersRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.use(authenticate, resolveAdmin, requireAdmin);

  router.get('/', (req, res) => c.listPartners(db, req as AuthRequest, res));
  router.post('/', handleLogo, (req, res) => c.createPartner(db, req as AuthRequest, res));
  // Registered before /:id so "reorder" is not swallowed as an id.
  router.post('/reorder', (req, res) => c.reorderPartners(db, req as AuthRequest, res));
  router.put('/:id/reorder', (req, res) => c.setPartnerOrder(db, req as AuthRequest, res));
  router.put('/:id', handleLogo, (req, res) => c.updatePartner(db, req as AuthRequest, res));
  router.delete('/:id', (req, res) => c.deletePartner(db, req as AuthRequest, res));
  router.post('/:id/restore', (req, res) => c.restorePartner(db, req as AuthRequest, res));

  return router;
}
