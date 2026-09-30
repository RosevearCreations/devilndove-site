-- Release 467 Build 320 — Development-only Grey Hair source-evidence/story-plan readiness.
-- Read-only. CI performs no evidence approval, story review, Maker Story creation or media-rights mutation.

-- 1: exact Grey Hair identity and readiness counts.
SELECT
 w.creative_work_project_id,w.project_key,w.project_title,w.project_status,
 cp.creative_project_id caip_project_id,cp.creative_project_key caip_project_key,COALESCE(cp.content_project_id,0) content_project_id,
 (SELECT COUNT(*) FROM creative_assets a WHERE a.creative_project_id=cp.creative_project_id AND a.asset_status<>'archived') active_assets,
 (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=cp.creative_project_id AND r.marker_status='active') active_source_evidence,
 (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=cp.creative_project_id AND r.marker_status='active' AND r.review_status='approved') approved_source_evidence,
 (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=cp.creative_project_id AND r.marker_status='active' AND r.review_status='needs_review') source_evidence_needs_review,
 (SELECT COUNT(*) FROM caip_capture_groups g WHERE g.creative_project_id=cp.creative_project_id AND g.sync_status='confirmed') confirmed_capture_groups,
 (SELECT COUNT(*) FROM caip_capture_tracks t JOIN caip_capture_groups g ON g.caip_capture_group_id=t.caip_capture_group_id WHERE g.creative_project_id=cp.creative_project_id AND t.review_status='confirmed') confirmed_capture_tracks,
 (SELECT COUNT(*) FROM caip_story_builder_drafts d WHERE d.creative_project_id=cp.creative_project_id AND d.story_status IN ('review','approved')) reviewed_story_plans,
 (SELECT COUNT(*) FROM caip_story_builder_drafts d WHERE d.creative_project_id=cp.creative_project_id AND d.story_status='approved') approved_story_plans,
 (SELECT COUNT(*) FROM caip_story_builder_items i JOIN caip_story_builder_drafts d ON d.caip_story_builder_draft_id=i.caip_story_builder_draft_id WHERE d.creative_project_id=cp.creative_project_id AND d.story_status IN ('review','approved') AND i.creative_media_evidence_range_id IS NOT NULL) source_backed_story_items,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=6) maker_story_profiles,
 (SELECT COUNT(*) FROM creative_assets a WHERE a.creative_project_id=cp.creative_project_id AND a.source_safety_status='public_allowed') public_allowed_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=cp.creative_project_id AND f.consent_state='public_allowed' AND f.rights_status='public_allowed') public_allowed_uploads
FROM creative_work_projects w
JOIN creative_projects cp ON cp.source_type='creative_work_project' AND cp.source_id=CAST(w.creative_work_project_id AS TEXT) AND cp.project_status<>'archived'
WHERE w.creative_work_project_id=6 AND w.project_key='CP-MSUNAL8R' AND w.project_title='Grey Hair';

-- 2: active source-evidence review rows; intentionally excludes asset keys, filenames and private object locations.
SELECT creative_media_evidence_range_id,evidence_category,COALESCE(title,'') title,COALESCE(note_text,'') note_text,
 COALESCE(transcript_excerpt,'') transcript_excerpt,start_seconds,end_seconds,confidence_score,
 verification_status,review_status,visibility,story_candidate,marker_status,COALESCE(reviewed_at,'') reviewed_at
FROM creative_media_evidence_ranges
WHERE creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='6' AND cp.project_status<>'archived')
  AND marker_status='active'
ORDER BY CASE review_status WHEN 'approved' THEN 0 WHEN 'needs_review' THEN 1 ELSE 2 END,start_seconds,creative_media_evidence_range_id;

-- 3: story-plan review rows and source-backed item counts; no private source locations.
SELECT d.caip_story_builder_draft_id,d.story_key,d.title,d.story_status,
 COALESCE(d.opening_summary,'') opening_summary,COALESCE(d.lesson_summary,'') lesson_summary,COALESCE(d.recommendation_summary,'') recommendation_summary,
 COALESCE(d.reviewed_by_user_id,0) reviewed_by_user_id,COALESCE(d.reviewed_at,'') reviewed_at,
 (SELECT COUNT(*) FROM caip_story_builder_items i WHERE i.caip_story_builder_draft_id=d.caip_story_builder_draft_id) item_count,
 (SELECT COUNT(*) FROM caip_story_builder_items i WHERE i.caip_story_builder_draft_id=d.caip_story_builder_draft_id AND i.creative_media_evidence_range_id IS NOT NULL) source_backed_item_count
FROM caip_story_builder_drafts d
WHERE d.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='6' AND cp.project_status<>'archived')
ORDER BY datetime(d.updated_at) DESC,d.caip_story_builder_draft_id DESC;

-- 4: identity, private-media and relational integrity.
SELECT
 (SELECT COUNT(*) FROM creative_work_projects WHERE creative_work_project_id=6 AND project_key='CP-MSUNAL8R' AND project_title='Grey Hair') exact_work_identity,
 (SELECT COUNT(*) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='6' AND project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='6') content_packages,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=6) maker_story_profiles,
 (SELECT COUNT(*) FROM creative_assets a WHERE a.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='6' AND cp.project_status<>'archived') AND a.asset_status<>'archived' AND COALESCE(a.source_safety_status,'needs_review')<>'public_allowed') non_public_assets,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
