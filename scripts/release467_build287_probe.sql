-- Release 467 Build 287 — one-shot read-only candidate/evidence probe.
-- Existing Development business rows only. No fixtures, writes, DDL, stock movement or Finance changes.
WITH material_events AS (
  SELECT
    e.creative_work_project_id,
    p.project_title,
    e.creative_work_event_id,
    TRIM(COALESCE(e.material_name,'')) AS material_name,
    COALESCE(e.material_quantity,0) AS material_quantity,
    COALESCE(e.material_unit,'') AS material_unit,
    COALESCE(LOWER(TRIM(r.review_status)),'') AS review_status,
    COALESCE(r.inventory_consumed,0) AS inventory_consumed,
    LOWER(TRIM(COALESCE(e.material_name,''))) AS material_norm
  FROM creative_work_events e
  JOIN creative_work_projects p
    ON p.creative_work_project_id=e.creative_work_project_id
  LEFT JOIN creative_project_material_reviews r
    ON r.creative_work_project_id=e.creative_work_project_id
   AND r.creative_work_event_id=e.creative_work_event_id
  WHERE COALESCE(p.project_status,'active')<>'archived'
    AND COALESCE(e.entry_status,'active')='active'
    AND TRIM(COALESCE(e.material_name,''))<>''
),
active_inventory AS (
  SELECT
    site_item_inventory_id,
    item_name,
    LOWER(TRIM(COALESCE(source_type,''))) AS source_type,
    external_key,
    COALESCE(on_hand_quantity,0) AS on_hand_quantity,
    COALESCE(stock_unit_label,'unit') AS stock_unit_label,
    LOWER(TRIM(COALESCE(item_name,''))) AS item_norm
  FROM site_item_inventory
  WHERE COALESCE(is_active,1)=1
    AND LOWER(TRIM(COALESCE(source_type,''))) IN ('supply','tool')
),
existing_links AS (
  SELECT
    l.creative_process_resource_link_id,
    e.creative_work_project_id,
    e.project_title,
    e.creative_work_event_id,
    e.material_name,
    e.material_quantity,
    e.material_unit,
    e.review_status,
    e.inventory_consumed,
    i.site_item_inventory_id,
    i.item_name AS inventory_name,
    i.source_type,
    i.on_hand_quantity,
    i.stock_unit_label,
    l.resource_role,
    COALESCE(l.link_notes,'') AS link_notes
  FROM creative_process_resource_links l
  JOIN material_events e
    ON e.creative_work_event_id=l.creative_work_event_id
   AND e.creative_work_project_id=l.creative_work_project_id
  JOIN active_inventory i
    ON i.site_item_inventory_id=l.site_item_inventory_id
),
ranked_candidates AS (
  SELECT
    e.creative_work_project_id,
    e.project_title,
    e.creative_work_event_id,
    e.material_name,
    e.material_quantity,
    e.material_unit,
    e.review_status,
    e.inventory_consumed,
    i.site_item_inventory_id,
    i.item_name AS inventory_name,
    i.source_type,
    i.on_hand_quantity,
    i.stock_unit_label,
    CASE
      WHEN i.item_norm=e.material_norm THEN 'exact_name'
      WHEN LENGTH(e.material_norm)>=4 AND i.item_norm LIKE '%'||e.material_norm||'%' THEN 'inventory_contains_material'
      WHEN LENGTH(i.item_norm)>=4 AND e.material_norm LIKE '%'||i.item_norm||'%' THEN 'material_contains_inventory'
      ELSE ''
    END AS match_kind,
    ROW_NUMBER() OVER (
      PARTITION BY e.creative_work_event_id
      ORDER BY
        CASE
          WHEN i.item_norm=e.material_norm THEN 0
          WHEN LENGTH(e.material_norm)>=4 AND i.item_norm LIKE '%'||e.material_norm||'%' THEN 1
          WHEN LENGTH(i.item_norm)>=4 AND e.material_norm LIKE '%'||i.item_norm||'%' THEN 2
          ELSE 9
        END,
        LENGTH(i.item_name),
        i.site_item_inventory_id
    ) AS candidate_rank
  FROM material_events e
  JOIN active_inventory i
    ON i.item_norm=e.material_norm
    OR (LENGTH(e.material_norm)>=4 AND i.item_norm LIKE '%'||e.material_norm||'%')
    OR (LENGTH(i.item_norm)>=4 AND e.material_norm LIKE '%'||i.item_norm||'%')
)
SELECT
  'EXISTING_LINK' AS record_type,
  creative_work_project_id,
  project_title,
  creative_work_event_id,
  material_name,
  material_quantity,
  material_unit,
  review_status,
  inventory_consumed,
  creative_process_resource_link_id AS resource_link_id,
  site_item_inventory_id,
  inventory_name,
  source_type AS inventory_source_type,
  on_hand_quantity,
  stock_unit_label,
  resource_role AS evidence_kind,
  link_notes AS evidence_note
FROM existing_links
UNION ALL
SELECT
  'CANDIDATE',
  creative_work_project_id,
  project_title,
  creative_work_event_id,
  material_name,
  material_quantity,
  material_unit,
  review_status,
  inventory_consumed,
  NULL,
  site_item_inventory_id,
  inventory_name,
  source_type,
  on_hand_quantity,
  stock_unit_label,
  match_kind,
  'Read-only candidate; not linked by this probe.'
FROM ranked_candidates
WHERE candidate_rank<=8
UNION ALL
SELECT
  'MATERIAL_EVENT',
  creative_work_project_id,
  project_title,
  creative_work_event_id,
  material_name,
  material_quantity,
  material_unit,
  review_status,
  inventory_consumed,
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  'existing_material_event',
  'Existing real Development material evidence.'
FROM material_events
ORDER BY creative_work_project_id,creative_work_event_id,record_type,site_item_inventory_id;
