-- Release 467 Build 445: additive, source-linked project BOM and actual-use evidence.
-- Inventory, supplier lots, project reservations, Creative Process and reversals
-- remain the ONLY authorities for actual quantity and stock movements.
CREATE TABLE IF NOT EXISTS maker_project_bom_lines (
 maker_project_bom_line_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_work_project_id INTEGER NOT NULL REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
 creative_project_operation_id INTEGER REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE RESTRICT,
 site_item_inventory_id INTEGER NOT NULL REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
 inventory_purchase_lot_id INTEGER REFERENCES inventory_purchase_lots(inventory_purchase_lot_id) ON DELETE RESTRICT,
 planned_usage_quantity REAL NOT NULL CHECK(planned_usage_quantity>0 AND planned_usage_quantity<=100000000),
 usage_unit_label_snapshot TEXT NOT NULL,
 usage_units_per_stock_unit_snapshot REAL NOT NULL CHECK(usage_units_per_stock_unit_snapshot>0),
 stock_unit_label_snapshot TEXT NOT NULL,
 supplier_name_snapshot TEXT,
 workstation_note TEXT,
 line_note TEXT NOT NULL,
 line_status TEXT NOT NULL DEFAULT 'planned' CHECK(line_status IN ('planned','retired')),
 created_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_maker_project_bom_lines_project ON maker_project_bom_lines(creative_work_project_id,maker_project_bom_line_id DESC);
CREATE INDEX IF NOT EXISTS idx_maker_project_bom_lines_item ON maker_project_bom_lines(site_item_inventory_id,creative_work_project_id);
CREATE TRIGGER IF NOT EXISTS trg_maker_bom_line_guard BEFORE INSERT ON maker_project_bom_lines BEGIN
 SELECT RAISE(ABORT,'bom_operation_mismatch') WHERE NEW.creative_project_operation_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM creative_project_operations o WHERE o.creative_project_operation_id=NEW.creative_project_operation_id
  AND o.creative_work_project_id=NEW.creative_work_project_id AND o.plan_status<>'retired');
 SELECT RAISE(ABORT,'bom_lot_mismatch') WHERE NEW.inventory_purchase_lot_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM inventory_purchase_lots l WHERE l.inventory_purchase_lot_id=NEW.inventory_purchase_lot_id
  AND l.site_item_inventory_id=NEW.site_item_inventory_id);
 SELECT RAISE(ABORT,'bom_not_supply') WHERE NOT EXISTS (
  SELECT 1 FROM site_item_inventory i WHERE i.site_item_inventory_id=NEW.site_item_inventory_id
  AND COALESCE(i.is_active,1)=1 AND LOWER(TRIM(COALESCE(i.source_type,'')))='supply');
END;
-- A canonical Creative Process post can only be classified once; it is never replayed.
CREATE TABLE IF NOT EXISTS maker_project_bom_actual_links (
 maker_project_bom_actual_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
 maker_project_bom_line_id INTEGER NOT NULL REFERENCES maker_project_bom_lines(maker_project_bom_line_id) ON DELETE RESTRICT,
 creative_project_inventory_post_id INTEGER NOT NULL UNIQUE REFERENCES creative_project_inventory_posts(creative_project_inventory_post_id) ON DELETE RESTRICT,
 scrap_usage_quantity REAL NOT NULL DEFAULT 0 CHECK(scrap_usage_quantity>=0),
 classification_note TEXT NOT NULL,
 linked_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 linked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_maker_project_bom_actual_links_line ON maker_project_bom_actual_links(maker_project_bom_line_id,maker_project_bom_actual_link_id);
CREATE TRIGGER IF NOT EXISTS trg_maker_bom_actual_guard BEFORE INSERT ON maker_project_bom_actual_links BEGIN
 SELECT RAISE(ABORT,'bom_actual_post_mismatch') WHERE NOT EXISTS (
  SELECT 1 FROM maker_project_bom_lines l JOIN creative_project_inventory_posts p
   ON p.creative_project_inventory_post_id=NEW.creative_project_inventory_post_id
  LEFT JOIN creative_project_inventory_usage_details u ON u.creative_project_inventory_post_id=p.creative_project_inventory_post_id
  LEFT JOIN creative_project_inventory_reversals r ON r.creative_project_inventory_post_id=p.creative_project_inventory_post_id
  WHERE l.maker_project_bom_line_id=NEW.maker_project_bom_line_id AND l.line_status='planned'
   AND l.creative_work_project_id=p.creative_work_project_id AND l.site_item_inventory_id=p.site_item_inventory_id
   AND COALESCE(p.posting_status,'posted')<>'reversed' AND r.creative_project_inventory_reversal_id IS NULL
   AND NEW.scrap_usage_quantity<=COALESCE(u.usage_quantity_consumed,p.stock_quantity_consumed*l.usage_units_per_stock_unit_snapshot)+0.000001);
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_bom_line_no_rewrite BEFORE UPDATE ON maker_project_bom_lines
 WHEN NEW.creative_work_project_id<>OLD.creative_work_project_id OR NEW.site_item_inventory_id<>OLD.site_item_inventory_id
  OR NEW.planned_usage_quantity<>OLD.planned_usage_quantity OR NEW.request_key<>OLD.request_key
  OR COALESCE(NEW.creative_project_operation_id,0)<>COALESCE(OLD.creative_project_operation_id,0)
  OR COALESCE(NEW.inventory_purchase_lot_id,0)<>COALESCE(OLD.inventory_purchase_lot_id,0)
  OR NEW.usage_unit_label_snapshot<>OLD.usage_unit_label_snapshot
  OR NEW.usage_units_per_stock_unit_snapshot<>OLD.usage_units_per_stock_unit_snapshot
  OR NEW.stock_unit_label_snapshot<>OLD.stock_unit_label_snapshot
  OR COALESCE(NEW.supplier_name_snapshot,'')<>COALESCE(OLD.supplier_name_snapshot,'')
  OR COALESCE(NEW.workstation_note,'')<>COALESCE(OLD.workstation_note,'')
  OR NEW.line_note<>OLD.line_note OR NEW.created_by_user_id<>OLD.created_by_user_id
  OR NEW.created_at<>OLD.created_at
  OR NEW.line_status<>'retired' OR OLD.line_status<>'planned'
 BEGIN SELECT RAISE(ABORT,'bom_line_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_bom_line_no_delete BEFORE DELETE ON maker_project_bom_lines
 BEGIN SELECT RAISE(ABORT,'bom_line_append_only'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_bom_actual_immutable BEFORE UPDATE ON maker_project_bom_actual_links
 BEGIN SELECT RAISE(ABORT,'bom_actual_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_bom_actual_no_delete BEFORE DELETE ON maker_project_bom_actual_links
 BEGIN SELECT RAISE(ABORT,'bom_actual_append_only'); END;
SELECT COUNT(*) AS build445_bom_tables FROM sqlite_master WHERE type='table' AND name LIKE 'maker_project_bom_%';
PRAGMA foreign_key_check;
