-- Release 467 Build 326 — Development-only 35th promo real-outcome evidence closure.
-- Read-only. No evidence fabrication, story review, public candidacy, publication or media-rights mutation.

-- 1: exact target, factual events and Maker Story facts.
SELECT
 p.creative_work_project_id,p.project_key,p.project_title,p.project_status,
 m.story_kind,m.story_review_status,m.public_story_candidate,m.outcome_status,
 COALESCE(m.what_we_are_trying,'') what_we_are_trying,
 COALESCE(m.why_we_are_trying_it,'') why_we_are_trying_it,
 COALESCE(m.actual_result,'') actual_result,
 COALESCE(m.lesson_learned,'') lesson_learned,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type IN ('setup','process','milestone','mistake','repair')) execution_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type='result') result_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type='lesson') lesson_events,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id WHERE s.creative_work_project_id=5 AND s.selected=1 AND e.event_type IN ('setup','process','milestone','mistake','repair','result','lesson')) selected_execution_evidence,
 (SELECT COUNT(*) FROM content_project_deliverables d WHERE d.content_project_id=23 AND d.approval_status='approved' AND d.copy_locked=1) approved_locked_deliverables,
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=23) publications,
 (SELECT COUNT(*) FROM social_post_queue WHERE source_type IN ('content_project','creative_project') AND CAST(source_id AS TEXT) IN ('23','5')) social_rows
FROM creative_work_projects p
JOIN creative_project_maker_story_profiles m ON m.creative_work_project_id=p.creative_work_project_id
WHERE p.creative_work_project_id=5 AND p.project_key='CP-MSC1SUG2' AND p.project_title='35th promo';

-- 2: real active factual evidence rows; planning is intentionally excluded.
SELECT creative_work_event_id,event_type,event_title,event_notes,occurred_at,duration_minutes,
 COALESCE(media_url,'') media_url,COALESCE(is_public_candidate,0) is_public_candidate,COALESCE(created_by,0) created_by
FROM creative_work_events
WHERE creative_work_project_id=5
  AND COALESCE(entry_status,'active')='active'
  AND event_type IN ('setup','process','milestone','mistake','repair','result','lesson')
ORDER BY occurred_at,creative_work_event_id;

-- 3: Build 319 intake traceability and explicit review-decision trace.
SELECT
 (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='creative_process_record_story_execution_evidence' AND target_type='creative_work_project' AND target_id=5) execution_intake_audits,
 COALESCE((SELECT MAX(created_at) FROM admin_action_audit WHERE action_type='creative_process_record_story_execution_evidence' AND target_type='creative_work_project' AND target_id=5),'') latest_execution_intake_audit_at,
 COALESCE((SELECT json_extract(source_snapshot_json,'$.maker_story_review_decision') FROM creative_projects WHERE source_type='creative_work_project' AND source_id='5' AND project_status<>'archived' LIMIT 1),'') prior_review_decision,
 COALESCE((SELECT json_extract(source_snapshot_json,'$.maker_story_reviewed_at') FROM creative_projects WHERE source_type='creative_work_project' AND source_id='5' AND project_status<>'archived' LIMIT 1),'') prior_reviewed_at;

-- 4: identity and public/media/integrity boundary.
SELECT
 (SELECT COUNT(*) FROM creative_work_projects WHERE creative_work_project_id=5 AND project_key='CP-MSC1SUG2' AND project_title='35th promo') exact_project_identity,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5) maker_profiles,
 (SELECT COUNT(*) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='5' AND project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='5') content_packages,
 (SELECT COUNT(*) FROM creative_work_events WHERE creative_work_project_id=5 AND COALESCE(entry_status,'active')='active' AND event_type IN ('setup','process','milestone','mistake','repair','result','lesson') AND (TRIM(COALESCE(media_url,''))<>'' OR COALESCE(is_public_candidate,0)<>0)) execution_rows_with_public_or_media_flags,
 (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived') AND ca.source_safety_status='public_allowed') public_allowed_caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived') AND f.consent_state='public_allowed' AND f.rights_status='public_allowed') public_allowed_private_uploads,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
