-- Release 448 read-only verification: durable Tool lifecycle authority.
SELECT COUNT(*) AS required_table_count FROM sqlite_master WHERE type='table' AND name IN ('inventory_tool_lifecycle_profiles','inventory_tool_lifecycle_events');
SELECT COUNT(*) AS non_tool_profiles FROM inventory_tool_lifecycle_profiles p JOIN site_item_inventory sii ON sii.site_item_inventory_id=p.site_item_inventory_id WHERE lower(trim(COALESCE(sii.source_type,'')))<>'tool';
SELECT COUNT(*) AS invalid_profile_states FROM inventory_tool_lifecycle_profiles WHERE lifecycle_status NOT IN ('active','maintenance','out_of_service','retired','replaced') OR condition_status NOT IN ('unverified','excellent','good','fair','service_due','damaged','unsafe','retired') OR replacement_priority NOT IN ('normal','watch','plan','urgent');
SELECT COUNT(*) AS invalid_event_states FROM inventory_tool_lifecycle_events WHERE event_type NOT IN ('inspection','maintenance','repair','calibration','damage','out_of_service','returned_to_service','retirement','replacement');
SELECT COUNT(*) AS self_replacements FROM inventory_tool_lifecycle_profiles WHERE replacement_site_item_inventory_id=site_item_inventory_id;
PRAGMA foreign_key_check;
