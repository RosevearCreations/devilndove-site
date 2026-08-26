-- Build 440 Tool lifecycle — strict read-only verification.
SELECT CASE WHEN
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('site_tool_lifecycle_profiles','site_tool_lifecycle_events'))=2
  AND (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name IN ('idx_site_tool_lifecycle_condition_due','idx_site_tool_lifecycle_events_item','idx_site_tool_lifecycle_events_type'))=3
  AND (SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key='build_440_tool_lifecycle_history' AND file_name='database_build440_tool_lifecycle_history.sql')=1
  AND (SELECT COUNT(*) FROM pragma_table_info('site_tool_lifecycle_profiles') WHERE name IN ('site_item_inventory_id','condition_status','service_interval_days','last_service_at','next_service_due_at','last_inspected_at','version','updated_by_user_id'))=8
  AND (SELECT COUNT(*) FROM pragma_table_info('site_tool_lifecycle_events') WHERE name IN ('site_item_inventory_id','event_type','event_at','condition_before','condition_after','service_interval_days','do_not_reuse_before','do_not_reuse_after','actor_user_id'))=9
  AND (SELECT COUNT(*) FROM site_tool_lifecycle_profiles p JOIN site_item_inventory sii ON sii.site_item_inventory_id=p.site_item_inventory_id WHERE LOWER(TRIM(COALESCE(sii.source_type,'')))<>'tool')=0
THEN 1 ELSE abs(-9223372036854775808) END AS verification_pass;
