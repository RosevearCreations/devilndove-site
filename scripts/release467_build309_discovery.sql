-- Release 467 Build 309 — Development-only discovery of the second-story Content Studio package.
-- Read-only. No copy refresh, approval, publication, provider action, or Production D1 contact.

SELECT
  cp.content_project_id,cp.source_type,cp.source_id,cp.content_project_key,cp.project_title,cp.project_status,
  COALESCE(cp.product_id,0) product_id,
  COALESCE(h.creative_project_content_handoff_id,0) handoff_id,
  COALESCE(h.handoff_status,'') handoff_status,
  COALESCE(h.evidence_count,0) handoff_evidence_count,
  COALESCE(h.package_json,'') package_json
FROM content_projects cp
LEFT JOIN creative_project_content_handoffs h
  ON h.content_project_id=cp.content_project_id AND h.creative_work_project_id=5
WHERE cp.source_type='creative_project' AND cp.source_id='5'
ORDER BY cp.content_project_id,h.creative_project_content_handoff_id;

SELECT
  d.content_project_deliverable_id,d.content_project_id,d.deliverable_key,d.channel_key,d.deliverable_type,
  d.title,COALESCE(d.caption,'') caption,COALESCE(d.script_text,'') script_text,COALESCE(d.body_content,'') body_content,
  d.deliverable_status,d.approval_status,COALESCE(d.review_notes,'') review_notes,COALESCE(d.copy_locked,0) copy_locked,
  COALESCE(d.generated_by,'') generated_by,COALESCE(d.output_url,'') output_url,COALESCE(d.thumbnail_url,'') thumbnail_url,
  COALESCE(d.approved_at,'') approved_at,COALESCE(d.published_at,'') published_at
FROM content_project_deliverables d
WHERE d.content_project_id=(SELECT MIN(content_project_id) FROM content_projects WHERE source_type='creative_project' AND source_id='5')
ORDER BY d.content_project_deliverable_id;

SELECT
  m.creative_work_project_id,m.story_kind,m.what_we_are_trying,m.why_we_are_trying_it,
  COALESCE(m.expected_result,'') expected_result,COALESCE(m.actual_result,'') actual_result,
  m.outcome_status,COALESCE(m.surprise_or_problem,'') surprise_or_problem,
  COALESCE(m.lesson_learned,'') lesson_learned,COALESCE(m.change_next_time,'') change_next_time,
  m.try_again_status,m.story_review_status,m.public_story_candidate,
  e.creative_work_event_id,e.event_type,e.event_title,COALESCE(e.event_notes,'') event_notes,
  COALESCE(e.media_url,'') media_url,COALESCE(e.is_public_candidate,0) event_public_candidate,
  s.evidence_role,s.selected,COALESCE(s.review_notes,'') evidence_review_notes
FROM creative_project_maker_story_profiles m
JOIN creative_project_evidence_selections s
  ON s.creative_work_project_id=m.creative_work_project_id AND s.selected=1
JOIN creative_work_events e
  ON e.creative_work_event_id=s.creative_work_event_id AND e.creative_work_project_id=s.creative_work_project_id
WHERE m.creative_work_project_id=5
ORDER BY e.occurred_at,e.creative_work_event_id;

SELECT
  (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived')) caip_assets,
  (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='5' AND cp.project_status<>'archived')) private_upload_files,
  (SELECT COUNT(*) FROM creative_work_events WHERE creative_work_project_id=5 AND COALESCE(entry_status,'active')='active' AND COALESCE(is_public_candidate,0)=1) public_event_candidates,
  (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5 AND public_story_candidate=1) public_story_candidates,
  (SELECT COUNT(*) FROM content_publications pub JOIN content_projects cp ON cp.content_project_id=pub.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='5') publications,
  (SELECT COUNT(*) FROM social_post_queue sp JOIN content_publications pub ON sp.source_type='workshop_journal' AND sp.source_id=CAST(pub.content_publication_id AS TEXT) JOIN content_projects cp ON cp.content_project_id=pub.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='5') social_rows,
  (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
