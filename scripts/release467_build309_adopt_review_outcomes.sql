-- Release 467 Build 309 — bounded Development-only review of the second real Story Content Studio package.
-- Exactly two corrected text-only drafts are approved/locked as COPY ONLY.
-- All 17 media/result-dependent drafts receive changes_requested.
-- No copy refresh, publication, provider execution, media-rights mutation, or Production D1 contact.

SELECT
 cp.content_project_id,cp.content_project_key,cp.source_type,cp.source_id,cp.project_title,cp.project_status,cp.review_status,cp.public_release_status,
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='5') content_packages,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23) deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND generated_by='factual_template') factual_template_deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND approval_status='approved') approved_before,
 (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=5 AND selected=1) selected_evidence,
 (SELECT story_review_status FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5) story_review_status,
 (SELECT public_story_candidate FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5) public_story_candidate,
 (SELECT outcome_status FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5) outcome_status,
 (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='5' AND caip.project_status<>'archived')) caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='5' AND caip.project_status<>'archived')) private_upload_files,
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=23) publications
FROM content_projects cp
WHERE cp.content_project_id=23 AND cp.source_type='creative_project' AND cp.source_id='5';

UPDATE creative_project_content_handoffs
SET handoff_status='ready_for_review',
    evidence_count=1,
    package_json=json_set(
      CASE WHEN json_valid(COALESCE(package_json,'')) THEN package_json ELSE '{}' END,
      '$.evidence_count',1,
      '$.build309_review_scope','existing_selected_text_evidence_only',
      '$.copy_refresh',0
    )
WHERE creative_work_project_id=5 AND content_project_id=23
  AND 1=(SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=5 AND selected=1);

UPDATE content_project_deliverables
SET
  title=CASE deliverable_key
    WHEN 'seo-assets' THEN '35th promo — SEO page assets'
    WHEN 'blog-article' THEN 'Project brief: 35th promo'
    ELSE title END,
  body_content=CASE deliverable_key
    WHEN 'seo-assets' THEN '{
  "meta_title": "35th promo | Project Brief | Devil n Dove",
  "meta_description": "35th promo is a Devil n Dove event-souvenir concept using significant colours, currently documented from the existing project brief.",
  "suggested_image_alt_text": [],
  "suggested_slug": "35th-promo",
  "canonical_rule": "Use one reviewed Project Journal/story URL only if a later publication is explicitly approved; do not create thin duplicate pages for the same project."
}'
    WHEN 'blog-article' THEN '# Project brief: 35th promo

35th promo is an event-souvenir concept intended to showcase the diversity of the Devil n Dove studio.

## Recorded brief

The existing project objective records green and coral as example significant colours for a 35th wedding anniversary. The recorded story angle proposes adapting significant colours to birthdays, anniversaries, weddings, showers, or other events.

## Current status

Only planning/project-brief evidence is recorded. No execution, finished result, lesson, reviewed media, or public release has been recorded. This copy describes the concept only and does not claim that an example set was completed.'
    ELSE body_content END,
  approval_status='approved',
  review_notes='Build 309 explicit review: corrected factual copy approved from the existing project brief and selected text-only planning evidence. Approval is copy-only; it does not approve the Maker Story itself, media/public-use rights, public release, publication, or provider execution.',
  copy_locked=1,
  approved_by_user_id=(SELECT user_id FROM users WHERE is_active=1 AND lower(trim(role))='admin' ORDER BY user_id ASC LIMIT 1),
  approved_at=COALESCE(approved_at,CURRENT_TIMESTAMP),
  updated_at=CURRENT_TIMESTAMP
WHERE content_project_id=23
  AND deliverable_key IN ('seo-assets','blog-article')
  AND generated_by='factual_template'
  AND 1=(SELECT COUNT(*) FROM content_projects WHERE content_project_id=23 AND source_type='creative_project' AND source_id='5')
  AND 19=(SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23)
  AND 19=(SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND generated_by='factual_template')
  AND 1=(SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=5 AND selected=1)
  AND 1=(SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5 AND story_review_status='needs_review' AND public_story_candidate=0 AND outcome_status='unknown')
  AND 0=(SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='5' AND caip.project_status<>'archived'))
  AND 0=(SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='5' AND caip.project_status<>'archived'))
  AND 0=(SELECT COUNT(*) FROM content_publications WHERE content_project_id=23);

UPDATE content_project_deliverables
SET
  approval_status='changes_requested',
  review_notes='Build 309 explicit review: changes requested. This draft depends on process/result/lesson claims, reviewed media, or public-use media that the current 35th promo record does not contain. Keep private and unapproved until execution/result evidence and any media rights are separately reviewed.',
  copy_locked=0,
  approved_by_user_id=NULL,
  approved_at=NULL,
  updated_at=CURRENT_TIMESTAMP
WHERE content_project_id=23
  AND deliverable_key NOT IN ('seo-assets','blog-article')
  AND generated_by='factual_template'
  AND 19=(SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23)
  AND 1=(SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=5 AND selected=1);

SELECT content_project_deliverable_id,deliverable_key,channel_key,deliverable_type,title,deliverable_status,approval_status,
 copy_locked,generated_by,review_notes,body_content,COALESCE(approved_by_user_id,0) approved_by_user_id,
 COALESCE(approved_at,'') approved_at,COALESCE(published_at,'') published_at
FROM content_project_deliverables
WHERE content_project_id=23
ORDER BY content_project_deliverable_id;

SELECT
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='5') content_packages,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23) deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND approval_status='approved') approved_deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND approval_status='changes_requested') changes_requested_deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND copy_locked=1) locked_deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=23 AND published_at IS NOT NULL) published_deliverables,
 (SELECT COUNT(*) FROM creative_project_content_handoffs WHERE creative_work_project_id=5 AND content_project_id=23 AND handoff_status='ready_for_review' AND evidence_count=1) aligned_handoffs,
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=23) publications,
 (SELECT COUNT(*) FROM social_post_queue sp JOIN content_publications pub ON sp.source_type='workshop_journal' AND sp.source_id=CAST(pub.content_publication_id AS TEXT) WHERE pub.content_project_id=23) social_rows,
 (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='5' AND caip.project_status<>'archived')) caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='5' AND caip.project_status<>'archived')) private_upload_files,
 (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=5 AND story_review_status='needs_review' AND public_story_candidate=0 AND outcome_status='unknown') maker_story_still_review_first,
 (SELECT COUNT(*) FROM (SELECT source_id FROM content_projects WHERE source_type='creative_project' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_content_source_identities,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
