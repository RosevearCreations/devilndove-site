-- Release 467 Build 311 — Development-only buyer discovery evidence freshness/search intake measurement.
-- Read-only. No provider calls, no writes, no schema mutation, no Production D1 contact.

-- 1: published reviewed Workshop Journal story coverage.
SELECT
  COUNT(*) published_story_rows,
  COUNT(DISTINCT pub.content_project_id) published_story_projects,
  COUNT(*) FILTER (WHERE instr(lower(pub.canonical_path),'under-the-sea-workshop-story-22')>0) under_the_sea_rows,
  COALESCE(MAX(pub.updated_at),'') latest_story_updated_at
FROM content_publications pub
WHERE pub.destination='workshop_journal' AND pub.content_status='published';

-- 2: real public telemetry freshness over 30 days.
SELECT
  COUNT(*) FILTER (WHERE event_type='page_view') total_page_views_30d,
  COUNT(DISTINCT site_visitor_id) FILTER (WHERE event_type='page_view') unique_visitors_30d,
  COUNT(*) FILTER (WHERE event_type='page_view' AND path='/workshop-journal/story/') workshop_story_views_30d,
  COUNT(*) FILTER (WHERE event_type='page_view' AND path='/shop/product/') product_detail_views_30d,
  COALESCE(MAX(created_at),'') latest_page_view_at,
  CASE WHEN MAX(created_at) IS NULL THEN NULL ELSE ROUND(julianday('now')-julianday(MAX(created_at)),2) END latest_page_view_age_days
FROM site_page_views
WHERE datetime(created_at)>=datetime('now','-30 days');

-- 3: Search Console staging freshness over 30 days.
SELECT
  COUNT(*) search_console_rows_30d,
  COALESCE(SUM(clicks),0) clicks_30d,
  COALESCE(SUM(impressions),0) impressions_30d,
  COALESCE(MAX(report_date),'') latest_report_date,
  CASE WHEN MAX(report_date) IS NULL OR trim(MAX(report_date))='' THEN NULL ELSE ROUND(julianday('now')-julianday(MAX(report_date)),2) END latest_report_age_days,
  COUNT(DISTINCT page_url) distinct_page_urls_30d
FROM search_console_page_queries
WHERE date(COALESCE(report_date,created_at))>=date('now','-30 days');

-- 4: Search Console import-batch freshness and staged-row continuity.
SELECT
  COUNT(*) import_batches,
  COALESCE(MAX(imported_at),'') latest_import_at,
  CASE WHEN MAX(imported_at) IS NULL THEN NULL ELSE ROUND(julianday('now')-julianday(MAX(imported_at)),2) END latest_import_age_days,
  COALESCE((SELECT SUM(row_count) FROM search_console_import_batches),0) declared_import_rows,
  COALESCE((SELECT COUNT(*) FROM search_console_page_queries),0) live_staged_rows
FROM search_console_import_batches;

-- 5: Search Console public-page attribution over 30 days.
SELECT
  COUNT(*) FILTER (WHERE instr(lower(page_url),'/workshop-journal/story/')>0) reviewed_story_rows,
  COALESCE(SUM(CASE WHEN instr(lower(page_url),'/workshop-journal/story/')>0 THEN clicks ELSE 0 END),0) reviewed_story_clicks,
  COALESCE(SUM(CASE WHEN instr(lower(page_url),'/workshop-journal/story/')>0 THEN impressions ELSE 0 END),0) reviewed_story_impressions,
  COUNT(*) FILTER (WHERE instr(lower(page_url),'/shop/product/')>0) reviewed_product_rows,
  COALESCE(SUM(CASE WHEN instr(lower(page_url),'/shop/product/')>0 THEN clicks ELSE 0 END),0) reviewed_product_clicks,
  COALESCE(SUM(CASE WHEN instr(lower(page_url),'/shop/product/')>0 THEN impressions ELSE 0 END),0) reviewed_product_impressions,
  COUNT(*) FILTER (WHERE instr(lower(page_url),'/workshop-journal/story/')=0 AND instr(lower(page_url),'/shop/product/')=0) other_public_rows
FROM search_console_page_queries
WHERE date(COALESCE(report_date,created_at))>=date('now','-30 days');

-- 6: existing Search Console intake schema readiness; no request-time DDL.
SELECT
  SUM(CASE WHEN name='search_console_import_batches' THEN 1 ELSE 0 END) search_console_import_batches_ready,
  SUM(CASE WHEN name='search_console_page_queries' THEN 1 ELSE 0 END) search_console_page_queries_ready,
  SUM(CASE WHEN name='seo_opportunity_actions' THEN 1 ELSE 0 END) seo_opportunity_actions_ready,
  SUM(CASE WHEN name='seo_page_overrides' THEN 1 ELSE 0 END) seo_page_overrides_ready
FROM sqlite_master
WHERE type='table' AND name IN ('search_console_import_batches','search_console_page_queries','seo_opportunity_actions','seo_page_overrides');

-- 7: active reviewed Product factual discovery readiness.
SELECT
  COUNT(*) active_reviewed_products,
  SUM(CASE WHEN trim(COALESCE(slug,''))<>'' THEN 1 ELSE 0 END) with_slug,
  SUM(CASE WHEN COALESCE(price_cents,0)>0 AND upper(COALESCE(currency,'CAD'))='CAD' THEN 1 ELSE 0 END) with_cad_price,
  SUM(CASE WHEN trim(COALESCE(featured_image_url,''))<>'' THEN 1 ELSE 0 END) with_featured_image,
  SUM(CASE WHEN COALESCE(requires_shipping,0)=1 THEN 1 ELSE 0 END) canada_shipping_flagged,
  SUM(CASE WHEN trim(COALESCE(slug,''))<>'' AND COALESCE(price_cents,0)>0 AND upper(COALESCE(currency,'CAD'))='CAD' AND trim(COALESCE(featured_image_url,''))<>'' AND COALESCE(requires_shipping,0)=1 THEN 1 ELSE 0 END) fact_complete_before_external_merchant_config
FROM products
WHERE lower(COALESCE(status,'active'))='active'
  AND lower(COALESCE(review_status,'published')) IN ('approved','published','');

-- 8: dynamic sitemap authority and relational integrity.
SELECT
  (SELECT COUNT(*) FROM products WHERE lower(COALESCE(status,'active'))='active' AND lower(COALESCE(review_status,'published')) IN ('approved','published','') AND trim(COALESCE(slug,''))<>'') sitemap_product_candidates,
  (SELECT COUNT(*) FROM content_publications WHERE destination='workshop_journal' AND content_status='published' AND trim(COALESCE(canonical_path,''))<>'') sitemap_story_candidates,
  (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
