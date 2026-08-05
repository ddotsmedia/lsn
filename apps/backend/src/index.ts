import express from 'express';
import { Pool } from 'pg';
import path from 'path';
import { createAuthRouter } from './routes/auth.js';
import { createGalleryRouter } from './routes/gallery.js';
import { createEventsRouter } from './routes/events.js';
import { createFacilitiesRouter } from './routes/facilities.js';
import { createRegistrationsRouter } from './routes/registrations.js';
import { createBookingsRouter } from './routes/bookings.js';
import { createAdminRouter } from './routes/admin/index.js';
import { createPublicAnalyticsRouter } from './routes/admin/analytics.js';

const app = express();
const PORT = process.env.PORT || 3001;

const db = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://lsn:password@localhost:5432/littlesmarties',
});

// An idle client erroring must not take the process down.
db.on('error', (err) => console.error('Unexpected postgres client error', err));

app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.resolve('./uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

// Public API routes
app.use('/api/v1/auth', createAuthRouter(db));
app.use('/api/v1/gallery', createGalleryRouter(db));
app.use('/api/v1/events', createEventsRouter(db));
app.use('/api/v1/facilities', createFacilitiesRouter(db));
app.use('/api/v1/registrations', createRegistrationsRouter(db));
app.use('/api/v1/tour-bookings', createBookingsRouter(db));

// Public analytics tracker (no auth)
app.use('/api/v1/analytics', createPublicAnalyticsRouter(db));

// Admin API routes (all guarded by authenticate → resolveAdmin → requireAdmin)
app.use('/api/v1/admin', createAdminRouter(db));

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
