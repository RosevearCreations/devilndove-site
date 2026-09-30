-- Release 467 Build 321 — Search Console Real Export Intake Continuity II.
-- Development-only, read-only. Never imports, deletes, or synthesizes Search Console evidence in CI.

-- 1: canonical intake schema readiness.
SELECT
 SUM(CASE WHEN name='search_console_import_batches' THEN 1 ELSE 0 END) search_console_import_batches_ready,
 SUM(CASE WHEN name='search_console_page_queries' THEN 1 ELSE 0 END) search_console_page_queries_ready,
 SUM(CASE WHEN name='seo_opportunity_actions' THEN 1 ELSE 0 END) seo_opportunity_actions_ready,
 SUM(CASE WHEN name='seo_page_overrides' THEN 1 ELSE 0 END) seo_page_overrides_ready,
 SUM(CASE WHEN name='admin_action_audit' THEN 1 ELSE 0 END) admin_action_audit_ready
FROM sqlite_master
WHERE type='table' AND name IN ('search_console_import_batches','search_console_page_queries','seo_opportunity_actions','seo_page_overrides','admin_action_audit');

-- 2: current batch/live-row reconciliation and operator ownership.
SELECT
 (SELECT COUNT(*) FROM search_console_import_batches) import_batches,
 COALESCE((SELECT SUM(row_count) FROM search_console_import_batches),0) declared_rows,
 (SELECT COUNT(*) FROM search_console_page_queries) live_rows,
 (SELECT COUNT(*) FROM search_console_import_batches b
   WHERE COALESCE(b.row_count,0)<>(SELECT COUNT(*) FROM search_console_page_queries q WHERE q.import_batch_key=b.import_batch_key)) mismatched_batches,
 (SELECT COUNT(*) FROM search_console_page_queries q
   WHERE NOT EXISTS (SELECT 1 FROM search_console_import_batches b WHERE b.import_batch_key=q.import_batch_key)) orphan_rows,
 (SELECT COUNT(*) FROM search_console_import_batches
   WHERE trim(COALESCE(source_file,''))<>'' AND COALESCE(imported_by_user_id,0)>0) operator_bound_batches,
 (SELECT COUNT(*) FROM search_console_import_batches
   WHERE lower(trim(COALESCE(source_file,''))) LIKE '%.csv') csv_named_batches;

-- 3: explicit import/revert audit traceability.
SELECT
 SUM(CASE WHEN action_type='search_console_import' THEN 1 ELSE 0 END) import_audits,
 SUM(CASE WHEN action_type='search_console_delete_batch' THEN 1 ELSE 0 END) revert_audits,
 COALESCE(MAX(CASE WHEN action_type='search_console_import' THEN created_at END),'') latest_import_audit_at,
 COALESCE(MAX(CASE WHEN action_type='search_console_delete_batch' THEN created_at END),'') latest_revert_audit_at
FROM admin_action_audit
WHERE action_type IN ('search_console_import','search_console_delete_batch');

-- 4: factual staged-row population. No data is created here.
SELECT
 COUNT(*) total_rows,
 COALESCE(SUM(clicks),0) clicks,
 COALESCE(SUM(impressions),0) impressions,
 SUM(CASE WHEN trim(COALESCE(page_url,''))<>'' THEN 1 ELSE 0 END) rows_with_page,
 SUM(CASE WHEN trim(COALESCE(query_text,''))<>'' THEN 1 ELSE 0 END) rows_with_query,
 SUM(CASE WHEN COALESCE(clicks,0)<0 OR COALESCE(impressions,0)<0 OR COALESCE(average_position,0)<0 THEN 1 ELSE 0 END) invalid_metric_rows
FROM search_console_page_queries;

-- 5: current report-date coverage.
SELECT
 COALESCE(MIN(report_date),'') earliest_report_date,
 COALESCE(MAX(report_date),'') latest_report_date,
 COUNT(DISTINCT report_date) report_dates
FROM search_console_page_queries;

-- 6: relational integrity.
SELECT (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
