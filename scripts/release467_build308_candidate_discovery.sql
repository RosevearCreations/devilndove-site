-- Release 467 Build 308 — bounded Development-only discovery for the second real Maker Story.
-- Read-only. No story/evidence/media/publication mutation.

-- 1: candidate project readiness (exclude the already-adopted Under the Sea project 7).
SELECT
 p.creative_work_project_id,p.project_key,p.project_title,p.project_type,p.project_status,
 COALESCE(p.summary,'') summary,COALESCE(p.objective,'') objective,COALESCE(p.story_angle,'') story_angle,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active') active_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type='planning') planning_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type='material') material_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type IN ('process','setup','milestone','result','lesson','mistake','repair')) process_result_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND TRIM(COALESCE(e.event_title,''))<>'') titled_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND TRIM(COALESCE(e.media_url,''))='' AND COALESCE(e.is_public_candidate,0)=0) safe_text_events,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=p.creative_work_project_id) maker_profiles,
 (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) content_packages,
 (SELECT COUNT(*) FROM content_project_deliverables d JOIN content_projects cp ON cp.content_project_id=d.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) deliverables,
 (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND ca.asset_status<>'archived') caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT))) private_upload_files
FROM creative_work_projects p
WHERE COALESCE(p.project_status,'')<>'archived' AND p.creative_work_project_id<>7
ORDER BY
  CASE WHEN (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active')>0 THEN 0 ELSE 1 END,
  (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active') DESC,
  p.creative_work_project_id;

-- 2: all factual timeline rows for remaining active projects.
SELECT e.creative_work_event_id,e.creative_work_project_id,e.event_type,COALESCE(e.event_title,'') event_title,
 COALESCE(e.event_notes,'') event_notes,COALESCE(e.material_name,'') material_name,
 COALESCE(e.material_quantity,0) material_quantity,COALESCE(e.material_unit,'') material_unit,
 COALESCE(e.media_url,'') media_url,COALESCE(e.is_public_candidate,0) is_public_candidate,
 COALESCE(e.occurred_at,'') occurred_at
FROM creative_work_events e
JOIN creative_work_projects p ON p.creative_work_project_id=e.creative_work_project_id
WHERE COALESCE(p.project_status,'')<>'archived' AND p.creative_work_project_id<>7 AND COALESCE(e.entry_status,'active')='active'
ORDER BY e.creative_work_project_id,e.occurred_at,e.creative_work_event_id;

-- 3: identity and existing evidence safety.
SELECT
 (SELECT COUNT(*) FROM creative_work_projects WHERE COALESCE(project_status,'')<>'archived') active_projects,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles) maker_story_profiles,
 (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project') content_packages,
 (SELECT COUNT(*) FROM (SELECT source_id,COUNT(*) n FROM creative_projects WHERE source_type='creative_work_project' AND project_status<>'archived' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_caip_source_identities,
 (SELECT COUNT(*) FROM (SELECT source_id,COUNT(*) n FROM content_projects WHERE source_type='creative_project' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_content_source_identities,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
