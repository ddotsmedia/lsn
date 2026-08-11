import type { Response } from 'express';
import type { Pool } from 'pg';
import type { AuthRequest } from '../middleware/auth.js';

/**
 * Dashboard statistics.
 *
 * Every query is run independently and every one is allowed to fail. The
 * dashboard previously used Promise.all against tables that did not exist in
 * production, so a single missing relation took the whole endpoint to a 500 and
 * the admin home page showed nothing at all. A missing table should cost you
 * one number, not the page.
 */

interface CountRow { count?: number }

export interface VisitedPage { path: string; count: number }

export interface DashboardStats {
  /** Approved registrations. There is no students table; this is the closest thing. */
  totalStudents: number;
  totalRegistrations: number;
  pageViews: number;
  visitedPages: VisitedPage[];

  registrations: { total: number; pending: number; approved: number; rejected: number; last_30_days: number };
  bookings: { total: number; pending: number; confirmed: number; cancelled: number; upcoming: number };
  events: { total: number };
  pages: { total: number; published: number; draft: number };
  gallery: { total_images: number; total_categories: number };
  analytics: { viewsToday: number; viewsWeek: number };
  recentActivity: Record<string, unknown>[];
  /** Names the queries that could not be answered, so the UI can say so. */
  degraded: string[];
}

const EMPTY: DashboardStats = {
  totalStudents: 0,
  totalRegistrations: 0,
  pageViews: 0,
  visitedPages: [],
  registrations: { total: 0, pending: 0, approved: 0, rejected: 0, last_30_days: 0 },
  bookings: { total: 0, pending: 0, confirmed: 0, cancelled: 0, upcoming: 0 },
  events: { total: 0 },
  pages: { total: 0, published: 0, draft: 0 },
  gallery: { total_images: 0, total_categories: 0 },
  analytics: { viewsToday: 0, viewsWeek: 0 },
  recentActivity: [],
  degraded: [],
};

/** Names each query so a failure can be reported precisely rather than as "something broke". */
const QUERIES = {
  registrations: `SELECT
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
      COUNT(*) FILTER (WHERE status = 'approved')::int as approved,
      COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected,
      COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::int as last_30_days
    FROM registrations`,
  bookings: `SELECT
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
      COUNT(*) FILTER (WHERE status = 'confirmed')::int as confirmed,
      COUNT(*) FILTER (WHERE status = 'cancelled')::int as cancelled,
      COUNT(*) FILTER (WHERE preferred_date >= CURRENT_DATE)::int as upcoming
    FROM tour_bookings`,
  events: `SELECT COUNT(*)::int as total FROM news_events WHERE deleted_at IS NULL`,
  pages: `SELECT COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE status = 'published')::int as published,
      COUNT(*) FILTER (WHERE status = 'draft')::int as draft
    FROM pages WHERE deleted_at IS NULL`,
  gallery: `SELECT COUNT(*)::int as total_images,
      (SELECT COUNT(*)::int FROM gallery_categories WHERE deleted_at IS NULL) as total_categories
    FROM gallery_images WHERE deleted_at IS NULL`,
  recentActivity: `SELECT al.*, u.name as admin_name
      FROM admin_activity_log al
      LEFT JOIN users u ON al.admin_user_id = u.id
      ORDER BY al.created_at DESC LIMIT 10`,
  viewsToday: `SELECT COUNT(*)::int as count FROM page_analytics WHERE visited_at >= CURRENT_DATE`,
  viewsWeek: `SELECT COUNT(*)::int as count FROM page_analytics WHERE visited_at >= CURRENT_DATE - INTERVAL '7 days'`,
  pageViews: `SELECT COUNT(*)::int as count FROM page_analytics`,
  visitedPages: `SELECT page_path as path, COUNT(*)::int as count
      FROM page_analytics
      GROUP BY page_path
      ORDER BY count DESC
      LIMIT 10`,
} as const;

type QueryName = keyof typeof QUERIES;

