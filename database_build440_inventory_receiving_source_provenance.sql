-- Devil n Dove Build 440 — barcode-first Inventory receiving and supplier/source provenance.
-- Additive/idempotent. Stock remains authoritative in site_item_inventory + site_inventory_movements;
-- purchase-lot quantity/cost remains authoritative in inventory_purchase_lots.
-- inventory_receiving_claims is only an idempotency/audit claim and is not a second stock ledger.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS inventory_item_identifiers (
  inventory_item_identifier_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL,
  identifier_type TEXT NOT NULL CHECK(identifier_type IN (
    'barcode','upc','ean','gtin','supplier_sku','manufacturer_sku','asin','external_key','internal_sku'
  )),
  identifier_value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  source_name TEXT NOT NULL DEFAULT '',
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0,1)),
  verification_status TEXT NOT NULL DEFAULT 'needs_review' CHECK(verification_status IN ('needs_review','verified','rejected')),
  verified_by_user_id INTEGER,
  verified_at TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_item_inventory_id, identifier_type, normalized_value, source_name),
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY(verified_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY(created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_item_identifiers_lookup
  ON inventory_item_identifiers(normalized_value, identifier_type, verification_status);
CREATE INDEX IF NOT EXISTS idx_inventory_item_identifiers_item
  ON inventory_item_identifiers(site_item_inventory_id, is_primary DESC, identifier_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_item_identifiers_global_barcode
  ON inventory_item_identifiers(normalized_value)
  WHERE identifier_type IN ('barcode','upc','ean','gtin') AND verification_status <> 'rejected';

CREATE TABLE IF NOT EXISTS inventory_item_sources (
  inventory_item_source_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL,
  source_kind TEXT NOT NULL DEFAULT 'supplier' CHECK(source_kind IN ('supplier','manufacturer','retailer','amazon','marketplace','import','manual')),
  source_name TEXT NOT NULL DEFAULT '',
  source_name_normalized TEXT NOT NULL DEFAULT '',
  supplier_sku TEXT NOT NULL DEFAULT '',
  supplier_sku_normalized TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  source_url_normalized TEXT NOT NULL DEFAULT '',
  source_reference TEXT,
  is_preferred INTEGER NOT NULL DEFAULT 0 CHECK(is_preferred IN (0,1)),
  verification_status TEXT NOT NULL DEFAULT 'needs_review' CHECK(verification_status IN ('needs_review','verified','rejected')),
  receipt_count INTEGER NOT NULL DEFAULT 0,
  last_received_at TEXT,
  last_verified_at TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_item_inventory_id, source_kind, source_name_normalized, supplier_sku_normalized, source_url_normalized),
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY(created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY(updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_item_sources_item
  ON inventory_item_sources(site_item_inventory_id, is_preferred DESC, verification_status, last_received_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_item_sources_supplier
  ON inventory_item_sources(source_name_normalized, supplier_sku_normalized, site_item_inventory_id);

CREATE TABLE IF NOT EXISTS inventory_receiving_claims (
  inventory_receiving_claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
  receive_key TEXT NOT NULL UNIQUE,
  site_item_inventory_id INTEGER NOT NULL,
  supplier_purchase_order_item_id INTEGER,
  inventory_purchase_lot_id INTEGER,
  lot_code TEXT NOT NULL,
  quantity_received REAL NOT NULL CHECK(quantity_received > 0),
  quantity_incoming_cleared REAL NOT NULL DEFAULT 0 CHECK(quantity_incoming_cleared >= 0),
  unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
  tax_cost_cents INTEGER NOT NULL DEFAULT 0,
  source_kind TEXT NOT NULL DEFAULT 'manual',
  source_name TEXT,
  supplier_sku TEXT,
  source_url TEXT,
  scanned_identifier TEXT,
  previous_on_hand_quantity REAL NOT NULL DEFAULT 0,
  new_on_hand_quantity REAL NOT NULL DEFAULT 0,
  previous_incoming_quantity REAL NOT NULL DEFAULT 0,
  new_incoming_quantity REAL NOT NULL DEFAULT 0,
  claim_status TEXT NOT NULL DEFAULT 'applying' CHECK(claim_status IN ('applying','completed','failed')),
  error_note TEXT,
  received_by_user_id INTEGER,
  received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
  FOREIGN KEY(inventory_purchase_lot_id) REFERENCES inventory_purchase_lots(inventory_purchase_lot_id) ON DELETE RESTRICT,
  FOREIGN KEY(received_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_receiving_claims_item
  ON inventory_receiving_claims(site_item_inventory_id, received_at DESC, inventory_receiving_claim_id DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_receiving_claims_po_item
  ON inventory_receiving_claims(supplier_purchase_order_item_id, received_at DESC)
  WHERE supplier_purchase_order_item_id IS NOT NULL;

-- Backfill identities already present in the canonical Inventory rows. We do not invent barcodes.
INSERT OR IGNORE INTO inventory_item_identifiers (
  site_item_inventory_id,identifier_type,identifier_value,normalized_value,source_name,is_primary,
  verification_status,verified_at,created_at,updated_at
)
SELECT
  site_item_inventory_id,'external_key',TRIM(external_key),UPPER(TRIM(external_key)),LOWER(TRIM(COALESCE(source_type,''))),1,
  'verified',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM site_item_inventory
WHERE TRIM(COALESCE(external_key,''))<>'';

INSERT OR IGNORE INTO inventory_item_identifiers (
  site_item_inventory_id,identifier_type,identifier_value,normalized_value,source_name,is_primary,
  verification_status,verified_at,created_at,updated_at
)
SELECT
  site_item_inventory_id,'supplier_sku',TRIM(supplier_sku),UPPER(REPLACE(TRIM(supplier_sku),' ','')),LOWER(TRIM(COALESCE(supplier_name,''))),0,
  'verified',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM site_item_inventory
WHERE TRIM(COALESCE(supplier_sku,''))<>'';

-- Preserve the existing Inventory supplier/source fields as the initial preferred source record.
INSERT OR IGNORE INTO inventory_item_sources (
  site_item_inventory_id,source_kind,source_name,source_name_normalized,supplier_sku,supplier_sku_normalized,
  source_url,source_url_normalized,source_reference,is_preferred,verification_status,receipt_count,
  last_verified_at,created_at,updated_at
)
SELECT
  site_item_inventory_id,
  CASE WHEN TRIM(COALESCE(amazon_url,''))<>'' THEN 'amazon'
       WHEN TRIM(COALESCE(supplier_name,''))<>'' THEN 'supplier'
       ELSE 'import' END,
  TRIM(COALESCE(supplier_name,'')),
  LOWER(TRIM(COALESCE(supplier_name,''))),
  TRIM(COALESCE(supplier_sku,'')),
  UPPER(REPLACE(TRIM(COALESCE(supplier_sku,'')),' ','')),
  TRIM(CASE WHEN TRIM(COALESCE(source_url,''))<>'' THEN source_url ELSE COALESCE(amazon_url,'') END),
  LOWER(TRIM(CASE WHEN TRIM(COALESCE(source_url,''))<>'' THEN source_url ELSE COALESCE(amazon_url,'') END)),
  'Build 440 normalized from the existing site_item_inventory supplier/source fields.',
  1,'verified',0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM site_item_inventory
WHERE TRIM(COALESCE(supplier_name,''))<>''
   OR TRIM(COALESCE(supplier_sku,''))<>''
   OR TRIM(COALESCE(source_url,''))<>''
   OR TRIM(COALESCE(amazon_url,''))<>'';

INSERT OR IGNORE INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.inventory.receiving_authority','site_inventory_movements_plus_inventory_purchase_lots_v440',0);
INSERT OR IGNORE INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.inventory.barcode_resolver_policy','verified_identifier_exact_match_fail_ambiguous_v440',0);
INSERT OR IGNORE INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.inventory.source_provenance_policy','normalized_multi_source_preferred_review_v440',0);

INSERT INTO schema_migration_ledger(migration_key,file_name,checksum,status,destructive,applied_at,notes,created_at,updated_at)
VALUES (
  'build440_inventory_receiving_source_provenance',
  'database_build440_inventory_receiving_source_provenance.sql',
  NULL,'applied',0,CURRENT_TIMESTAMP,
  'Adds normalized Inventory identifiers and supplier/source provenance plus idempotent receiving claims. Stock remains in site_item_inventory/site_inventory_movements and lot quantity/cost remains in inventory_purchase_lots. No historical barcode values are invented.',
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,status='applied',destructive=0,
  applied_at=COALESCE(schema_migration_ledger.applied_at,CURRENT_TIMESTAMP),
  notes=excluded.notes,updated_at=CURRENT_TIMESTAMP;
