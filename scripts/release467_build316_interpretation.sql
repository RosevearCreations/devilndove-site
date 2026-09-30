-- Release 467 Build 316 — Development-only buyer discovery interpretation.
-- Read-only. No Search Console, SEO queue or public SEO mutation.

-- 1: Search Console evidence inventory.
SELECT
 COUNT(*) search_rows,
 COALESCE(SUM(clicks),0) clicks,
 COALESCE(SUM(impressions),0) impressions,
 COUNT(DISTINCT page_url) distinct_pages,
 COUNT(DISTINCT CASE WHEN trim(COALESCE(query_text,''))<>'' THEN query_text END) distinct_queries,
 COALESCE(MAX(report_date),'') latest_report_date
FROM search_console_page_queries;

-- 2: real query/page pairs eligible for human SEO review under the default evidence threshold.
SELECT COUNT(*) eligible_pairs,COALESCE(SUM(impressions),0) eligible_impressions
FROM (
 SELECT page_url,query_text,SUM(clicks) clicks,SUM(impressions) impressions,AVG(average_position) average_position
 FROM search_console_page_queries
 WHERE trim(COALESCE(page_url,''))<>'' AND trim(COALESCE(query_text,''))<>''
 GROUP BY page_url,query_text
 HAVING SUM(impressions)>=10 AND AVG(average_position) BETWEEN 4 AND 20
);

-- 3: current SEO queue and current evidence support.
SELECT
 COUNT(*) queue_rows,
 SUM(CASE WHEN a.action_status='open' THEN 1 ELSE 0 END) open_rows,
 SUM(CASE WHEN a.action_status='applied' THEN 1 ELSE 0 END) applied_rows,
 SUM(CASE WHEN EXISTS(
   SELECT 1 FROM search_console_page_queries q
   WHERE lower(q.page_url)=lower(a.page_url)
     AND lower(COALESCE(q.query_text,''))=lower(COALESCE(a.query_text,''))
   GROUP BY q.page_url,q.query_text
   HAVING SUM(q.impressions)>=10 AND AVG(q.average_position) BETWEEN 4 AND 20
 ) THEN 1 ELSE 0 END) currently_supported_rows,
 SUM(CASE WHEN a.action_status IN ('open','in_progress') AND NOT EXISTS(
   SELECT 1 FROM search_console_page_queries q
   WHERE lower(q.page_url)=lower(a.page_url)
     AND lower(COALESCE(q.query_text,''))=lower(COALESCE(a.query_text,''))
   GROUP BY q.page_url,q.query_text
   HAVING SUM(q.impressions)>=10 AND AVG(q.average_position) BETWEEN 4 AND 20
 ) THEN 1 ELSE 0 END) unsupported_pending_rows,
 SUM(CASE WHEN trim(COALESCE(a.suggested_title,''))<>'' OR trim(COALESCE(a.suggested_meta_description,''))<>'' OR trim(COALESCE(a.suggested_internal_link_note,''))<>'' THEN 1 ELSE 0 END) legacy_generated_copy_rows
FROM seo_opportunity_actions a;

-- 4: public telemetry observation only.
SELECT
 COUNT(*) FILTER (WHERE event_type='page_view') page_views_30d,
 COUNT(DISTINCT site_visitor_id) FILTER (WHERE event_type='page_view') unique_visitors_30d,
 COUNT(*) FILTER (WHERE event_type='page_view' AND path='/workshop-journal/story/') story_views_30d,
 COUNT(*) FILTER (WHERE event_type='page_view' AND path='/shop/product/') product_views_30d,
 COALESCE(MAX(created_at),'') latest_page_view_at
FROM site_page_views
WHERE datetime(created_at)>=datetime('now','-30 days');

-- 5: reviewed public attribution populations.
SELECT
 (SELECT COUNT(*) FROM content_publications WHERE destination='workshop_journal' AND content_status='published') published_reviewed_stories,
 (SELECT COUNT(*) FROM products WHERE lower(COALESCE(status,'active'))='active' AND lower(COALESCE(review_status,'published')) IN ('approved','published','')) active_reviewed_products;

-- 6: integrity.
SELECT
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations,
 (SELECT COUNT(*) FROM search_console_page_queries q WHERE NOT EXISTS(SELECT 1 FROM search_console_import_batches b WHERE b.import_batch_key=q.import_batch_key)) orphan_search_rows;
