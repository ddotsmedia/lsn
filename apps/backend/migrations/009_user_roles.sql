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

-- logActivity writes admin_user_id and details. The live admin_activity_log was
-- created with admin_id and no details column, so every audit write failed —
-- silently, because logActivity swallows its own errors by design. Add the
-- columns it expects. No FK: admin_id points at admin_users(id) here but at
-- users(id) in 002, and the two tables differ between environments.
ALTER TABLE admin_activity_log ADD COLUMN IF NOT EXISTS admin_user_id UUID;
ALTER TABLE admin_activity_log ADD COLUMN IF NOT EXISTS details JSONB;

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_user
  ON admin_activity_log(admin_user_id);

-- The rest of this file only applies where admin_users is the join table 002
-- defines. The live database has an unrelated admin_users (standalone accounts
-- with email/password_hash and no user_id), so it is skipped there.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'admin_users' AND column_name = 'user_id') THEN

    -- user_id only ever had a plain index, but the grant and role-update
    -- handlers run ON CONFLICT (user_id) DO UPDATE, which needs a unique
    -- constraint to infer — so those calls errored. Deduplicate, then add it.
    DELETE FROM admin_users a USING admin_users b
    WHERE a.user_id = b.user_id AND (a.created_at, a.id) < (b.created_at, b.id);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_user_id_unique
      ON admin_users(user_id);

    -- Keep the two in step on who is an admin. admin_users still holds the
    -- permissions list; it just no longer decides isAdmin.
    INSERT INTO admin_users (user_id, role, permissions)
    SELECT u.id, 'admin', '{}'::text[]
    FROM users u
    WHERE u.role = 'admin'
      AND NOT EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = u.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;
