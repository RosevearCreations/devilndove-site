-- Release 467 Build 300 — read-only Development outcome measurement.
-- No DDL, no business-data mutation, no provider/R2 action.

-- 1: Maker Story adoption and completion.
SELECT
  COUNT(*) maker_profiles,
  SUM(CASE WHEN story_kind<>'ordinary_project' THEN 1 ELSE 0 END) active_maker_stories,
  SUM(CASE WHEN story_review_status='reviewed' THEN 1 ELSE 0 END) reviewed_maker_stories,
  SUM(CASE WHEN public_story_candidate=1 THEN 1 ELSE 0 END) public_story_candidates,
  SUM(CASE WHEN story_kind<>'ordinary_project'
    AND TRIM(COALESCE(what_we_are_trying,''))<>'' AND TRIM(COALESCE(why_we_are_trying_it,''))<>''
    AND TRIM(COALESCE(actual_result,''))<>'' AND outcome_status<>'unknown'
    AND TRIM(COALESCE(lesson_learned,''))<>'' THEN 1 ELSE 0 END) core_story_complete
FROM creative_project_maker_story_profiles;

-- 2: Identity duplication must remain zero.
SELECT
  (SELECT COUNT(*) FROM (
    SELECT source_id FROM creative_projects
    WHERE source_type='creative_work_project' AND project_status<>'archived'
    GROUP BY source_id HAVING COUNT(*)>1
  )) duplicate_caip_source_identities,
  (SELECT COUNT(*) FROM (
    SELECT source_id FROM content_projects
    WHERE source_type='creative_project'
    GROUP BY source_id HAVING COUNT(*)>1
  )) duplicate_content_source_identities,
  (SELECT COUNT(*) FROM (
    SELECT creative_work_project_id,site_item_inventory_id
    FROM creative_project_maker_story_workstations
    GROUP BY creative_work_project_id,site_item_inventory_id HAVING COUNT(*)>1
  )) duplicate_workstation_memberships;

-- 3: CAIP private-media and evidence boundary.
SELECT
  COUNT(*) caip_assets,
  SUM(CASE WHEN asset_status<>'archived' THEN 1 ELSE 0 END) active_caip_assets,
  SUM(CASE WHEN source_safety_status='public_allowed' THEN 1 ELSE 0 END) public_allowed_assets,
  SUM(CASE WHEN source_safety_status IN ('blocked','internal_only','needs_review') OR source_safety_status IS NULL THEN 1 ELSE 0 END) non_public_assets,
  (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE selected=1) selected_evidence_rows
FROM creative_assets;

