-- Release 467 Build 387. Additive, forward-only; existing raw inventory, receipts and movements are retained.
ALTER TABLE site_item_inventory ADD COLUMN last_quick_edit_key TEXT;
CREATE TABLE IF NOT EXISTS inventory_quick_edit_receipts (
 inventory_quick_edit_receipt_id INTEGER PRIMARY KEY AUTOINCREMENT,
 request_key TEXT NOT NULL UNIQUE CHECK(length(request_key) BETWEEN 16 AND 80),
 actor_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 site_item_inventory_id INTEGER NOT NULL REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 prior_on_hand_quantity REAL NOT NULL,
 new_on_hand_quantity REAL NOT NULL,
 prior_unit_cost_cents INTEGER NOT NULL,
 net_unit_cost_cents INTEGER NOT NULL,
 tax_rate_basis_points INTEGER NOT NULL CHECK(tax_rate_basis_points BETWEEN 0 AND 3000),
 tax_included INTEGER NOT NULL CHECK(tax_included IN (0,1)),
 tax_estimate_cents INTEGER NOT NULL CHECK(tax_estimate_cents>=0),
 gross_unit_cost_cents INTEGER NOT NULL CHECK(gross_unit_cost_cents>=0),
 purchase_cost_entered_cents INTEGER NOT NULL CHECK(purchase_cost_entered_cents>=0),
 stock_unit_label TEXT NOT NULL,
 usage_unit_label TEXT NOT NULL,
 usage_units_per_stock_unit REAL NOT NULL CHECK(usage_units_per_stock_unit>0),
 source_movement_id INTEGER NOT NULL REFERENCES site_inventory_movements(site_inventory_movement_id) ON DELETE RESTRICT,
 note TEXT NOT NULL CHECK(length(trim(note))>=12),
 committed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inventory_quick_receipts_item ON inventory_quick_edit_receipts(site_item_inventory_id,inventory_quick_edit_receipt_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_inventory_quick_receipt_requires_source BEFORE INSERT ON inventory_quick_edit_receipts BEGIN
 SELECT RAISE(ABORT,'quick_edit_source_not_committed') WHERE NOT EXISTS(
  SELECT 1 FROM site_item_inventory i WHERE i.site_item_inventory_id=NEW.site_item_inventory_id
   AND i.last_quick_edit_key=NEW.request_key AND i.on_hand_quantity=NEW.new_on_hand_quantity
   AND i.unit_cost_cents=NEW.net_unit_cost_cents AND i.stock_unit_label=NEW.stock_unit_label
   AND i.usage_unit_label=NEW.usage_unit_label AND i.usage_units_per_stock_unit=NEW.usage_units_per_stock_unit
 );
 SELECT RAISE(ABORT,'quick_edit_base_balance_not_synced') WHERE NOT EXISTS(
  SELECT 1 FROM site_inventory_base_balances b WHERE b.site_item_inventory_id=NEW.site_item_inventory_id
  AND b.purchase_unit_cost_cents=NEW.net_unit_cost_cents AND b.base_on_hand_quantity=ROUND(NEW.new_on_hand_quantity*NEW.usage_units_per_stock_unit,6)
  AND b.base_units_per_purchase_unit=NEW.usage_units_per_stock_unit
 );
 SELECT RAISE(ABORT,'quick_edit_movement_not_committed') WHERE NOT EXISTS(
  SELECT 1 FROM site_inventory_movements m WHERE m.site_inventory_movement_id=NEW.source_movement_id
  AND m.site_item_inventory_id=NEW.site_item_inventory_id AND m.actor_user_id=NEW.actor_user_id
  AND m.new_on_hand_quantity=NEW.new_on_hand_quantity AND instr(COALESCE(m.note,''),NEW.request_key)>0
 );
END;
CREATE TRIGGER IF NOT EXISTS trg_inventory_quick_receipts_immutable_update BEFORE UPDATE ON inventory_quick_edit_receipts BEGIN SELECT RAISE(ABORT,'quick_edit_receipt_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_inventory_quick_receipts_immutable_delete BEFORE DELETE ON inventory_quick_edit_receipts BEGIN SELECT RAISE(ABORT,'quick_edit_receipt_immutable'); END;
SELECT COUNT(*) AS build387_receipt_authority FROM sqlite_master WHERE type='table' AND name='inventory_quick_edit_receipts';
PRAGMA foreign_key_check;
