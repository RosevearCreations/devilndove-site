-- Release 467 Build 377: bounded, project-agnostic, read-only workflow routing proof.
-- No Product/CAIP/Creative Process writes; no schema migration; Development D1 only.
-- Statement 1: canonical ID, project lifecycle and source evidence state. At most 101 projects.
SELECT w.creative_work_project_id,w.project_key,w.project_title,w.project_status,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id) maker_story_profiles,
 COALESCE((SELECT MAX(m.story_review_status) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id),'') story_review_status,
 (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(w.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id AND COALESCE(e.entry_status,'active')='active') active_events,
 (SELECT COUNT(*) FROM creative_project_evidence_selections es WHERE es.creative_work_project_id=w.creative_work_project_id AND es.selected=1) selected_evidence_rows
FROM creative_work_projects w WHERE COALESCE(w.project_status,'active')<>'archived'
ORDER BY w.creative_work_project_id LIMIT 101;
-- Statement 2: total portfolio cardinality and FK safety independent of limited page.
SELECT
 (SELECT COUNT(*) FROM creative_work_projects WHERE COALESCE(project_status,'active')<>'archived') total_active_projects,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
