-- Release 467 Build 305 — Development-only buyer discovery/search measurement.
-- Read-only. No provider calls, no writes, no schema mutation, no Production D1 contact.

-- 1: reviewed publication identity.
SELECT
  pub.content_publication_id,pub.publication_key,pub.content_project_id,pub.destination,pub.publication_slug,
  pub.content_status,pub.canonical_path,pub.published_at,
  cp.source_type,cp.source_id,COALESCE(cp.product_id,0) product_id,
  (SELECT COUNT(*) FROM social_post_queue s WHERE s.social_post_key='workshop-journal-22-under-the-sea' AND s.approval_status='approved' AND s.post_status='ready' AND COALESCE(s.api_publish_mode,'')='review_first') social_ready,
  (SELECT COUNT(*) FROM social_post_queue s WHERE s.social_post_key='workshop-journal-22-under-the-sea' AND (s.post_status='posted' OR s.published_at IS NOT NULL)) social_posted
FROM content_publications pub
JOIN content_projects cp ON cp.content_project_id=pub.content_project_id
WHERE pub.publication_key='content-project-22-workshop_journal';

-- 2: real public telemetry after publication and over 28 days.
SELECT
  COUNT(*) FILTER (WHERE event_type='page_view' AND path='/workshop-journal/story/' AND instr(COALESCE(query_string,''),'under-the-sea-workshop-story-22')>0) under_the_sea_story_views,
  COUNT(*) FILTER (WHERE event_type='page_view' AND path='/workshop-journal/') workshop_journal_index_views,
  COUNT(*) FILTER (WHERE event_type='page_view' AND path='/shop/product/') product_detail_views,
  COUNT(*) FILTER (WHERE event_type='page_view') total_page_views_28d,
  COUNT(DISTINCT site_visitor_id) FILTER (WHERE event_type='page_view') unique_visitors_28d,
  MAX(created_at) latest_page_view_at
FROM site_page_views
WHERE datetime(created_at)>=datetime('now','-28 days');

-- 3: Search Console staging evidence.
SELECT
  COUNT(*) search_console_rows_28d,
  COALESCE(SUM(clicks),0) clicks_28d,
  COALESCE(SUM(impressions),0) impressions_28d,
  COALESCE(MAX(report_date),'') latest_report_date,
  COUNT(*) FILTER (WHERE instr(lower(page_url),'under-the-sea-workshop-story-22')>0) story_rows,
  COALESCE(SUM(CASE WHEN instr(lower(page_url),'under-the-sea-workshop-story-22')>0 THEN clicks ELSE 0 END),0) story_clicks,
  COALESCE(SUM(CASE WHEN instr(lower(page_url),'under-the-sea-workshop-story-22')>0 THEN impressions ELSE 0 END),0) story_impressions,
  COUNT(*) FILTER (WHERE instr(lower(page_url),'/shop/product/')>0) product_rows
FROM search_console_page_queries
WHERE date(COALESCE(report_date,created_at))>=date('now','-28 days');

-- 4: Product discovery/merchant factual readiness independent of external account config.
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

-- 5: dynamic sitemap data authority.
SELECT
  (SELECT COUNT(*) FROM products WHERE lower(COALESCE(status,'active'))='active' AND lower(COALESCE(review_status,'published')) IN ('approved','published','') AND trim(COALESCE(slug,''))<>'') sitemap_product_candidates,
  (SELECT COUNT(*) FROM content_publications WHERE destination='workshop_journal' AND content_status='published' AND trim(COALESCE(canonical_path,''))<>'') sitemap_story_candidates,
  (SELECT COUNT(*) FROM content_publications WHERE publication_key='content-project-22-workshop_journal' AND destination='workshop_journal' AND content_status='published' AND trim(COALESCE(canonical_path,''))<>'') under_the_sea_sitemap_candidate;

-- 6: factual internal-discovery source relationships.
SELECT
  (SELECT COUNT(*) FROM creative_project_operations WHERE creative_work_project_id=7 AND COALESCE(plan_status,'planned')<>'retired') project_operations,
  (SELECT COUNT(*) FROM workshop_capability_profiles WHERE is_public=1 AND review_status IN ('reviewed','published')) public_capability_profiles,
  (SELECT COUNT(*) FROM content_publications WHERE content_project_id=22 AND destination='workshop_journal' AND content_status='published') published_story_rows,
  (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
