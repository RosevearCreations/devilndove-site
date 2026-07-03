-- Devil n Dove Build 205 — D1-console-compatible authentication repair.
--
-- IMPORTANT
-- - Do NOT use the prior Build 204 script. D1 does not allow
--   PRAGMA foreign_keys = OFF inside its implicit transaction.
-- - Run the three numbered blocks below ONE AT A TIME in the D1 console.
-- - Stop immediately if a block returns an error. Do not continue to the next block.
-- - This repair is intended only for the confirmed legacy layout:
--   members(member_id, email, password_hash, display_name, role, is_active, created_at, last_login_at)
--   sessions(session_id, member_id, token_hash, expires_at, created_at)
--
-- It copies member credentials into users. Existing legacy sessions cannot be reused
-- because their token hashes cannot become browser cookies; they are retained in the
-- archive table for audit and every user will sign in again.

-- -----------------------------------------------------------------------------
-- 1. PRECHECK — RUN THIS BLOCK FIRST, BY ITSELF. It does not change data.
-- -----------------------------------------------------------------------------
SELECT
  name AS table_name,
  sql AS create_statement
FROM sqlite_master
WHERE type = 'table'
  AND name IN ('members', 'users', 'sessions', 'sessions_legacy_build204', 'sessions_legacy_build205')
ORDER BY name;

-- Expected before proceeding:
--   members and sessions exist.
--   sessions_legacy_build204 and sessions_legacy_build205 DO NOT exist.
-- If either archive table exists, STOP. The repair may already have partially run;
-- run the postcheck block below and use the current table layout rather than renaming again.

-- -----------------------------------------------------------------------------
-- 2. COPY MEMBERS — RUN THIS BLOCK SECOND, BY ITSELF.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

INSERT OR IGNORE INTO users (
  email,
  password_hash,
  display_name,
  role,
  is_active,
  created_at,
  updated_at,
  last_login_at
)
SELECT
  LOWER(TRIM(email)),
  password_hash,
  display_name,
  CASE WHEN LOWER(COALESCE(role, 'member')) = 'admin' THEN 'admin' ELSE 'member' END,
  CASE WHEN COALESCE(is_active, 1) = 1 THEN 1 ELSE 0 END,
  COALESCE(created_at, CURRENT_TIMESTAMP),
  COALESCE(created_at, CURRENT_TIMESTAMP),
  last_login_at
FROM members
WHERE TRIM(COALESCE(email, '')) <> ''
  AND TRIM(COALESCE(password_hash, '')) <> '';

-- -----------------------------------------------------------------------------
-- 3. SWAP THE LEGACY SESSION TABLE — RUN THIS BLOCK THIRD, BY ITSELF.
-- -----------------------------------------------------------------------------
ALTER TABLE sessions RENAME TO sessions_legacy_build205;

CREATE TABLE sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- -----------------------------------------------------------------------------
-- 4. POSTCHECK — RUN THIS BLOCK LAST, BY ITSELF. It does not reveal account data.
-- -----------------------------------------------------------------------------
SELECT name AS table_name
FROM sqlite_master
WHERE type = 'table'
  AND name IN ('members', 'users', 'sessions', 'sessions_legacy_build204', 'sessions_legacy_build205')
ORDER BY name;

PRAGMA table_info(users);
PRAGMA table_info(sessions);
