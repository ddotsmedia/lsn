-- Points video_uploads.uploaded_by at the users table.
--
-- The column referenced admin_users(id). Authentication resolves an admin from
-- users.role (settled in migration 009), and the live admin_users is a separate
-- table of standalone accounts, so a signed-in administrator's id is not in it.
-- Saving a video therefore failed with
--   video_uploads_uploaded_by_fkey ... Key (uploaded_by)=(...) is not present
--   in table "admin_users"
-- after the upload to Cloudinary had already succeeded, leaving the file
-- uploaded but unrecorded.
--
-- media.uploaded_by already references users(id); this brings video_uploads
-- into line with it.
--
-- Additive; 001-020 untouched.

-- Any existing value that does not resolve to a user would block the new
-- constraint. There are none today, but a restored backup could differ.
UPDATE video_uploads
   SET uploaded_by = NULL
 WHERE uploaded_by IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = video_uploads.uploaded_by);

DO $$
DECLARE
  con_name TEXT;
BEGIN
  SELECT tc.constraint_name INTO con_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
   WHERE tc.table_name = 'video_uploads'
     AND tc.constraint_type = 'FOREIGN KEY'
     AND kcu.column_name = 'uploaded_by'
   LIMIT 1;

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE video_uploads DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'video_uploads'::regclass
       AND conname = 'video_uploads_uploaded_by_users_fkey'
  ) THEN
    ALTER TABLE video_uploads
      ADD CONSTRAINT video_uploads_uploaded_by_users_fkey
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;
