import express from 'express';
import type { Pool } from 'pg';
import { createAdminRegistrationsRouter } from './registrations.js';
import { createAdminBookingsRouter } from './bookings.js';
import { createAdminGalleryRouter } from './gallery.js';
import { createAdminContentRouter, createAdminEventsRouter } from './content.js';
import { createAdminNewsRouter } from './news.js';
import { createAdminDashboardRouter } from './dashboard.js';
import { createAdminPagesRouter } from './pages.js';
import { createAdminSeoRouter } from './seo.js';
import { createAdminAnalyticsRouter } from './analytics.js';
import { createAdminUsersRouter } from './users.js';
import { createAdminChatbotRouter } from './chatbot.js';
import { createAdminSocialLinksRouter } from './socialLinks.js';
import { createAdminYoutubeVideosRouter } from './youtubeVideos.js';

/**
 * Aggregates every admin sub-router under /api/v1/admin.
 * Each sub-router applies its own authenticate → resolveAdmin → requireAdmin guard.
 */
export function createAdminRouter(db: Pool): express.Router {
  const router = express.Router();

  router.use('/registrations', createAdminRegistrationsRouter(db));
  router.use('/tour-bookings', createAdminBookingsRouter(db));
  router.use('/gallery', createAdminGalleryRouter(db));
  router.use('/content', createAdminContentRouter(db));
  router.use('/news', createAdminNewsRouter(db));
  router.use('/dashboard', createAdminDashboardRouter(db));
  // Same handlers as /content/events, at the path the admin Events tab uses.
  router.use('/events', createAdminEventsRouter(db));
  router.use('/pages', createAdminPagesRouter(db));
  router.use('/seo', createAdminSeoRouter(db));
  router.use('/analytics', createAdminAnalyticsRouter(db));
  router.use('/users', createAdminUsersRouter(db));
  router.use('/chatbot', createAdminChatbotRouter(db));
  router.use('/social-links', createAdminSocialLinksRouter(db));
  router.use('/youtube-videos', createAdminYoutubeVideosRouter(db));

  return router;
}
