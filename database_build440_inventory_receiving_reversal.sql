-- Devil n Dove Build 440 — audited reversal for Tool/Supply receipts.
-- Additive/idempotent. The original inventory_receiving_claim remains immutable completed evidence;
-- this table records the one allowed compensating reversal rather than rewriting history.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS inventory_receiving_reversals (
  inventory_receiving_reversal_id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_receiving_claim_id INTEGER NOT NULL UNIQUE,
  reversal_key TEXT NOT NULL UNIQUE,
  site_item_inventory_id INTEGER NOT NULL,
  inventory_purchase_lot_id INTEGER NOT NULL,
  supplier_purchase_order_item_id INTEGER,
  quantity_reversed REAL NOT NULL CHECK(quantity_reversed > 0),
  quantity_incoming_restored REAL NOT NULL DEFAULT 0 CHECK(quantity_incoming_restored >= 0),
  previous_on_hand_quantity REAL NOT NULL DEFAULT 0,
  new_on_hand_quantity REAL NOT NULL DEFAULT 0,
  previous_incoming_quantity REAL NOT NULL DEFAULT 0,
  new_incoming_quantity REAL NOT NULL DEFAULT 0,
  previous_lot_received_quantity REAL NOT NULL DEFAULT 0,
  new_lot_received_quantity REAL NOT NULL DEFAULT 0,
  previous_lot_remaining_quantity REAL NOT NULL DEFAULT 0,
  new_lot_remaining_quantity REAL NOT NULL DEFAULT 0,
  previous_po_received_quantity REAL,
  new_po_received_quantity REAL,
  reversal_reason TEXT NOT NULL,
  reversed_by_user_id INTEGER,
  reversed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(inventory_receiving_claim_id) REFERENCES inventory_receiving_claims(inventory_receiving_claim_id) ON DELETE RESTRICT,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
  FOREIGN KEY(inventory_purchase_lot_id) REFERENCES inventory_purchase_lots(inventory_purchase_lot_id) ON DELETE RESTRICT,
  FOREIGN KEY(reversed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_receiving_reversals_item
  ON inventory_receiving_reversals(site_item_inventory_id, reversed_at DESC, inventory_receiving_reversal_id DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_receiving_reversals_lot
  ON inventory_receiving_reversals(inventory_purchase_lot_id, reversed_at DESC);

INSERT OR IGNORE INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.inventory.receiving_reversal_policy','single_compensating_reversal_unconsumed_lot_v440',0);

INSERT INTO schema_migration_ledger(migration_key,file_name,checksum,status,destructive,applied_at,notes,created_at,updated_at)
VALUES (
  'build440_inventory_receiving_reversal',
  'database_build440_inventory_receiving_reversal.sql',
  NULL,'applied',0,CURRENT_TIMESTAMP,
  'Adds one immutable compensating reversal per completed Tool/Supply receiving claim. Reversal is blocked once the received quantity cannot be proven to remain in the linked purchase lot.',
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,status='applied',destructive=0,
  applied_at=COALESCE(schema_migration_ledger.applied_at,CURRENT_TIMESTAMP),
  notes=excluded.notes,updated_at=CURRENT_TIMESTAMP;
