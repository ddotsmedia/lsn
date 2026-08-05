/**
 * One-time bootstrap: create (or promote) an admin user.
 *
 * Usage (from the backend container):
 *   node dist/scripts/create-admin.js <email> <password> <name> [role]
 *
 * role defaults to 'admin'. Safe to re-run: if the user already exists,
 * their password is left untouched and they are simply granted/updated
 * as an admin_users row instead of erroring.
 */
import { Pool } from 'pg';
import { hashPassword } from '../utils/hash.js';

async function main(): Promise<void> {
  const [, , email, password, name, role] = process.argv;

  if (!email || !password || !name) {
    console.error('Usage: node dist/scripts/create-admin.js <email> <password> <name> [role=admin]');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const resolvedRole = role === 'moderator' ? 'moderator' : 'admin';

  const db = new Pool({
    connectionString:
      process.env.DATABASE_URL || 'postgresql://lsn:password@localhost:5432/littlesmarties',
  });

  try {
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);

    let userId: string;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      console.log(`User ${email} already exists — leaving password unchanged.`);
    } else {
      const passwordHash = await hashPassword(password);
      const inserted = await db.query(
        'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [email, name, passwordHash]
      );
      userId = inserted.rows[0].id;
      console.log(`Created user ${email}.`);
    }

    const existingAdmin = await db.query('SELECT id FROM admin_users WHERE user_id = $1', [userId]);
    if (existingAdmin.rows.length > 0) {
      await db.query('UPDATE admin_users SET role = $1 WHERE user_id = $2', [resolvedRole, userId]);
      console.log(`Updated existing admin_users row -> role=${resolvedRole}.`);
    } else {
      await db.query(
        'INSERT INTO admin_users (user_id, role, permissions) VALUES ($1, $2, $3)',
        [userId, resolvedRole, []]
      );
      console.log(`Granted admin_users role=${resolvedRole} to ${email}.`);
    }

    console.log(`\nDone. Log in to the admin panel with ${email}.`);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error('create-admin failed:', err);
  process.exit(1);
});
