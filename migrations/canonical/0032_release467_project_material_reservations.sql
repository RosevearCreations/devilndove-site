-- Release 467 Build 380: Development-first canonical D1 application proof is required before subsequent production calendar builds.
-- Build 380: real per-project reservations against canonical site_item_inventory.reserved_quantity.
-- Allocation rows reference existing inventory identity, never create duplicate item records.
CREATE TABLE IF NOT EXISTS creative_project_material_reservations (
 creative_project_material_reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_work_project_id INTEGER NOT NULL REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
 creative_project_operation_id INTEGER REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE RESTRICT,
 site_item_inventory_id INTEGER NOT NULL REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
 original_stock_quantity REAL NOT NULL CHECK(original_stock_quantity>0 AND original_stock_quantity<=100000),
 released_stock_quantity REAL NOT NULL DEFAULT 0 CHECK(released_stock_quantity>=0 AND released_stock_quantity<=original_stock_quantity),
 unit_cost_cents_snapshot INTEGER,
 supplier_name_snapshot TEXT,
 stock_unit_label_snapshot TEXT NOT NULL,
 reservation_note TEXT NOT NULL,
 release_note TEXT,
 created_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 updated_by_user_id INTEGER REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_project_material_reservations_project ON creative_project_material_reservations(creative_work_project_id,creative_project_material_reservation_id DESC);
CREATE INDEX IF NOT EXISTS idx_project_material_reservations_item ON creative_project_material_reservations(site_item_inventory_id,creative_project_material_reservation_id);
CREATE TRIGGER IF NOT EXISTS trg_project_material_reservation_before_insert BEFORE INSERT ON creative_project_material_reservations BEGIN
 SELECT RAISE(ABORT,'project_material_invalid_operation') WHERE NEW.creative_project_operation_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM creative_project_operations o WHERE o.creative_project_operation_id=NEW.creative_project_operation_id
  AND o.creative_work_project_id=NEW.creative_work_project_id AND o.plan_status<>'retired');
 SELECT RAISE(ABORT,'project_material_not_reservable') WHERE NOT EXISTS (
  SELECT 1 FROM site_item_inventory i LEFT JOIN site_inventory_usage_profiles u ON u.site_item_inventory_id=i.site_item_inventory_id
  WHERE i.site_item_inventory_id=NEW.site_item_inventory_id AND COALESCE(i.is_active,1)=1
  AND LOWER(TRIM(COALESCE(i.source_type,'')))='supply'
  AND COALESCE(u.usage_tracking_mode,'exact')='exact'
  AND COALESCE(i.on_hand_quantity,0)-COALESCE(i.reserved_quantity,0)+0.000001>=NEW.original_stock_quantity);
END;
CREATE TRIGGER IF NOT EXISTS trg_project_material_reservation_after_insert AFTER INSERT ON creative_project_material_reservations BEGIN
 UPDATE site_item_inventory SET reserved_quantity=COALESCE(reserved_quantity,0)+NEW.original_stock_quantity,updated_at=CURRENT_TIMESTAMP
 WHERE site_item_inventory_id=NEW.site_item_inventory_id;
 INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at)
 SELECT site_item_inventory_id,source_type,external_key,item_name,'reserve',0,on_hand_quantity,on_hand_quantity,
 COALESCE(reserved_quantity,0)-NEW.original_stock_quantity,reserved_quantity,incoming_quantity,incoming_quantity,
 'Project allocation #'||NEW.creative_project_material_reservation_id,NEW.created_by_user_id,CURRENT_TIMESTAMP
 FROM site_item_inventory WHERE site_item_inventory_id=NEW.site_item_inventory_id;
END;
CREATE TRIGGER IF NOT EXISTS trg_project_material_reservation_guard_update BEFORE UPDATE ON creative_project_material_reservations BEGIN
 SELECT RAISE(ABORT,'project_material_reservation_immutable') WHERE
 NEW.creative_work_project_id<>OLD.creative_work_project_id OR
 NEW.site_item_inventory_id<>OLD.site_item_inventory_id OR
 COALESCE(NEW.creative_project_operation_id,0)<>COALESCE(OLD.creative_project_operation_id,0) OR
 NEW.original_stock_quantity<>OLD.original_stock_quantity OR NEW.request_key<>OLD.request_key OR
 NEW.released_stock_quantity<=OLD.released_stock_quantity OR NEW.released_stock_quantity>OLD.original_stock_quantity;
 SELECT RAISE(ABORT,'project_material_reserved_balance_changed') WHERE
 (SELECT COALESCE(reserved_quantity,0) FROM site_item_inventory WHERE site_item_inventory_id=OLD.site_item_inventory_id)+0.000001 < NEW.released_stock_quantity-OLD.released_stock_quantity;
END;
CREATE TRIGGER IF NOT EXISTS trg_project_material_reservation_after_release AFTER UPDATE OF released_stock_quantity ON creative_project_material_reservations BEGIN
 UPDATE site_item_inventory SET reserved_quantity=COALESCE(reserved_quantity,0)-(NEW.released_stock_quantity-OLD.released_stock_quantity),updated_at=CURRENT_TIMESTAMP
 WHERE site_item_inventory_id=NEW.site_item_inventory_id;
 INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at)
 SELECT site_item_inventory_id,source_type,external_key,item_name,'release',0,on_hand_quantity,on_hand_quantity,
 COALESCE(reserved_quantity,0)+(NEW.released_stock_quantity-OLD.released_stock_quantity),reserved_quantity,incoming_quantity,incoming_quantity,
 'Project allocation release #'||NEW.creative_project_material_reservation_id,NEW.updated_by_user_id,CURRENT_TIMESTAMP
 FROM site_item_inventory WHERE site_item_inventory_id=NEW.site_item_inventory_id;
END;
SELECT COUNT(*) AS build380_project_reservation_tables FROM sqlite_master WHERE name='creative_project_material_reservations' AND type='table';
PRAGMA foreign_key_check;
