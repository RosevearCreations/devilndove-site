-- Release 461: compatibility synchronization for legacy inventory writers.
-- Canonical read authority is site_inventory_base_balances. Until every mature writer is
-- converted to base-unit mutations, package-field writes are deterministically mirrored here.
-- Forward-only; no runtime DDL and no historical migration replay.

PRAGMA foreign_keys = ON;

CREATE TRIGGER IF NOT EXISTS trg_site_item_inventory_base_insert
AFTER INSERT ON site_item_inventory
BEGIN
  INSERT INTO site_inventory_base_balances (
    site_item_inventory_id,purchase_unit_label,base_unit_label,base_units_per_purchase_unit,
    purchase_unit_cost_cents,base_on_hand_quantity,base_reserved_quantity,base_incoming_quantity,
    base_reorder_level,base_preferred_reorder_quantity,updated_by_user_id,created_at,updated_at
  ) VALUES (
    NEW.site_item_inventory_id,
    COALESCE(NULLIF(TRIM(NEW.stock_unit_label),''),'unit'),
    COALESCE(NULLIF(TRIM(NEW.usage_unit_label),''),'unit'),
    CASE WHEN COALESCE(NEW.usage_units_per_stock_unit,0)>0 THEN NEW.usage_units_per_stock_unit ELSE 1 END,
    MAX(0,COALESCE(NEW.unit_cost_cents,0)),
    MAX(0,COALESCE(NEW.on_hand_quantity,0))*CASE WHEN COALESCE(NEW.usage_units_per_stock_unit,0)>0 THEN NEW.usage_units_per_stock_unit ELSE 1 END,
    MAX(0,COALESCE(NEW.reserved_quantity,0))*CASE WHEN COALESCE(NEW.usage_units_per_stock_unit,0)>0 THEN NEW.usage_units_per_stock_unit ELSE 1 END,
    MAX(0,COALESCE(NEW.incoming_quantity,0))*CASE WHEN COALESCE(NEW.usage_units_per_stock_unit,0)>0 THEN NEW.usage_units_per_stock_unit ELSE 1 END,
    MAX(0,COALESCE(NEW.reorder_level,0))*CASE WHEN COALESCE(NEW.usage_units_per_stock_unit,0)>0 THEN NEW.usage_units_per_stock_unit ELSE 1 END,
    MAX(0,COALESCE(NEW.preferred_reorder_quantity,0))*CASE WHEN COALESCE(NEW.usage_units_per_stock_unit,0)>0 THEN NEW.usage_units_per_stock_unit ELSE 1 END,
    NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
  )
  ON CONFLICT(site_item_inventory_id) DO UPDATE SET
    purchase_unit_label=excluded.purchase_unit_label,
    base_unit_label=excluded.base_unit_label,
    base_units_per_purchase_unit=excluded.base_units_per_purchase_unit,
    purchase_unit_cost_cents=excluded.purchase_unit_cost_cents,
    base_on_hand_quantity=excluded.base_on_hand_quantity,
    base_reserved_quantity=excluded.base_reserved_quantity,
    base_incoming_quantity=excluded.base_incoming_quantity,
    base_reorder_level=excluded.base_reorder_level,
    base_preferred_reorder_quantity=excluded.base_preferred_reorder_quantity,
    updated_at=CURRENT_TIMESTAMP;
END;

CREATE TRIGGER IF NOT EXISTS trg_site_item_inventory_base_update
AFTER UPDATE OF stock_unit_label,usage_unit_label,usage_units_per_stock_unit,unit_cost_cents,on_hand_quantity,reserved_quantity,incoming_quantity,reorder_level,preferred_reorder_quantity
ON site_item_inventory
BEGIN
  INSERT INTO site_inventory_base_balances (
    site_item_inventory_id,purchase_unit_label,base_unit_label,base_units_per_purchase_unit,
    purchase_unit_cost_cents,base_on_hand_quantity,base_reserved_quantity,base_incoming_quantity,
    base_reorder_level,base_preferred_reorder_quantity,updated_by_user_id,created_at,updated_at
  ) VALUES (
    NEW.site_item_inventory_id,
    COALESCE(NULLIF(TRIM(NEW.stock_unit_label),''),'unit'),
    COALESCE(NULLIF(TRIM(NEW.usage_unit_label),''),'unit'),
    CASE WHEN COALESCE(NEW.usage_units_per_stock_unit,0)>0 THEN NEW.usage_units_per_stock_unit ELSE 1 END,
    MAX(0,COALESCE(NEW.unit_cost_cents,0)),
    MAX(0,COALESCE(NEW.on_hand_quantity,0))*CASE WHEN COALESCE(NEW.usage_units_per_stock_unit,0)>0 THEN NEW.usage_units_per_stock_unit ELSE 1 END,
    MAX(0,COALESCE(NEW.reserved_quantity,0))*CASE WHEN COALESCE(NEW.usage_units_per_stock_unit,0)>0 THEN NEW.usage_units_per_stock_unit ELSE 1 END,
    MAX(0,COALESCE(NEW.incoming_quantity,0))*CASE WHEN COALESCE(NEW.usage_units_per_stock_unit,0)>0 THEN NEW.usage_units_per_stock_unit ELSE 1 END,
    MAX(0,COALESCE(NEW.reorder_level,0))*CASE WHEN COALESCE(NEW.usage_units_per_stock_unit,0)>0 THEN NEW.usage_units_per_stock_unit ELSE 1 END,
    MAX(0,COALESCE(NEW.preferred_reorder_quantity,0))*CASE WHEN COALESCE(NEW.usage_units_per_stock_unit,0)>0 THEN NEW.usage_units_per_stock_unit ELSE 1 END,
    NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
  )
  ON CONFLICT(site_item_inventory_id) DO UPDATE SET
    purchase_unit_label=excluded.purchase_unit_label,
    base_unit_label=excluded.base_unit_label,
    base_units_per_purchase_unit=excluded.base_units_per_purchase_unit,
    purchase_unit_cost_cents=excluded.purchase_unit_cost_cents,
    base_on_hand_quantity=excluded.base_on_hand_quantity,
    base_reserved_quantity=excluded.base_reserved_quantity,
    base_incoming_quantity=excluded.base_incoming_quantity,
    base_reorder_level=excluded.base_reorder_level,
    base_preferred_reorder_quantity=excluded.base_preferred_reorder_quantity,
    updated_at=CURRENT_TIMESTAMP;
END;
