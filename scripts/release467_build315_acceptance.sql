-- Release 467 Build 315 — Development-only Search Console operator intake acceptance.
-- Read-only. Never synthesize/import/delete Search Console evidence in CI.

-- 1: canonical intake schema readiness.
SELECT
 SUM(CASE WHEN name='search_console_import_batches' THEN 1 ELSE 0 END) search_console_import_batches_ready,
 SUM(CASE WHEN name='search_console_page_queries' THEN 1 ELSE 0 END) search_console_page_queries_ready,
 SUM(CASE WHEN name='seo_opportunity_actions' THEN 1 ELSE 0 END) seo_opportunity_actions_ready,
 SUM(CASE WHEN name='seo_page_overrides' THEN 1 ELSE 0 END) seo_page_overrides_ready,
 SUM(CASE WHEN name='admin_action_audit' THEN 1 ELSE 0 END) admin_action_audit_ready
FROM sqlite_master
WHERE type='table' AND name IN ('search_console_import_batches','search_console_page_queries','seo_opportunity_actions','seo_page_overrides','admin_action_audit');

-- 2: current batch/live-row reconciliation.
SELECT
 (SELECT COUNT(*) FROM search_console_import_batches) import_batches,
 COALESCE((SELECT SUM(row_count) FROM search_console_import_batches),0) declared_rows,
 (SELECT COUNT(*) FROM search_console_page_queries) live_rows,
 (SELECT COUNT(*) FROM search_console_import_batches b
   WHERE COALESCE(b.row_count,0)<>(SELECT COUNT(*) FROM search_console_page_queries q WHERE q.import_batch_key=b.import_batch_key)) mismatched_batches,
 (SELECT COUNT(*) FROM search_console_page_queries q
   WHERE NOT EXISTS (SELECT 1 FROM search_console_import_batches b WHERE b.import_batch_key=q.import_batch_key)) orphan_rows,
 (SELECT COUNT(*) FROM search_console_import_batches
   WHERE trim(COALESCE(source_file,''))<>'' AND COALESCE(imported_by_user_id,0)>0) operator_bound_batches;

-- 3: explicit operator audit traceability.
SELECT
 SUM(CASE WHEN action_type='search_console_import' THEN 1 ELSE 0 END) import_audits,
 SUM(CASE WHEN action_type='search_console_delete_batch' THEN 1 ELSE 0 END) revert_audits,
 COALESCE(MAX(CASE WHEN action_type='search_console_import' THEN created_at END),'') latest_import_audit_at,
 COALESCE(MAX(CASE WHEN action_type='search_console_delete_batch' THEN created_at END),'') latest_revert_audit_at
FROM admin_action_audit
WHERE action_type IN ('search_console_import','search_console_delete_batch');

-- 4: factual attribution of all currently staged Search Console rows.
SELECT
 COUNT(*) total_rows,
 SUM(CASE WHEN instr(lower(page_url),'/workshop-journal/story/')>0 THEN 1 ELSE 0 END) reviewed_story_rows,
 COALESCE(SUM(CASE WHEN instr(lower(page_url),'/workshop-journal/story/')>0 THEN clicks ELSE 0 END),0) reviewed_story_clicks,
 COALESCE(SUM(CASE WHEN instr(lower(page_url),'/workshop-journal/story/')>0 THEN impressions ELSE 0 END),0) reviewed_story_impressions,
 SUM(CASE WHEN instr(lower(page_url),'/shop/product/')>0 THEN 1 ELSE 0 END) reviewed_product_rows,
 COALESCE(SUM(CASE WHEN instr(lower(page_url),'/shop/product/')>0 THEN clicks ELSE 0 END),0) reviewed_product_clicks,
 COALESCE(SUM(CASE WHEN instr(lower(page_url),'/shop/product/')>0 THEN impressions ELSE 0 END),0) reviewed_product_impressions,
 SUM(CASE WHEN instr(lower(page_url),'/workshop-journal/story/')=0 AND instr(lower(page_url),'/shop/product/')=0 THEN 1 ELSE 0 END) other_public_rows
FROM search_console_page_queries;

-- 5: canonical reviewed public populations available for attribution.
SELECT
 (SELECT COUNT(*) FROM content_publications WHERE destination='workshop_journal' AND content_status='published') published_reviewed_stories,
 (SELECT COUNT(*) FROM products WHERE lower(COALESCE(status,'active'))='active' AND lower(COALESCE(review_status,'published')) IN ('approved','published','')) active_reviewed_products;

-- 6: relational integrity.
SELECT (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
