import 'express-async-errors';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { Pool } from 'pg';
import { cloudinary } from './config/cloudinary.js';
import { createAuthRouter } from './routes/auth-proper.js';
import { createGalleryRouter } from './routes/gallery.js';
import { createEventsRouter } from './routes/events.js';
import { createFacilitiesRouter } from './routes/facilities.js';
import { createRegistrationsRouter } from './routes/registrations.js';
import { createBookingsRouter } from './routes/bookings.js';
import { createChatbotRouter } from './routes/chatbot.js';
import { createPublicContentRouter } from './routes/content.js';
import { createVideoUploadRouter } from './routes/videoUpload.js';
import { createAgeGroupsRouter } from './routes/ageGroups.js';
import { createMediaRouter } from './routes/media.js';
import { createPagesRouter } from './routes/pages.js';
import { createAdminRouter } from './routes/admin/index.js';
import { createPageContentRouter } from './routes/pageContent.js';
import { createAnalyticsTracker } from './middleware/analytics.js';

const app = express();
const PORT = process.env.PORT || 3011;

if (!cloudinary.config().api_key) {
  console.warn('Cloudinary is not configured — image uploads will fail. Set CLOUDINARY_URL.');
}

const db = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://lsn:password@localhost:5432/littlesmarties',
});

// An idle client erroring must not take the process down.
db.on('error', (err) => console.error('Unexpected postgres client error', err));

// Enable CORS for frontend
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3010',
    'http://127.0.0.1:3010',
    'http://187.127.185.239:3000',
    'http://187.127.185.239:3001',
    'https://lsn.ae',
    'https://www.lsn.ae',
    'https://bayrotna.ae',
    'https://www.bayrotna.ae',
    'https://admin.lsn.ae',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Serve uploaded gallery images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

// Records public page views. Mounted after /health and before the routers so it
// sees visitor traffic; it skips admin and auth paths itself, and never blocks
// or fails a request.
app.use(createAnalyticsTracker(db));

app.use('/api/v1/auth', createAuthRouter(db));
app.use('/api/v1/gallery', createGalleryRouter(db));
app.use('/api/v1/events', createEventsRouter(db));
app.use('/api/v1/facilities', createFacilitiesRouter(db));
app.use('/api/v1/registrations', createRegistrationsRouter(db));
app.use('/api/v1/tour-bookings', createBookingsRouter(db));
app.use('/api/v1/chatbot', createChatbotRouter(db));
app.use('/api/v1/videos', createVideoUploadRouter(db));
app.use('/api/v1/age-groups', createAgeGroupsRouter(db));
app.use('/api/v1/media', createMediaRouter(db));
app.use('/api/v1', createPagesRouter(db));
app.use('/api/v1', createPublicContentRouter(db));
app.use('/api/v1/admin', createAdminRouter(db));
app.use('/api/v1', createPageContentRouter(db));

// 404 handler for undefined routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler — must be last middleware (4-arg signature)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
