-- Devil n Dove Build 221 — current upgrade pass.
-- Apply only after backing up D1 and after the Build 220 schema is present.
-- This file is intentionally reset each build so it does not replay years of historical ALTER statements.
PRAGMA foreign_keys = ON;

-- Build 221 — Packaging Studio foundation, streamlined product cleanup,
-- purchase-lot reconciliation controls, and review-first packaging exports.
-- Apply after database_build220_quantity_sets_lots_content_only.sql.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS packaging_templates (
  packaging_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_key TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  package_type TEXT NOT NULL DEFAULT 'soap_ribbon',
  description TEXT,
  page_width_mm REAL NOT NULL DEFAULT 279.4,
  page_height_mm REAL NOT NULL DEFAULT 19,
  front_width_mm REAL NOT NULL DEFAULT 50.8,
  front_height_mm REAL NOT NULL DEFAULT 38.1,
  rear_width_mm REAL NOT NULL DEFAULT 50,
  rear_height_mm REAL NOT NULL DEFAULT 50,
  layout_json TEXT NOT NULL DEFAULT '{}',
  theme_json TEXT NOT NULL DEFAULT '{}',
  is_system INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS packaging_projects (
  packaging_project_id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_key TEXT NOT NULL UNIQUE,
  product_id INTEGER,
  packaging_template_id INTEGER NOT NULL,
  project_name TEXT NOT NULL,
  package_type TEXT NOT NULL DEFAULT 'soap_ribbon',
  project_status TEXT NOT NULL DEFAULT 'draft',
  collection_name TEXT,
  product_name TEXT NOT NULL,
  product_subtitle TEXT,
  product_identity_en TEXT,
  product_identity_fr TEXT,
  ingredients_inci TEXT,
  ingredients_en TEXT,
  ingredients_fr TEXT,
  net_quantity_text TEXT,
  website_text TEXT,
  dealer_name TEXT,
  dealer_address TEXT,
  contact_text TEXT,
  made_in_canada_text TEXT,
  claims_json TEXT NOT NULL DEFAULT '[]',
  warnings_en TEXT,
  warnings_fr TEXT,
  icons_json TEXT NOT NULL DEFAULT '[]',
  theme_json TEXT NOT NULL DEFAULT '{}',
  artwork_json TEXT NOT NULL DEFAULT '{}',
  print_notes TEXT,
  compliance_status TEXT NOT NULL DEFAULT 'needs_review',
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE SET NULL,
  FOREIGN KEY(packaging_template_id) REFERENCES packaging_templates(packaging_template_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_packaging_projects_product ON packaging_projects(product_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_packaging_projects_status ON packaging_projects(project_status, updated_at DESC);

CREATE TABLE IF NOT EXISTS packaging_project_versions (
  packaging_project_version_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL,
  version_label TEXT,
  snapshot_json TEXT NOT NULL,
  svg_markup TEXT,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(packaging_project_id, version_number),
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_packaging_project_versions_project ON packaging_project_versions(packaging_project_id, version_number DESC);

CREATE TABLE IF NOT EXISTS packaging_export_history (
  packaging_export_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  packaging_project_version_id INTEGER,
  export_format TEXT NOT NULL,
  file_name TEXT,
  export_status TEXT NOT NULL DEFAULT 'prepared',
  source_snapshot_json TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,
  FOREIGN KEY(packaging_project_version_id) REFERENCES packaging_project_versions(packaging_project_version_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_packaging_export_history_project ON packaging_export_history(packaging_project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS inventory_lot_policies (
  site_item_inventory_id INTEGER PRIMARY KEY,
  depletion_method TEXT NOT NULL DEFAULT 'manual',
  reconcile_status TEXT NOT NULL DEFAULT 'needs_review',
  last_reconciled_quantity REAL,
  last_reconciled_at TEXT,
  updated_by_user_id INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS inventory_lot_reconciliations (
  inventory_lot_reconciliation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL,
  main_on_hand_quantity REAL NOT NULL DEFAULT 0,
  lot_remaining_quantity REAL NOT NULL DEFAULT 0,
  discrepancy_quantity REAL NOT NULL DEFAULT 0,
  applied_to_main_inventory INTEGER NOT NULL DEFAULT 0,
  previous_on_hand_quantity REAL,
  new_on_hand_quantity REAL,
  depletion_method TEXT NOT NULL DEFAULT 'manual',
  review_note TEXT NOT NULL,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_inventory_lot_reconciliations_item ON inventory_lot_reconciliations(site_item_inventory_id, reviewed_at DESC);

INSERT OR IGNORE INTO packaging_templates (
  template_key, template_name, package_type, description,
  page_width_mm, page_height_mm, front_width_mm, front_height_mm,
  rear_width_mm, rear_height_mm, layout_json, theme_json, is_system, is_active
) VALUES (
  'soap-ribbon-scalloped-reference-v1',
  'Soap ribbon — scalloped medallion reference',
  'soap_ribbon',
  'Recreates the supplied ribbon structure: narrow 19 mm band, scalloped front medallion, curved collection and scent text, bilingual centre title, side botanical ornaments, ingredients, rear medallion, claims and net quantity.',
  279.4, 50, 50.8, 38.1, 50, 50,
  '{"sections":["front_scalloped_badge","ingredients_en","ingredients_fr","rear_medallion","claims"],"band_height_mm":19,"front_style":"scalloped_curved_text"}',
  '{"rose_colour":"#9b8068","theme_colour":"#f2ead8","border_colour":"#2f2721","accent_gold":"#b69a61"}',
  1, 1
);

INSERT OR IGNORE INTO packaging_templates (
  template_key, template_name, package_type, description,
  page_width_mm, page_height_mm, front_width_mm, front_height_mm,
  rear_width_mm, rear_height_mm, layout_json, theme_json, is_system, is_active
) VALUES (
  'soap-ribbon-11x0.75-v1',
  'Soap ribbon — standard 11 × 0.75 inch',
  'soap_ribbon',
  'Standard narrow ribbon with front oval, English ingredients, French ingredients, rear medallion, claims and net weight.',
  279.4, 19, 50.8, 19, 50, 19,
  '{"sections":["front","ingredients_en","ingredients_fr","rear","claims"],"band_height_mm":19}',
  '{"rose_colour":"#b74b63","theme_colour":"#f4eadb","border_colour":"#3b2c2f","accent_gold":"#b38a3b"}',
  1, 1
);
