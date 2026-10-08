-- Release 467 Build 366 — full content-adoption & discovery outcomes renewal XI.
-- Development-only and read-only. No DDL, no business-data mutation, no provider/R2 action.

-- 1 Maker Story adoption/completeness.
SELECT
  (SELECT COUNT(*) FROM creative_work_projects WHERE project_status<>'archived') active_creative_projects,
  COUNT(*) maker_profiles,
  SUM(CASE WHEN story_kind<>'ordinary_project' THEN 1 ELSE 0 END) active_maker_stories,
  SUM(CASE WHEN story_review_status='reviewed' THEN 1 ELSE 0 END) reviewed_maker_stories,
  SUM(CASE WHEN public_story_candidate=1 THEN 1 ELSE 0 END) public_story_candidates,
  SUM(CASE WHEN story_kind<>'ordinary_project'
    AND TRIM(COALESCE(what_we_are_trying,''))<>'' AND TRIM(COALESCE(why_we_are_trying_it,''))<>''
    AND TRIM(COALESCE(actual_result,''))<>'' AND outcome_status<>'unknown'
    AND TRIM(COALESCE(lesson_learned,''))<>'' THEN 1 ELSE 0 END) core_story_complete
FROM creative_project_maker_story_profiles;

-- 2 Identity integrity.
SELECT
  (SELECT COUNT(*) FROM (SELECT source_id FROM creative_projects WHERE source_type='creative_work_project' AND project_status<>'archived' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_caip_source_identities,
  (SELECT COUNT(*) FROM (SELECT source_id FROM content_projects WHERE source_type='creative_project' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_content_source_identities,
  (SELECT COUNT(*) FROM (SELECT creative_work_project_id,site_item_inventory_id FROM creative_project_maker_story_workstations GROUP BY creative_work_project_id,site_item_inventory_id HAVING COUNT(*)>1)) duplicate_workstation_memberships;

-- 3 Private-media and selected-evidence boundary.
SELECT
  COUNT(*) caip_assets,
  SUM(CASE WHEN asset_status<>'archived' THEN 1 ELSE 0 END) active_caip_assets,
  SUM(CASE WHEN source_safety_status='public_allowed' THEN 1 ELSE 0 END) public_allowed_assets,
  SUM(CASE WHEN source_safety_status IN ('blocked','internal_only','needs_review') OR source_safety_status IS NULL THEN 1 ELSE 0 END) non_public_assets,
  (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE selected=1) selected_evidence_rows
FROM creative_assets;

-- 4 Bridge continuity.
SELECT
  (SELECT COUNT(*) FROM creative_work_projects WHERE project_status<>'archived') active_creative_projects,
  (SELECT COUNT(*) FROM creative_projects WHERE source_type='creative_work_project' AND project_status<>'archived') linked_caip_workspaces,
  (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project') linked_content_packages,
  (SELECT COUNT(*) FROM creative_project_content_handoffs) handoff_rows,
  (SELECT COUNT(*) FROM content_project_events WHERE event_type='creative_project_content_studio_bridge') bridge_events;

-- 5 Deliverable review state.
SELECT
  COUNT(*) deliverables,
  SUM(CASE WHEN approval_status='approved' THEN 1 ELSE 0 END) approved_deliverables,
  SUM(CASE WHEN approval_status='changes_requested' THEN 1 ELSE 0 END) changes_requested_deliverables,
  SUM(CASE WHEN deliverable_status='published' OR published_at IS NOT NULL THEN 1 ELSE 0 END) published_deliverables,
  SUM(CASE WHEN copy_locked=1 THEN 1 ELSE 0 END) copy_locked_deliverables,
  SUM(CASE WHEN generated_by='factual_template' THEN 1 ELSE 0 END) factual_template_deliverables
FROM content_project_deliverables d
JOIN content_projects cp ON cp.content_project_id=d.content_project_id
WHERE cp.source_type='creative_project';

-- 6 Workshop Journal outcomes.
SELECT
  COUNT(*) workshop_journal_rows,
  SUM(CASE WHEN content_status='approved' THEN 1 ELSE 0 END) approved_journal_rows,
  SUM(CASE WHEN content_status='published' THEN 1 ELSE 0 END) published_journal_rows,
  SUM(CASE WHEN published_by_user_id IS NOT NULL THEN 1 ELSE 0 END) human_publisher_recorded,
  SUM(CASE WHEN publication_slug='under-the-sea-workshop-story-22' AND content_status='published' THEN 1 ELSE 0 END) under_the_sea_published
FROM content_publications pub
JOIN content_projects cp ON cp.content_project_id=pub.content_project_id
WHERE cp.source_type='creative_project' AND pub.destination='workshop_journal';

-- 7 Social review-first outcomes.
SELECT
  COUNT(*) social_rows,
  SUM(CASE WHEN approval_status='approved' THEN 1 ELSE 0 END) approved_social_rows,
  SUM(CASE WHEN post_status='ready' THEN 1 ELSE 0 END) ready_social_rows,
  SUM(CASE WHEN post_status='posted' OR published_at IS NOT NULL THEN 1 ELSE 0 END) posted_social_rows,
  SUM(CASE WHEN approval_status='approved' OR COALESCE(approved_for_public_post,0)=1 THEN 1 ELSE 0 END) human_social_approval_rows,
  SUM(CASE WHEN COALESCE(api_publish_mode,'')='review_first' THEN 1 ELSE 0 END) review_first_rows
FROM social_post_queue
WHERE source_type IN ('content_project','creative_project','workshop_journal');

-- 8 Buyer discovery/public telemetry 30d.
SELECT
  SUM(CASE WHEN event_type='page_view' AND path LIKE '/workshop-journal/%' THEN 1 ELSE 0 END) journal_page_views_30d,
  SUM(CASE WHEN event_type='page_view' AND path='/workshop-journal/story/' THEN 1 ELSE 0 END) workshop_story_views_30d,
  SUM(CASE WHEN event_type='page_view' AND path='/shop/product/' THEN 1 ELSE 0 END) product_detail_views_30d,
  COUNT(*) FILTER (WHERE event_type='page_view') total_page_views_30d,
  COUNT(DISTINCT site_visitor_id) FILTER (WHERE event_type='page_view') unique_visitors_30d,
  COALESCE(MAX(created_at),'') latest_page_view_at
FROM site_page_views
WHERE created_at>=datetime('now','-30 days');

-- 9 Runtime/search health + Search Console freshness.
SELECT
  (SELECT COUNT(*) FROM runtime_incidents WHERE created_at>=datetime('now','-7 days') AND LOWER(COALESCE(severity,'warning')) IN ('error','critical')) runtime_errors_7d,
  (SELECT COUNT(*) FROM runtime_incidents WHERE incident_scope IN ('client_runtime','real_user_performance') AND created_at>=datetime('now','-7 days')) client_runtime_records_7d,
  (SELECT COUNT(*) FROM site_search_events WHERE created_at>=datetime('now','-30 days')) searches_30d,
  (SELECT COUNT(*) FROM search_console_page_queries WHERE report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')) search_console_rows_30d,
  (SELECT COALESCE(SUM(clicks),0) FROM search_console_page_queries WHERE report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')) search_console_clicks_30d,
  (SELECT COALESCE(SUM(impressions),0) FROM search_console_page_queries WHERE report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')) search_console_impressions_30d,
  (SELECT COALESCE(MAX(report_date),'') FROM search_console_page_queries) latest_search_console_report_date,
  (SELECT COUNT(*) FROM search_console_import_batches) search_console_import_batches;

-- 10 Product/Merchant factual baseline.
SELECT
  COUNT(*) active_products,
  SUM(CASE WHEN lower(COALESCE(review_status,'published')) IN ('approved','published','') THEN 1 ELSE 0 END) reviewed_products,
  SUM(CASE WHEN price_cents>0 AND TRIM(COALESCE(slug,''))<>'' AND TRIM(COALESCE(featured_image_url,''))<>'' AND requires_shipping=1 THEN 1 ELSE 0 END) merchant_fact_complete_products
FROM products
WHERE lower(COALESCE(status,'active'))='active';

-- 11 Maker Story coverage/friction.
SELECT
  (SELECT COUNT(*) FROM creative_work_projects WHERE project_status<>'archived') active_projects,
  COUNT(*) profiled_projects,
  SUM(CASE WHEN story_kind<>'ordinary_project' THEN 1 ELSE 0 END) maker_story_projects,
  SUM(CASE WHEN story_kind<>'ordinary_project' AND story_review_status='needs_review' THEN 1 ELSE 0 END) needs_review_stories,
  SUM(CASE WHEN story_kind<>'ordinary_project' AND outcome_status='unknown' THEN 1 ELSE 0 END) unknown_outcome_stories,
  SUM(CASE WHEN story_kind<>'ordinary_project' AND public_story_candidate=1 THEN 1 ELSE 0 END) public_candidate_stories
FROM creative_project_maker_story_profiles;

-- 12 Exact Under the Sea continuity.
SELECT
  (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=7 AND story_kind<>'ordinary_project') maker_story_profile,
  (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=7 AND story_review_status='reviewed') reviewed_profile,
  (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=7 AND public_story_candidate=1) public_candidate,
  (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=7 AND selected=1) selected_evidence,
  (SELECT COUNT(*) FROM content_projects WHERE content_project_id=22 AND source_type='creative_project' AND source_id='7') content_package,
  (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND approval_status='approved') approved_deliverables,
  (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND copy_locked=1) locked_deliverables,
  (SELECT COUNT(*) FROM content_publications WHERE publication_key='content-project-22-workshop_journal' AND destination='workshop_journal' AND content_status='published') published_journal,
  (SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' AND approval_status='approved' AND post_status='ready' AND COALESCE(api_publish_mode,'')='review_first') social_ready_review_first,
  (SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' AND (post_status='posted' OR published_at IS NOT NULL)) social_posted;

-- 13 Exact 35th promo continuity.
SELECT
  (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5 AND story_kind<>'ordinary_project') maker_story_profile,
  (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5 AND story_review_status='reviewed') reviewed_profile,
  (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5 AND public_story_candidate=1) public_candidate,
  (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5 AND outcome_status='unknown') unknown_outcome,
  (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=5 AND selected=1) selected_evidence,
  (SELECT COUNT(*) FROM content_projects WHERE content_project_id=23 AND source_type='creative_project' AND source_id='5') content_package,
  (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND approval_status='approved') approved_deliverables,
  (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND approval_status='changes_requested') changes_requested_deliverables,
  (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND copy_locked=1) locked_deliverables,
  (SELECT COUNT(*) FROM content_publications WHERE content_project_id=23) publications,
  (SELECT COUNT(*) FROM social_post_queue WHERE source_type IN ('content_project','creative_project') AND CAST(source_id AS TEXT) IN ('23','5')) social_rows;

-- 14 Multi-project adoption coverage.
SELECT
  COUNT(*) active_projects,
  SUM(CASE WHEN ms.creative_work_project_id IS NOT NULL THEN 1 ELSE 0 END) projects_with_maker_story_profile,
  SUM(CASE WHEN ms.story_review_status='reviewed' THEN 1 ELSE 0 END) projects_with_reviewed_maker_story,
  SUM(CASE WHEN ms.public_story_candidate=1 THEN 1 ELSE 0 END) projects_public_story_candidate,
  SUM(CASE WHEN caip.source_id IS NOT NULL THEN 1 ELSE 0 END) projects_with_caip_workspace,
  SUM(CASE WHEN cp.source_id IS NOT NULL THEN 1 ELSE 0 END) projects_with_content_package,
  SUM(CASE WHEN COALESCE(ap.approved_count,0)>0 THEN 1 ELSE 0 END) projects_with_approved_deliverable,
  SUM(CASE WHEN COALESCE(pub.published_count,0)>0 THEN 1 ELSE 0 END) projects_with_published_journal
FROM creative_work_projects cwp
LEFT JOIN creative_project_maker_story_profiles ms ON ms.creative_work_project_id=cwp.creative_work_project_id
LEFT JOIN creative_projects caip ON caip.source_type='creative_work_project' AND CAST(caip.source_id AS TEXT)=CAST(cwp.creative_work_project_id AS TEXT) AND caip.project_status<>'archived'
LEFT JOIN content_projects cp ON cp.source_type='creative_project' AND CAST(cp.source_id AS TEXT)=CAST(cwp.creative_work_project_id AS TEXT)
LEFT JOIN (SELECT content_project_id,COUNT(*) approved_count FROM content_project_deliverables WHERE approval_status='approved' GROUP BY content_project_id) ap ON ap.content_project_id=cp.content_project_id
LEFT JOIN (SELECT content_project_id,COUNT(*) published_count FROM content_publications WHERE destination='workshop_journal' AND content_status='published' GROUP BY content_project_id) pub ON pub.content_project_id=cp.content_project_id
WHERE cwp.project_status<>'archived';

-- 15 Search Console intake schema/readiness.
SELECT
  SUM(CASE WHEN name='search_console_import_batches' THEN 1 ELSE 0 END) search_console_import_batches_ready,
  SUM(CASE WHEN name='search_console_page_queries' THEN 1 ELSE 0 END) search_console_page_queries_ready,
  SUM(CASE WHEN name='seo_opportunity_actions' THEN 1 ELSE 0 END) seo_opportunity_actions_ready,
  SUM(CASE WHEN name='seo_page_overrides' THEN 1 ELSE 0 END) seo_page_overrides_ready
FROM sqlite_master
WHERE type='table' AND name IN ('search_console_import_batches','search_console_page_queries','seo_opportunity_actions','seo_page_overrides');

-- 16 Foreign-key integrity.
SELECT COUNT(*) foreign_key_violations FROM pragma_foreign_key_check;

-- 17 Evidence-backed SEO review queue continuity.
SELECT
  COUNT(*) seo_queue_rows,
  SUM(CASE WHEN action_status='open' THEN 1 ELSE 0 END) open_rows,
  SUM(CASE WHEN action_status='applied' THEN 1 ELSE 0 END) applied_rows,
  SUM(CASE WHEN EXISTS(
    SELECT 1 FROM search_console_page_queries q
    WHERE lower(q.page_url)=lower(a.page_url)
      AND lower(COALESCE(q.query_text,''))=lower(COALESCE(a.query_text,''))
      AND q.report_date IS NOT NULL AND date(q.report_date)>=date('now','-30 days')
    GROUP BY q.page_url,q.query_text
    HAVING SUM(q.impressions)>=10 AND AVG(q.average_position) BETWEEN 4 AND 20
  ) THEN 1 ELSE 0 END) currently_supported_rows,
  SUM(CASE WHEN trim(COALESCE(suggested_title,''))<>'' OR trim(COALESCE(suggested_meta_description,''))<>'' OR trim(COALESCE(suggested_internal_link_note,''))<>'' THEN 1 ELSE 0 END) legacy_generated_copy_rows
FROM seo_opportunity_actions a;

-- 18 Remaining unprofiled-project Maker Story readiness after Build 347.
SELECT
  COUNT(*) remaining_unprofiled_projects,
  SUM(CASE WHEN
    (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived')=1
    AND
    (SELECT COUNT(*) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT))=1
    AND (
      (
        (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type<>'planning')>=1
        AND
        (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND trim(COALESCE(e.event_title,''))<>'' AND trim(COALESCE(e.media_url,''))='' AND COALESCE(e.is_public_candidate,0)=0)>=1
      )
      OR
      (
        (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND r.marker_status='active' AND r.review_status='approved')>=2
        AND
        (SELECT COUNT(*) FROM caip_story_builder_drafts d WHERE d.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND d.story_status IN ('review','approved'))>=1
        AND
        (SELECT COUNT(*) FROM caip_story_builder_items i JOIN caip_story_builder_drafts d ON d.caip_story_builder_draft_id=i.caip_story_builder_draft_id WHERE d.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND d.story_status IN ('review','approved') AND i.creative_media_evidence_range_id IS NOT NULL)>=2
      )
    )
  THEN 1 ELSE 0 END) third_story_ready_projects,
  SUM(CASE WHEN p.creative_work_project_id=6 THEN
    (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='6' AND cp.project_status<>'archived') AND r.marker_status='active' AND r.review_status='approved')
  ELSE 0 END) grey_hair_approved_source_evidence,
  SUM(CASE WHEN p.creative_work_project_id=6 THEN
    (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=6 AND COALESCE(e.entry_status,'active')='active' AND e.event_type<>'planning')
  ELSE 0 END) grey_hair_execution_events,
  SUM(CASE WHEN p.creative_work_project_id=6 THEN
    (SELECT COUNT(*) FROM caip_story_builder_drafts d WHERE d.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='6' AND cp.project_status<>'archived') AND d.story_status IN ('review','approved'))
  ELSE 0 END) grey_hair_reviewed_story_plans
FROM creative_work_projects p
LEFT JOIN creative_project_maker_story_profiles m ON m.creative_work_project_id=p.creative_work_project_id
WHERE COALESCE(p.project_status,'')<>'archived' AND m.creative_work_project_id IS NULL;

-- 19 Raw Inventory one-record identity and lot-provenance topology.
SELECT
  COUNT(*) active_inventory_rows,
  SUM(CASE WHEN LOWER(TRIM(COALESCE(source_type,'')))='supply' THEN 1 ELSE 0 END) active_supply_rows,
  COALESCE(SUM(CASE WHEN LOWER(TRIM(COALESCE(source_type,'')))='supply' THEN on_hand_quantity ELSE 0 END),0) supply_on_hand_total,
  (SELECT COUNT(*) FROM (
    SELECT LOWER(TRIM(COALESCE(source_type,''))) source_type_key, external_key
    FROM site_item_inventory
    WHERE COALESCE(is_active,1)=1
    GROUP BY LOWER(TRIM(COALESCE(source_type,''))), external_key
    HAVING COUNT(*)>1
  )) duplicate_active_inventory_identities,
  (SELECT COUNT(*) FROM inventory_purchase_lots) purchase_lot_rows,
  (SELECT COUNT(DISTINCT site_item_inventory_id) FROM inventory_purchase_lots) inventory_items_with_purchase_lots
FROM site_item_inventory
WHERE COALESCE(is_active,1)=1;
