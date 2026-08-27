-- Devil n Dove Build 442
-- I.T. & Platform fourth-module registry + explicit per-user access authority.
-- Additive only. Runtime code must not create or repair this schema at request time.
-- The initial explicit I.T. manager bootstrap runs only while no I.T. user grant exists.

PRAGMA foreign_keys = ON;

INSERT INTO app_modules (
  module_key, display_name, description, is_enabled, requires_login,
  default_route, load_priority, background_activity_enabled
) VALUES (
  'it-platform',
  'I.T. & Platform',
  'Technical release readiness, deployment, schema/storage health, runtime diagnostics, recovery evidence and technical HOLDs.',
  1, 1, '/admin/it-platform/', 40, 0
)
ON CONFLICT(module_key) DO NOTHING;

-- Role membership alone never grants I.T. access. Explicit user grants below are authoritative.
INSERT INTO app_module_role_access (module_key, role_code, is_allowed, access_level) VALUES
  ('it-platform', 'member', 0, 'none'),
  ('it-platform', 'admin', 0, 'none')
ON CONFLICT(module_key, role_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS app_module_user_access (
  module_key TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  is_allowed INTEGER NOT NULL DEFAULT 0 CHECK (is_allowed IN (0,1)),
  access_level TEXT NOT NULL DEFAULT 'none' CHECK (access_level IN ('none','read','manage')),
  granted_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (module_key, user_id),
  FOREIGN KEY (module_key) REFERENCES app_modules(module_key) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CHECK (
    (is_allowed = 0 AND access_level = 'none') OR
    (is_allowed = 1 AND access_level IN ('read','manage'))
  )
);

CREATE INDEX IF NOT EXISTS idx_app_module_user_access_user
  ON app_module_user_access(user_id, is_allowed, module_key);

CREATE INDEX IF NOT EXISTS idx_app_module_user_access_module
  ON app_module_user_access(module_key, is_allowed, access_level, user_id);

-- Bootstrap only the currently active administrators, and only when I.T. has no
-- explicit user grants yet. Future administrators do not receive I.T. automatically.
INSERT INTO app_module_user_access (
  module_key, user_id, is_allowed, access_level, granted_by_user_id
)
SELECT 'it-platform', u.user_id, 1, 'manage', NULL
FROM users u
WHERE u.is_active = 1
  AND LOWER(TRIM(u.role)) = 'admin'
  AND NOT EXISTS (
    SELECT 1
    FROM app_module_user_access existing
    WHERE existing.module_key = 'it-platform'
  )
ON CONFLICT(module_key, user_id) DO NOTHING;
