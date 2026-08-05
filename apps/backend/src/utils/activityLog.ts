import type { Pool } from 'pg';

/**
 * Records one admin action for the Activity Log page. Never throws — a
 * logging failure must not fail the mutation it's describing, so errors are
 * swallowed after being reported to stderr.
 */
export async function logActivity(
  db: Pool,
  adminUserId: string | undefined,
  action: 'create' | 'update' | 'delete' | 'status_change' | 'invite' | 'upload',
  entityType: string,
  entityId: string | null | undefined,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await db.query(
      'INSERT INTO admin_activity_log (admin_user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [adminUserId ?? null, action, entityType, entityId ?? null, details ? JSON.stringify(details) : null]
    );
  } catch (error) {
    console.error('logActivity failed (non-fatal)', error);
  }
}
