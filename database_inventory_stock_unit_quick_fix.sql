-- Devil n Dove / Inventory stock and package-unit quick fix
-- Current pass: 2026-05-14
-- Safe to run after the Tools/Supplies catalog sync if any imported item still shows zero stock.

UPDATE site_item_inventory
SET on_hand_quantity = 1,
    updated_at = CURRENT_TIMESTAMP
WHERE source_type IN ('tool', 'supply')
  AND COALESCE(on_hand_quantity, 0) < 1;

UPDATE site_item_inventory
SET stock_unit_label = CASE
      WHEN COALESCE(stock_unit_label, '') = '' THEN CASE WHEN source_type = 'tool' THEN 'tool' ELSE 'package' END
      ELSE stock_unit_label
    END,
    usage_unit_label = CASE
      WHEN COALESCE(usage_unit_label, '') = '' THEN CASE WHEN source_type = 'tool' THEN 'use' ELSE 'unit' END
      ELSE usage_unit_label
    END,
    usage_units_per_stock_unit = CASE
      WHEN COALESCE(usage_units_per_stock_unit, 0) < 1 THEN 1
      ELSE usage_units_per_stock_unit
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE source_type IN ('tool', 'supply');

-- DTF transfer film common correction: one package contains many single-use sheets.
UPDATE site_item_inventory
SET stock_unit_label = 'package',
    usage_unit_label = 'sheet',
    usage_units_per_stock_unit = CASE
      WHEN LOWER(item_name) LIKE '%100%' THEN 100
      WHEN LOWER(reorder_notes) LIKE '%100%' THEN 100
      ELSE MAX(COALESCE(usage_units_per_stock_unit, 1), 1)
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE source_type = 'supply'
  AND (LOWER(item_name) LIKE '%dtf%' OR LOWER(reorder_notes) LIKE '%dtf%')
  AND (LOWER(item_name) LIKE '%sheet%' OR LOWER(reorder_notes) LIKE '%sheet%' OR LOWER(item_name) LIKE '%film%' OR LOWER(reorder_notes) LIKE '%film%');
