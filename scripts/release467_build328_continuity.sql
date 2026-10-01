-- Release 467 Build 328 — Search Console Real Export Freshness & Discovery Intake III.
-- Development-only read-only evidence. No import, queue mutation, SEO apply, provider execution or Production D1 contact.

-- 1: canonical intake schema readiness.
SELECT
 SUM(CASE WHEN name='search_console_import_batches' THEN 1 ELSE 0 END) search_console_import_batches_ready,
 SUM(CASE WHEN name='search_console_page_queries' THEN 1 ELSE 0 END) search_console_page_queries_ready,
 SUM(CASE WHEN name='seo_opportunity_actions' THEN 1 ELSE 0 END) seo_opportunity_actions_ready,
 SUM(CASE WHEN name='seo_page_overrides' THEN 1 ELSE 0 END) seo_page_overrides_ready,
 SUM(CASE WHEN name='admin_action_audit' THEN 1 ELSE 0 END) admin_action_audit_ready
FROM sqlite_master WHERE type='table' AND name IN ('search_console_import_batches','search_console_page_queries','seo_opportunity_actions','seo_page_overrides','admin_action_audit');

-- 2: batch/live-row reconciliation and operator ownership.
SELECT
 (SELECT COUNT(*) FROM search_console_import_batches) import_batches,
 COALESCE((SELECT SUM(row_count) FROM search_console_import_batches),0) declared_rows,
 (SELECT COUNT(*) FROM search_console_page_queries) live_rows,
 (SELECT COUNT(*) FROM search_console_import_batches b WHERE COALESCE(b.row_count,0)<>(SELECT COUNT(*) FROM search_console_page_queries q WHERE q.import_batch_key=b.import_batch_key)) mismatched_batches,
 (SELECT COUNT(*) FROM search_console_page_queries q WHERE NOT EXISTS (SELECT 1 FROM search_console_import_batches b WHERE b.import_batch_key=q.import_batch_key)) orphan_rows,
 (SELECT COUNT(*) FROM search_console_import_batches WHERE trim(COALESCE(source_file,''))<>'' AND COALESCE(imported_by_user_id,0)>0) operator_bound_batches,
 (SELECT COUNT(*) FROM search_console_import_batches WHERE lower(trim(COALESCE(source_file,''))) LIKE '%.csv') csv_named_batches,
 COALESCE((SELECT MAX(imported_at) FROM search_console_import_batches),'') latest_import_at;

-- 3: explicit import/revert audit traceability.
SELECT
 SUM(CASE WHEN action_type='search_console_import' THEN 1 ELSE 0 END) import_audits,
 SUM(CASE WHEN action_type='search_console_delete_batch' THEN 1 ELSE 0 END) revert_audits,
 COALESCE(MAX(CASE WHEN action_type='search_console_import' THEN created_at END),'') latest_import_audit_at,
 COALESCE(MAX(CASE WHEN action_type='search_console_delete_batch' THEN created_at END),'') latest_revert_audit_at
FROM admin_action_audit WHERE action_type IN ('search_console_import','search_console_delete_batch');

-- 4: factual population and metric validity.
SELECT
 COUNT(*) total_rows,COALESCE(SUM(clicks),0) clicks,COALESCE(SUM(impressions),0) impressions,
 SUM(CASE WHEN trim(COALESCE(page_url,''))<>'' THEN 1 ELSE 0 END) rows_with_page,
 SUM(CASE WHEN trim(COALESCE(query_text,''))<>'' THEN 1 ELSE 0 END) rows_with_query,
 SUM(CASE WHEN COALESCE(clicks,0)<0 OR COALESCE(impressions,0)<0 OR COALESCE(average_position,0)<0 THEN 1 ELSE 0 END) invalid_metric_rows,
 SUM(CASE WHEN report_date IS NULL OR trim(COALESCE(report_date,''))='' OR date(report_date) IS NULL THEN 1 ELSE 0 END) invalid_report_date_rows
FROM search_console_page_queries;

-- 5: 30-day freshness.
SELECT
 COUNT(*) all_search_rows,
 SUM(CASE WHEN date(COALESCE(report_date,created_at))>=date('now','-30 days') THEN 1 ELSE 0 END) recent_search_rows,
 COALESCE(SUM(CASE WHEN date(COALESCE(report_date,created_at))>=date('now','-30 days') THEN clicks ELSE 0 END),0) recent_clicks,
 COALESCE(SUM(CASE WHEN date(COALESCE(report_date,created_at))>=date('now','-30 days') THEN impressions ELSE 0 END),0) recent_impressions,
 COUNT(DISTINCT CASE WHEN date(COALESCE(report_date,created_at))>=date('now','-30 days') THEN page_url END) recent_distinct_pages,
 COUNT(DISTINCT CASE WHEN date(COALESCE(report_date,created_at))>=date('now','-30 days') AND trim(COALESCE(query_text,''))<>'' THEN query_text END) recent_distinct_queries,
 COALESCE(MIN(report_date),'') earliest_report_date,COALESCE(MAX(report_date),'') latest_report_date,
 CASE WHEN MAX(report_date) IS NULL OR trim(MAX(report_date))='' THEN NULL ELSE ROUND(julianday('now')-julianday(MAX(report_date)),2) END latest_report_age_days,
 COUNT(DISTINCT report_date) report_dates
