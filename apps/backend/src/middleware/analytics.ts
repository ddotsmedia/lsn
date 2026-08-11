import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { Pool } from 'pg';

/**
 * Records a page view per request, without ever getting in the request's way.
 *
 * The site is a client-rendered Next.js app, so the server never sees a
 * navigation to /gallery — it sees the API calls that page makes. The Referer
 * header carries the page the visitor is actually on, so that is what gets
 * recorded when it is present, falling back to the request path. Without that,
 * "top visited pages" would be a list of API endpoints.
 */

/** Paths that are never a page view. */
const SKIP_PREFIXES = [
  '/api/v1/admin', // admin traffic is staff, not visitors
  '/health',
  '/api/v1/auth', // login/refresh, and never worth logging with an IP
];

/** One page counts once per session per window, however many API calls it makes. */
const DEDUPE_WINDOW_MINUTES = 30;

/** Trims a URL down to its path, so query strings do not fragment the counts. */
function toPath(value: string | undefined): string | null {
  if (!value) return null;
  try {
    // Referer is absolute; req paths are not, hence the base.
    const url = new URL(value, 'http://placeholder.invalid');
    return url.pathname || '/';
  } catch {
    return null;
  }
}

/** First hop of X-Forwarded-For, since nginx sits in front of this. */
function clientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || null;
  }
  return req.socket.remoteAddress || null;
}

/**
 * A per-visitor-per-day identifier. Hashed rather than stored raw so the
 * session key itself is not another copy of the visitor's IP, and salted with
 * the date so it rotates daily instead of following someone indefinitely.
 */
function sessionId(ip: string | null, userAgent: string, day: string): string {
  return crypto.createHash('sha256').update(`${ip ?? 'unknown'}|${userAgent}|${day}`).digest('hex').slice(0, 32);
}

function deviceOf(ua: string): string {
  if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

function browserOf(ua: string): string {
  if (/edg/i.test(ua)) return 'Edge';
  if (/opr|opera/i.test(ua)) return 'Opera';
  if (/chrome/i.test(ua) && !/edg|opr/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  return 'other';
}

export function createAnalyticsTracker(db: Pool) {
  return function trackPageView(req: Request, _res: Response, next: NextFunction): void {
    // Hand the request on immediately; tracking happens alongside it and its
    // outcome must never affect the response.
    next();

    try {
      if (req.method !== 'GET') return;

      const requestPath = req.originalUrl.split('?')[0] ?? '';
      if (SKIP_PREFIXES.some((prefix) => requestPath.startsWith(prefix))) return;

      const referer = typeof req.headers.referer === 'string' ? req.headers.referer : undefined;
      const pagePath = toPath(referer) ?? toPath(requestPath);
      if (!pagePath) return;

      // A referer pointing into the admin panel is staff browsing, not a visit.
      if (pagePath.startsWith('/admin')) return;

      const ua = (req.headers['user-agent'] as string) || '';
      // Crawlers would otherwise dominate the counts.
      if (/bot|crawler|spider|crawling|preview|monitor|curl|wget|headless/i.test(ua)) return;

      const ip = clientIp(req);
      const day = new Date().toISOString().slice(0, 10);
      const session = sessionId(ip, ua, day);

      // INSERT ... SELECT so the dedupe check and the write are one round trip
      // and cannot race with a parallel request from the same visitor.
      void db
        .query(
          // Every parameter is cast explicitly. page_path is varchar but the
          // slug comparison below produces text, and without the casts Postgres
          // deduces two different types for the same placeholder and rejects
          // the statement with 42P08.
          `INSERT INTO page_analytics
             (page_path, page_id, visitor_ip, visitor_id, user_agent, referer, referrer,
              session_id, device_type, browser, visited_at, created_at)
           SELECT $1::text,
                  (SELECT id FROM pages
                    WHERE deleted_at IS NULL
                      AND (path = $1::text OR '/' || slug = $1::text)
                    LIMIT 1),
                  $2::text, $3::text, $4::text, $5::text, $5::text, $3::text,
                  $6::text, $7::text, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            WHERE NOT EXISTS (
              SELECT 1 FROM page_analytics
               WHERE session_id = $3::text
                 AND page_path = $1::text
                 AND visited_at > CURRENT_TIMESTAMP - make_interval(mins => $8::int)
            )`,
          [pagePath, ip, session, ua || null, referer ?? null, deviceOf(ua), browserOf(ua), DEDUPE_WINDOW_MINUTES]
        )
        .catch((error: unknown) => {
          // Missing table, bad column, database down — none of it should
          // surface to a visitor, but it should be visible in the logs.
          console.error('analytics tracking failed', error);
        });
    } catch (error) {
      console.error('analytics tracking failed', error);
    }
  };
}