export async function buildDashboardStats(db: Pool): Promise<DashboardStats> {
  const names = Object.keys(QUERIES) as QueryName[];
  const settled = await Promise.allSettled(names.map((name) => db.query(QUERIES[name])));

  const rowsOf = (name: QueryName): Record<string, unknown>[] => {
    const index = names.indexOf(name);
    const result = settled[index];
    if (result?.status === 'fulfilled') return result.value.rows as Record<string, unknown>[];
    return [];
  };

  const degraded: string[] = [];
  settled.forEach((result, i) => {
    if (result.status === 'rejected') {
      degraded.push(names[i] as string);
      console.error(`dashboard query "${names[i]}" failed`, result.reason);
    }
  });

  const first = <T>(name: QueryName, fallback: T): T =>
    (rowsOf(name)[0] as T | undefined) ?? fallback;

  const registrations = first('registrations', EMPTY.registrations);
  const pageViews = (first<CountRow>('pageViews', {}).count) ?? 0;

  return {
    totalStudents: registrations.approved ?? 0,
    totalRegistrations: registrations.total ?? 0,
    pageViews,
    visitedPages: rowsOf('visitedPages') as unknown as VisitedPage[],

    registrations,
    bookings: first('bookings', EMPTY.bookings),
    events: { total: (first<{ total?: number }>('events', {}).total) ?? 0 },
    pages: first('pages', EMPTY.pages),
    gallery: first('gallery', EMPTY.gallery),
    analytics: {
      viewsToday: (first<CountRow>('viewsToday', {}).count) ?? 0,
      viewsWeek: (first<CountRow>('viewsWeek', {}).count) ?? 0,
    },
    recentActivity: rowsOf('recentActivity'),
    degraded,
  };
}

// ------------------------------------------------------------------- cache

const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { at: number; value: DashboardStats } | null = null;

/** Dropped whenever the numbers would be stale, e.g. after a seed or import. */
export function clearDashboardCache(): void {
  cached = null;
}

export async function getDashboardStats(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    // ?fresh=true bypasses the cache, for when an admin has just changed
    // something and wants to see it reflected immediately.
    const bypass = req.query.fresh === 'true';
    const now = Date.now();

    if (!bypass && cached && now - cached.at < CACHE_TTL_MS) {
      res.set('X-Cache', 'HIT');
      res.json(cached.value);
      return;
    }

    const stats = await buildDashboardStats(db);
    cached = { at: now, value: stats };
    res.set('X-Cache', bypass ? 'BYPASS' : 'MISS');
    res.json(stats);
  } catch (error) {
    // buildDashboardStats swallows per-query failures, so reaching here means
    // something more fundamental went wrong. Still answer with a usable shape.
    console.error('getDashboardStats failed', error);
    res.json({ ...EMPTY, degraded: ['all'] });
  }
}

// -------------------------------------------------------------- page views

/**
 * Raw-ish page view data with filters: ?from, ?to (YYYY-MM-DD), ?path, ?limit.
 * Returns both the per-page totals and a daily series, which is what a chart
 * needs without a second request.
 */
export async function getPageViews(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { from, to, path } = req.query as Record<string, string | undefined>;
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 50));

    const isDate = (v: string | undefined): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (isDate(from)) { params.push(from); conditions.push(`visited_at >= $${params.length}::date`); }
    // The whole of the "to" day, not everything up to midnight at its start.
    if (isDate(to)) { params.push(to); conditions.push(`visited_at < ($${params.length}::date + INTERVAL '1 day')`); }
    if (path) { params.push(path); conditions.push(`page_path = $${params.length}`); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [byPage, byDay, total] = await Promise.all([
      db.query(
        `SELECT page_path as path, COUNT(*)::int as count,
                COUNT(DISTINCT session_id)::int as sessions,
                MAX(visited_at) as last_visit
           FROM page_analytics ${where}
          GROUP BY page_path
          ORDER BY count DESC
          LIMIT $${params.length + 1}`,
        [...params, limit]
      ),
      db.query(
        `SELECT visited_at::date as day, COUNT(*)::int as count
           FROM page_analytics ${where}
          GROUP BY day
          ORDER BY day ASC`,
        params
      ),
      db.query(`SELECT COUNT(*)::int as count FROM page_analytics ${where}`, params),
    ]);

    res.json({
      filters: { from: from ?? null, to: to ?? null, path: path ?? null, limit },
      total: (total.rows[0] as CountRow | undefined)?.count ?? 0,
      byPage: byPage.rows,
      byDay: byDay.rows,
    });
  } catch (error) {
    console.error('getPageViews failed', error);
    // An empty result set reads better on a dashboard than an error banner.
    res.json({ filters: {}, total: 0, byPage: [], byDay: [], error: 'Analytics unavailable' });
  }
}
