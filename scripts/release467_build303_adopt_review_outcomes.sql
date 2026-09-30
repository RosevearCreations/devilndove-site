-- Release 467 Build 303 — bounded Development-only human draft review outcome adoption.
-- The owner requested Build 303. Discovery reviewed all 19 factual-template drafts.
-- Exactly two text-only drafts are corrected to the recorded evidence and approved as COPY ONLY.
-- Seventeen media/result-dependent drafts receive changes_requested. No publication or provider action.
-- Idempotent. Never run against Production.

-- 1: fail-closed exact package and evidence preflight.
SELECT
  cp.content_project_id,cp.content_project_key,cp.source_type,cp.source_id,cp.public_release_status,
  (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='7') content_packages,
  (SELECT COUNT(*) FROM content_project_deliverables d WHERE d.content_project_id=cp.content_project_id) deliverables,
  (SELECT COUNT(*) FROM content_project_deliverables d WHERE d.content_project_id=cp.content_project_id AND d.generated_by='factual_template') factual_template_deliverables,
  (SELECT COUNT(*) FROM content_project_deliverables d WHERE d.content_project_id=cp.content_project_id AND d.approval_status='approved') approved_before,
  (SELECT COUNT(*) FROM creative_project_evidence_selections s WHERE s.creative_work_project_id=7 AND s.selected=1) selected_evidence,
  (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='7' AND caip.project_status<>'archived')) caip_assets,
  (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='7' AND caip.project_status<>'archived')) private_upload_files
FROM content_projects cp
WHERE cp.content_project_id=22 AND cp.source_type='creative_project' AND cp.source_id='7';

-- 2: correct and approve the two evidence-safe text-only drafts.
UPDATE content_project_deliverables
SET
  body_content=CASE deliverable_key
    WHEN 'seo-assets' THEN '{
  "meta_title": "Under the Sea | Project Journal | Devil n Dove",
  "meta_description": "Under the Sea is a Devil n Dove loaf-soap project with a sea-creature theme, documented from workshop planning and material-use records.",
  "suggested_image_alt_text": [],
  "suggested_slug": "under-the-sea",
  "canonical_rule": "Use one reviewed Project Journal/story URL if this project is published; do not create thin duplicate pages for each social output."
}'
    WHEN 'blog-article' THEN '# Project journal: Under the Sea

Under the Sea is a planned loaf-soap project featuring sea creatures.

## Recorded process

The current workshop record contains one planning entry, “Sea creatures,” and two material-use entries. Those material records document 2.5 pounds plus 2.5 pounds of Velona goat''s milk melt-and-pour soap base used for the project.

## Current status

No finished-result event or reviewed project media is recorded yet. This draft therefore documents only the planning and material-use stage. Photos, the final result, lessons, and any public claims remain pending review.'
    ELSE body_content END,
  approval_status='approved',
  review_notes='Build 303 human review: factual copy approved from the recorded planning/material evidence only. Approval is copy-only; it does not approve media, public release, publication, or provider execution.',
  copy_locked=1,
  approved_at=COALESCE(approved_at,CURRENT_TIMESTAMP),
  updated_at=CURRENT_TIMESTAMP
WHERE content_project_id=22
  AND deliverable_key IN ('seo-assets','blog-article')
  AND generated_by='factual_template'
  AND 1=(SELECT COUNT(*) FROM content_projects WHERE content_project_id=22 AND source_type='creative_project' AND source_id='7')
  AND 19=(SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22)
  AND 19=(SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND generated_by='factual_template')
  AND 3=(SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=7 AND selected=1)
  AND 0=(SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='7' AND caip.project_status<>'archived'))
  AND 0=(SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='7' AND caip.project_status<>'archived'));

-- 3: record changes requested for every media/result-dependent draft; do not rewrite their copy.
UPDATE content_project_deliverables
SET
  approval_status='changes_requested',
  review_notes='Build 303 human review: changes requested. The draft depends on reviewed/public-use media or uses result/reviewed language that is not yet supported by the current project evidence. Keep private and unapproved until evidence, media rights, and final-result facts are reviewed.',
  updated_at=CURRENT_TIMESTAMP
WHERE content_project_id=22
  AND deliverable_key NOT IN ('seo-assets','blog-article')
  AND generated_by='factual_template'
  AND 1=(SELECT COUNT(*) FROM content_projects WHERE content_project_id=22 AND source_type='creative_project' AND source_id='7')
  AND 19=(SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22)
  AND 3=(SELECT COUNT(*) FROM creative_project_evidence_selections WHERE creative_work_project_id=7 AND selected=1);

-- 4: exact human-review outcomes.
SELECT content_project_deliverable_id,deliverable_key,channel_key,deliverable_type,deliverable_status,approval_status,
 copy_locked,generated_by,review_notes,body_content,COALESCE(approved_at,'') approved_at,COALESCE(published_at,'') published_at
FROM content_project_deliverables WHERE content_project_id=22 ORDER BY content_project_deliverable_id;

-- 5: prove package/public/private integrity after review.
SELECT
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='7') content_packages,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22) deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND approval_status='approved') approved_deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND approval_status='changes_requested') changes_requested_deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND copy_locked=1) locked_deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables WHERE content_project_id=22 AND published_at IS NOT NULL) published_deliverables,
 (SELECT COUNT(*) FROM content_publications pub WHERE pub.content_project_id=22) publications,
 (SELECT COUNT(*) FROM social_post_queue WHERE source_type IN ('content_project','creative_project','workshop_journal')) social_rows_total,
 (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='7' AND caip.project_status<>'archived')) caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(caip.creative_project_id) FROM creative_projects caip WHERE caip.source_type='creative_work_project' AND caip.source_id='7' AND caip.project_status<>'archived')) private_upload_files,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
