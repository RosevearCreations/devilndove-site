-- Release 467 Build 304 — Development-only Workshop Journal + social review-first acceptance.
-- Owner-requested acceptance. No schema change, R2 action, provider call, or Production D1 contact.
-- Idempotent. Never run against Production.

-- 1: fail-closed predecessor and privacy preflight.
SELECT
  cp.content_project_id,cp.content_project_key,cp.source_type,cp.source_id,
  (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='7') content_packages,
  (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22) deliverables,
  (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND approval_status='approved') approved_deliverables,
  (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND approval_status='changes_requested') changes_requested_deliverables,
  (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND deliverable_key='blog-article' AND approval_status='approved' AND copy_locked=1) approved_blog,
  (SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=7 AND selected=1) selected_evidence,
  (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='7' AND caip.project_status<>'archived')) caip_assets,
  (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='7' AND caip.project_status<>'archived')) private_upload_files
FROM content_projects cp
WHERE cp.content_project_id=22 AND cp.source_type='creative_project' AND cp.source_id='7';

-- 2: explicitly approve + publish one factual text-only Workshop Journal row.
INSERT INTO content_publications (
  publication_key,content_project_id,content_project_deliverable_id,destination,publication_slug,
  title,summary,body_content,hero_media_url,hero_alt_text,media_urls_json,product_path,
  canonical_path,meta_title,meta_description,schema_json,content_status,review_notes,copy_locked,
  approved_by_user_id,approved_at,published_by_user_id,published_at,created_at,updated_at
)
SELECT
  'content-project-22-workshop_journal',22,d.content_project_deliverable_id,'workshop_journal','under-the-sea-workshop-story-22',
  'Project journal: Under the Sea',
  'Under the Sea is a Devil n Dove loaf-soap project with a sea-creature theme, documented from workshop planning and material-use records.',
  d.body_content,NULL,NULL,'[]','/shop/',
  '/workshop-journal/story/?story=under-the-sea-workshop-story-22',
  'Under the Sea | Workshop Journal | Devil n Dove',
  'Under the Sea is a sea-creature themed loaf-soap project documented from workshop planning and material-use records.',
  '{"@context":"https://schema.org","@type":"Article","headline":"Project journal: Under the Sea","description":"Under the Sea is a sea-creature themed loaf-soap project documented from workshop planning and material-use records.","mainEntityOfPage":"https://devilndove.com/workshop-journal/story/?story=under-the-sea-workshop-story-22","author":{"@type":"Organization","name":"Devil n Dove"},"isPartOf":{"@type":"CollectionPage","name":"Devil n Dove Workshop Journal","url":"https://devilndove.com/workshop-journal/"}}',
  'published',
  'Build 304 explicit human review: publish the approved factual text only. No public media exists or is inferred; website gallery remains blocked until public-cleared media exists.',
  1,
  (SELECT user_id FROM users WHERE is_active=1 AND lower(trim(role))='admin' ORDER BY user_id ASC LIMIT 1),CURRENT_TIMESTAMP,
  (SELECT user_id FROM users WHERE is_active=1 AND lower(trim(role))='admin' ORDER BY user_id ASC LIMIT 1),CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM content_project_deliverables d
WHERE d.content_project_id=22 AND d.deliverable_key='blog-article' AND d.approval_status='approved' AND d.copy_locked=1
  AND 1=(SELECT COUNT(*) FROM content_projects WHERE content_project_id=22 AND source_type='creative_project' AND source_id='7')
  AND 19=(SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22)
  AND 2=(SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND approval_status='approved')
  AND 17=(SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND approval_status='changes_requested')
  AND 3=(SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=7 AND selected=1)
  AND 0=(SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='7' AND caip.project_status<>'archived'))
  AND 0=(SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='7' AND caip.project_status<>'archived'))
ON CONFLICT(publication_key) DO UPDATE SET
  content_project_deliverable_id=excluded.content_project_deliverable_id,
  title=excluded.title,summary=excluded.summary,body_content=excluded.body_content,
  hero_media_url=NULL,hero_alt_text=NULL,media_urls_json='[]',
  canonical_path=excluded.canonical_path,meta_title=excluded.meta_title,meta_description=excluded.meta_description,
  schema_json=excluded.schema_json,content_status='published',review_notes=excluded.review_notes,copy_locked=1,
  approved_by_user_id=excluded.approved_by_user_id,approved_at=COALESCE(content_publications.approved_at,CURRENT_TIMESTAMP),
  published_by_user_id=excluded.published_by_user_id,published_at=COALESCE(content_publications.published_at,CURRENT_TIMESTAMP),
  updated_at=CURRENT_TIMESTAMP;

