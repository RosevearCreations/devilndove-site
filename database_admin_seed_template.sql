-- File: /database_admin_seed_template.sql
-- Brief description: Creates a starter admin account for the current users/sessions schema.
-- Temporary password for this template hash: ChangeMe123!
-- Change the email before running and change the password immediately after first login.

INSERT INTO users (
  email,
  password_hash,
  display_name,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'admin@devilndove.com',
  'sha256$9a4aabf0e5cf71cae2cea646613ce7e2a5919fa758e56819704be25a3a2c1f0b',
  'Devil n Dove Admin',
  'admin',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Current pass note: the initial D1 catalog migration completed successfully for Tools, Supplies, Movies, and Featured Creations.
-- The main Catalog admin page no longer exposes the day-to-day migration panel, while `/api/admin/catalog-sync` remains available for maintenance or reseed recovery only.
