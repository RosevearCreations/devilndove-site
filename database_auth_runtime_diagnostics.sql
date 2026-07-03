-- File: database_auth_runtime_diagnostics.sql
-- Devil n Dove Cloudflare D1 authentication diagnostic.
-- Safe to run in the Cloudflare D1 SQL console. It does not expose password hashes,
-- session tokens, email addresses, or user names.

SELECT 'bound database check' AS check_name, 1 AS ok;

SELECT
  name AS auth_table,
  type
FROM sqlite_master
WHERE type = 'table'
  AND name IN ('users', 'sessions')
ORDER BY name;

PRAGMA table_info(users);
PRAGMA table_info(sessions);

SELECT
  COUNT(*) AS total_users,
  SUM(CASE WHEN COALESCE(is_active, 0) = 1 THEN 1 ELSE 0 END) AS active_users,
  SUM(CASE WHEN LOWER(COALESCE(role, '')) = 'admin' AND COALESCE(is_active, 0) = 1 THEN 1 ELSE 0 END) AS active_admin_users
FROM users;

SELECT
  COUNT(*) AS total_sessions,
  SUM(CASE WHEN datetime(expires_at) > datetime('now') THEN 1 ELSE 0 END) AS unexpired_sessions
FROM sessions;
