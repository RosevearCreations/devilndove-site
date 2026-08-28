-- Devil n Dove current Development platform convergence migration.
-- One idempotent schema/registry authority for Release 447.
-- No business-domain table is dropped and no Production target is encoded here.

PRAGMA foreign_keys = ON;

-- Bootstrap the canonical module registry so a fresh or partially migrated Development
-- database does not depend on a historical migration being remembered first.
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

-- Canonical module rows. INSERT OR IGNORE preserves an already-current Development state.
INSERT OR IGNORE INTO app_modules (
  module_key, display_name, description, is_enabled, requires_login,
  default_route, load_priority, background_activity_enabled
) VALUES
  ('storefront', 'Storefront', 'Public storefront, catalog, products, collections, merchandising, inventory, orders, memberships and customer commerce.', 1, 0, '/', 10, 0),
  ('creators', 'Creators', 'Creative Projects, Packaging and Labeling, Content Studio, media evidence and reviewed maker workflows.', 1, 1, '/admin/creative-automation/', 20, 0),
  ('socials', 'Socials', 'Public social hub, CAIP media review, publication packages, social-channel publishing, campaigns and publication evidence.', 1, 0, '/socials/', 30, 0),
  ('financials', 'Financials', 'Accounting, costs, profitability, payment-provider operations, reconciliation, tax and financial reporting.', 1, 1, '/admin/accounting/', 40, 0),
  ('it-platform', 'I.T.', 'Application modules, user access, API/provider configuration, D1/R2 readiness, diagnostics, recovery and release controls.', 1, 1, '/admin/it-platform/', 50, 0);

-- Carry existing legacy enabled/background state into the canonical owners where possible.
UPDATE app_modules
SET display_name='Storefront', description='Public storefront, catalog, products, collections, merchandising, inventory, orders, memberships and customer commerce.', requires_login=0, default_route='/', load_priority=10,
    is_enabled=COALESCE((SELECT is_enabled FROM app_modules WHERE module_key='commerce-operations'), is_enabled),
    background_activity_enabled=COALESCE((SELECT background_activity_enabled FROM app_modules WHERE module_key='commerce-operations'), background_activity_enabled),
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='storefront';
UPDATE app_modules
SET display_name='Creators', description='Creative Projects, Packaging and Labeling, Content Studio, media evidence and reviewed maker workflows.', requires_login=1, default_route='/admin/creative-automation/', load_priority=20,
    is_enabled=COALESCE((SELECT is_enabled FROM app_modules WHERE module_key='creative-production'), is_enabled),
    background_activity_enabled=COALESCE((SELECT background_activity_enabled FROM app_modules WHERE module_key='creative-production'), background_activity_enabled),
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='creators';
UPDATE app_modules
SET display_name='Socials', description='Public social hub, CAIP media review, publication packages, social-channel publishing, campaigns and publication evidence.', requires_login=0, default_route='/socials/', load_priority=30, updated_at=CURRENT_TIMESTAMP
WHERE module_key='socials';
UPDATE app_modules
SET display_name='Financials', description='Accounting, costs, profitability, payment-provider operations, reconciliation, tax and financial reporting.', requires_login=1, default_route='/admin/accounting/', load_priority=40,
    is_enabled=COALESCE((SELECT is_enabled FROM app_modules WHERE module_key='business-administration'), is_enabled),
    background_activity_enabled=COALESCE((SELECT background_activity_enabled FROM app_modules WHERE module_key='business-administration'), background_activity_enabled),
    updated_at=CURRENT_TIMESTAMP
WHERE module_key='financials';
UPDATE app_modules
SET display_name='I.T.', description='Application modules, user access, API/provider configuration, D1/R2 readiness, diagnostics, recovery and release controls.', requires_login=1, default_route='/admin/it-platform/', load_priority=50, updated_at=CURRENT_TIMESTAMP
WHERE module_key='it-platform';

