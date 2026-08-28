-- Devil n Dove current platform convergence migration.
-- Canonicalizes the application-module registry to the one current five-module architecture.
-- Idempotent and Development-safe. No business-domain data is deleted.

PRAGMA foreign_keys = ON;

-- Canonical module rows. Existing canonical state is preserved; legacy enable/background
-- state is copied below when a legacy row exists.
INSERT OR IGNORE INTO app_modules (
  module_key, display_name, description, is_enabled, requires_login,
  default_route, load_priority, background_activity_enabled
) VALUES
  ('storefront', 'Storefront', 'Public storefront, catalog, products, collections, merchandising, inventory, orders, memberships and customer commerce.', 1, 0, '/', 10, 0),
  ('creators', 'Creators', 'Creative Projects, CAIP, Packaging and Labeling, Content Studio, media evidence and reviewed maker workflows.', 1, 1, '/admin/creative-automation/', 20, 0),
  ('socials', 'Socials', 'Public social hub, publication packages, social-channel publishing, campaigns and publication evidence.', 1, 0, '/socials/', 30, 0),
  ('financials', 'Financials', 'Accounting, costs, profitability, payment-provider operations, reconciliation, tax and financial reporting.', 1, 1, '/admin/accounting/', 40, 0),
  ('it-platform', 'I.T.', 'Application modules, user access, API/provider configuration, D1/R2 readiness, diagnostics, recovery and release controls.', 1, 1, '/admin/it-platform/', 50, 0);

UPDATE app_modules
SET display_name='Storefront',
    description='Public storefront, catalog, products, collections, merchandising, inventory, orders, memberships and customer commerce.',
    requires_login=0,
    default_route='/',
    load_priority=10,
    is_enabled=COALESCE((SELECT is_enabled FROM app_modules WHERE module_key='commerce-operations'), is_enabled),
    background_activity_enabled=COALESCE((SELECT background_activity_enabled FROM app_modules WHERE module_key='commerce-operations'), background_activity_enabled),
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='storefront';

UPDATE app_modules
SET display_name='Creators',
    description='Creative Projects, CAIP, Packaging and Labeling, Content Studio, media evidence and reviewed maker workflows.',
    requires_login=1,
    default_route='/admin/creative-automation/',
    load_priority=20,
    is_enabled=COALESCE((SELECT is_enabled FROM app_modules WHERE module_key='creative-production'), is_enabled),
    background_activity_enabled=COALESCE((SELECT background_activity_enabled FROM app_modules WHERE module_key='creative-production'), background_activity_enabled),
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='creators';

UPDATE app_modules
SET display_name='Socials',
    description='Public social hub, publication packages, social-channel publishing, campaigns and publication evidence.',
    requires_login=0,
    default_route='/socials/',
    load_priority=30,
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='socials';

UPDATE app_modules
SET display_name='Financials',
    description='Accounting, costs, profitability, payment-provider operations, reconciliation, tax and financial reporting.',
    requires_login=1,
    default_route='/admin/accounting/',
    load_priority=40,
    is_enabled=COALESCE((SELECT is_enabled FROM app_modules WHERE module_key='business-administration'), is_enabled),
    background_activity_enabled=COALESCE((SELECT background_activity_enabled FROM app_modules WHERE module_key='business-administration'), background_activity_enabled),
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='financials';

UPDATE app_modules
SET display_name='I.T.',
    description='Application modules, user access, API/provider configuration, D1/R2 readiness, diagnostics, recovery and release controls.',
    requires_login=1,
    default_route='/admin/it-platform/',
    load_priority=50,
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='it-platform';

-- Canonical role authority.
INSERT OR IGNORE INTO app_module_role_access (module_key, role_code, is_allowed, access_level) VALUES
  ('storefront', 'member', 1, 'member'),
  ('storefront', 'admin', 1, 'manage'),
  ('creators', 'member', 0, 'none'),
  ('creators', 'admin', 1, 'manage'),
  ('socials', 'member', 1, 'read'),
  ('socials', 'admin', 1, 'manage'),
  ('financials', 'member', 0, 'none'),
  ('financials', 'admin', 1, 'manage'),
  ('it-platform', 'member', 0, 'none'),
  ('it-platform', 'admin', 0, 'none');

