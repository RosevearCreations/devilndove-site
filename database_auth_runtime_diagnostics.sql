-- Devil n Dove Cloudflare D1 authentication diagnostic.
-- Safe to run in the Cloudflare D1 SQL console. It does not return password hashes,
-- raw sessions, email addresses, display names, or other account values.

SELECT 'bound database check' AS check_name, 1 AS ok;

SELECT name AS auth_table, type
FROM sqlite_master
WHERE type = 'table'
  AND name IN ('users', 'sessions', 'members', 'sessions_legacy_build204')
ORDER BY name;

PRAGMA table_info(users);
PRAGMA table_info(sessions);
PRAGMA table_info(members);

-- The table list and PRAGMA output above deliberately work whether the database
-- is legacy, current, incomplete, or empty. Do not add direct COUNT(*) queries
-- here: they would fail before diagnosis when a table has not been created yet.
