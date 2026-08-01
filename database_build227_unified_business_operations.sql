-- Devil n Dove Build 227 — unified labeling/packaging and client-document controls.
-- Apply once after the Build 225 readiness/packaging migration. Back up D1 first.
-- This file is identical to database_upgrade_current_pass.sql; apply one, not both.

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS packaging_components (
  packaging_component_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  site_item_inventory_id INTEGER,
  component_type TEXT NOT NULL DEFAULT 'label',
  component_name TEXT NOT NULL,
  sku_reference TEXT,
  quantity_per_finished_unit REAL NOT NULL DEFAULT 1,
  wastage_percent REAL NOT NULL DEFAULT 0,
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  lot_tracking_required INTEGER NOT NULL DEFAULT 0,
  supplier_name TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_packaging_components_project ON packaging_components(packaging_project_id,is_active,packaging_component_id);
CREATE INDEX IF NOT EXISTS idx_packaging_components_inventory ON packaging_components(site_item_inventory_id,is_active);

CREATE TABLE IF NOT EXISTS customer_document_sequences (
  document_type TEXT NOT NULL,
  sequence_year INTEGER NOT NULL,
  next_number INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(document_type,sequence_year)
);

CREATE TABLE IF NOT EXISTS customer_documents (
  customer_document_id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_number TEXT NOT NULL UNIQUE,
  document_type TEXT NOT NULL,
  order_id INTEGER NOT NULL,
  refund_id INTEGER,
  document_status TEXT NOT NULL DEFAULT 'issued',
  currency TEXT NOT NULL DEFAULT 'CAD',
  document_amount_cents INTEGER NOT NULL DEFAULT 0,
  tax_adjustment_cents INTEGER NOT NULL DEFAULT 0,
  issue_reason TEXT,
  customer_email TEXT,
  business_name TEXT,
  business_registration_number TEXT,
  source_snapshot_json TEXT NOT NULL,
  issued_by_user_id INTEGER,
  issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  voided_by_user_id INTEGER,
  voided_at TEXT,
  void_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE RESTRICT,
  FOREIGN KEY(refund_id) REFERENCES payment_refunds(refund_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_customer_documents_order ON customer_documents(order_id,issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_documents_type_status ON customer_documents(document_type,document_status,issued_at DESC);

INSERT OR IGNORE INTO packaging_templates (template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active)
VALUES
('product-label-rectangle-v1','General product label — rectangle','product_label','Structured bilingual general-purpose label for non-soap products. Confirm the physical dieline and category-specific legal fields before approval.',88.9,50.8,88.9,50.8,0,0,'{"sections":["identity","description","net_quantity","dealer_contact","batch_barcode"],"dimension_profile":"general_rectangle","bleed_mm":3,"safe_margin_mm":3}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1),
('candle-label-v1','Candle label — bilingual rectangle','candle_label','General candle-label working profile with review-first warnings and net quantity. Confirm vessel fit and current hazard requirements.',76.2,50.8,76.2,50.8,0,0,'{"sections":["identity","scent","net_quantity","warnings","dealer_contact","batch"],"dimension_profile":"candle_rectangle","bleed_mm":3,"safe_margin_mm":3}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1),
('jewelry-card-v1','Jewelry display card','jewelry_card','Display-card working profile with product identity, maker/contact, care and inventory references.',63.5,88.9,63.5,88.9,0,0,'{"sections":["brand","identity","care","maker_contact","sku_barcode"],"dimension_profile":"jewelry_card","bleed_mm":3,"safe_margin_mm":3}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1),
('package-insert-a6-v1','Package insert / care card — A6','package_insert','Customer-facing insert for care, thank-you, support, QR and reorder information.',105,148,105,148,0,0,'{"sections":["brand","message","care","support","qr"],"dimension_profile":"a6_insert","bleed_mm":3,"safe_margin_mm":5}','{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',1,1);

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES ('build227_unified_business_operations','database_build227_unified_business_operations.sql',CURRENT_TIMESTAMP,'Adds a business-wide packaging component BOM/cost layer and immutable sequential invoices, receipts, packing slips, credit notes, and refund-confirmation snapshots.')
ON CONFLICT(migration_key) DO UPDATE SET file_name=excluded.file_name,notes=excluded.notes;

COMMIT;
