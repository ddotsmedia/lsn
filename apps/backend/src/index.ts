import express from 'express';
import { Pool } from 'pg';
import { createAuthRouter } from './routes/auth.js';
import { createGalleryRouter } from './routes/gallery.js';
import { createEventsRouter } from './routes/events.js';
import { createFacilitiesRouter } from './routes/facilities.js';
import { createRegistrationsRouter } from './routes/registrations.js';
import { createBookingsRouter } from './routes/bookings.js';

const app = express();
const PORT = process.env.PORT || 3001;

const db = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://lsn:password@localhost:5432/littlesmarties',
});

// An idle client erroring must not take the process down.
db.on('error', (err) => console.error('Unexpected postgres client error', err));

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

app.use('/api/v1/auth', createAuthRouter(db));
app.use('/api/v1/gallery', createGalleryRouter(db));
app.use('/api/v1/events', createEventsRouter(db));
app.use('/api/v1/facilities', createFacilitiesRouter(db));
app.use('/api/v1/registrations', createRegistrationsRouter(db));
app.use('/api/v1/tour-bookings', createBookingsRouter(db));

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
