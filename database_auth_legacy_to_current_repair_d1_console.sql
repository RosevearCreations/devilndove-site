-- RETIRED SAFETY STUB — Devil n Dove Build 207
--
-- Do NOT use this file as a migration.
-- The currently selected Devil n Dove D1 database was verified to contain the
-- current `users` and `sessions` tables and no legacy `members` table. This
-- filename is retained only to make former instructions harmless.
--
-- The login 500 remains evidence-first. Capture its safe Function code/detail and
-- matching Cloudflare log before any database change. Never run PRAGMA foreign_keys
-- changes, rename sessions, or create/import members without verified need.

SELECT
  'RETIRED_BUILD207_NO_SCHEMA_ACTION' AS code,
  'No auth migration was run. See AUTH_LOGIN_500_TROUBLESHOOTING.md.' AS message;
