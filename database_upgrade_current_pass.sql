-- Devil n Dove / Rosevear Creations
-- Amazon purchase import staging schema
-- Generated: 2026-05-11
-- Source CSV: orders_from_20220601_to_20260416_20260416_0932.csv
--
-- Purpose:
-- Stage reviewed Amazon purchase rows before applying costs/ASINs/order references
-- to tools, supplies, inventory, accounting, or receipt tables.
--
-- Privacy note:
-- This staging layout intentionally excludes account user email and seller address.

CREATE TABLE IF NOT EXISTS amazon_purchase_import_staging (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  import_batch_id TEXT NOT NULL,
  source_file TEXT NOT NULL,

  match_status TEXT NOT NULL DEFAULT 'unmatched',
  match_score REAL NOT NULL DEFAULT 0,
  token_coverage REAL NOT NULL DEFAULT 0,
  matched_token_count INTEGER NOT NULL DEFAULT 0,
  matched_tokens TEXT,

  safe_to_stage_after_review TEXT NOT NULL DEFAULT 'review',
  review_decision TEXT NOT NULL DEFAULT 'pending',
  review_notes TEXT,

  inventory_type TEXT CHECK (inventory_type IN ('tool', 'supply') OR inventory_type IS NULL),
  inventory_key TEXT,
  inventory_key_loose TEXT,
  inventory_name TEXT,
  inventory_brand_guess TEXT,
  inventory_category_or_type TEXT,
  inventory_r2_object_key TEXT,

  order_date TEXT,
  payment_date TEXT,
  amazon_order_id TEXT,
  asin TEXT,
  amazon_title TEXT,
  amazon_brand TEXT,
  manufacturer TEXT,
  amazon_product_category TEXT,
  item_model_number TEXT,
  part_number TEXT,
  seller_name TEXT,

  currency TEXT NOT NULL DEFAULT 'CAD',
  item_quantity REAL,
  item_subtotal_cents INTEGER NOT NULL DEFAULT 0,
  item_shipping_cents INTEGER NOT NULL DEFAULT 0,
  item_tax_cents INTEGER NOT NULL DEFAULT 0,
  item_net_total_cents INTEGER NOT NULL DEFAULT 0,
  unit_net_cost_cents INTEGER,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_batch
  ON amazon_purchase_import_staging(import_batch_id);

CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_inventory
  ON amazon_purchase_import_staging(inventory_type, inventory_key);

CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_asin
  ON amazon_purchase_import_staging(asin);

CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_order
  ON amazon_purchase_import_staging(amazon_order_id, asin);

CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_review
  ON amazon_purchase_import_staging(review_decision, match_status);

-- Recommended import workflow:
-- 1. Load amazon_inventory_high_confidence_stage_candidates.csv into this staging table.
-- 2. Review medium/review rows in the spreadsheet before changing review_decision.
-- 3. Only rows with review_decision = 'approved' should be applied to production inventory/accounting records.
-- 4. Use amazon_inventory_purchase_summary_by_item.csv to compare totals before posting journal lines.


-- Current build guardrail, 2026-05-14:
-- The admin site-item-inventory API now auto-creates/backfills these columns when missing,
-- then syncs catalog_items into site_item_inventory for searchable Tools/Supplies inventory.
-- Keep this reference here so the schema expectation is visible even when the API does the safe migration.
-- Required site_item_inventory columns include:
-- source_type, external_key, item_name, category, source_url, amazon_url, image_url,
-- on_hand_quantity, reserved_quantity, incoming_quantity, reorder_level, unit_cost_cents,
-- stock_unit_label, usage_unit_label, usage_units_per_stock_unit, supplier_name, supplier_sku,
-- supplier_contact, reorder_notes, preferred_reorder_quantity, is_on_reorder_list,
-- do_not_reorder, do_not_reuse, reuse_status, reservation_notes, last_reorder_requested_at,
-- last_counted_at, is_active, last_seen_at, created_at, updated_at.

-- Inventory sync correction, 2026-05-14:
-- Existing Tools/Supplies records are considered in stock once imported.
-- Build 125 applies this safely through /api/admin/site-item-inventory sync and runtime migrations
-- instead of relying on an UPDATE that can fail on older partial schemas.


-- Current pass, 2026-05-14: schema migration ledger for D1 SQL change tracking.
CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','skipped','failed','pending_review')),
  destructive INTEGER NOT NULL DEFAULT 0,
  applied_by_user_id INTEGER,
  applied_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_schema_migration_ledger_status ON schema_migration_ledger(status, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_schema_migration_ledger_file ON schema_migration_ledger(file_name);

-- Record this pass as pending review unless the admin records it as applied from /admin/operations/.
INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build124',
  'database_upgrade_current_pass.sql',
  'pending_review',
  1,
  'Created by build 124. Mark as applied after this SQL is run in D1.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Current pass, 2026-05-14: saved statement-import provider profiles.
CREATE TABLE IF NOT EXISTS accounting_statement_provider_profiles (
  accounting_statement_provider_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_scope TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  date_column TEXT,
  description_column TEXT,
  gross_column TEXT,
  fee_column TEXT,
  net_column TEXT,
  currency_column TEXT,
  reference_column TEXT,
  default_currency TEXT NOT NULL DEFAULT 'CAD',
  mapping_json TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_accounting_statement_provider_profiles_active ON accounting_statement_provider_profiles(is_active, provider_scope);

-- Build 125 current pass: runtime-safe APIs now create/backfill these schema pieces when missing.
CREATE TABLE IF NOT EXISTS site_item_inventory_cost_history (
  site_item_inventory_cost_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER,
  source_type TEXT,
  external_key TEXT,
  item_name TEXT,
  previous_unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  new_unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  source_kind TEXT NOT NULL DEFAULT 'manual',
  source_id TEXT,
  source_reference TEXT,
  reason_note TEXT,
  changed_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_site_item_inventory_cost_history_item ON site_item_inventory_cost_history(site_item_inventory_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_item_inventory_cost_history_source ON site_item_inventory_cost_history(source_kind, source_id);
-- The reconciliation queue index is created by the runtime API after confirming columns exist.

-- Note: the Build 125 Functions add missing columns safely after checking PRAGMA table_info:
-- amazon_purchase_import_staging.applied_inventory_id / applied_cost_history_id / applied_at / reviewed_by_user_id
-- accounting_reconciliation_exceptions.assigned_to_user_id / accountant_review_flag / resolved_by_user_id / resolved_at / reopened_by_user_id / reopened_at
-- accounting_journal_entries.posted_by_user_id / posted_at / validation_message



-- Build 125 migration ledger marker.
INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key, file_name, status, destructive, notes, created_at, updated_at
) VALUES (
  'database_upgrade_current_pass_build125',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  'Created by build 125. Adds Amazon purchase review/apply workflow, inventory cost history, reconciliation queue fields, journal validation/posting metadata, and local-intent SEO pages. Mark as applied after this SQL and the deployed Functions have been verified.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
