-- Build 274 read-only D1 verification
-- Run after database_build274_creative_process_lifecycle_corrections.sql.

SELECT name, type
FROM pragma_table_info('creative_work_events')
WHERE name IN ('entry_status','void_reason','voided_by','voided_at')
ORDER BY name;

SELECT name, tbl_name, sql
FROM sqlite_master
WHERE type='index'
  AND name='idx_creative_work_events_project_status';

SELECT migration_key, file_name, applied_at, notes
FROM schema_migration_ledger
WHERE migration_key='build274_creative_process_lifecycle_corrections';

SELECT
  creative_work_project_id,
  SUM(CASE WHEN COALESCE(entry_status,'active')='active' THEN 1 ELSE 0 END) AS active_entries,
  SUM(CASE WHEN entry_status='voided' THEN 1 ELSE 0 END) AS voided_entries
FROM creative_work_events
GROUP BY creative_work_project_id
ORDER BY creative_work_project_id DESC;

-- Project 7 acceptance-case inventory audit. Read only.
SELECT
  e.creative_work_event_id,
  e.event_title,
  e.material_name,
  e.material_quantity,
  e.material_unit,
  COALESCE(e.entry_status,'active') AS entry_status,
  r.review_status,
  r.actual_quantity,
  r.inventory_consumed,
  ip.creative_project_inventory_post_id,
  ip.posting_status,
  ip.stock_quantity_consumed,
  ip.site_item_inventory_id,
  e.void_reason,
  e.voided_at
FROM creative_work_events e
LEFT JOIN creative_project_material_reviews r
  ON r.creative_work_project_id=e.creative_work_project_id
 AND r.creative_work_event_id=e.creative_work_event_id
LEFT JOIN creative_project_inventory_posts ip
  ON ip.creative_project_material_review_id=r.creative_project_material_review_id
WHERE e.creative_work_project_id=7
ORDER BY e.creative_work_event_id;

PRAGMA foreign_key_check;
