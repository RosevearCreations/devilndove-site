-- Release 467 Build 323 — Maker Story coverage & publication readiness continuity.
-- Development-only and read-only. No DDL, business-data mutation, publication, provider, R2 or Production contact.

-- 1: all active Creative Projects with story/copy/publication/media-rights facts.
SELECT
 p.creative_work_project_id,
 p.project_key,
 p.project_title,
 p.project_status,
 (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) content_packages,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=p.creative_work_project_id) maker_story_profiles,
 COALESCE((SELECT m.story_kind FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=p.creative_work_project_id LIMIT 1),'') story_kind,
 COALESCE((SELECT m.story_review_status FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=p.creative_work_project_id LIMIT 1),'') story_review_status,
 COALESCE((SELECT m.public_story_candidate FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=p.creative_work_project_id LIMIT 1),0) public_story_candidate,
 COALESCE((SELECT m.outcome_status FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=p.creative_work_project_id LIMIT 1),'') outcome_status,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles m
   WHERE m.creative_work_project_id=p.creative_work_project_id AND m.story_kind<>'ordinary_project'
     AND TRIM(COALESCE(m.what_we_are_trying,''))<>'' AND TRIM(COALESCE(m.why_we_are_trying_it,''))<>''
     AND TRIM(COALESCE(m.actual_result,''))<>'' AND COALESCE(m.outcome_status,'unknown')<>'unknown'
     AND TRIM(COALESCE(m.lesson_learned,''))<>'') core_story_complete,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s WHERE s.creative_work_project_id=p.creative_work_project_id AND s.selected=1) selected_evidence_rows,
 (SELECT COUNT(*) FROM creative_media_evidence_ranges r
   WHERE r.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived')
     AND r.marker_status='active' AND r.review_status='approved') approved_source_evidence,
 (SELECT COUNT(*) FROM caip_story_builder_drafts d
   WHERE d.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived')
     AND d.story_status IN ('review','approved')) reviewed_story_plans,
 (SELECT COUNT(*) FROM caip_story_builder_items i
   JOIN caip_story_builder_drafts d ON d.caip_story_builder_draft_id=i.caip_story_builder_draft_id
   WHERE d.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived')
     AND d.story_status IN ('review','approved') AND i.creative_media_evidence_range_id IS NOT NULL) source_backed_story_items,
 (SELECT COUNT(*) FROM content_project_deliverables d
   WHERE d.content_project_id=(SELECT MIN(cp.content_project_id) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT))
     AND d.approval_status='approved') approved_deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables d
   WHERE d.content_project_id=(SELECT MIN(cp.content_project_id) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT))
     AND d.copy_locked=1) locked_deliverables,
 (SELECT COUNT(*) FROM content_publications pub
   WHERE pub.content_project_id=(SELECT MIN(cp.content_project_id) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT))
     AND pub.destination='workshop_journal' AND pub.content_status='published') published_journal_rows,
 (SELECT COUNT(*) FROM content_publications pub
   WHERE pub.content_project_id=(SELECT MIN(cp.content_project_id) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT))
     AND pub.destination='workshop_journal' AND pub.content_status='published'
     AND pub.approved_by_user_id IS NOT NULL AND pub.published_by_user_id IS NOT NULL) human_published_journal_rows,
 (SELECT COUNT(*) FROM creative_assets a
   WHERE a.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived')
     AND a.asset_status<>'archived' AND a.source_safety_status='public_allowed') public_allowed_caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f
   WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived')
     AND f.consent_state='public_allowed' AND f.rights_status='public_allowed') public_allowed_private_uploads,
 (SELECT COUNT(*) FROM creative_assets a
   WHERE a.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived')
     AND a.asset_status<>'archived' AND COALESCE(a.source_safety_status,'needs_review')<>'public_allowed') non_public_caip_assets,
 (SELECT COUNT(*) FROM social_post_queue s
   WHERE s.source_type IN ('content_project','creative_project','workshop_journal')
     AND CAST(s.source_id AS TEXT) IN (
       CAST(p.creative_work_project_id AS TEXT),
       CAST((SELECT MIN(cp.content_project_id) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) AS TEXT)
     )
     AND s.approval_status='approved' AND s.post_status='ready' AND COALESCE(s.api_publish_mode,'')='review_first') review_first_social_ready,
 (SELECT COUNT(*) FROM social_post_queue s
   WHERE s.source_type IN ('content_project','creative_project','workshop_journal')
     AND CAST(s.source_id AS TEXT) IN (
       CAST(p.creative_work_project_id AS TEXT),
       CAST((SELECT MIN(cp.content_project_id) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) AS TEXT)
     )
     AND (s.post_status='posted' OR s.published_at IS NOT NULL)) provider_posted_social_rows
FROM creative_work_projects p
WHERE COALESCE(p.project_status,'')<>'archived'
ORDER BY p.creative_work_project_id;

