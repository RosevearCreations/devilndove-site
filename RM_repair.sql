-- MIGRATION: members/member_sessions -> users/sessions
-- This preserves existing member IDs so related tables like user_profiles keep working.

PRAGMA foreign_keys = OFF;

-- 1) Rename old auth tables out of the way
ALTER TABLE members RENAME TO members_legacy;
ALTER TABLE member_sessions RENAME TO member_sessions_legacy;

-- 2) Create the new users table expected by the newer app
CREATE TABLE users (
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

-- 3) Create the new sessions table expected by the newer app
CREATE TABLE sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY(user_id) REFERENCES users(user_id)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- 4) Copy members into users, preserving IDs
INSERT INTO users (
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
  email,
  password_hash,
  display_name,
  role,
  is_active,
  created_at,
  COALESCE(last_login_at, created_at, CURRENT_TIMESTAMP),
  last_login_at
FROM members_legacy;

-- 5) Copy member sessions into new sessions table
-- We preserve the old text session_id as both session_token and token
INSERT INTO sessions (
  user_id,
  session_token,
  token,
  created_at,
  expires_at,
  ip_address,
  user_agent
)
SELECT
  member_id,
  session_id,
  session_id,
  created_at,
  expires_at,
  ip_hash,
  user_agent
FROM member_sessions_legacy;

-- 6) Optional sanity checks
-- SELECT COUNT(*) AS old_members FROM members_legacy;
-- SELECT COUNT(*) AS new_users FROM users;
-- SELECT COUNT(*) AS old_sessions FROM member_sessions_legacy;
-- SELECT COUNT(*) AS new_sessions FROM sessions;

PRAGMA foreign_keys = ON;
