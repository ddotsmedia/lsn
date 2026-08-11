import express from 'express';
import type { Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import { authenticate, createResolveAdmin, requireAdmin } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { logActivity } from '../../utils/activityLog.js';
import { hashPassword } from '../../utils/hash.js';

const InviteSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password: z.string().min(8),
  role: z.enum(['admin', 'moderator']).optional(),
  permissions: z.array(z.string()).optional(),
});

const RoleUpdateSchema = z.object({
  role: z.enum(['admin', 'moderator']),
  permissions: z.array(z.string()).optional(),
});

// ---------- Users ----------
async function listUsers(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search as string | undefined;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(LOWER(u.name) LIKE $${paramIdx} OR LOWER(u.email) LIKE $${paramIdx})`);
      params.push(`%${search.toLowerCase()}%`);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*) FROM users u ${where}`, params);
    const total = Number(countResult.rows[0]?.count ?? 0);

    const dataResult = await db.query(
      `SELECT u.id, u.email, u.name, u.phone, u.created_at, u.updated_at,
              au.role as admin_role, au.permissions as admin_permissions
       FROM users u
       LEFT JOIN admin_users au ON au.user_id = u.id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({ data: dataResult.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('listUsers failed', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

async function getUser(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.name, u.phone, u.created_at, u.updated_at,
              au.role as admin_role, au.permissions as admin_permissions
       FROM users u
       LEFT JOIN admin_users au ON au.user_id = u.id
       WHERE u.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('getUser failed', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

async function inviteAdmin(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = InviteSchema.parse(req.body);
    const hash = await hashPassword(data.password);

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      // Create user (or skip if email already exists)
      const userResult = await client.query(
        `INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [data.email, data.name, hash]
      );
      const userId = (userResult.rows[0] as { id: string }).id;

      // Grant admin role
      await client.query(
        `INSERT INTO admin_users (user_id, role, permissions) VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET role = $2, permissions = $3`,
        [userId, data.role || 'moderator', data.permissions || []]
      );

      // users.role is what resolveAdmin reads; without this the invited admin
      // would be listed as one but get 403 from every admin endpoint.
      await client.query("UPDATE users SET role = 'admin' WHERE id = $1", [userId]);

      await client.query('COMMIT');

      await logActivity(db, req.userId, 'invite', 'user', userId, {
        email: data.email,
        role: data.role || 'moderator',
      });

      res.status(201).json({ id: userId, email: data.email, name: data.name, role: data.role || 'moderator' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: error.issues }); return; }
    console.error('inviteAdmin failed', error);
    res.status(500).json({ error: 'Failed to invite admin' });
  }
}

async function updateRole(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const data = RoleUpdateSchema.parse(req.body);

    // Prevent self-demotion
    if (id === req.userId) {
      res.status(400).json({ error: 'Cannot change your own role' });
      return;
    }

    const result = await db.query(
      `INSERT INTO admin_users (user_id, role, permissions) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET role = $2, permissions = $3
       RETURNING *`,
      [id, data.role, data.permissions || []]
    );

    // Keep users.role, the authorization source of truth, in step.
    await db.query("UPDATE users SET role = 'admin' WHERE id = $1", [id]);

    await logActivity(db, req.userId, 'update', 'admin_user', id, { role: data.role });
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: error.issues }); return; }
    console.error('updateRole failed', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
}

async function revokeAdmin(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (id === req.userId) {
      res.status(400).json({ error: 'Cannot revoke your own admin access' });
      return;
    }

    const result = await db.query('DELETE FROM admin_users WHERE user_id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) { res.status(404).json({ error: 'Admin user not found' }); return; }
    // users.role decides isAdmin, so revoking must clear it there too —
    // otherwise the account keeps full admin access.
    await db.query("UPDATE users SET role = 'user' WHERE id = $1", [id]);
    await logActivity(db, req.userId, 'delete', 'admin_user', id);
    res.status(204).send();
  } catch (error) {
    console.error('revokeAdmin failed', error);
    res.status(500).json({ error: 'Failed to revoke admin access' });
  }
}