FROM search_console_page_queries;

-- 6: fresh real query/page pairs eligible for human SEO review.
SELECT COUNT(*) eligible_pairs,COALESCE(SUM(impressions),0) eligible_impressions
FROM (
 SELECT page_url,query_text,SUM(clicks) clicks,SUM(impressions) impressions,AVG(average_position) average_position
 FROM search_console_page_queries
 WHERE date(COALESCE(report_date,created_at))>=date('now','-30 days') AND trim(COALESCE(page_url,''))<>'' AND trim(COALESCE(query_text,''))<>''
 GROUP BY page_url,query_text HAVING SUM(impressions)>=10 AND AVG(average_position) BETWEEN 4 AND 20
);

-- 7: fresh route attribution from Search Console only.
SELECT
 COUNT(*) FILTER (WHERE instr(lower(page_url),'/workshop-journal/story/')>0) story_rows,
 COALESCE(SUM(CASE WHEN instr(lower(page_url),'/workshop-journal/story/')>0 THEN clicks ELSE 0 END),0) story_clicks,
 COALESCE(SUM(CASE WHEN instr(lower(page_url),'/workshop-journal/story/')>0 THEN impressions ELSE 0 END),0) story_impressions,
 COUNT(*) FILTER (WHERE instr(lower(page_url),'/shop/product/')>0) product_rows,
 COALESCE(SUM(CASE WHEN instr(lower(page_url),'/shop/product/')>0 THEN clicks ELSE 0 END),0) product_clicks,
 COALESCE(SUM(CASE WHEN instr(lower(page_url),'/shop/product/')>0 THEN impressions ELSE 0 END),0) product_impressions,
 COUNT(*) FILTER (WHERE instr(lower(page_url),'/workshop-journal/story/')=0 AND instr(lower(page_url),'/shop/product/')=0) other_public_rows
FROM search_console_page_queries WHERE date(COALESCE(report_date,created_at))>=date('now','-30 days');

-- 8: SEO queue support from fresh Search Console evidence only.
SELECT
 COUNT(*) queue_rows,
 SUM(CASE WHEN a.action_status='open' THEN 1 ELSE 0 END) open_rows,
 SUM(CASE WHEN a.action_status='in_progress' THEN 1 ELSE 0 END) in_progress_rows,
 SUM(CASE WHEN a.action_status='applied' THEN 1 ELSE 0 END) applied_rows,
 SUM(CASE WHEN EXISTS(
   SELECT 1 FROM search_console_page_queries q
   WHERE date(COALESCE(q.report_date,q.created_at))>=date('now','-30 days') AND lower(q.page_url)=lower(a.page_url) AND lower(COALESCE(q.query_text,''))=lower(COALESCE(a.query_text,''))
   GROUP BY q.page_url,q.query_text HAVING SUM(q.impressions)>=10 AND AVG(q.average_position) BETWEEN 4 AND 20
 ) THEN 1 ELSE 0 END) currently_supported_rows,
 SUM(CASE WHEN a.action_status IN ('open','in_progress') AND NOT EXISTS(
   SELECT 1 FROM search_console_page_queries q
   WHERE date(COALESCE(q.report_date,q.created_at))>=date('now','-30 days') AND lower(q.page_url)=lower(a.page_url) AND lower(COALESCE(q.query_text,''))=lower(COALESCE(a.query_text,''))
   GROUP BY q.page_url,q.query_text HAVING SUM(q.impressions)>=10 AND AVG(q.average_position) BETWEEN 4 AND 20
 ) THEN 1 ELSE 0 END) stale_or_unsupported_pending_rows,
 SUM(CASE WHEN trim(COALESCE(a.suggested_title,''))<>'' OR trim(COALESCE(a.suggested_meta_description,''))<>'' OR trim(COALESCE(a.suggested_internal_link_note,''))<>'' THEN 1 ELSE 0 END) generated_wording_rows
FROM seo_opportunity_actions a;

-- 9: reviewed public population and relational integrity.
SELECT
 (SELECT COUNT(*) FROM content_publications WHERE destination='workshop_journal' AND content_status='published') published_reviewed_stories,
 (SELECT COUNT(*) FROM products WHERE lower(COALESCE(status,'active'))='active' AND lower(COALESCE(review_status,'published')) IN ('approved','published','')) active_reviewed_products,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
