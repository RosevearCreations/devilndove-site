-- Devil n Dove Build 204 targeted D1 authentication compatibility repair.
--
-- RUN ONLY when GET /api/auth/login reports code AUTH_LEGACY_SCHEMA and the
-- preflight confirms this older structure:
--   members(member_id, email, password_hash, display_name, role, is_active, created_at, last_login_at)
--   sessions(session_id, member_id, token_hash, expires_at, created_at)
--
-- What this does:
-- 1. Keeps every legacy member record and its existing password_hash.
-- 2. Copies legacy members into the current users table.
-- 3. Renames the incompatible sessions table to sessions_legacy_build204.
-- 4. Creates the current sessions table expected by the live login route.
--
-- Existing legacy session tokens are intentionally not migrated. They were stored as
-- hashes in the prior design, cannot be recovered as raw browser tokens, and users
-- will simply sign in again after this repair. The archived rows remain for audit.
--
-- Before running: Cloudflare Dashboard > Storage & Databases > D1 > devilndove-prod > Console.
-- First run database_auth_runtime_diagnostics.sql. Take a D1 backup/export before any schema change.

PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

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
  user_id,
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
  member_id,
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

ALTER TABLE sessions RENAME TO sessions_legacy_build204;

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

COMMIT;

PRAGMA foreign_keys = ON;

-- Confirmation: all expected current columns must appear below.
PRAGMA table_info(users);
PRAGMA table_info(sessions);
SELECT COUNT(*) AS migrated_or_existing_user_count FROM users;
SELECT COUNT(*) AS archived_legacy_session_count FROM sessions_legacy_build204;