-- 4: Creative Project → CAIP → Content Studio bridge outcomes.
SELECT
  (SELECT COUNT(*) FROM creative_work_projects WHERE project_status<>'archived') active_creative_projects,
  (SELECT COUNT(*) FROM creative_projects WHERE source_type='creative_work_project' AND project_status<>'archived') linked_caip_workspaces,
  (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project') linked_content_packages,
  (SELECT COUNT(*) FROM creative_project_content_handoffs) handoff_rows,
  (SELECT COUNT(*) FROM content_project_events WHERE event_type='creative_project_content_studio_bridge') bridge_events;

-- 5: Deliverable usefulness/review state.
SELECT
  COUNT(*) deliverables,
  SUM(CASE WHEN approval_status='approved' THEN 1 ELSE 0 END) approved_deliverables,
  SUM(CASE WHEN deliverable_status='published' OR published_at IS NOT NULL THEN 1 ELSE 0 END) published_deliverables,
  SUM(CASE WHEN copy_locked=1 THEN 1 ELSE 0 END) copy_locked_deliverables,
  SUM(CASE WHEN generated_by='factual_template' THEN 1 ELSE 0 END) factual_template_deliverables
FROM content_project_deliverables d
JOIN content_projects cp ON cp.content_project_id=d.content_project_id
WHERE cp.source_type='creative_project';

-- 6: Reviewed/public Journal outcome.
SELECT
  COUNT(*) workshop_journal_rows,
  SUM(CASE WHEN content_status='approved' THEN 1 ELSE 0 END) approved_journal_rows,
  SUM(CASE WHEN content_status='published' THEN 1 ELSE 0 END) published_journal_rows,
  SUM(CASE WHEN published_by_user_id IS NOT NULL THEN 1 ELSE 0 END) human_publisher_recorded
FROM content_publications pub
JOIN content_projects cp ON cp.content_project_id=pub.content_project_id
WHERE cp.source_type='creative_project' AND pub.destination='workshop_journal';

-- 7: Social review-first outcome.
SELECT
  COUNT(*) social_rows,
  SUM(CASE WHEN approval_status='approved' THEN 1 ELSE 0 END) approved_social_rows,
  SUM(CASE WHEN post_status='posted' OR published_at IS NOT NULL THEN 1 ELSE 0 END) posted_social_rows,
  SUM(CASE WHEN approved_by_user_id IS NOT NULL THEN 1 ELSE 0 END) human_social_approval_rows
FROM social_post_queue
WHERE source_type IN ('content_project','creative_project','workshop_journal');

-- 8: Buyer discovery / story engagement over 30 days.
SELECT
  SUM(CASE WHEN path LIKE '/workshop-journal/%' THEN 1 ELSE 0 END) journal_page_views_30d,
  SUM(CASE WHEN path LIKE '/shop/product/%' OR path LIKE '/shop/product/?%' THEN 1 ELSE 0 END) product_detail_views_30d,
  COUNT(*) total_page_views_30d
FROM site_page_views
WHERE created_at>=datetime('now','-30 days');

-- 9: Runtime/search health over 7/30 days.
SELECT
  (SELECT COUNT(*) FROM runtime_incidents
    WHERE created_at>=datetime('now','-7 days') AND LOWER(COALESCE(severity,'warning')) IN ('error','critical')) runtime_errors_7d,
  (SELECT COUNT(*) FROM runtime_incidents
    WHERE incident_scope IN ('client_runtime','real_user_performance') AND created_at>=datetime('now','-7 days')) client_runtime_records_7d,
  (SELECT COUNT(*) FROM site_search_events WHERE created_at>=datetime('now','-30 days')) searches_30d,
  (SELECT COUNT(*) FROM search_console_page_queries) search_console_rows;

-- 10: Product/merchant baseline.
SELECT
  COUNT(*) active_products,
  SUM(CASE WHEN lower(COALESCE(review_status,'published')) IN ('approved','published','') THEN 1 ELSE 0 END) reviewed_products,
  SUM(CASE WHEN price_cents>0 AND TRIM(COALESCE(slug,''))<>'' AND TRIM(COALESCE(featured_image_url,''))<>'' AND requires_shipping=1 THEN 1 ELSE 0 END) merchant_fact_complete_products
FROM products
WHERE lower(COALESCE(status,'active'))='active';

-- 11: Maker-story friction by missing core fact.
SELECT
  SUM(CASE WHEN story_kind<>'ordinary_project' AND TRIM(COALESCE(what_we_are_trying,''))='' THEN 1 ELSE 0 END) missing_what,
  SUM(CASE WHEN story_kind<>'ordinary_project' AND TRIM(COALESCE(why_we_are_trying_it,''))='' THEN 1 ELSE 0 END) missing_why,
  SUM(CASE WHEN story_kind<>'ordinary_project' AND TRIM(COALESCE(actual_result,''))='' THEN 1 ELSE 0 END) missing_actual,
  SUM(CASE WHEN story_kind<>'ordinary_project' AND outcome_status='unknown' THEN 1 ELSE 0 END) missing_outcome,
  SUM(CASE WHEN story_kind<>'ordinary_project' AND TRIM(COALESCE(lesson_learned,''))='' THEN 1 ELSE 0 END) missing_lesson
FROM creative_project_maker_story_profiles;

-- 12: Read-only foreign-key integrity.
SELECT COUNT(*) foreign_key_violations FROM pragma_foreign_key_check;
