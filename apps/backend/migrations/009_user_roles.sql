-- Makes users.role the authoritative source for admin authorization.
--
-- role and is_active existed only in the live database, added outside the
-- migration chain. A database built from 001-008 has neither, so /me (which
-- selects them) fails with "column role does not exist". This puts them in the
-- schema so both agree.
--
-- Additive; 001-003 and 008 untouched.

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- The live column was created with DEFAULT 'admin', so every row inserted into
-- users became an administrator unless something explicitly said otherwise.
-- Anyone who can create a user could grant themselves admin.
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- Existing rows: keep anyone already recorded in admin_users as an admin, and
-- keep the accounts the live default already made admin. Everyone else becomes
-- a plain user.
UPDATE users u
SET role = 'admin'
WHERE u.role IS NULL
  AND EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = u.id);

UPDATE users SET role = 'user' WHERE role IS NULL;

ALTER TABLE users ALTER COLUMN role SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role <> 'user';

-- admin_users.user_id only had a plain index, never a unique one. The grant and
-- role-update handlers both run
--   INSERT INTO admin_users ... ON CONFLICT (user_id) DO UPDATE
-- which needs a unique constraint to infer, so those calls errored. Deduplicate
-- (keep the newest row per user) and add the unique index.
DELETE FROM admin_users a
USING admin_users b
WHERE a.user_id = b.user_id
  AND (a.created_at, a.id) < (b.created_at, b.id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_user_id_unique ON admin_users(user_id);

-- admin_users is kept: it still holds the permissions list and the Users &
-- Roles screen reads it. It is no longer what decides isAdmin.
-- Backfill it from users.role so the two do not disagree on who is an admin.
INSERT INTO admin_users (user_id, role, permissions)
SELECT u.id, 'admin', '{}'::text[]
FROM users u
WHERE u.role = 'admin'
  AND NOT EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;
