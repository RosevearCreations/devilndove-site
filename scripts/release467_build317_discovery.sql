-- Release 467 Build 317 — Development-only readiness discovery for a third real Maker Story.
-- Read-only. Select at most one only after factual readiness is measured.

-- 1: remaining unprofiled active projects and readiness counts.
SELECT
 p.creative_work_project_id,p.project_key,p.project_title,p.project_type,p.project_status,
 COALESCE(p.summary,'') summary,COALESCE(p.objective,'') objective,COALESCE(p.story_angle,'') story_angle,
 (CASE WHEN trim(COALESCE(p.summary,''))<>'' THEN 1 ELSE 0 END+
  CASE WHEN trim(COALESCE(p.objective,''))<>'' THEN 1 ELSE 0 END+
  CASE WHEN trim(COALESCE(p.story_angle,''))<>'' THEN 1 ELSE 0 END) project_fact_fields,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active') active_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type='planning') planning_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type<>'planning') non_planning_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type IN ('material','process','setup','milestone','result','lesson','mistake','repair')) execution_result_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND trim(COALESCE(e.event_title,''))<>'' AND trim(COALESCE(e.media_url,''))='' AND COALESCE(e.is_public_candidate,0)=0) safe_text_events,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s WHERE s.creative_work_project_id=p.creative_work_project_id AND s.selected=1) selected_evidence,
 (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) content_packages,
 (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND r.marker_status='active' AND r.review_status='approved') approved_source_evidence,
 (SELECT COUNT(*) FROM caip_story_builder_drafts d WHERE d.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND d.story_status IN ('review','approved')) reviewed_story_plans,
 (SELECT COUNT(*) FROM caip_story_builder_items i JOIN caip_story_builder_drafts d ON d.caip_story_builder_draft_id=i.caip_story_builder_draft_id WHERE d.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND d.story_status IN ('review','approved') AND i.creative_media_evidence_range_id IS NOT NULL) source_backed_story_items,
 (SELECT COUNT(*) FROM creative_assets a WHERE a.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND a.asset_status<>'archived') active_caip_assets,
 (SELECT COUNT(*) FROM creative_assets a WHERE a.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND a.asset_status<>'archived' AND a.source_safety_status='public_allowed') public_allowed_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT))) private_upload_files,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) AND f.consent_state='public_allowed' AND f.rights_status='public_allowed') public_allowed_uploads
FROM creative_work_projects p
LEFT JOIN creative_project_maker_story_profiles m ON m.creative_work_project_id=p.creative_work_project_id
WHERE COALESCE(p.project_status,'')<>'archived' AND m.creative_work_project_id IS NULL
ORDER BY p.creative_work_project_id;

-- 2: factual timeline rows for remaining unprofiled projects.
SELECT e.creative_work_event_id,e.creative_work_project_id,e.event_type,COALESCE(e.event_title,'') event_title,
 COALESCE(e.event_notes,'') event_notes,COALESCE(e.material_name,'') material_name,
 COALESCE(e.material_quantity,0) material_quantity,COALESCE(e.material_unit,'') material_unit,
 COALESCE(e.media_url,'') media_url,COALESCE(e.is_public_candidate,0) is_public_candidate,COALESCE(e.occurred_at,'') occurred_at
FROM creative_work_events e
JOIN creative_work_projects p ON p.creative_work_project_id=e.creative_work_project_id
LEFT JOIN creative_project_maker_story_profiles m ON m.creative_work_project_id=p.creative_work_project_id
WHERE COALESCE(p.project_status,'')<>'archived' AND m.creative_work_project_id IS NULL AND COALESCE(e.entry_status,'active')='active'
ORDER BY e.creative_work_project_id,e.occurred_at,e.creative_work_event_id;

-- 3: global one-to-one identity and selected-evidence integrity.
SELECT
 (SELECT COUNT(*) FROM creative_work_projects WHERE COALESCE(project_status,'')<>'archived') active_projects,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles) maker_story_profiles,
 (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE selected=1) selected_evidence_rows,
 (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project') content_packages,
 (SELECT COUNT(*) FROM (SELECT source_id FROM creative_projects WHERE source_type='creative_work_project' AND project_status<>'archived' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_caip_source_identities,
 (SELECT COUNT(*) FROM (SELECT source_id FROM content_projects WHERE source_type='creative_project' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_content_source_identities,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
