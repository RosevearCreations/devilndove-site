WITH
active_projects AS (
  SELECT creative_work_project_id FROM creative_work_projects
  WHERE COALESCE(project_status,'active')<>'archived'
),
material_events AS (
  SELECT e.creative_work_event_id,e.creative_work_project_id,e.material_name,
         COALESCE(e.entry_status,'active') entry_status,
         COALESCE(LOWER(TRIM(r.review_status)),'') review_status,
         COALESCE(r.inventory_consumed,0) inventory_consumed
  FROM creative_work_events e
  JOIN active_projects p ON p.creative_work_project_id=e.creative_work_project_id
  LEFT JOIN creative_project_material_reviews r
    ON r.creative_work_project_id=e.creative_work_project_id
   AND r.creative_work_event_id=e.creative_work_event_id
  WHERE COALESCE(e.entry_status,'active')='active'
    AND TRIM(COALESCE(e.material_name,''))<>''
),
active_operations AS (
  SELECT o.creative_project_operation_id,o.creative_work_project_id,o.inventory_process_id
  FROM creative_project_operations o
  JOIN active_projects p ON p.creative_work_project_id=o.creative_work_project_id
  WHERE COALESCE(o.plan_status,'planned')<>'retired'
),
operation_resources AS (
  SELECT r.creative_project_operation_resource_id,r.creative_project_operation_id,
         o.creative_work_project_id,r.site_item_inventory_id,r.resource_role,
         LOWER(TRIM(COALESCE(i.source_type,''))) source_type,
         COALESCE(i.is_active,1) inventory_active
  FROM creative_project_operation_resources r
  JOIN active_operations o ON o.creative_project_operation_id=r.creative_project_operation_id
  JOIN site_item_inventory i ON i.site_item_inventory_id=r.site_item_inventory_id
),
active_supply_tool_inventory AS (
  SELECT i.site_item_inventory_id,LOWER(TRIM(COALESCE(i.source_type,''))) source_type
  FROM site_item_inventory i
  WHERE COALESCE(i.is_active,1)=1
    AND LOWER(TRIM(COALESCE(i.source_type,''))) IN ('supply','tool')
)
SELECT
  (SELECT COUNT(*) FROM active_projects) active_projects,
  (SELECT COUNT(DISTINCT creative_work_project_id) FROM material_events) projects_with_material_events,
  (SELECT COUNT(*) FROM material_events) active_material_events,
  (SELECT COUNT(*) FROM material_events WHERE review_status<>'approved') planned_material_events,
  (SELECT COUNT(*) FROM material_events WHERE review_status='approved') approved_material_events,
  (SELECT COUNT(*) FROM material_events WHERE review_status='approved' AND inventory_consumed=0) reviewed_unposted_material_events,
  (SELECT COUNT(*) FROM active_operations) active_operations,
  (SELECT COUNT(DISTINCT creative_work_project_id) FROM active_operations) projects_with_operations,
  (SELECT COUNT(*) FROM operation_resources) operation_resources,
  (SELECT COUNT(*) FROM operation_resources WHERE inventory_active=1 AND source_type IN ('supply','tool')) operation_resources_supply_tool,
  (SELECT COUNT(*) FROM operation_resources WHERE inventory_active=1 AND source_type IN ('supply','tool') AND resource_role IN ('material','consumable','tool')) operation_resources_actionable_supply_tool,
  (SELECT COUNT(DISTINCT creative_work_project_id) FROM operation_resources WHERE inventory_active=1 AND source_type IN ('supply','tool')) projects_with_supply_tool_operation_resources,
  (SELECT COUNT(DISTINCT m.creative_work_project_id)
     FROM material_events m
     WHERE EXISTS (
       SELECT 1 FROM operation_resources r
       WHERE r.creative_work_project_id=m.creative_work_project_id
         AND r.inventory_active=1 AND r.source_type IN ('supply','tool')
     )) projects_with_material_and_supply_tool_operation_resource,
  (SELECT COUNT(*) FROM active_supply_tool_inventory) active_supply_tool_inventory,
  (SELECT COUNT(*) FROM active_supply_tool_inventory i
     WHERE EXISTS (SELECT 1 FROM site_inventory_usage_profiles u WHERE u.site_item_inventory_id=i.site_item_inventory_id)) supply_tool_with_usage_profile,
  (SELECT COUNT(*) FROM active_supply_tool_inventory i
     WHERE EXISTS (SELECT 1 FROM inventory_process_assignments a WHERE a.site_item_inventory_id=i.site_item_inventory_id)) supply_tool_with_process_assignment,
  (SELECT COUNT(*) FROM product_resource_links) product_resource_links,
  (SELECT COUNT(*) FROM product_resource_links WHERE LOWER(TRIM(COALESCE(resource_kind,''))) IN ('supply','tool')) product_resource_links_supply_tool,
  (SELECT COUNT(*) FROM product_resource_links prl
     JOIN site_item_inventory i
       ON LOWER(TRIM(COALESCE(i.source_type,'')))=LOWER(TRIM(COALESCE(prl.resource_kind,'')))
      AND LOWER(TRIM(COALESCE(i.external_key,'')))=LOWER(TRIM(COALESCE(prl.source_key,'')))
      AND COALESCE(i.is_active,1)=1
     WHERE LOWER(TRIM(COALESCE(prl.resource_kind,''))) IN ('supply','tool')) product_resource_links_with_inventory_match,
  (SELECT COUNT(*) FROM creative_project_product_links) creative_project_product_links,
  (SELECT COUNT(*) FROM pragma_table_info('creative_work_events') WHERE name='creative_project_operation_id') event_operation_link_columns,
  (SELECT COUNT(*) FROM pragma_table_info('creative_project_material_reviews') WHERE name='creative_project_operation_resource_id') review_resource_link_columns,
  (SELECT COUNT(*) FROM creative_project_inventory_posts) inventory_posts_total,
  (SELECT COUNT(*) FROM creative_project_inventory_reversals) inventory_reversals_total,
  (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