-- Canonical role authority. I.T. remains explicit-user only.
INSERT OR IGNORE INTO app_module_role_access (module_key, role_code, is_allowed, access_level) VALUES
  ('storefront', 'member', 1, 'member'), ('storefront', 'admin', 1, 'manage'),
  ('creators', 'member', 0, 'none'), ('creators', 'admin', 1, 'manage'),
  ('socials', 'member', 1, 'read'), ('socials', 'admin', 1, 'manage'),
  ('financials', 'member', 0, 'none'), ('financials', 'admin', 1, 'manage'),
  ('it-platform', 'member', 0, 'none'), ('it-platform', 'admin', 0, 'none');

UPDATE app_module_role_access SET is_allowed=COALESCE((SELECT is_allowed FROM app_module_role_access WHERE module_key='commerce-operations' AND role_code='member'),is_allowed), access_level=COALESCE((SELECT access_level FROM app_module_role_access WHERE module_key='commerce-operations' AND role_code='member'),access_level), updated_at=CURRENT_TIMESTAMP WHERE module_key='storefront' AND role_code='member';
UPDATE app_module_role_access SET is_allowed=COALESCE((SELECT is_allowed FROM app_module_role_access WHERE module_key='commerce-operations' AND role_code='admin'),is_allowed), access_level=COALESCE((SELECT access_level FROM app_module_role_access WHERE module_key='commerce-operations' AND role_code='admin'),access_level), updated_at=CURRENT_TIMESTAMP WHERE module_key='storefront' AND role_code='admin';
UPDATE app_module_role_access SET is_allowed=COALESCE((SELECT is_allowed FROM app_module_role_access WHERE module_key='creative-production' AND role_code='member'),is_allowed), access_level=COALESCE((SELECT access_level FROM app_module_role_access WHERE module_key='creative-production' AND role_code='member'),access_level), updated_at=CURRENT_TIMESTAMP WHERE module_key='creators' AND role_code='member';
UPDATE app_module_role_access SET is_allowed=COALESCE((SELECT is_allowed FROM app_module_role_access WHERE module_key='creative-production' AND role_code='admin'),is_allowed), access_level=COALESCE((SELECT access_level FROM app_module_role_access WHERE module_key='creative-production' AND role_code='admin'),access_level), updated_at=CURRENT_TIMESTAMP WHERE module_key='creators' AND role_code='admin';
UPDATE app_module_role_access SET is_allowed=COALESCE((SELECT is_allowed FROM app_module_role_access WHERE module_key='business-administration' AND role_code='member'),is_allowed), access_level=COALESCE((SELECT access_level FROM app_module_role_access WHERE module_key='business-administration' AND role_code='member'),access_level), updated_at=CURRENT_TIMESTAMP WHERE module_key='financials' AND role_code='member';
UPDATE app_module_role_access SET is_allowed=COALESCE((SELECT is_allowed FROM app_module_role_access WHERE module_key='business-administration' AND role_code='admin'),is_allowed), access_level=COALESCE((SELECT access_level FROM app_module_role_access WHERE module_key='business-administration' AND role_code='admin'),access_level), updated_at=CURRENT_TIMESTAMP WHERE module_key='financials' AND role_code='admin';
UPDATE app_module_role_access SET is_allowed=0, access_level='none', updated_at=CURRENT_TIMESTAMP WHERE module_key='it-platform' AND role_code IN ('member','admin');

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

INSERT OR IGNORE INTO app_module_user_access (module_key,user_id,is_allowed,access_level,granted_by_user_id,created_at,updated_at)
SELECT 'storefront',user_id,is_allowed,CASE WHEN access_level='member' THEN 'read' ELSE access_level END,granted_by_user_id,created_at,CURRENT_TIMESTAMP FROM app_module_user_access WHERE module_key='commerce-operations';
INSERT OR IGNORE INTO app_module_user_access (module_key,user_id,is_allowed,access_level,granted_by_user_id,created_at,updated_at)
SELECT 'creators',user_id,is_allowed,CASE WHEN access_level='member' THEN 'read' ELSE access_level END,granted_by_user_id,created_at,CURRENT_TIMESTAMP FROM app_module_user_access WHERE module_key='creative-production';
INSERT OR IGNORE INTO app_module_user_access (module_key,user_id,is_allowed,access_level,granted_by_user_id,created_at,updated_at)
SELECT 'financials',user_id,is_allowed,CASE WHEN access_level='member' THEN 'read' ELSE access_level END,granted_by_user_id,created_at,CURRENT_TIMESTAMP FROM app_module_user_access WHERE module_key='business-administration';

