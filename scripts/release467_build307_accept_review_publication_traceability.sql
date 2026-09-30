-- Release 467 Build 307 — Development-only Maker Story review-state and publication traceability acceptance.
-- Explicitly reconciles reviewed factual story text with existing human-approved publication.
-- Public-story candidacy NEVER grants media/public-use rights. No provider action. Idempotent.

-- 1: fail-closed real-path preflight.
SELECT
 m.creative_work_project_id,m.story_kind,m.story_review_status,m.public_story_candidate,
 (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=7 AND selected=1) selected_evidence,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND approval_status='approved') approved_copy,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND copy_locked=1) locked_copy,
 (SELECT COUNT(*) FROM content_publications WHERE publication_key='content-project-22-workshop_journal' AND content_status='published') published_journal,
 (SELECT COALESCE(approved_by_user_id,0) FROM content_publications WHERE publication_key='content-project-22-workshop_journal' LIMIT 1) publication_approved_by_user_id,
 (SELECT COALESCE(published_by_user_id,0) FROM content_publications WHERE publication_key='content-project-22-workshop_journal' LIMIT 1) publication_published_by_user_id,
 (SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' AND approval_status='approved' AND post_status='ready' AND COALESCE(api_publish_mode,'')='review_first') social_ready_review_first
FROM creative_project_maker_story_profiles m
WHERE m.creative_work_project_id=7 AND m.story_kind='maker_story';

-- 2: reconcile story-level review/public-candidate state from the already explicit human-approved text publication.
UPDATE creative_project_maker_story_profiles
SET story_review_status='reviewed',
    public_story_candidate=1,
    updated_by_user_id=(SELECT COALESCE(published_by_user_id,approved_by_user_id) FROM content_publications WHERE publication_key='content-project-22-workshop_journal' AND content_status='published' LIMIT 1),
    updated_at=CURRENT_TIMESTAMP
WHERE creative_work_project_id=7
  AND story_kind='maker_story'
  AND 3=(SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=7 AND selected=1)
  AND 2=(SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND approval_status='approved' AND copy_locked=1)
  AND 1=(SELECT COUNT(*) FROM content_publications WHERE publication_key='content-project-22-workshop_journal' AND content_status='published' AND approved_by_user_id IS NOT NULL AND published_by_user_id IS NOT NULL)
  AND 1=(SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' AND approval_status='approved' AND post_status='ready' AND COALESCE(api_publish_mode,'')='review_first');

-- 3: refresh only review traceability in the existing CAIP source snapshot; do not alter media rights.
UPDATE creative_projects
SET source_snapshot_json=json_set(
      CASE WHEN json_valid(COALESCE(source_snapshot_json,'')) THEN source_snapshot_json ELSE '{}' END,
      '$.maker_story.story_review_status','reviewed',
      '$.maker_story.public_story_candidate',1,
      '$.maker_story_review_traceability_build',307,
      '$.maker_story_public_candidate_scope','reviewed_factual_story_text_only',
      '$.maker_story_media_rights_scope','separate_never_inferred'
    ),
    updated_at=CURRENT_TIMESTAMP
WHERE source_type='creative_work_project' AND source_id='7'
  AND EXISTS(SELECT 1 FROM creative_project_maker_story_profiles WHERE creative_work_project_id=7 AND story_review_status='reviewed' AND public_story_candidate=1);

-- 4: exact reconciled story/copy/publication authority.
SELECT
 m.story_review_status,m.public_story_candidate,COALESCE(m.updated_by_user_id,0) profile_review_actor_user_id,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND approval_status='approved') approved_copy_count,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND copy_locked=1) locked_copy_count,
 (SELECT COUNT(*) FROM content_publications WHERE publication_key='content-project-22-workshop_journal' AND content_status='published') published_journal_count,
 (SELECT COALESCE(approved_by_user_id,0) FROM content_publications WHERE publication_key='content-project-22-workshop_journal' LIMIT 1) publication_approved_by_user_id,
 (SELECT COALESCE(published_by_user_id,0) FROM content_publications WHERE publication_key='content-project-22-workshop_journal' LIMIT 1) publication_published_by_user_id,
 (SELECT COALESCE(approved_at,'') FROM content_publications WHERE publication_key='content-project-22-workshop_journal' LIMIT 1) publication_approved_at,
 (SELECT COALESCE(published_at,'') FROM content_publications WHERE publication_key='content-project-22-workshop_journal' LIMIT 1) publication_published_at
FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=7;

-- 5: prove media/public-use rights were NOT back-propagated.
SELECT
 (SELECT COUNT(*) FROM creative_work_events WHERE creative_work_project_id=7 AND COALESCE(entry_status,'active')='active' AND COALESCE(is_public_candidate,0)=1) public_event_candidates,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id AND e.creative_work_project_id=s.creative_work_project_id WHERE s.creative_work_project_id=7 AND s.selected=1 AND TRIM(COALESCE(e.media_url,''))<>'') selected_media_evidence,
 (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived') AND ca.source_safety_status='public_allowed') public_allowed_caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived') AND f.consent_state='public_allowed' AND f.rights_status='public_allowed') public_allowed_private_uploads,
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=22 AND destination='website_gallery') website_gallery_rows;

-- 6: identity/social/provider boundary.
SELECT
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=7) maker_story_profiles,
 (SELECT COUNT(*) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='7' AND project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='7') content_packages,
 (SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' AND approval_status='approved' AND post_status='ready' AND COALESCE(api_publish_mode,'')='review_first') review_first_social_ready,
 (SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' AND (post_status='posted' OR published_at IS NOT NULL)) posted_social_rows,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
