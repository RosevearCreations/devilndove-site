-- Devil n Dove Build 246 — product/project integrity, finished-production inventory, and packaging translation review.
-- Run after Build 245. Additive/idempotent. No TEMP tables, destructive table-removal operations, or request-time schema mutations.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS creative_project_deletion_audit (
  creative_project_deletion_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id_deleted INTEGER NOT NULL,
  project_key TEXT NOT NULL,
  project_title TEXT,
  product_id INTEGER,
  project_snapshot_json TEXT NOT NULL DEFAULT '{}',
  inventory_return_json TEXT NOT NULL DEFAULT '{}',
  deletion_reason TEXT,
  deleted_by_user_id INTEGER,
  deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_creative_project_deletion_audit_project
  ON creative_project_deletion_audit(creative_work_project_id_deleted, deleted_at DESC);

CREATE TABLE IF NOT EXISTS product_resource_ingredient_profiles (
  product_resource_link_id INTEGER PRIMARY KEY,
  is_label_ingredient INTEGER NOT NULL DEFAULT 0,
  ingredient_name_en TEXT,
  ingredient_name_fr TEXT,
  inci_name TEXT,
  label_sort_order INTEGER NOT NULL DEFAULT 0,
  translation_review_status TEXT NOT NULL DEFAULT 'needs_review',
  notes TEXT,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_resource_link_id) REFERENCES product_resource_links(product_resource_link_id) ON DELETE CASCADE,
  FOREIGN KEY(updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_product_resource_ingredient_profiles_label
  ON product_resource_ingredient_profiles(is_label_ingredient, label_sort_order, product_resource_link_id);

CREATE TABLE IF NOT EXISTS product_production_runs (
  product_production_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_key TEXT NOT NULL UNIQUE,
  product_id INTEGER NOT NULL,
  output_quantity INTEGER NOT NULL DEFAULT 1,
  output_unit_label TEXT NOT NULL DEFAULT 'unit',
  run_status TEXT NOT NULL DEFAULT 'posted' CHECK(run_status IN ('posted','reversed','failed')),
  material_snapshot_json TEXT NOT NULL DEFAULT '[]',
  ingredient_snapshot_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  posted_by_user_id INTEGER,
  posted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reversed_by_user_id INTEGER,
  reversed_at TEXT,
  reversal_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
  FOREIGN KEY(posted_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY(reversed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_product_production_runs_product
  ON product_production_runs(product_id, run_status, posted_at DESC);

CREATE TABLE IF NOT EXISTS product_production_run_materials (
  product_production_run_material_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_production_run_id INTEGER NOT NULL,
  product_resource_link_id INTEGER,
  site_item_inventory_id INTEGER,
  resource_kind TEXT NOT NULL,
  source_key TEXT,
  item_name TEXT NOT NULL,
  consumption_mode TEXT NOT NULL DEFAULT 'per_unit',
  tracking_mode TEXT NOT NULL DEFAULT 'exact',
  usage_quantity REAL NOT NULL DEFAULT 0,
  usage_unit_label TEXT NOT NULL DEFAULT 'unit',
  stock_quantity_consumed REAL NOT NULL DEFAULT 0,
  stock_unit_label TEXT NOT NULL DEFAULT 'unit',
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  is_label_ingredient INTEGER NOT NULL DEFAULT 0,
  ingredient_name_en TEXT,
  ingredient_name_fr TEXT,
  inci_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(product_production_run_id) REFERENCES product_production_runs(product_production_run_id) ON DELETE CASCADE,
  FOREIGN KEY(product_resource_link_id) REFERENCES product_resource_links(product_resource_link_id) ON DELETE SET NULL,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_product_production_run_materials_run
  ON product_production_run_materials(product_production_run_id, product_production_run_material_id);
CREATE INDEX IF NOT EXISTS idx_product_production_run_materials_inventory
  ON product_production_run_materials(site_item_inventory_id, created_at DESC);

CREATE TABLE IF NOT EXISTS packaging_translation_reviews (
  packaging_translation_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  field_key TEXT NOT NULL,
  source_text TEXT NOT NULL DEFAULT '',
  generated_text TEXT NOT NULL DEFAULT '',
  generator_key TEXT NOT NULL DEFAULT 'curated_bilingual_v1',
  review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK(review_status IN ('needs_review','approved','changes_requested')),
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(packaging_project_id, field_key, generated_text),
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,
  FOREIGN KEY(reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY(created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_packaging_translation_reviews_project
  ON packaging_translation_reviews(packaging_project_id, review_status, updated_at DESC);

INSERT INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.product.generated_project_shell_delete_policy','auto_cleanup_unreviewed_v246',0)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,is_public=0;

INSERT INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.creative_project.delete_inventory_policy','compensate_unreversed_consumption_v246',0)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,is_public=0;

INSERT INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.product.production_release_policy','reviewed_bom_snapshot_inventory_post_v246',0)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,is_public=0;

INSERT INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.packaging.soap_design_policy','approved_soap_reference_v2',0)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,is_public=0;

INSERT INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.packaging.french_generation_policy','curated_draft_human_review_v246',0)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,is_public=0;

INSERT INTO schema_migration_ledger(migration_key,file_name,checksum,status,destructive,applied_at,notes,created_at,updated_at)
VALUES (
  'build246_product_project_production_packaging',
  'database_build246_product_project_production_packaging.sql',
  NULL,'applied',0,CURRENT_TIMESTAMP,
  'Adds audited Creative Project deletion with inventory compensation, generated product Content Studio/CAIP shell cleanup support, finished-production material/ingredient snapshots, and reviewed packaging translation evidence. No source media or business history is silently discarded.',
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,status='applied',destructive=0,
  applied_at=COALESCE(schema_migration_ledger.applied_at,CURRENT_TIMESTAMP),
  notes=excluded.notes,updated_at=CURRENT_TIMESTAMP;
