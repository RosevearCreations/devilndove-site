-- Release 467 Build 319 — Development-only 35th promo evidence-intake completeness measurement.
-- Read-only. CI does not create execution/result/lesson evidence.

-- 1: exact 35th promo state and evidence completeness.
SELECT
 p.creative_work_project_id,p.project_key,p.project_title,
 m.story_kind,m.story_review_status,m.public_story_candidate,m.outcome_status,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type='planning') planning_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type IN ('setup','process','milestone','mistake','repair')) execution_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type='result') result_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type='lesson') lesson_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type IN ('setup','process','milestone','result','lesson','mistake','repair')) factual_execution_evidence_events,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s WHERE s.creative_work_project_id=5 AND s.selected=1) selected_evidence,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id WHERE s.creative_work_project_id=5 AND s.selected=1 AND e.event_type IN ('setup','process','milestone','result','lesson','mistake','repair')) selected_execution_evidence,
 (SELECT COUNT(*) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id='5') content_packages,
 (SELECT COUNT(*) FROM content_project_deliverables d WHERE d.content_project_id=23 AND d.approval_status='approved' AND d.copy_locked=1) approved_locked_deliverables,
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=23) publications,
 (SELECT COUNT(*) FROM social_post_queue WHERE source_type IN ('content_project','creative_project') AND CAST(source_id AS TEXT) IN ('23','5')) social_rows
FROM creative_work_projects p
JOIN creative_project_maker_story_profiles m ON m.creative_work_project_id=p.creative_work_project_id
WHERE p.creative_work_project_id=5 AND p.project_key='CP-MSC1SUG2' AND p.project_title='35th promo';

-- 2: active factual timeline evidence (planning excluded from completeness).
SELECT creative_work_event_id,event_type,event_title,event_notes,occurred_at,duration_minutes,
 COALESCE(media_url,'') media_url,COALESCE(is_public_candidate,0) is_public_candidate,COALESCE(created_by,0) created_by
FROM creative_work_events
WHERE creative_work_project_id=5 AND COALESCE(entry_status,'active')='active'
ORDER BY occurred_at,creative_work_event_id;

-- 3: identity and safety integrity.
SELECT
 (SELECT COUNT(*) FROM creative_work_projects WHERE creative_work_project_id=5 AND project_key='CP-MSC1SUG2' AND project_title='35th promo') exact_project_identity,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5) maker_profiles,
 (SELECT COUNT(*) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='5' AND project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='5') content_packages,
 (SELECT COUNT(*) FROM creative_work_events WHERE creative_work_project_id=5 AND COALESCE(entry_status,'active')='active' AND event_type IN ('setup','process','milestone','result','lesson','mistake','repair') AND (TRIM(COALESCE(media_url,''))<>'' OR COALESCE(is_public_candidate,0)<>0)) execution_rows_with_public_or_media_flags,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
