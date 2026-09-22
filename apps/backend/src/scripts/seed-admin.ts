/**
 * Seeding script: automatically create admin user on startup if it doesn't exist.
 * 
 * This script runs during deployment to ensure the admin user is created with 
 * the configured credentials. It's idempotent: running it multiple times is safe.
 */
import { Pool } from 'pg';
import { hashPassword } from '../utils/hash.js';

async function main(): Promise<void> {
  const email = 'admin@bayrotna.ae';
  const password = 'SecureAccess@2k26';
  const name = 'Admin User';
  const role = 'admin';

  console.log(`[seed-admin] Ensuring admin user exists: ${email}`);

  const db = new Pool({
    connectionString:
      process.env.DATABASE_URL || 'postgresql://lsn:password@localhost:5432/littlesmarties',
  });

  try {
    const existing = await db.query('SELECT id, email FROM users WHERE email = $1', [email]);

    let userId: string;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      console.log(`[seed-admin] User ${email} already exists with id ${userId}`);
    } else {
      const passwordHash = await hashPassword(password);
      const inserted = await db.query(
        'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [email, name, passwordHash]
      );
      userId = inserted.rows[0].id;
      console.log(`[seed-admin] Created user ${email} with id ${userId}`);
    }

    // Ensure admin_users row exists
    const existingAdmin = await db.query('SELECT id FROM admin_users WHERE user_id = $1', [userId]);
    if (existingAdmin.rows.length > 0) {
      await db.query('UPDATE admin_users SET role = $1 WHERE user_id = $2', [role, userId]);
      console.log(`[seed-admin] Updated admin_users role to ${role}`);
    } else {
      await db.query(
        'INSERT INTO admin_users (user_id, role, permissions) VALUES ($1, $2, $3)',
        [userId, role, []]
      );
      console.log(`[seed-admin] Created admin_users row with role ${role}`);
    }

    // Set users.role to admin for authorization
    await db.query("UPDATE users SET role = $1 WHERE id = $2", ['admin', userId]);
    console.log(`[seed-admin] Set users.role = admin`);

    // Verify it was created/updated
    const verify = await db.query(
      'SELECT id, email, role FROM users WHERE email = $1',
      [email]
    );
    if (verify.rows.length > 0) {
      const user = verify.rows[0];
      console.log(`[seed-admin] Verified admin user: email=${user.email}, role=${user.role}`);
      console.log(`[seed-admin] Admin user ready for login`);
    } else {
      console.error(`[seed-admin] ERROR: Failed to verify admin user creation`);
      process.exit(1);
    }
  } catch (err) {
    console.error('[seed-admin] ERROR:', err);
    process.exit(1);
  } finally {
    await db.end();
  }
}

main().catch((err) => {
  console.error('[seed-admin] Fatal error:', err);
  process.exit(1);
});
