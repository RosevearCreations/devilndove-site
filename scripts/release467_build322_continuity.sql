-- Release 467 Build 322 — Development-only buyer discovery attribution and SEO review continuity.
-- Read-only. No Search Console, SEO queue, public SEO, provider, publication or Production mutation.

-- 1: Search Console evidence inventory and 30-day freshness.
SELECT
 COUNT(*) all_search_rows,
 SUM(CASE WHEN date(COALESCE(report_date,created_at))>=date('now','-30 days') THEN 1 ELSE 0 END) recent_search_rows,
 COALESCE(SUM(CASE WHEN date(COALESCE(report_date,created_at))>=date('now','-30 days') THEN clicks ELSE 0 END),0) recent_clicks,
 COALESCE(SUM(CASE WHEN date(COALESCE(report_date,created_at))>=date('now','-30 days') THEN impressions ELSE 0 END),0) recent_impressions,
 COUNT(DISTINCT CASE WHEN date(COALESCE(report_date,created_at))>=date('now','-30 days') THEN page_url END) recent_distinct_pages,
 COUNT(DISTINCT CASE WHEN date(COALESCE(report_date,created_at))>=date('now','-30 days') AND trim(COALESCE(query_text,''))<>'' THEN query_text END) recent_distinct_queries,
 COALESCE(MAX(report_date),'') latest_report_date,
 CASE WHEN MAX(report_date) IS NULL OR trim(MAX(report_date))='' THEN NULL ELSE ROUND(julianday('now')-julianday(MAX(report_date)),2) END latest_report_age_days
FROM search_console_page_queries;

-- 2: current real query/page pairs eligible for human SEO review.
SELECT COUNT(*) eligible_pairs,COALESCE(SUM(impressions),0) eligible_impressions
FROM (
 SELECT page_url,query_text,SUM(clicks) clicks,SUM(impressions) impressions,AVG(average_position) average_position
 FROM search_console_page_queries
 WHERE date(COALESCE(report_date,created_at))>=date('now','-30 days')
   AND trim(COALESCE(page_url,''))<>'' AND trim(COALESCE(query_text,''))<>''
 GROUP BY page_url,query_text
 HAVING SUM(impressions)>=10 AND AVG(average_position) BETWEEN 4 AND 20
);

-- 3: current route-level Search Console attribution populations.
SELECT
 COUNT(*) FILTER (WHERE instr(lower(page_url),'/workshop-journal/story/')>0) story_rows,
 COALESCE(SUM(CASE WHEN instr(lower(page_url),'/workshop-journal/story/')>0 THEN clicks ELSE 0 END),0) story_clicks,
 COALESCE(SUM(CASE WHEN instr(lower(page_url),'/workshop-journal/story/')>0 THEN impressions ELSE 0 END),0) story_impressions,
 COUNT(*) FILTER (WHERE instr(lower(page_url),'/shop/product/')>0) product_rows,
 COALESCE(SUM(CASE WHEN instr(lower(page_url),'/shop/product/')>0 THEN clicks ELSE 0 END),0) product_clicks,
 COALESCE(SUM(CASE WHEN instr(lower(page_url),'/shop/product/')>0 THEN impressions ELSE 0 END),0) product_impressions,
 COUNT(*) FILTER (WHERE instr(lower(page_url),'/workshop-journal/story/')=0 AND instr(lower(page_url),'/shop/product/')=0) other_public_rows
FROM search_console_page_queries
WHERE date(COALESCE(report_date,created_at))>=date('now','-30 days');

-- 4: SEO review queue support against current real Search Console evidence.
SELECT
 COUNT(*) queue_rows,
 SUM(CASE WHEN a.action_status='open' THEN 1 ELSE 0 END) open_rows,
 SUM(CASE WHEN a.action_status='in_progress' THEN 1 ELSE 0 END) in_progress_rows,
 SUM(CASE WHEN a.action_status='applied' THEN 1 ELSE 0 END) applied_rows,
 SUM(CASE WHEN EXISTS(
   SELECT 1 FROM search_console_page_queries q
   WHERE date(COALESCE(q.report_date,q.created_at))>=date('now','-30 days')
     AND lower(q.page_url)=lower(a.page_url)
     AND lower(COALESCE(q.query_text,''))=lower(COALESCE(a.query_text,''))
   GROUP BY q.page_url,q.query_text
   HAVING SUM(q.impressions)>=10 AND AVG(q.average_position) BETWEEN 4 AND 20
 ) THEN 1 ELSE 0 END) currently_supported_rows,
 SUM(CASE WHEN a.action_status IN ('open','in_progress') AND NOT EXISTS(
   SELECT 1 FROM search_console_page_queries q
   WHERE date(COALESCE(q.report_date,q.created_at))>=date('now','-30 days')
     AND lower(q.page_url)=lower(a.page_url)
     AND lower(COALESCE(q.query_text,''))=lower(COALESCE(a.query_text,''))
   GROUP BY q.page_url,q.query_text
   HAVING SUM(q.impressions)>=10 AND AVG(q.average_position) BETWEEN 4 AND 20
 ) THEN 1 ELSE 0 END) stale_or_unsupported_pending_rows,
 SUM(CASE WHEN trim(COALESCE(a.suggested_title,''))<>'' OR trim(COALESCE(a.suggested_meta_description,''))<>'' OR trim(COALESCE(a.suggested_internal_link_note,''))<>'' THEN 1 ELSE 0 END) wording_present_rows
FROM seo_opportunity_actions a;

-- 5: public first-party telemetry observation only; never query attribution.
SELECT
 COUNT(*) FILTER (WHERE event_type='page_view') page_views_30d,
 COUNT(DISTINCT site_visitor_id) FILTER (WHERE event_type='page_view') unique_visitors_30d,
 COUNT(*) FILTER (WHERE event_type='page_view' AND path='/workshop-journal/story/') story_views_30d,
 COUNT(*) FILTER (WHERE event_type='page_view' AND path='/workshop-journal/') journal_index_views_30d,
 COUNT(*) FILTER (WHERE event_type='page_view' AND path='/shop/product/') product_views_30d,
 COALESCE(MAX(created_at),'') latest_page_view_at,
 CASE WHEN MAX(created_at) IS NULL THEN NULL ELSE ROUND(julianday('now')-julianday(MAX(created_at)),2) END latest_page_view_age_days
FROM site_page_views
WHERE datetime(created_at)>=datetime('now','-30 days');

-- 6: Search Console import/staging traceability.
SELECT
 (SELECT COUNT(*) FROM search_console_import_batches) batch_count,
 (SELECT COUNT(*) FROM search_console_page_queries) staged_rows,
 (SELECT COUNT(*) FROM search_console_import_batches b WHERE b.row_count<>(SELECT COUNT(*) FROM search_console_page_queries q WHERE q.import_batch_key=b.import_batch_key)) mismatched_batches,
 (SELECT COUNT(*) FROM search_console_page_queries q WHERE NOT EXISTS(SELECT 1 FROM search_console_import_batches b WHERE b.import_batch_key=q.import_batch_key)) orphan_search_rows,
 COALESCE((SELECT MAX(imported_at) FROM search_console_import_batches),'') latest_import_at;

-- 7: reviewed public population and relational integrity.
SELECT
 (SELECT COUNT(*) FROM content_publications WHERE destination='workshop_journal' AND content_status='published') published_reviewed_stories,
 (SELECT COUNT(*) FROM products WHERE lower(COALESCE(status,'active'))='active' AND lower(COALESCE(review_status,'published')) IN ('approved','published','')) active_reviewed_products,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
