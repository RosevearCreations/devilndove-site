-- Release 467 Build 301 — bounded Development-only adoption of the first real Maker Story.
-- Project 7 was selected from read-only Build 301 discovery because its real timeline records
-- planning plus two material-use events. No finished-result event is recorded.
-- This script is idempotent and must never run against Production.

-- 1: preflight exact real-project facts and authority.
SELECT p.creative_work_project_id,p.project_key,p.project_title,p.project_type,p.project_status,p.summary,
  (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active') active_events,
  (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type='planning') planning_events,
  (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=p.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type='material') material_events,
  (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) caip_workspaces,
  (SELECT COUNT(*) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) content_packages,
  (SELECT COUNT(*) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=p.creative_work_project_id) existing_profiles
FROM creative_work_projects p
WHERE p.creative_work_project_id=7 AND p.project_key='CP-MSXCYQB6' AND p.project_title='Under the Sea'
  AND p.summary='Loaf soap with sea creatures';

-- 2: insert exactly one complete factual Maker Story if it is still absent.
INSERT INTO creative_project_maker_story_profiles(
  creative_work_project_id,story_kind,what_we_are_trying,why_we_are_trying_it,primary_inventory_process_id,
  expected_result,actual_result,outcome_status,surprise_or_problem,lesson_learned,change_next_time,
  try_again_status,story_review_status,public_story_candidate,updated_by_user_id,created_at,updated_at
)
SELECT
  7,
  'maker_story',
  'Make an Under the Sea loaf soap with sea creatures.',
  'The existing Creative Project is named Under the Sea and its recorded concept is a loaf soap with sea creatures.',
  NULL,
  'A loaf soap with sea creatures.',
  'The project timeline records planning and two material-use entries for Velona 5 LB Goat''s Milk Soap Base. No finished-result entry is recorded yet.',
  'partial_win',
  'No problem or surprise is recorded in the current project timeline.',
  'The current record documents real material-use progress, but a finished-result entry is still needed before this story should be treated as a completed public result.',
  'Record the finished result and any observed problem or lesson in the project timeline before public review.',
  'undecided',
  'needs_review',
  0,
  NULL,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM creative_work_projects p
WHERE p.creative_work_project_id=7
  AND p.project_key='CP-MSXCYQB6'
  AND p.project_title='Under the Sea'
  AND p.summary='Loaf soap with sea creatures'
  AND (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7')=1
  AND (SELECT COUNT(*) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id='7')=1
  AND (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=7 AND COALESCE(e.entry_status,'active')='active')=3
  AND (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=7 AND COALESCE(e.entry_status,'active')='active' AND e.event_type='planning')>=1
  AND (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=7 AND COALESCE(e.entry_status,'active')='active' AND e.event_type='material')>=2
  AND NOT EXISTS(SELECT 1 FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=7);

-- 3: refresh only the existing CAIP source snapshot with the adopted factual profile.
UPDATE creative_projects
SET source_snapshot_json=json_set(
      CASE WHEN json_valid(COALESCE(source_snapshot_json,'')) THEN source_snapshot_json ELSE '{}' END,
      '$.maker_story',json_object(
        'creative_work_project_id',7,
        'story_kind','maker_story',
        'what_we_are_trying','Make an Under the Sea loaf soap with sea creatures.',
        'why_we_are_trying_it','The existing Creative Project is named Under the Sea and its recorded concept is a loaf soap with sea creatures.',
        'expected_result','A loaf soap with sea creatures.',
        'actual_result','The project timeline records planning and two material-use entries for Velona 5 LB Goat''s Milk Soap Base. No finished-result entry is recorded yet.',
        'outcome_status','partial_win',
        'surprise_or_problem','No problem or surprise is recorded in the current project timeline.',
        'lesson_learned','The current record documents real material-use progress, but a finished-result entry is still needed before this story should be treated as a completed public result.',
        'change_next_time','Record the finished result and any observed problem or lesson in the project timeline before public review.',
        'try_again_status','undecided',
        'story_review_status','needs_review',
        'public_story_candidate',0
      ),
      '$.maker_story_workstations',json('[]'),
      '$.maker_story_foundation_build',294,
      '$.maker_story_adoption_build',301
    ),
    updated_at=CURRENT_TIMESTAMP
WHERE source_type='creative_work_project' AND source_id='7'
  AND EXISTS(SELECT 1 FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=7);

-- 4: prove factual completeness and review-first state.
SELECT
  m.creative_work_project_id,m.story_kind,m.what_we_are_trying,m.why_we_are_trying_it,m.expected_result,
  m.actual_result,m.outcome_status,m.surprise_or_problem,m.lesson_learned,m.change_next_time,
  m.try_again_status,m.story_review_status,m.public_story_candidate,
  CASE WHEN m.story_kind<>'ordinary_project'
    AND TRIM(COALESCE(m.what_we_are_trying,''))<>''
    AND TRIM(COALESCE(m.why_we_are_trying_it,''))<>''
    AND TRIM(COALESCE(m.actual_result,''))<>''
    AND m.outcome_status<>'unknown'
    AND TRIM(COALESCE(m.lesson_learned,''))<>'' THEN 1 ELSE 0 END core_story_complete
FROM creative_project_maker_story_profiles m
WHERE m.creative_work_project_id=7;

-- 5: prove no authority duplication or downstream/public side effects.
SELECT
  (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=7) maker_story_profiles,
  (SELECT COUNT(*) FROM creative_project_maker_story_workstations WHERE creative_work_project_id=7) maker_story_workstations,
  (SELECT COUNT(*) FROM creative_projects WHERE source_type='creative_work_project' AND source_id='7') caip_workspaces,
  (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='7') content_packages,
  (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=7 AND selected=1) selected_evidence,
  (SELECT COUNT(*) FROM content_publications pub JOIN content_projects cp ON cp.content_project_id=pub.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='7') publications,
  (SELECT COUNT(*) FROM social_post_queue WHERE source_type IN ('content_project','creative_project','workshop_journal')) social_rows_total,
  (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
