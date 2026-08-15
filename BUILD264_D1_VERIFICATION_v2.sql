-- Devil n Dove Build 264 — D1 verification v2.
-- Read-only. This version avoids database-wide pragma_foreign_key_check so an
-- unrelated historical malformed FK cannot hide Build 264 verification results.

SELECT migration_key,file_name,status,destructive,applied_at
FROM schema_migration_ledger
WHERE migration_key='build264_content_project_merchandising';

SELECT 'public_display_priorities_table' AS check_name,
       COUNT(*) AS object_count
FROM sqlite_master
WHERE type='table' AND name='public_display_priorities';

SELECT 'creative_project_cost_context_table' AS check_name,
       COUNT(*) AS object_count
FROM sqlite_master
WHERE type='table' AND name='creative_project_cost_context';

SELECT 'active_media_content_slots' AS check_name, COUNT(*) AS row_count
FROM media_content_slots WHERE is_active=1;

SELECT 'shop_static_slots' AS check_name, COUNT(*) AS row_count
FROM media_content_slots WHERE is_active=1 AND page_path='/shop/';

SELECT 'home_what_we_make_slots' AS check_name, COUNT(*) AS row_count
FROM media_content_slots
WHERE is_active=1 AND page_path='/' AND slot_key LIKE 'home.what.%';

SELECT 'home_visual_polish_slots' AS check_name, COUNT(*) AS row_count
FROM media_content_slots
WHERE is_active=1 AND page_path='/' AND slot_key LIKE 'home.visual-polish.%';

SELECT 'productless_or_product_backed_caip_workspaces' AS check_name, COUNT(*) AS row_count
FROM creative_projects
WHERE source_type='creative_work_project';

SELECT 'creative_process_caip_mirrors' AS check_name, COUNT(*) AS row_count
FROM creative_project_caip_mirrors m
JOIN creative_projects c ON c.creative_project_id=m.creative_project_id
WHERE c.source_type='creative_work_project';

SELECT 'creative_projects_missing_caip_workspace' AS check_name, COUNT(*) AS missing_count
FROM creative_work_projects w
LEFT JOIN creative_projects c
  ON c.source_type='creative_work_project'
 AND c.source_id=CAST(w.creative_work_project_id AS TEXT)
WHERE c.creative_project_id IS NULL;

SELECT 'research_content_projects_missing_material_usage' AS check_name, COUNT(*) AS missing_count
FROM creative_work_projects w
LEFT JOIN creative_work_outputs o
  ON o.creative_work_project_id=w.creative_work_project_id
 AND o.output_key='material_usage'
WHERE LOWER(COALESCE(w.project_type,'')) IN ('content_only','education','research','archive')
  AND o.creative_work_output_id IS NULL;

SELECT 'research_content_projects_missing_cost_analysis' AS check_name, COUNT(*) AS missing_count
FROM creative_work_projects w
LEFT JOIN creative_work_outputs o
  ON o.creative_work_project_id=w.creative_work_project_id
 AND o.output_key='cost_analysis'
WHERE LOWER(COALESCE(w.project_type,'')) IN ('content_only','education','research','archive')
  AND o.creative_work_output_id IS NULL;

-- Verify the parent-key repair required by customer_documents.refund_id.
SELECT 'payment_refunds_unique_parent_key' AS check_name, COUNT(*) AS index_count
FROM sqlite_master
WHERE type='index' AND name='uq_payment_refunds_refund_id';

SELECT 'duplicate_payment_refund_ids' AS check_name, COUNT(*) AS duplicate_groups
FROM (
  SELECT refund_id
  FROM payment_refunds
  WHERE refund_id IS NOT NULL
  GROUP BY refund_id
  HAVING COUNT(*) > 1
);

SELECT 'orphaned_customer_document_refunds' AS check_name, COUNT(*) AS orphan_count
FROM customer_documents cd
LEFT JOIN payment_refunds pr ON pr.refund_id=cd.refund_id
WHERE cd.refund_id IS NOT NULL
  AND pr.refund_id IS NULL;
