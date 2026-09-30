-- Release 467 Build 302 — read-only evidence/public-safety discovery for the adopted real Maker Story.
-- No DDL, no mutation, no Production D1 contact.

-- 1: exact adopted Maker Story and identity boundary.
SELECT
  p.creative_work_project_id,p.project_key,p.project_title,p.project_status,
  m.story_kind,m.outcome_status,m.story_review_status,m.public_story_candidate,
  (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') caip_workspace_count,
  (SELECT COUNT(*) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) content_package_count,
  (SELECT COUNT(*) FROM creative_project_evidence_selections s WHERE s.creative_work_project_id=p.creative_work_project_id AND s.selected=1) selected_evidence_count
FROM creative_work_projects p
JOIN creative_project_maker_story_profiles m ON m.creative_work_project_id=p.creative_work_project_id
WHERE p.creative_work_project_id=7 AND p.project_key='CP-MSXCYQB6' AND p.project_title='Under the Sea';

-- 2: factual active timeline available for evidence selection.
SELECT
  e.creative_work_event_id,e.event_type,e.event_title,COALESCE(e.event_notes,'') event_notes,
  COALESCE(e.material_name,'') material_name,COALESCE(e.material_quantity,0) material_quantity,
  COALESCE(e.material_unit,'') material_unit,COALESCE(e.media_url,'') media_url,
  COALESCE(e.is_public_candidate,0) is_public_candidate,e.occurred_at
FROM creative_work_events e
WHERE e.creative_work_project_id=7 AND COALESCE(e.entry_status,'active')='active'
ORDER BY e.occurred_at,e.creative_work_event_id;

-- 3: existing evidence selections before Build 302 adoption.
SELECT *
FROM creative_project_evidence_selections
WHERE creative_work_project_id=7
ORDER BY creative_work_event_id;

-- 4: CAIP asset rights/safety states for the exact linked workspace.
SELECT
  ca.creative_asset_id,ca.source_safety_status,ca.rights_status,ca.asset_status,ca.media_type,
  COALESCE(ca.is_source_selected,0) is_source_selected,COALESCE(ca.is_source_featured,0) is_source_featured
FROM creative_assets ca
WHERE ca.creative_project_id=(
  SELECT MIN(cp.creative_project_id) FROM creative_projects cp
  WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived'
)
ORDER BY ca.creative_asset_id;

-- 5: private-upload consent/rights aggregate; do not expose filenames/object keys.
SELECT
  COUNT(*) upload_file_count,
  SUM(CASE WHEN COALESCE(privacy_state,'') IN ('private','internal','internal_only') THEN 1 ELSE 0 END) private_or_internal_count,
  SUM(CASE WHEN consent_state='public_allowed' THEN 1 ELSE 0 END) public_consent_count,
  SUM(CASE WHEN rights_status='public_allowed' THEN 1 ELSE 0 END) public_rights_count,
  SUM(CASE WHEN consent_state='public_allowed' AND rights_status='public_allowed' THEN 1 ELSE 0 END) fully_public_allowed_count,
  SUM(CASE WHEN rights_status='blocked' THEN 1 ELSE 0 END) blocked_rights_count
FROM caip_media_upload_files
WHERE creative_project_id=(
  SELECT MIN(cp.creative_project_id) FROM creative_projects cp
  WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived'
);

-- 6: downstream/public boundary must remain untouched during discovery.
SELECT
  (SELECT COUNT(*) FROM content_publications pub JOIN content_projects cp ON cp.content_project_id=pub.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='7') publications,
  (SELECT COUNT(*) FROM content_project_deliverables d JOIN content_projects cp ON cp.content_project_id=d.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='7' AND d.approval_status='approved') approved_deliverables,
  (SELECT COUNT(*) FROM social_post_queue WHERE source_type IN ('content_project','creative_project','workshop_journal')) social_rows_total,
  (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