-- 3: exact Journal result.
SELECT content_publication_id,publication_key,content_project_id,content_project_deliverable_id,destination,publication_slug,
 content_status,COALESCE(hero_media_url,'') hero_media_url,media_urls_json,copy_locked,
 COALESCE(approved_by_user_id,0) approved_by_user_id,COALESCE(published_by_user_id,0) published_by_user_id,
 COALESCE(published_at,'') published_at,review_notes
FROM content_publications
WHERE publication_key='content-project-22-workshop_journal';

-- 4: prepare one explicitly approved review-first text/link social queue item; do not post it.
INSERT INTO social_post_queue (
  social_post_key,source_type,source_id,title,summary,caption,hashtags,target_platforms_json,
  image_urls_json,video_url,link_url,approval_status,post_status,created_by_user_id,updated_by_user_id,
  created_at,updated_at,notes,api_publish_mode
)
SELECT
  'workshop-journal-22-under-the-sea','workshop_journal',CAST(pub.content_publication_id AS TEXT),
  'Under the Sea — Workshop Journal',
  'A factual project-journal update from the Devil n Dove workshop.',
  'Under the Sea is now in our Workshop Journal: a factual look at the sea-creature loaf-soap project using the planning and material-use records currently available.',
  '#DevilnDove #WorkshopJournal #HandmadeOntario #SoapMaking',
  '["facebook","x"]','[]',NULL,
  'https://devilndove.com/workshop-journal/story/?story=under-the-sea-workshop-story-22',
  'approved','ready',
  (SELECT user_id FROM users WHERE is_active=1 AND lower(trim(role))='admin' ORDER BY user_id ASC LIMIT 1),
  (SELECT user_id FROM users WHERE is_active=1 AND lower(trim(role))='admin' ORDER BY user_id ASC LIMIT 1),
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,
  'Build 304 explicit human review: text/link social draft approved for the review queue only. Provider execution/publication is not authorized by this build.',
  'review_first'
FROM content_publications pub
WHERE pub.publication_key='content-project-22-workshop_journal' AND pub.content_status='published'
ON CONFLICT(social_post_key) DO UPDATE SET
  source_type='workshop_journal',source_id=excluded.source_id,title=excluded.title,summary=excluded.summary,
  caption=excluded.caption,hashtags=excluded.hashtags,target_platforms_json=excluded.target_platforms_json,
  image_urls_json='[]',video_url=NULL,link_url=excluded.link_url,approval_status='approved',
  post_status=CASE WHEN social_post_queue.post_status='posted' THEN 'posted' ELSE 'ready' END,
  updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP,notes=excluded.notes,api_publish_mode='review_first';

-- 5: exact social review result.
SELECT social_post_queue_id,social_post_key,source_type,source_id,approval_status,post_status,
 target_platforms_json,image_urls_json,COALESCE(video_url,'') video_url,COALESCE(link_url,'') link_url,
 COALESCE(api_publish_mode,'') api_publish_mode,COALESCE(published_at,'') published_at,notes
FROM social_post_queue
WHERE social_post_key='workshop-journal-22-under-the-sea';

-- 6: post-acceptance integrity and provider boundary.
SELECT
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='7') content_packages,
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=22 AND destination='workshop_journal') workshop_journal_rows,
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=22 AND destination='workshop_journal' AND content_status='published') published_journal_rows,
 (SELECT COUNT(*) FROM content_publications WHERE content_project_id=22 AND destination='website_gallery') website_gallery_rows,
 (SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea') social_rows,
 (SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' AND approval_status='approved' AND post_status='ready' AND COALESCE(api_publish_mode,'')='review_first') approved_review_first_social_rows,
 (SELECT COUNT(*) FROM social_post_queue WHERE social_post_key='workshop-journal-22-under-the-sea' AND (post_status='posted' OR published_at IS NOT NULL)) posted_social_rows,
 (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='7' AND caip.project_status<>'archived')) caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='7' AND caip.project_status<>'archived')) private_upload_files,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
