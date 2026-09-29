-- Release 467 Build 290 — bounded read-only workstation-membership measurement.
-- Mirrors the Inventory page shape: one bounded page of Inventory identities plus one
-- set-based membership read. No N+1 correlated membership query is used here.

WITH page_items AS (
  SELECT site_item_inventory_id
  FROM site_item_inventory
  WHERE COALESCE(is_active,1)=1
  ORDER BY site_item_inventory_id
  LIMIT 40
),
page_memberships AS (
  SELECT iwm.site_item_inventory_id,iwm.workstation_site_item_inventory_id
  FROM inventory_workstation_memberships iwm
  JOIN page_items p ON p.site_item_inventory_id=iwm.site_item_inventory_id
),
membership_counts AS (
  SELECT site_item_inventory_id,COUNT(*) AS membership_count
  FROM page_memberships
  GROUP BY site_item_inventory_id
)
SELECT
  (SELECT COUNT(*) FROM page_items) AS page_items,
  (SELECT COUNT(*) FROM page_memberships) AS membership_rows,
  (SELECT COUNT(*) FROM membership_counts) AS items_with_memberships,
  COALESCE((SELECT MAX(membership_count) FROM membership_counts),0) AS max_memberships_per_item,
  (SELECT COUNT(*)
     FROM page_memberships pm
     LEFT JOIN site_item_inventory ws ON ws.site_item_inventory_id=pm.workstation_site_item_inventory_id
     LEFT JOIN inventory_workstation_roles wr ON wr.site_item_inventory_id=pm.workstation_site_item_inventory_id
     LEFT JOIN inventory_process_assignments item_pa ON item_pa.site_item_inventory_id=pm.site_item_inventory_id
     LEFT JOIN inventory_process_assignments station_pa ON station_pa.site_item_inventory_id=pm.workstation_site_item_inventory_id
    WHERE ws.site_item_inventory_id IS NULL
       OR COALESCE(ws.is_active,1)<>1
       OR LOWER(TRIM(COALESCE(ws.source_type,'')))<>'tool'
       OR COALESCE(wr.workstation_role,'')<>'station'
       OR COALESCE(item_pa.inventory_process_id,0)<>COALESCE(station_pa.inventory_process_id,0)
  ) AS invalid_membership_rows,
  (SELECT COUNT(*) FROM pragma_foreign_key_check) AS foreign_key_violations;
