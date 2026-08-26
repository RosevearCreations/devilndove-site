-- Devil n Dove Build 438
-- Application Core / top-level module activation authority.
-- Additive only. Request handlers must never create/repair these tables at runtime.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_modules (
  module_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_enabled INTEGER NOT NULL DEFAULT 1 CHECK (is_enabled IN (0,1)),
  requires_login INTEGER NOT NULL DEFAULT 1 CHECK (requires_login IN (0,1)),
  default_route TEXT NOT NULL DEFAULT '/',
  load_priority INTEGER NOT NULL DEFAULT 100,
  background_activity_enabled INTEGER NOT NULL DEFAULT 0 CHECK (background_activity_enabled IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_module_role_access (
  module_key TEXT NOT NULL,
  role_code TEXT NOT NULL,
  is_allowed INTEGER NOT NULL DEFAULT 0 CHECK (is_allowed IN (0,1)),
  access_level TEXT NOT NULL DEFAULT 'read',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (module_key, role_code),
  FOREIGN KEY (module_key) REFERENCES app_modules(module_key) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_app_modules_enabled_priority
  ON app_modules(is_enabled, load_priority, module_key);

CREATE INDEX IF NOT EXISTS idx_app_module_role_access_role
  ON app_module_role_access(role_code, is_allowed, module_key);

INSERT INTO app_modules (
  module_key, display_name, description, is_enabled, requires_login,
  default_route, load_priority, background_activity_enabled
) VALUES
  (
    'commerce-operations',
    'Commerce & Operations',
    'Customer/storefront, catalog, inventory, orders, memberships, fulfillment and day-to-day customer operations.',
    1, 0, '/', 10, 0
  ),
  (
    'creative-production',
    'Creative & Production',
    'Creative Process, CAIP, Packaging & Labeling, Content Studio and reviewed production workflows.',
    1, 1, '/admin/creative-automation/', 20, 0
  ),
  (
    'business-administration',
    'Business & Administration',
    'Accounting, marketing, analytics, administration, platform/release tooling and business controls.',
    1, 1, '/admin/', 30, 0
  )
ON CONFLICT(module_key) DO NOTHING;

-- Current user-role authority supports member/admin. Keep role mapping explicit and
-- additive so a future operator/creator role can be introduced deliberately.
INSERT INTO app_module_role_access (module_key, role_code, is_allowed, access_level) VALUES
  ('commerce-operations', 'member', 1, 'member'),
  ('commerce-operations', 'admin', 1, 'manage'),
  ('creative-production', 'member', 0, 'none'),
  ('creative-production', 'admin', 1, 'manage'),
  ('business-administration', 'member', 0, 'none'),
  ('business-administration', 'admin', 1, 'manage')
ON CONFLICT(module_key, role_code) DO NOTHING;
