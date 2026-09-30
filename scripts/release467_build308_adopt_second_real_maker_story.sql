-- Release 467 Build 308 — bounded Development-only second real Maker Story adoption + factual evidence selection.
-- Discovery proved all four remaining Creative Projects have zero timeline events.
-- Project 5 (35th promo) has the richest existing project facts: summary + objective + story angle.
-- This script normalizes those existing facts into ONE text-only planning timeline source record,
-- adopts ONE Maker Story profile, and selects that exact event as internal evidence.
-- No media/public rights, Content Studio approval, publication, provider action or Production D1 contact.

-- 1: fail-closed exact existing project/identity preflight.
SELECT
 p.creative_work_project_id,p.project_key,p.project_title,p.project_type,p.project_status,
 COALESCE(p.summary,'') summary,COALESCE(p.objective,'') objective,COALESCE(p.story_angle,'') story_angle,
 (SELECT COUNT(*) FROM creative_work_events WHERE creative_work_project_id=5 AND COALESCE(entry_status,'active')='active') active_events_before,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5) maker_profiles_before,
 (SELECT COUNT(*) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='5' AND project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='5') content_packages,
 (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived')) caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived')) private_upload_files
FROM creative_work_projects p
WHERE p.creative_work_project_id=5 AND p.project_key='CP-MSC1SUG2' AND p.project_title='35th promo'
 AND p.summary='to showcase the diversity of our studio'
 AND TRIM(COALESCE(p.objective,''))<>''
 AND TRIM(COALESCE(p.story_angle,''))<>'';

-- 2: normalize the existing project brief into exactly one internal, text-only planning event.
INSERT INTO creative_work_events(
 creative_work_project_id,event_type,event_title,event_notes,occurred_at,duration_minutes,
 material_name,material_quantity,material_unit,material_cost_cents,media_url,is_public_candidate,created_by
)
SELECT
 5,'planning','35th promo - existing project brief',
 'Build 308 metadata normalization from the existing Creative Project only. Summary: '||TRIM(p.summary)||
 ' Objective: '||TRIM(p.objective)||' Story angle: '||TRIM(p.story_angle)||
 ' This is an internal source record; it does not claim execution, completion, results, lessons, media rights, or public approval.',
 CURRENT_TIMESTAMP,0,NULL,NULL,NULL,0,NULL,0,
 (SELECT user_id FROM users WHERE is_active=1 AND lower(trim(role))='admin' ORDER BY user_id ASC LIMIT 1)
FROM creative_work_projects p
WHERE p.creative_work_project_id=5 AND p.project_key='CP-MSC1SUG2' AND p.project_title='35th promo'
 AND 1=(SELECT COUNT(*) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='5' AND project_status<>'archived')
 AND 1=(SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='5')
 AND NOT EXISTS(
  SELECT 1 FROM creative_work_events
  WHERE creative_work_project_id=5 AND COALESCE(entry_status,'active')='active'
    AND event_type='planning' AND event_title='35th promo - existing project brief'
 );

-- 3: adopt one review-first Maker Story profile using only existing project facts.
INSERT INTO creative_project_maker_story_profiles(
 creative_work_project_id,story_kind,what_we_are_trying,why_we_are_trying_it,primary_inventory_process_id,
 expected_result,actual_result,outcome_status,surprise_or_problem,lesson_learned,change_next_time,
 try_again_status,story_review_status,public_story_candidate,updated_by_user_id,created_at,updated_at
)
SELECT
 5,'maker_story',
 'Create an event-souvenir set using colours significant to the event; the existing project objective records green and coral with a 35th wedding anniversary as the current example.',
 'The existing project summary says the purpose is to showcase the diversity of the studio.',
 NULL,
 'The existing story angle describes a completed example set that could demonstrate event souvenirs for birthdays, anniversaries, weddings or showers using significant colours.',
 'No execution or completed-result timeline is recorded yet. Build 308 adopts only the existing project brief and does not claim a finished result.',
 'unknown',
 'No problem or surprise is recorded in the existing project brief.',
 'No lesson is recorded yet; execution evidence is required before any lesson or result claim can be reviewed.',
 'Record actual execution, finished-result and lesson evidence before story review or public storytelling.',
 'undecided','needs_review',0,
 (SELECT user_id FROM users WHERE is_active=1 AND lower(trim(role))='admin' ORDER BY user_id ASC LIMIT 1),
 CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM creative_work_projects p
WHERE p.creative_work_project_id=5 AND p.project_key='CP-MSC1SUG2' AND p.project_title='35th promo'
 AND 1=(SELECT COUNT(*) FROM creative_work_events WHERE creative_work_project_id=5 AND COALESCE(entry_status,'active')='active' AND event_title='35th promo - existing project brief')
 AND NOT EXISTS(SELECT 1 FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5)
ON CONFLICT(creative_work_project_id) DO UPDATE SET
 story_kind=excluded.story_kind,what_we_are_trying=excluded.what_we_are_trying,
 why_we_are_trying_it=excluded.why_we_are_trying_it,expected_result=excluded.expected_result,
 actual_result=excluded.actual_result,outcome_status=excluded.outcome_status,
 surprise_or_problem=excluded.surprise_or_problem,lesson_learned=excluded.lesson_learned,
 change_next_time=excluded.change_next_time,try_again_status=excluded.try_again_status,
 story_review_status='needs_review',public_story_candidate=0,
 updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP;

