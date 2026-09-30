-- Release 467 Build 302 — bounded Development-only factual evidence selection and public-safety adoption.
-- Discovery proved Project 7 has three active factual timeline entries, no attached media URLs,
-- zero CAIP assets and zero CAIP private-upload files. Evidence selection never grants public-use rights.
-- Idempotent. Never run against Production.

-- 1: fail-closed preflight over the exact adopted story and discovered safety state.
SELECT
  p.creative_work_project_id,p.project_key,p.project_title,
  m.story_kind,m.story_review_status,m.public_story_candidate,
  (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=7 AND COALESCE(e.entry_status,'active')='active') active_events,
  (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=7 AND COALESCE(e.entry_status,'active')='active' AND COALESCE(e.is_public_candidate,0)=0 AND TRIM(COALESCE(e.media_url,''))='') safe_text_events,
  (SELECT COUNT(*) FROM creative_project_evidence_selections s WHERE s.creative_work_project_id=7 AND s.selected=1) selected_evidence_before,
  (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived') AND ca.asset_status<>'archived') caip_assets,
  (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived')) private_upload_files
FROM creative_work_projects p
JOIN creative_project_maker_story_profiles m ON m.creative_work_project_id=p.creative_work_project_id
WHERE p.creative_work_project_id=7 AND p.project_key='CP-MSXCYQB6' AND p.project_title='Under the Sea';

-- 2: select the three already-existing factual timeline evidence rows.
UPDATE creative_project_evidence_selections
SET
  selected=1,
  evidence_role=CASE creative_work_event_id
    WHEN 1 THEN 'process_evidence'
    WHEN 2 THEN 'material_evidence'
    WHEN 3 THEN 'material_evidence'
    ELSE evidence_role END,
  review_notes=CASE creative_work_event_id
    WHEN 1 THEN 'Build 302 factual planning evidence. No media is attached. Selection is internal review evidence only and does not grant public-use rights.'
    WHEN 2 THEN 'Build 302 factual material-use evidence. No media is attached. Selection is internal review evidence only and does not grant public-use rights.'
    WHEN 3 THEN 'Build 302 factual material-use evidence. No media is attached. Selection is internal review evidence only and does not grant public-use rights.'
    ELSE review_notes END
WHERE creative_work_project_id=7
  AND creative_work_event_id IN (1,2,3)
  AND EXISTS(
    SELECT 1 FROM creative_project_maker_story_profiles m
    WHERE m.creative_work_project_id=7
      AND m.story_kind='maker_story'
      AND m.story_review_status='needs_review'
      AND m.public_story_candidate=0
  )
  AND 3=(SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=7 AND COALESCE(e.entry_status,'active')='active')
  AND 3=(SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=7 AND e.creative_work_event_id IN (1,2,3) AND COALESCE(e.entry_status,'active')='active' AND COALESCE(e.is_public_candidate,0)=0 AND TRIM(COALESCE(e.media_url,''))='')
  AND 0=(SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived') AND ca.asset_status<>'archived')
  AND 0=(SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived'));

-- 3: prove selected factual evidence content and roles.
SELECT
  s.creative_project_evidence_selection_id,s.creative_work_event_id,s.evidence_role,s.selected,s.review_notes,
  e.event_type,e.event_title,COALESCE(e.media_url,'') media_url,COALESCE(e.is_public_candidate,0) is_public_candidate
FROM creative_project_evidence_selections s
JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id AND e.creative_work_project_id=s.creative_work_project_id
WHERE s.creative_work_project_id=7 AND s.selected=1
ORDER BY s.creative_work_event_id;

-- 4: prove public-use permission was not inferred and no private media was exposed/reclassified.
SELECT
  (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=7 AND public_story_candidate=1) public_story_candidates,
  (SELECT COUNT(*) FROM creative_work_events WHERE creative_work_project_id=7 AND COALESCE(entry_status,'active')='active' AND COALESCE(is_public_candidate,0)=1) public_event_candidates,
  (SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id AND e.creative_work_project_id=s.creative_work_project_id WHERE s.creative_work_project_id=7 AND s.selected=1 AND TRIM(COALESCE(e.media_url,''))<>'') selected_media_evidence,
  (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived')) caip_asset_count,
  (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived') AND ca.source_safety_status='public_allowed') caip_public_allowed_assets,
  (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived')) private_upload_files,
  (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived') AND f.consent_state='public_allowed' AND f.rights_status='public_allowed') fully_public_allowed_uploads;

-- 5: prove authority uniqueness and Build 303/304 boundary.
SELECT
  (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=7 AND selected=1) selected_evidence,
  (SELECT COUNT(*) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='7' AND project_status<>'archived') caip_workspaces,
  (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='7') content_packages,
  (SELECT COUNT(*) FROM content_project_deliverables d JOIN content_projects cp ON cp.content_project_id=d.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='7' AND d.approval_status='approved') approved_deliverables,
  (SELECT COUNT(*) FROM content_publications pub JOIN content_projects cp ON cp.content_project_id=pub.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='7') publications,
  (SELECT COUNT(*) FROM social_post_queue WHERE source_type IN ('content_project','creative_project','workshop_journal')) social_rows_total,
  (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
