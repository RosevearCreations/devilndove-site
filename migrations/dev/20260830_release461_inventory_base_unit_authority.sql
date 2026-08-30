-- Release 461: canonical usable/base-unit inventory balance authority.
-- Purchase packaging remains on site_item_inventory for receiving and package-cost history.
-- Runtime code may read/write this table only after this forward migration exists; no runtime DDL.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS site_inventory_base_balances (
  site_item_inventory_id INTEGER PRIMARY KEY,
  purchase_unit_label TEXT NOT NULL DEFAULT 'unit',
  base_unit_label TEXT NOT NULL DEFAULT 'unit',
  base_units_per_purchase_unit REAL NOT NULL DEFAULT 1 CHECK (base_units_per_purchase_unit > 0),
  purchase_unit_cost_cents INTEGER NOT NULL DEFAULT 0 CHECK (purchase_unit_cost_cents >= 0),
  base_on_hand_quantity REAL NOT NULL DEFAULT 0 CHECK (base_on_hand_quantity >= 0),
  base_reserved_quantity REAL NOT NULL DEFAULT 0 CHECK (base_reserved_quantity >= 0),
  base_incoming_quantity REAL NOT NULL DEFAULT 0 CHECK (base_incoming_quantity >= 0),
  base_reorder_level REAL NOT NULL DEFAULT 0 CHECK (base_reorder_level >= 0),
  base_preferred_reorder_quantity REAL NOT NULL DEFAULT 0 CHECK (base_preferred_reorder_quantity >= 0),
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_site_inventory_base_balances_stock
  ON site_inventory_base_balances(base_on_hand_quantity, base_reserved_quantity, base_reorder_level);

CREATE INDEX IF NOT EXISTS idx_site_inventory_base_balances_updated
  ON site_inventory_base_balances(updated_at, site_item_inventory_id);

-- One-time convergence for existing inventory. Current stock/package quantities are converted
-- into their usable units using the already-reviewed usage_units_per_stock_unit relationship.
INSERT OR IGNORE INTO site_inventory_base_balances (
  site_item_inventory_id,
  purchase_unit_label,
  base_unit_label,
  base_units_per_purchase_unit,
  purchase_unit_cost_cents,
  base_on_hand_quantity,
  base_reserved_quantity,
  base_incoming_quantity,
  base_reorder_level,
  base_preferred_reorder_quantity,
  updated_by_user_id,
  created_at,
  updated_at
)
SELECT
  sii.site_item_inventory_id,
  COALESCE(NULLIF(TRIM(sii.stock_unit_label), ''), 'unit'),
  COALESCE(NULLIF(TRIM(sii.usage_unit_label), ''), 'unit'),
  CASE WHEN COALESCE(sii.usage_units_per_stock_unit, 0) > 0 THEN sii.usage_units_per_stock_unit ELSE 1 END,
  MAX(0, COALESCE(sii.unit_cost_cents, 0)),
  MAX(0, COALESCE(sii.on_hand_quantity, 0)) * CASE WHEN COALESCE(sii.usage_units_per_stock_unit, 0) > 0 THEN sii.usage_units_per_stock_unit ELSE 1 END,
  MAX(0, COALESCE(sii.reserved_quantity, 0)) * CASE WHEN COALESCE(sii.usage_units_per_stock_unit, 0) > 0 THEN sii.usage_units_per_stock_unit ELSE 1 END,
  MAX(0, COALESCE(sii.incoming_quantity, 0)) * CASE WHEN COALESCE(sii.usage_units_per_stock_unit, 0) > 0 THEN sii.usage_units_per_stock_unit ELSE 1 END,
  MAX(0, COALESCE(sii.reorder_level, 0)) * CASE WHEN COALESCE(sii.usage_units_per_stock_unit, 0) > 0 THEN sii.usage_units_per_stock_unit ELSE 1 END,
  MAX(0, COALESCE(sii.preferred_reorder_quantity, 0)) * CASE WHEN COALESCE(sii.usage_units_per_stock_unit, 0) > 0 THEN sii.usage_units_per_stock_unit ELSE 1 END,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM site_item_inventory sii;
