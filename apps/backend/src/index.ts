import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { createAuthRouter } from './routes/auth.js';
import { createGalleryRouter } from './routes/gallery.js';
import { createEventsRouter } from './routes/events.js';
import { createFacilitiesRouter } from './routes/facilities.js';
import { createRegistrationsRouter } from './routes/registrations.js';
import { createBookingsRouter } from './routes/bookings.js';
import { createChatbotRouter } from './routes/chatbot.js';
import multer from 'multer';
import cloudinary from 'cloudinary';
import { createVideoUploadRouter } from './routes/videoUpload.js';
import { createAdminRouter } from './routes/admin/index.js';

const app = express();
// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const PORT = process.env.PORT || 3011;

const db = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://lsn:password@localhost:5432/littlesmarties',
});

// An idle client erroring must not take the process down.
db.on('error', (err) => console.error('Unexpected postgres client error', err));

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3010', 'http://127.0.0.1:3010'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

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
app.use('/api/v1/chatbot', createChatbotRouter(db));
app.use('/api/v1/admin', createAdminRouter(db));
app.use('/api/v1/videos', createVideoUploadRouter(db));

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
