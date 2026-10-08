-- Release 467 Build 367 — Development-only Evidence Gap Execution Workbench measurement.
-- Read-only. No owner assignment, acknowledgement, resolution, evidence, story, SEO, provider or Production mutation.

-- 1: 35th promo factual blocker and existing action trace.
SELECT
 w.creative_work_project_id,w.project_key,w.project_title,w.project_status,
 COALESCE((SELECT m.story_review_status FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id LIMIT 1),'') story_review_status,
 COALESCE((SELECT m.public_story_candidate FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id LIMIT 1),0) public_story_candidate,
 COALESCE((SELECT m.outcome_status FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id LIMIT 1),'') outcome_status,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type IN ('setup','process','mistake','repair','milestone','result','lesson')) execution_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type='result') result_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type='lesson') lesson_events,
 COALESCE((SELECT MAX(e.occurred_at) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id),'') latest_project_event_at,
 COALESCE((SELECT MAX(a.created_at) FROM admin_action_audit a WHERE a.action_type='creative_process_record_story_execution_evidence' AND a.target_type='creative_work_project' AND a.target_id=w.creative_work_project_id),'') latest_execution_intake_audit_at
FROM creative_work_projects w
WHERE w.creative_work_project_id=5;

-- 2: Grey Hair source-evidence blocker and existing review trace.
SELECT
 w.creative_work_project_id,w.project_key,w.project_title,
 cp.creative_project_id caip_project_id,
 (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=cp.creative_project_id AND r.marker_status='active') active_source_evidence,
 (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=cp.creative_project_id AND r.marker_status='active' AND r.review_status='approved') approved_source_evidence,
 (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=cp.creative_project_id AND r.marker_status='active' AND r.review_status='needs_review') source_evidence_needs_review,
 (SELECT COUNT(*) FROM caip_story_builder_drafts d WHERE d.creative_project_id=cp.creative_project_id AND d.story_status IN ('review','approved')) reviewed_story_plans,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id) maker_story_profiles,
 COALESCE((SELECT MAX(r.reviewed_at) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=cp.creative_project_id AND r.marker_status='active' AND TRIM(COALESCE(r.reviewed_at,''))<>''),'') latest_evidence_review_at
FROM creative_work_projects w
JOIN creative_projects cp ON cp.source_type='creative_work_project' AND cp.source_id=CAST(w.creative_work_project_id AS TEXT) AND cp.project_status<>'archived'
WHERE w.creative_work_project_id=6;

-- 3: Search Console real-export blocker and audit trace.
SELECT
 (SELECT COUNT(*) FROM search_console_import_batches) import_batches,
 (SELECT COUNT(*) FROM search_console_page_queries) live_rows,
 COALESCE((SELECT SUM(clicks) FROM search_console_page_queries),0) clicks,
 COALESCE((SELECT SUM(impressions) FROM search_console_page_queries),0) impressions,
 (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='search_console_import') import_audits,
 (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='search_console_delete_batch') revert_audits,
 COALESCE((SELECT MAX(created_at) FROM admin_action_audit WHERE action_type IN ('search_console_import','search_console_delete_batch')),'') latest_search_console_audit_at,
 (SELECT COUNT(*) FROM search_console_page_queries WHERE report_date IS NOT NULL AND date(report_date)>=date('now','-30 days')) fresh_rows,
 COALESCE((SELECT MAX(report_date) FROM search_console_page_queries),'') latest_report_date;

-- 4: all currently unprofiled active projects with existing evidence/activity trace.
SELECT
 w.creative_work_project_id,w.project_key,w.project_title,w.project_status,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id AND COALESCE(e.entry_status,'active')='active') active_events,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s WHERE s.creative_work_project_id=w.creative_work_project_id AND s.selected=1) selected_evidence_rows,
 COALESCE((SELECT MAX(e.occurred_at) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id),'') latest_project_event_at
FROM creative_work_projects w
WHERE COALESCE(w.project_status,'')<>'archived'
  AND NOT EXISTS (SELECT 1 FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id)
ORDER BY w.creative_work_project_id;

-- 5: queue source-authority trace totals; no shadow task/owner table is created.
SELECT
 (SELECT COUNT(*) FROM creative_work_projects WHERE COALESCE(project_status,'')<>'archived') active_projects,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles) maker_story_profiles,
 (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE selected=1) selected_evidence_rows,
 (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='creative_process_record_story_execution_evidence') execution_intake_audits,
 (SELECT COUNT(*) FROM admin_action_audit WHERE action_type IN ('search_console_import','search_console_delete_batch')) search_console_trace_audits;

-- 6: relational integrity.
SELECT
 (SELECT COUNT(*) FROM (SELECT source_id FROM creative_projects WHERE source_type='creative_work_project' AND project_status<>'archived' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_caip_source_identities,
 (SELECT COUNT(*) FROM (SELECT source_id FROM content_projects WHERE source_type='creative_project' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_content_source_identities,
 (SELECT COUNT(*) FROM (SELECT creative_work_project_id FROM creative_project_maker_story_profiles GROUP BY creative_work_project_id HAVING COUNT(*)>1)) duplicate_maker_story_profiles,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
