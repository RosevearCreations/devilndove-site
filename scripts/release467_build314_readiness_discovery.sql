-- Release 467 Build 314 — Development-only second-story publication readiness and review-queue continuity.
-- Read-only. No publication/social mutation, provider execution, schema/R2 mutation, or Production D1 contact.

-- 1: second-story factual publication prerequisites and Build 313 decision traceability.
SELECT
 p.creative_work_project_id,p.project_key,p.project_title,
 m.story_review_status,m.public_story_candidate,m.outcome_status,m.actual_result,m.lesson_learned,
 json_extract(cp.source_snapshot_json,'$.maker_story_review_decision_build') review_decision_build,
 json_extract(cp.source_snapshot_json,'$.maker_story_review_decision') review_decision,
 json_extract(cp.source_snapshot_json,'$.maker_story_media_rights_scope') media_rights_scope,
 json_extract(cp.source_snapshot_json,'$.maker_story_approved_copy_authorizes_publication') approved_copy_authorizes_publication,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active') active_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type='planning') planning_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type<>'planning') non_planning_events,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id WHERE s.creative_work_project_id=5 AND s.selected=1) selected_evidence,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id WHERE s.creative_work_project_id=5 AND s.selected=1 AND e.event_type<>'planning') selected_execution_evidence,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND approval_status='approved' AND copy_locked=1) approved_locked_deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND approval_status='changes_requested') changes_requested_deliverables,
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=23) publications,
 (SELECT COUNT(*) FROM social_post_queue sp JOIN content_publications pub ON sp.source_type='workshop_journal' AND sp.source_id=CAST(pub.content_publication_id AS TEXT) WHERE pub.content_project_id=23) social_rows
FROM creative_work_projects p
JOIN creative_project_maker_story_profiles m ON m.creative_work_project_id=p.creative_work_project_id
JOIN creative_projects cp ON cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived'
WHERE p.creative_work_project_id=5 AND p.project_key='CP-MSC1SUG2' AND p.project_title='35th promo';

-- 2: Content Studio review queue source-state continuity.
SELECT deliverable_key,approval_status,copy_locked
FROM content_project_deliverables
WHERE content_project_id=23
ORDER BY deliverable_key;

-- 3: accepted first-story continuity plus global integrity.
SELECT
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=22 AND destination='workshop_journal' AND content_status='published') first_story_published_journal_rows,
 (SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' AND approval_status='approved' AND post_status='ready' AND COALESCE(api_publish_mode,'')='review_first') first_story_review_first_social_rows,
 (SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' AND (post_status='posted' OR published_at IS NOT NULL)) first_story_posted_social_rows,
 (SELECT COUNT(*) FROM (SELECT source_id FROM content_projects WHERE source_type='creative_project' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_content_source_identities,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
