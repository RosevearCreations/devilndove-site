-- Build 440 Tool lifecycle — Development read-only verification.
SELECT name,type FROM sqlite_master WHERE name IN (
 'site_tool_lifecycle_profiles','site_tool_lifecycle_events',
 'idx_site_tool_lifecycle_condition_due','idx_site_tool_lifecycle_events_item','idx_site_tool_lifecycle_events_type'
) ORDER BY type,name;

SELECT migration_key,file_name,applied_at FROM schema_migration_ledger
WHERE migration_key='build_440_tool_lifecycle_history';

SELECT
 (SELECT COUNT(*) FROM site_item_inventory WHERE LOWER(TRIM(COALESCE(source_type,'')))='tool' AND COALESCE(is_active,1)=1) AS active_tools,
 (SELECT COUNT(*) FROM site_tool_lifecycle_profiles) AS lifecycle_profiles,
 (SELECT COUNT(*) FROM site_tool_lifecycle_events) AS lifecycle_events,
 (SELECT COUNT(*) FROM site_inventory_usage_movements u JOIN site_item_inventory sii ON sii.site_item_inventory_id=u.site_item_inventory_id WHERE LOWER(TRIM(COALESCE(sii.source_type,'')))='tool') AS existing_tool_usage_events;

SELECT COUNT(*) AS non_tool_lifecycle_profiles
FROM site_tool_lifecycle_profiles p JOIN site_item_inventory sii ON sii.site_item_inventory_id=p.site_item_inventory_id
WHERE LOWER(TRIM(COALESCE(sii.source_type,'')))<>'tool';

SELECT condition_status,COUNT(*) AS profile_count FROM site_tool_lifecycle_profiles GROUP BY condition_status ORDER BY condition_status;
SELECT event_type,COUNT(*) AS event_count FROM site_tool_lifecycle_events GROUP BY event_type ORDER BY event_type;
