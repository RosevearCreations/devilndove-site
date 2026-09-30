-- Release 467 Build 313 — explicit Development-only human review decision for 35th promo.
-- Decision: remain needs_review / not public candidate until execution, actual-result and lesson evidence exists.
-- This is idempotent and does not alter result/lesson claims, media rights, publications or social rows.

-- 1: fail-closed exact preflight.
SELECT
 m.creative_work_project_id,m.story_kind,m.story_review_status,m.public_story_candidate,m.outcome_status,
 m.actual_result,m.lesson_learned,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active') active_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type='planning') planning_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type<>'planning') non_planning_events,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id WHERE s.creative_work_project_id=5 AND s.selected=1) selected_evidence,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id WHERE s.creative_work_project_id=5 AND s.selected=1 AND e.event_type<>'planning') selected_execution_evidence,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND approval_status='approved' AND copy_locked=1) approved_locked_copy,
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=23) publications
FROM creative_project_maker_story_profiles m
WHERE m.creative_work_project_id=5 AND m.story_kind='maker_story';

-- 2: record the explicit review decision on the existing profile without inventing result/lesson content.
UPDATE creative_project_maker_story_profiles
SET story_review_status='needs_review',
    public_story_candidate=0,
    updated_by_user_id=(SELECT user_id FROM users WHERE is_active=1 AND lower(trim(role))='admin' ORDER BY user_id ASC LIMIT 1),
    updated_at=CURRENT_TIMESTAMP
WHERE creative_work_project_id=5
  AND story_kind='maker_story'
  AND outcome_status='unknown'
  AND story_review_status='needs_review'
  AND public_story_candidate=0
  AND 1=(SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type='planning')
  AND 0=(SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type<>'planning')
  AND 1=(SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id WHERE s.creative_work_project_id=5 AND s.selected=1)
  AND 0=(SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id WHERE s.creative_work_project_id=5 AND s.selected=1 AND e.event_type<>'planning')
  AND 2=(SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND approval_status='approved' AND copy_locked=1)
  AND 0=(SELECT COUNT(*) FROM content_publications WHERE content_project_id=23);

-- 3: persist review-decision traceability only in the existing CAIP source snapshot.
UPDATE creative_projects
SET source_snapshot_json=json_set(
      CASE WHEN json_valid(COALESCE(source_snapshot_json,'')) THEN source_snapshot_json ELSE '{}' END,
      '$.maker_story.story_review_status','needs_review',
      '$.maker_story.public_story_candidate',0,
      '$.maker_story_review_decision_build',313,
      '$.maker_story_review_decision','REMAIN_NEEDS_REVIEW_PENDING_EXECUTION_RESULT_LESSON_EVIDENCE',
      '$.maker_story_review_reason','Planning-only evidence remains; no execution event, completed-result evidence, resolved outcome, or execution-derived lesson is recorded.',
      '$.maker_story_review_scope','story_text_only_no_media_rights',
      '$.maker_story_media_rights_scope','separate_never_inferred',
      '$.maker_story_approved_copy_authorizes_publication',0,
      '$.maker_story_review_actor_user_id',(SELECT user_id FROM users WHERE is_active=1 AND lower(trim(role))='admin' ORDER BY user_id ASC LIMIT 1),
      '$.maker_story_reviewed_at',CURRENT_TIMESTAMP
    ),
    updated_at=CURRENT_TIMESTAMP
WHERE source_type='creative_work_project' AND source_id='5' AND project_status<>'archived'
  AND 1=(SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5 AND story_review_status='needs_review' AND public_story_candidate=0 AND outcome_status='unknown');

-- 4: exact decision state and snapshot traceability.
SELECT
 m.story_review_status,m.public_story_candidate,m.outcome_status,m.actual_result,m.lesson_learned,
 COALESCE(m.updated_by_user_id,0) review_actor_user_id,COALESCE(m.updated_at,'') profile_updated_at,
 json_extract(cp.source_snapshot_json,'$.maker_story_review_decision_build') review_decision_build,
 json_extract(cp.source_snapshot_json,'$.maker_story_review_decision') review_decision,
 json_extract(cp.source_snapshot_json,'$.maker_story_review_reason') review_reason,
 json_extract(cp.source_snapshot_json,'$.maker_story_review_scope') review_scope,
 json_extract(cp.source_snapshot_json,'$.maker_story_media_rights_scope') media_rights_scope,
 json_extract(cp.source_snapshot_json,'$.maker_story_approved_copy_authorizes_publication') approved_copy_authorizes_publication,
 json_extract(cp.source_snapshot_json,'$.maker_story_review_actor_user_id') snapshot_review_actor_user_id,
 json_extract(cp.source_snapshot_json,'$.maker_story_reviewed_at') snapshot_reviewed_at
FROM creative_project_maker_story_profiles m
JOIN creative_projects cp ON cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived'
WHERE m.creative_work_project_id=5;

-- 5: downstream/public/media safety remains unchanged.
SELECT
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=23) publications,
 (SELECT COUNT(*) FROM social_post_queue sp JOIN content_publications pub ON sp.source_type='workshop_journal' AND sp.source_id=CAST(pub.content_publication_id AS TEXT) WHERE pub.content_project_id=23) social_rows,
 (SELECT COUNT(*) FROM creative_work_events WHERE creative_work_project_id=5 AND COALESCE(entry_status,'active')='active' AND COALESCE(is_public_candidate,0)=1) public_event_candidates,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id WHERE s.creative_work_project_id=5 AND s.selected=1 AND TRIM(COALESCE(e.media_url,''))<>'') selected_media_evidence,
 (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived') AND ca.source_safety_status='public_allowed') public_allowed_caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived') AND f.consent_state='public_allowed' AND f.rights_status='public_allowed') public_allowed_private_uploads,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