// ---------- Activity Log ----------
async function getActivityLog(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const offset = (page - 1) * limit;
    const entityType = req.query.entityType as string | undefined;
    const action = req.query.action as string | undefined;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (entityType) { conditions.push(`al.entity_type = $${paramIdx++}`); params.push(entityType); }
    if (action) { conditions.push(`al.action = $${paramIdx++}`); params.push(action); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*) FROM admin_activity_log al ${where}`, params);
    const total = Number(countResult.rows[0]?.count ?? 0);

    const dataResult = await db.query(
      `SELECT al.*, u.name as admin_name, u.email as admin_email
       FROM admin_activity_log al
       LEFT JOIN users u ON al.admin_user_id = u.id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    res.json({ data: dataResult.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('getActivityLog failed', error);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
}

// ---------- Dashboard Stats ----------
async function getDashboardStats(db: Pool, _req: AuthRequest, res: Response): Promise<void> {
  try {
    const [registrations, bookings, events, pages, gallery, recentActivity, viewsToday, viewsWeek] = await Promise.all([
      db.query(`SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
        COUNT(*) FILTER (WHERE status = 'approved')::int as approved,
        COUNT(*) FILTER (WHERE status = 'rejected')::int as rejected,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::int as last_30_days
        FROM registrations`),
      db.query(`SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending,
        COUNT(*) FILTER (WHERE status = 'confirmed')::int as confirmed,
        COUNT(*) FILTER (WHERE status = 'cancelled')::int as cancelled,
        COUNT(*) FILTER (WHERE preferred_date >= CURRENT_DATE)::int as upcoming
        FROM tour_bookings`),
      db.query('SELECT COUNT(*)::int as total FROM news_events WHERE deleted_at IS NULL'),
      db.query(`SELECT COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE status = 'published')::int as published,
        COUNT(*) FILTER (WHERE status = 'draft')::int as draft
        FROM pages`),
      db.query(`SELECT COUNT(*)::int as total_images,
        (SELECT COUNT(*)::int FROM gallery_categories WHERE deleted_at IS NULL) as total_categories
        FROM gallery_images WHERE deleted_at IS NULL`),
      db.query(`SELECT al.*, u.name as admin_name
        FROM admin_activity_log al
        LEFT JOIN users u ON al.admin_user_id = u.id
        ORDER BY al.created_at DESC LIMIT 10`),
      db.query(`SELECT COUNT(*)::int as count FROM page_analytics WHERE created_at >= CURRENT_DATE`),
      db.query(`SELECT COUNT(*)::int as count FROM page_analytics WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`),
    ]);

    res.json({
      registrations: registrations.rows[0],
      bookings: bookings.rows[0],
      events: { total: events.rows[0]?.total ?? 0 },
      pages: pages.rows[0],
      gallery: gallery.rows[0],
      analytics: {
        viewsToday: viewsToday.rows[0]?.count ?? 0,
        viewsWeek: viewsWeek.rows[0]?.count ?? 0,
      },
      recentActivity: recentActivity.rows,
    });
  } catch (error) {
    console.error('getDashboardStats failed', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}

export function createAdminUsersRouter(db: Pool): express.Router {
  const router = express.Router();
  const resolveAdmin = createResolveAdmin(db);

  router.use(authenticate, resolveAdmin, requireAdmin);

  // Dashboard
  router.get('/dashboard', (req, res) => getDashboardStats(db, req as AuthRequest, res));

  // Activity Log
  router.get('/activity-log', (req, res) => getActivityLog(db, req as AuthRequest, res));

  // Users
  router.get('/', (req, res) => listUsers(db, req as AuthRequest, res));
  router.get('/:id', (req, res) => getUser(db, req as AuthRequest, res));
  router.post('/invite', (req, res) => inviteAdmin(db, req as AuthRequest, res));
  router.put('/:id/role', (req, res) => updateRole(db, req as AuthRequest, res));
  router.delete('/:id/admin', (req, res) => revokeAdmin(db, req as AuthRequest, res));

  return router;
}
