-- RETIRED SAFETY STUB — Devil n Dove Build 207
--
-- Do NOT use this file as a migration.
-- The currently selected Devil n Dove D1 database was verified to contain the
-- current `users` and `sessions` tables and no legacy `members` table. A former
-- Build 204 version of this filename attempted a multi-statement migration and
-- is retained only so old documentation or bookmarks cannot lead to a destructive
-- schema change.
--
-- For the separate POST /api/auth/login 500, collect only the safe response code
-- and matching Cloudflare Function log. Do not alter D1 schema until a verified
-- error identifies a specific missing/invalid column or query.

SELECT
  'RETIRED_BUILD207_NO_SCHEMA_ACTION' AS code,
  'No auth migration was run. Use database_auth_runtime_diagnostics.sql and AUTH_LOGIN_500_TROUBLESHOOTING.md for evidence only.' AS message;
