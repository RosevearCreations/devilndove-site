-- Release 467 Build 310 — Development-only review-first publication/distribution continuity evidence.
-- Read-only. No publication/social mutation, provider execution, schema/R2 mutation, or Production D1 contact.

-- 1: second-story publication prerequisites and downstream state.
SELECT
 cp.content_project_id,cp.content_project_key,cp.source_type,cp.source_id,cp.project_title,
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='5') content_packages,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23) deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND approval_status='approved') approved_deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND approval_status='changes_requested') changes_requested_deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND copy_locked=1) locked_deliverables,
 (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=5 AND selected=1) selected_evidence,
 (SELECT story_review_status FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5) story_review_status,
 (SELECT public_story_candidate FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5) public_story_candidate,
 (SELECT outcome_status FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5) outcome_status,
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=23) publications,
 (SELECT COUNT(*) FROM social_post_queue sp JOIN content_publications pub ON sp.source_type='workshop_journal' AND sp.source_id=CAST(pub.content_publication_id AS TEXT) WHERE pub.content_project_id=23) social_rows,
 (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='5' AND caip.project_status<>'archived')) caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='5' AND caip.project_status<>'archived')) private_upload_files,
 (SELECT COUNT(*) FROM creative_work_events WHERE creative_work_project_id=5 AND COALESCE(entry_status,'active')='active' AND COALESCE(is_public_candidate,0)=1) public_event_candidates
FROM content_projects cp
WHERE cp.content_project_id=23 AND cp.source_type='creative_project' AND cp.source_id='5';

-- 2: previously accepted first-story publication/social continuity.
SELECT
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=22 AND destination='workshop_journal') workshop_journal_rows,
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=22 AND destination='workshop_journal' AND content_status='published') published_journal_rows,
 (SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea') social_rows,
 (SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' AND approval_status='approved' AND post_status='ready' AND COALESCE(api_publish_mode,'')='review_first') approved_review_first_social_rows,
 (SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' AND (post_status='posted' OR published_at IS NOT NULL)) posted_social_rows,
 (SELECT COALESCE(image_urls_json,'') FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' LIMIT 1) social_image_urls_json,
 (SELECT COALESCE(video_url,'') FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' LIMIT 1) social_video_url;

-- 3: global integrity and no inferred gallery publication for the second story.
SELECT
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=23 AND destination='website_gallery') second_story_website_gallery_rows,
 (SELECT COUNT(*) FROM (SELECT source_id FROM content_projects WHERE source_type='creative_project' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_content_source_identities,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