-- 2: aggregate adoption/publication continuity.
SELECT
 (SELECT COUNT(*) FROM creative_work_projects WHERE COALESCE(project_status,'')<>'archived') active_projects,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles m JOIN creative_work_projects p ON p.creative_work_project_id=m.creative_work_project_id WHERE COALESCE(p.project_status,'')<>'archived') profiled_projects,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles m JOIN creative_work_projects p ON p.creative_work_project_id=m.creative_work_project_id WHERE COALESCE(p.project_status,'')<>'archived' AND m.story_kind<>'ordinary_project' AND m.story_review_status='reviewed') reviewed_maker_story_projects,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles m JOIN creative_work_projects p ON p.creative_work_project_id=m.creative_work_project_id WHERE COALESCE(p.project_status,'')<>'archived' AND m.story_kind<>'ordinary_project' AND m.public_story_candidate=1) public_story_candidates,
 (SELECT COUNT(*) FROM content_publications pub JOIN content_projects cp ON cp.content_project_id=pub.content_project_id WHERE cp.source_type='creative_project' AND pub.destination='workshop_journal' AND pub.content_status='published') published_workshop_journal_stories,
 (SELECT COUNT(*) FROM content_publications pub JOIN content_projects cp ON cp.content_project_id=pub.content_project_id WHERE cp.source_type='creative_project' AND pub.destination='workshop_journal' AND pub.content_status='published' AND pub.approved_by_user_id IS NOT NULL AND pub.published_by_user_id IS NOT NULL) human_traceable_published_stories;

-- 3: private/public evidence-rights boundary.
SELECT
 (SELECT COUNT(*) FROM creative_assets a JOIN creative_projects cp ON cp.creative_project_id=a.creative_project_id WHERE cp.source_type='creative_work_project' AND cp.project_status<>'archived' AND a.asset_status<>'archived') active_caip_assets,
 (SELECT COUNT(*) FROM creative_assets a JOIN creative_projects cp ON cp.creative_project_id=a.creative_project_id WHERE cp.source_type='creative_work_project' AND cp.project_status<>'archived' AND a.asset_status<>'archived' AND a.source_safety_status='public_allowed') public_allowed_caip_assets,
 (SELECT COUNT(*) FROM creative_assets a JOIN creative_projects cp ON cp.creative_project_id=a.creative_project_id WHERE cp.source_type='creative_work_project' AND cp.project_status<>'archived' AND a.asset_status<>'archived' AND COALESCE(a.source_safety_status,'needs_review')<>'public_allowed') non_public_caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f JOIN creative_projects cp ON cp.creative_project_id=f.creative_project_id WHERE cp.source_type='creative_work_project' AND cp.project_status<>'archived' AND f.consent_state='public_allowed' AND f.rights_status='public_allowed') public_allowed_private_uploads,
 (SELECT COUNT(*) FROM content_publications pub JOIN content_projects cp ON cp.content_project_id=pub.content_project_id WHERE cp.source_type='creative_project' AND pub.destination='website_gallery') website_gallery_rows;

-- 4: evidence-completion lanes from Builds 319–320.
SELECT
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type<>'planning') promo35_execution_events,
 (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type IN ('result','lesson','mistake','repair')) promo35_result_lesson_events,
 (SELECT COALESCE(m.story_review_status,'') FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=5 LIMIT 1) promo35_story_review_status,
 (SELECT COALESCE(m.outcome_status,'') FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=5 LIMIT 1) promo35_outcome_status,
 (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='6' AND cp.project_status<>'archived') AND r.marker_status='active' AND r.review_status='approved') grey_hair_approved_source_evidence,
 (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='6' AND cp.project_status<>'archived') AND r.marker_status='active' AND r.review_status='needs_review') grey_hair_source_evidence_needs_review,
 (SELECT COUNT(*) FROM caip_story_builder_drafts d WHERE d.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='6' AND cp.project_status<>'archived') AND d.story_status IN ('review','approved')) grey_hair_reviewed_story_plans,
 (SELECT COUNT(*) FROM caip_story_builder_items i JOIN caip_story_builder_drafts d ON d.caip_story_builder_draft_id=i.caip_story_builder_draft_id WHERE d.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='6' AND cp.project_status<>'archived') AND d.story_status IN ('review','approved') AND i.creative_media_evidence_range_id IS NOT NULL) grey_hair_source_backed_story_items;

-- 5: review-first social/provider boundary.
SELECT
 COUNT(*) social_rows,
 SUM(CASE WHEN approval_status='approved' AND post_status='ready' AND COALESCE(api_publish_mode,'')='review_first' THEN 1 ELSE 0 END) review_first_ready_rows,
 SUM(CASE WHEN post_status='posted' OR published_at IS NOT NULL THEN 1 ELSE 0 END) provider_posted_rows
FROM social_post_queue
WHERE source_type IN ('content_project','creative_project','workshop_journal');

-- 6: identity and relational integrity.
SELECT
 (SELECT COUNT(*) FROM (SELECT source_id FROM creative_projects WHERE source_type='creative_work_project' AND project_status<>'archived' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_caip_source_identities,
 (SELECT COUNT(*) FROM (SELECT source_id FROM content_projects WHERE source_type='creative_project' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_content_source_identities,
 (SELECT COUNT(*) FROM (SELECT creative_work_project_id FROM creative_project_maker_story_profiles GROUP BY creative_work_project_id HAVING COUNT(*)>1)) duplicate_maker_story_profiles,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
