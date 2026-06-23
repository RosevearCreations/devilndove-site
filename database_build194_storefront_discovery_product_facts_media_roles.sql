-- Devil n Dove Build 194 — Storefront Discovery, Product Facts, and Media Roles
-- Run after database_build193_live_readiness_playbook.sql.
-- Adds sidecar listing-profile and image-role tables. No product row is changed automatically.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS product_listing_profiles (
  product_listing_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL UNIQUE,
  best_for_text TEXT,
  materials_text TEXT,
  finish_text TEXT,
  dimensions_text TEXT,
  care_summary TEXT,
  handmade_variation_note TEXT,
  availability_note TEXT,
  shipping_pickup_note TEXT,
  product_video_url TEXT,
  profile_status TEXT NOT NULL DEFAULT 'draft',
  internal_notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_product_listing_profiles_status ON product_listing_profiles(profile_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS product_media_role_assignments (
  product_media_role_assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  role_key TEXT NOT NULL,
  product_image_id INTEGER,
  image_url TEXT,
  assignment_status TEXT NOT NULL DEFAULT 'assigned',
  notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, role_key),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (product_image_id) REFERENCES product_images(product_image_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_product_media_role_assignments_product ON product_media_role_assignments(product_id, role_key);

CREATE TABLE IF NOT EXISTS storefront_discovery_audit_rows (
  storefront_discovery_audit_row_id INTEGER PRIMARY KEY AUTOINCREMENT,
  audit_key TEXT NOT NULL UNIQUE,
  route_path TEXT NOT NULL,
  audit_status TEXT NOT NULL DEFAULT 'planned',
  evidence_url TEXT,
  notes TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO storefront_discovery_audit_rows (audit_key,route_path,audit_status,notes)
VALUES
 ('home_hero_clarity','/','planned','Review the homepage on phone and desktop with a first-time visitor: workshop identity, handmade/vintage distinction, and four primary choices should be understandable within a few seconds.'),
 ('home_featured_products','/','planned','Confirm featured creations render only active approved storefront products and empty state stays helpful.'),
 ('shop_quick_filters','/shop/','planned','Confirm quick chips set familiar filters without hiding normal search/filter controls.'),
 ('product_quick_facts','/shop/product/','planned','Approve listing facts before public display; verify dimensions, care, pickup/shipping, and handmade variation are truthful.'),
 ('product_media_roles','/admin/catalog-media/','planned','Assign real photo roles and replace public placeholders only after consent, alt text, performance, and device review.'),
 ('workshop_journal','/workshop-journal/','planned','Review journal pages for accuracy and replace visual placeholders only with approved real media.')
ON CONFLICT(audit_key) DO UPDATE SET route_path=excluded.route_path, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP;

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build_194_storefront_discovery_product_facts_media_roles',
  'database_build194_storefront_discovery_product_facts_media_roles.sql',
  CURRENT_TIMESTAMP,
  'Adds approved public product listing profiles, buyer-question media role assignments, storefront discovery audit rows, workshop journal support, and product media role coverage.'
)
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;
