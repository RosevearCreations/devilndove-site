-- Build 249 read-only D1 verification. Run after database_build249_inventory_kits_components_provenance.sql.
PRAGMA foreign_keys = ON;
SELECT 'inventory_item_profiles' AS table_name, COUNT(*) AS row_count FROM inventory_item_profiles
UNION ALL SELECT 'inventory_kit_templates',COUNT(*) FROM inventory_kit_templates
UNION ALL SELECT 'inventory_kit_template_components',COUNT(*) FROM inventory_kit_template_components
UNION ALL SELECT 'inventory_kit_open_events',COUNT(*) FROM inventory_kit_open_events
UNION ALL SELECT 'inventory_kit_open_components',COUNT(*) FROM inventory_kit_open_components
UNION ALL SELECT 'inventory_source_material_links',COUNT(*) FROM inventory_source_material_links;

SELECT inventory_class,lifecycle_mode,COUNT(*) AS item_count
FROM inventory_item_profiles GROUP BY inventory_class,lifecycle_mode ORDER BY inventory_class,lifecycle_mode;

SELECT t.inventory_kit_template_id,t.template_name,s.item_name AS kit_item,s.on_hand_quantity,
       COUNT(c.inventory_kit_template_component_id) AS component_count,
       ROUND(SUM(COALESCE(c.cost_share_percent,0)),2) AS percentage_total,
       t.allocation_method
FROM inventory_kit_templates t
JOIN site_item_inventory s ON s.site_item_inventory_id=t.kit_inventory_item_id
LEFT JOIN inventory_kit_template_components c ON c.inventory_kit_template_id=t.inventory_kit_template_id
GROUP BY t.inventory_kit_template_id,t.template_name,s.item_name,s.on_hand_quantity,t.allocation_method
ORDER BY t.inventory_kit_template_id;

SELECT * FROM pragma_foreign_key_check;