INSERT INTO app_module_user_access (module_key,user_id,is_allowed,access_level,granted_by_user_id)
SELECT 'it-platform',u.user_id,1,'manage',NULL FROM users u
WHERE u.is_active=1 AND LOWER(TRIM(u.role))='admin'
  AND NOT EXISTS (SELECT 1 FROM app_module_user_access WHERE module_key='it-platform')
ON CONFLICT(module_key,user_id) DO NOTHING;

-- Storefront Home Carousel authority. No slide is seeded: the existing static Home hero
-- remains the public fallback until an administrator deliberately publishes a slide.
CREATE TABLE IF NOT EXISTS home_carousel_slides (
  slide_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body_text TEXT,
  image_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  cta_label TEXT,
  cta_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','paused','archived')),
  sort_order INTEGER NOT NULL DEFAULT 100 CHECK (sort_order BETWEEN 1 AND 999999),
  starts_at TEXT,
  ends_at TEXT,
  auto_advance_seconds INTEGER NOT NULL DEFAULT 7 CHECK (auto_advance_seconds BETWEEN 5 AND 20),
  supersedes_slide_id INTEGER,
  created_by INTEGER,
  updated_by INTEGER,
  published_by INTEGER,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (length(trim(title)) BETWEEN 1 AND 120),
  CHECK (length(COALESCE(body_text,'')) <= 320),
  CHECK (length(trim(image_url)) BETWEEN 1 AND 500),
  CHECK (length(trim(alt_text)) BETWEEN 1 AND 220),
  CHECK (length(COALESCE(cta_label,'')) <= 80),
  CHECK (length(COALESCE(cta_url,'')) <= 500),
  CHECK ((COALESCE(trim(cta_label),'')='' AND COALESCE(trim(cta_url),'')='') OR (COALESCE(trim(cta_label),'')<>'' AND COALESCE(trim(cta_url),'')<>'')),
  CHECK (starts_at IS NULL OR ends_at IS NULL OR datetime(ends_at) > datetime(starts_at)),
  CHECK (supersedes_slide_id IS NULL OR supersedes_slide_id <> slide_id),
  FOREIGN KEY (supersedes_slide_id) REFERENCES home_carousel_slides(slide_id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (published_by) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_home_carousel_public ON home_carousel_slides(status,sort_order,starts_at,ends_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_home_carousel_one_open_replacement ON home_carousel_slides(supersedes_slide_id) WHERE supersedes_slide_id IS NOT NULL AND status IN ('draft','paused');

CREATE TABLE IF NOT EXISTS home_carousel_events (
  carousel_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  slide_id INTEGER NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('created','saved','published','paused','archived','reordered')),
  actor_user_id INTEGER,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (slide_id) REFERENCES home_carousel_slides(slide_id) ON DELETE RESTRICT,
  FOREIGN KEY (actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_home_carousel_events_slide ON home_carousel_events(slide_id,created_at DESC,carousel_event_id DESC);

-- Retire only registry/access compatibility rows after canonical state is copied.
-- Aggregate schema inspection confirms these are the only app_modules foreign-key dependants.
DELETE FROM app_module_user_access WHERE module_key IN ('commerce-operations','creative-production','business-administration');
DELETE FROM app_module_role_access WHERE module_key IN ('commerce-operations','creative-production','business-administration');
DELETE FROM app_modules WHERE module_key IN ('commerce-operations','creative-production','business-administration');

-- Execution evidence returned by Wrangler/D1.
SELECT module_key,display_name,is_enabled,requires_login,default_route,load_priority,background_activity_enabled FROM app_modules WHERE module_key IN ('storefront','creators','socials','financials','it-platform') ORDER BY load_priority,module_key;
SELECT module_key,role_code,is_allowed,access_level FROM app_module_role_access WHERE module_key IN ('storefront','creators','socials','financials','it-platform') ORDER BY module_key,role_code;
SELECT module_key,user_id,is_allowed,access_level FROM app_module_user_access ORDER BY module_key,user_id;
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('app_modules','app_module_role_access','app_module_user_access','home_carousel_slides','home_carousel_events') ORDER BY name;
PRAGMA foreign_key_check;