-- Preserve legacy role choices when they existed.
UPDATE app_module_role_access
SET is_allowed=COALESCE((SELECT is_allowed FROM app_module_role_access WHERE module_key='commerce-operations' AND role_code='member'), is_allowed),
    access_level=COALESCE((SELECT access_level FROM app_module_role_access WHERE module_key='commerce-operations' AND role_code='member'), access_level),
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='storefront' AND role_code='member';
UPDATE app_module_role_access
SET is_allowed=COALESCE((SELECT is_allowed FROM app_module_role_access WHERE module_key='commerce-operations' AND role_code='admin'), is_allowed),
    access_level=COALESCE((SELECT access_level FROM app_module_role_access WHERE module_key='commerce-operations' AND role_code='admin'), access_level),
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='storefront' AND role_code='admin';
UPDATE app_module_role_access
SET is_allowed=COALESCE((SELECT is_allowed FROM app_module_role_access WHERE module_key='creative-production' AND role_code='member'), is_allowed),
    access_level=COALESCE((SELECT access_level FROM app_module_role_access WHERE module_key='creative-production' AND role_code='member'), access_level),
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='creators' AND role_code='member';
UPDATE app_module_role_access
SET is_allowed=COALESCE((SELECT is_allowed FROM app_module_role_access WHERE module_key='creative-production' AND role_code='admin'), is_allowed),
    access_level=COALESCE((SELECT access_level FROM app_module_role_access WHERE module_key='creative-production' AND role_code='admin'), access_level),
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='creators' AND role_code='admin';
UPDATE app_module_role_access
SET is_allowed=COALESCE((SELECT is_allowed FROM app_module_role_access WHERE module_key='business-administration' AND role_code='member'), is_allowed),
    access_level=COALESCE((SELECT access_level FROM app_module_role_access WHERE module_key='business-administration' AND role_code='member'), access_level),
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='financials' AND role_code='member';
UPDATE app_module_role_access
SET is_allowed=COALESCE((SELECT is_allowed FROM app_module_role_access WHERE module_key='business-administration' AND role_code='admin'), is_allowed),
    access_level=COALESCE((SELECT access_level FROM app_module_role_access WHERE module_key='business-administration' AND role_code='admin'), access_level),
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='financials' AND role_code='admin';

-- I.T. remains explicit-user only regardless of the historical admin role.
UPDATE app_module_role_access
SET is_allowed=0, access_level='none', updated_at=CURRENT_TIMESTAMP
WHERE module_key='it-platform' AND role_code IN ('member','admin');

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
  CHECK ((is_allowed=0 AND access_level='none') OR (is_allowed=1 AND access_level IN ('read','manage')))
);
CREATE INDEX IF NOT EXISTS idx_app_module_user_access_user ON app_module_user_access(user_id, is_allowed, module_key);
CREATE INDEX IF NOT EXISTS idx_app_module_user_access_module ON app_module_user_access(module_key, is_allowed, access_level, user_id);

-- Preserve any explicit per-user grants that were attached to a legacy module key.
INSERT OR IGNORE INTO app_module_user_access (module_key, user_id, is_allowed, access_level, granted_by_user_id, created_at, updated_at)
SELECT 'storefront', user_id, is_allowed,
       CASE WHEN access_level='member' THEN 'read' ELSE access_level END,
       granted_by_user_id, created_at, CURRENT_TIMESTAMP
FROM app_module_user_access WHERE module_key='commerce-operations';
INSERT OR IGNORE INTO app_module_user_access (module_key, user_id, is_allowed, access_level, granted_by_user_id, created_at, updated_at)
SELECT 'creators', user_id, is_allowed,
       CASE WHEN access_level='member' THEN 'read' ELSE access_level END,
       granted_by_user_id, created_at, CURRENT_TIMESTAMP
FROM app_module_user_access WHERE module_key='creative-production';
INSERT OR IGNORE INTO app_module_user_access (module_key, user_id, is_allowed, access_level, granted_by_user_id, created_at, updated_at)
SELECT 'financials', user_id, is_allowed,
       CASE WHEN access_level='member' THEN 'read' ELSE access_level END,
       granted_by_user_id, created_at, CURRENT_TIMESTAMP
FROM app_module_user_access WHERE module_key='business-administration';

-- Bootstrap I.T. manager access only when the system has no explicit I.T. grant at all.
INSERT INTO app_module_user_access (module_key, user_id, is_allowed, access_level, granted_by_user_id)
SELECT 'it-platform', u.user_id, 1, 'manage', NULL
FROM users u
WHERE u.is_active=1
  AND LOWER(TRIM(u.role))='admin'
  AND NOT EXISTS (SELECT 1 FROM app_module_user_access WHERE module_key='it-platform')
ON CONFLICT(module_key, user_id) DO NOTHING;

-- Retire legacy registry keys after their state/grants have been preserved. Git history remains
-- the provenance authority; these rows must no longer participate in runtime configuration.
DELETE FROM app_module_user_access WHERE module_key IN ('commerce-operations','creative-production','business-administration');
DELETE FROM app_module_role_access WHERE module_key IN ('commerce-operations','creative-production','business-administration');
DELETE FROM app_modules WHERE module_key IN ('commerce-operations','creative-production','business-administration');

-- Verification result sets for manual/transport execution evidence.
SELECT module_key, display_name, is_enabled, requires_login, default_route, load_priority, background_activity_enabled
FROM app_modules
WHERE module_key IN ('storefront','creators','socials','financials','it-platform')
ORDER BY load_priority, module_key;
SELECT module_key, role_code, is_allowed, access_level
FROM app_module_role_access
WHERE module_key IN ('storefront','creators','socials','financials','it-platform')
ORDER BY module_key, role_code;
SELECT module_key, user_id, is_allowed, access_level
FROM app_module_user_access
ORDER BY module_key, user_id;
