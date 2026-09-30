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


-- 4: Grey Hair private CAIP readiness and reviewed planning state.
SELECT
 w.creative_work_project_id,w.project_key,w.project_title,w.project_type,w.project_status,COALESCE(w.summary,'') summary,
 cp.creative_project_id caip_project_id,cp.creative_project_key caip_project_key,COALESCE(cp.content_project_id,0) caip_content_project_id,
 (SELECT COUNT(*) FROM creative_assets a WHERE a.creative_project_id=cp.creative_project_id AND a.asset_status<>'archived') active_assets,
 (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=cp.creative_project_id AND r.marker_status='active' AND r.review_status='approved') approved_source_evidence,
 (SELECT COUNT(*) FROM caip_semantic_evidence_annotations a JOIN creative_media_evidence_ranges r ON r.creative_media_evidence_range_id=a.creative_media_evidence_range_id WHERE r.creative_project_id=cp.creative_project_id AND r.marker_status='active' AND r.review_status='approved' AND a.review_status='approved') semantic_approved_evidence,
 (SELECT COUNT(*) FROM caip_capture_groups g WHERE g.creative_project_id=cp.creative_project_id AND g.sync_status='confirmed') confirmed_capture_groups,
 (SELECT COUNT(*) FROM caip_capture_tracks t JOIN caip_capture_groups g ON g.caip_capture_group_id=t.caip_capture_group_id WHERE g.creative_project_id=cp.creative_project_id AND t.review_status='confirmed') confirmed_capture_tracks,
 (SELECT COUNT(*) FROM caip_story_builder_drafts d WHERE d.creative_project_id=cp.creative_project_id AND d.story_status IN ('review','approved')) reviewed_story_plans,
 (SELECT COUNT(*) FROM caip_story_builder_drafts d WHERE d.creative_project_id=cp.creative_project_id AND d.story_status='approved') approved_story_plans,
 (SELECT COUNT(*) FROM caip_story_builder_items i JOIN caip_story_builder_drafts d ON d.caip_story_builder_draft_id=i.caip_story_builder_draft_id WHERE d.creative_project_id=cp.creative_project_id AND d.story_status IN ('review','approved')) reviewed_story_items,
 (SELECT COUNT(*) FROM caip_edit_timeline_drafts t WHERE t.creative_project_id=cp.creative_project_id AND t.timeline_status='approved') approved_edit_plans,
 (SELECT COUNT(*) FROM creative_assets a WHERE a.creative_project_id=cp.creative_project_id AND a.source_safety_status='public_allowed') public_allowed_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=cp.creative_project_id AND f.consent_state='public_allowed' AND f.rights_status='public_allowed') fully_public_allowed_uploads
FROM creative_work_projects w
JOIN creative_projects cp ON cp.source_type='creative_work_project' AND cp.source_id=CAST(w.creative_work_project_id AS TEXT) AND cp.project_status<>'archived'
WHERE w.creative_work_project_id=6 AND w.project_key='CP-MSUNAL8R' AND w.project_title='Grey Hair';

-- 5: reviewed private Grey Hair story-plan facts and source-backed evidence (no asset keys/filenames).
SELECT
 d.caip_story_builder_draft_id,d.story_key,d.title,d.story_status,COALESCE(d.opening_summary,'') opening_summary,
 COALESCE(d.lesson_summary,'') lesson_summary,COALESCE(d.recommendation_summary,'') recommendation_summary,
 COALESCE(d.reviewed_by_user_id,0) reviewed_by_user_id,COALESCE(d.reviewed_at,'') reviewed_at,
 i.caip_story_builder_item_id,i.item_role,COALESCE(i.item_title,'') item_title,COALESCE(i.item_text,'') item_text,
 r.creative_media_evidence_range_id,r.evidence_category,r.visibility,r.review_status evidence_review_status,
 r.marker_status,COALESCE(r.title,'') evidence_title,COALESCE(r.note_text,'') evidence_note,
 COALESCE(r.transcript_excerpt,'') transcript_excerpt
FROM caip_story_builder_drafts d
JOIN caip_story_builder_items i ON i.caip_story_builder_draft_id=d.caip_story_builder_draft_id
JOIN creative_media_evidence_ranges r ON r.creative_media_evidence_range_id=i.creative_media_evidence_range_id
WHERE d.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='6' AND cp.project_status<>'archived')
  AND d.story_status IN ('review','approved')
  AND r.marker_status='active' AND r.review_status='approved'
ORDER BY CASE d.story_status WHEN 'approved' THEN 0 ELSE 1 END,d.updated_at DESC,i.sort_order,i.caip_story_builder_item_id;
