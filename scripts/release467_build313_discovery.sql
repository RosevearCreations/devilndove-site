-- Release 467 Build 313 — Development-only second Maker Story review decision discovery.
-- Read-only discovery. No schema, publication, provider, R2 or Production D1 action.

SELECT
 p.creative_work_project_id,p.project_key,p.project_title,p.project_status,
 m.story_kind,m.what_we_are_trying,m.why_we_are_trying_it,m.expected_result,
 m.actual_result,m.outcome_status,m.surprise_or_problem,m.lesson_learned,m.change_next_time,
 m.try_again_status,m.story_review_status,m.public_story_candidate,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active') active_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type='planning') planning_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type<>'planning') non_planning_events,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id WHERE s.creative_work_project_id=5 AND s.selected=1) selected_evidence,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id WHERE s.creative_work_project_id=5 AND s.selected=1 AND e.event_type<>'planning') selected_execution_evidence,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND approval_status='approved' AND copy_locked=1) approved_locked_copy,
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=23) publications,
 (SELECT COUNT(*) FROM social_post_queue sp JOIN content_publications pub ON sp.source_type='workshop_journal' AND sp.source_id=CAST(pub.content_publication_id AS TEXT) WHERE pub.content_project_id=23) social_rows,
 (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived')) caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived')) private_upload_files
FROM creative_work_projects p
JOIN creative_project_maker_story_profiles m ON m.creative_work_project_id=p.creative_work_project_id
WHERE p.creative_work_project_id=5 AND p.project_key='CP-MSC1SUG2' AND p.project_title='35th promo';

SELECT
 e.creative_work_event_id,e.event_type,e.event_title,COALESCE(e.event_notes,'') event_notes,
 COALESCE(e.media_url,'') media_url,COALESCE(e.is_public_candidate,0) event_public_candidate,
 COALESCE(s.evidence_role,'') evidence_role,COALESCE(s.selected,0) selected,COALESCE(s.review_notes,'') review_notes
FROM creative_work_events e
LEFT JOIN creative_project_evidence_selections s
 ON s.creative_work_project_id=e.creative_work_project_id AND s.creative_work_event_id=e.creative_work_event_id
WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active'
ORDER BY e.creative_work_event_id;

SELECT
 (SELECT COUNT(*) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='5' AND project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='5') content_packages,
 (SELECT COUNT(*) FROM (SELECT source_id FROM creative_projects WHERE source_type='creative_work_project' AND project_status<>'archived' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_caip_source_identities,
 (SELECT COUNT(*) FROM (SELECT source_id FROM content_projects WHERE source_type='creative_project' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_content_source_identities,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
