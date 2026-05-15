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

  -- Build 125 review/apply fields.
  applied_inventory_id INTEGER,
  applied_cost_history_id INTEGER,
  applied_at TEXT,
  reviewed_by_user_id INTEGER,

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

CREATE INDEX IF NOT EXISTS idx_amazon_purchase_import_staging_applied
  ON amazon_purchase_import_staging(applied_inventory_id, applied_at);

-- Recommended import workflow:
-- 1. Load amazon_inventory_high_confidence_stage_candidates.csv into this staging table.
-- 2. Review medium/review rows in the spreadsheet before changing review_decision.
-- 3. Only rows with review_decision = 'approved' should be applied to production inventory/accounting records.
-- 4. Approve obvious safe matches first from /admin/catalog/ Amazon purchase review.
-- 5. Approved rows apply unit cost/supplier/ASIN/URL to site_item_inventory and write site_item_inventory_cost_history.
-- 6. Use amazon_inventory_purchase_summary_by_item.csv to compare totals before posting journal lines.
