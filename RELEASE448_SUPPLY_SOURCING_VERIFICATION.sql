-- Release 448 Supply sourcing/replenishment read-only verification.
SELECT COUNT(*) AS required_tables
FROM sqlite_master
WHERE type='table' AND name IN ('inventory_supply_source_options','inventory_supply_replenishment_profiles','inventory_supply_substitution_reviews');

SELECT COUNT(*) AS non_supply_sources
FROM inventory_supply_source_options s
JOIN site_item_inventory i ON i.site_item_inventory_id=s.site_item_inventory_id
WHERE lower(trim(COALESCE(i.source_type,'')))<>'supply';

SELECT COUNT(*) AS non_supply_profiles
FROM inventory_supply_replenishment_profiles p
JOIN site_item_inventory i ON i.site_item_inventory_id=p.site_item_inventory_id
WHERE lower(trim(COALESCE(i.source_type,'')))<>'supply';

SELECT COUNT(*) AS invalid_substitutions
FROM inventory_supply_substitution_reviews r
JOIN site_item_inventory a ON a.site_item_inventory_id=r.site_item_inventory_id
JOIN site_item_inventory b ON b.site_item_inventory_id=r.substitute_site_item_inventory_id
WHERE lower(trim(COALESCE(a.source_type,'')))<>'supply'
   OR lower(trim(COALESCE(b.source_type,'')))<>'supply'
   OR r.site_item_inventory_id=r.substitute_site_item_inventory_id;

SELECT COUNT(*) AS mismatched_preferred_sources
FROM inventory_supply_replenishment_profiles p
JOIN inventory_supply_source_options s ON s.inventory_supply_source_option_id=p.preferred_source_option_id
WHERE s.site_item_inventory_id<>p.site_item_inventory_id;

SELECT COUNT(*) AS active_discontinued_primary_sources
FROM inventory_supply_source_options
WHERE is_active=1 AND relationship_type='primary' AND availability_status='discontinued';

PRAGMA foreign_key_check;