-- 4: select exactly the normalized factual planning event as INTERNAL review evidence.
INSERT INTO creative_project_evidence_selections(
 creative_work_project_id,creative_work_event_id,evidence_role,selected,review_notes,reviewed_by,reviewed_at
)
SELECT
 5,e.creative_work_event_id,'process_evidence',1,
 'Build 308 factual planning evidence normalized from existing Creative Project summary/objective/story angle. Text-only internal review evidence; selection does not grant public-use or media rights.',
 (SELECT user_id FROM users WHERE is_active=1 AND lower(trim(role))='admin' ORDER BY user_id ASC LIMIT 1),
 CURRENT_TIMESTAMP
FROM creative_work_events e
WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active'
 AND e.event_type='planning' AND e.event_title='35th promo - existing project brief'
 AND COALESCE(e.is_public_candidate,0)=0 AND TRIM(COALESCE(e.media_url,''))=''
ON CONFLICT(creative_work_project_id,creative_work_event_id) DO UPDATE SET
 evidence_role='process_evidence',selected=1,
 review_notes=excluded.review_notes,reviewed_by=excluded.reviewed_by,reviewed_at=CURRENT_TIMESTAMP;

-- 5: refresh only the existing CAIP source snapshot; no new workspace/package/media.
UPDATE creative_projects
SET source_snapshot_json=json_set(
 CASE WHEN json_valid(COALESCE(source_snapshot_json,'')) THEN source_snapshot_json ELSE '{}' END,
 '$.maker_story',json_object(
   'creative_work_project_id',5,
   'story_kind','maker_story',
   'what_we_are_trying','Create an event-souvenir set using colours significant to the event; the existing project objective records green and coral with a 35th wedding anniversary as the current example.',
   'why_we_are_trying_it','The existing project summary says the purpose is to showcase the diversity of the studio.',
   'expected_result','The existing story angle describes a completed example set that could demonstrate event souvenirs for birthdays, anniversaries, weddings or showers using significant colours.',
   'actual_result','No execution or completed-result timeline is recorded yet. Build 308 adopts only the existing project brief and does not claim a finished result.',
   'outcome_status','unknown',
   'surprise_or_problem','No problem or surprise is recorded in the existing project brief.',
   'lesson_learned','No lesson is recorded yet; execution evidence is required before any lesson or result claim can be reviewed.',
   'change_next_time','Record actual execution, finished-result and lesson evidence before story review or public storytelling.',
   'try_again_status','undecided',
   'story_review_status','needs_review',
   'public_story_candidate',0
 ),
 '$.maker_story_adoption_build',308,
 '$.maker_story_evidence_scope','existing_project_metadata_normalized_to_internal_text_planning_event',
 '$.maker_story_media_rights_scope','separate_never_inferred'
),
updated_at=CURRENT_TIMESTAMP
WHERE source_type='creative_work_project' AND source_id='5' AND project_status<>'archived'
 AND EXISTS(SELECT 1 FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5);

-- 6: exact adopted profile + selected source record.
SELECT
 m.creative_work_project_id,m.story_kind,m.what_we_are_trying,m.why_we_are_trying_it,m.expected_result,
 m.actual_result,m.outcome_status,m.surprise_or_problem,m.lesson_learned,m.change_next_time,
 m.try_again_status,m.story_review_status,m.public_story_candidate,COALESCE(m.updated_by_user_id,0) updated_by_user_id,
 e.creative_work_event_id,e.event_type,e.event_title,e.event_notes,COALESCE(e.media_url,'') media_url,
 COALESCE(e.is_public_candidate,0) event_public_candidate,
 s.evidence_role,s.selected,s.review_notes
FROM creative_project_maker_story_profiles m
JOIN creative_work_events e ON e.creative_work_project_id=m.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_title='35th promo - existing project brief'
JOIN creative_project_evidence_selections s ON s.creative_work_project_id=m.creative_work_project_id AND s.creative_work_event_id=e.creative_work_event_id
WHERE m.creative_work_project_id=5;

-- 7: public/media/downstream safety boundary for project 5.
SELECT
 (SELECT COUNT(*) FROM creative_work_events WHERE creative_work_project_id=5 AND COALESCE(entry_status,'active')='active' AND COALESCE(is_public_candidate,0)=1) public_event_candidates,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5 AND public_story_candidate=1) public_story_candidates,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id AND e.creative_work_project_id=s.creative_work_project_id WHERE s.creative_work_project_id=5 AND s.selected=1 AND TRIM(COALESCE(e.media_url,''))<>'') selected_media_evidence,
 (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived')) caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived')) private_upload_files,
 (SELECT COUNT(*) FROM content_publications pub JOIN content_projects cp ON cp.content_project_id=pub.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='5') publications,
 (SELECT COUNT(*) FROM social_post_queue sp JOIN content_publications pub ON sp.source_type='workshop_journal' AND sp.source_id=CAST(pub.content_publication_id AS TEXT) JOIN content_projects cp ON cp.content_project_id=pub.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='5') social_rows;

-- 8: global identity/coverage integrity after second adoption.
SELECT
 (SELECT COUNT(*) FROM creative_work_projects WHERE COALESCE(project_status,'')<>'archived') active_projects,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles) maker_story_profiles,
 (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE selected=1) selected_evidence_rows,
 (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project') content_packages,
 (SELECT COUNT(*) FROM (SELECT source_id,COUNT(*) n FROM creative_projects WHERE source_type='creative_work_project' AND project_status<>'archived' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_caip_source_identities,
 (SELECT COUNT(*) FROM (SELECT source_id,COUNT(*) n FROM content_projects WHERE source_type='creative_project' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_content_source_identities,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
