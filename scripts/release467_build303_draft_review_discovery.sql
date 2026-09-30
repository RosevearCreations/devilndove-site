-- Release 467 Build 303 — Development-only Content Studio draft review discovery.
-- READ ONLY. No Content Studio refresh, approval, publication, provider action, R2 mutation or Production D1 contact.

SELECT p.creative_work_project_id,p.project_key,p.project_title,m.story_kind,m.story_review_status,m.public_story_candidate,
 (SELECT COUNT(*) FROM creative_project_evidence_selections s WHERE s.creative_work_project_id=7 AND s.selected=1) selected_evidence,
 (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived') caip_workspaces,
 (SELECT COUNT(*) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id='7') content_packages,
 (SELECT MIN(content_project_id) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id='7') content_project_id
FROM creative_work_projects p JOIN creative_project_maker_story_profiles m ON m.creative_work_project_id=p.creative_work_project_id
WHERE p.creative_work_project_id=7 AND p.project_key='CP-MSXCYQB6' AND p.project_title='Under the Sea';

SELECT s.creative_work_event_id,s.evidence_role,s.selected,s.review_notes,e.event_type,e.event_title,COALESCE(e.event_notes,'') event_notes,
 COALESCE(e.material_name,'') material_name,COALESCE(e.material_quantity,0) material_quantity,COALESCE(e.material_unit,'') material_unit,
 COALESCE(e.media_url,'') media_url,COALESCE(e.is_public_candidate,0) is_public_candidate
FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id AND e.creative_work_project_id=s.creative_work_project_id
WHERE s.creative_work_project_id=7 AND s.selected=1 ORDER BY s.creative_work_event_id;

SELECT cp.content_project_id,cp.content_project_key,cp.source_type,cp.source_id,cp.project_title,cp.project_status,cp.review_status,cp.public_release_status,cp.product_id,
 h.creative_project_content_handoff_id,h.handoff_status,h.evidence_count
FROM content_projects cp LEFT JOIN creative_project_content_handoffs h ON h.content_project_id=cp.content_project_id AND h.creative_work_project_id=7
WHERE cp.source_type='creative_project' AND cp.source_id='7' ORDER BY cp.content_project_id,h.creative_project_content_handoff_id;

SELECT d.content_project_deliverable_id,d.deliverable_key,d.channel_key,d.deliverable_type,d.title,COALESCE(d.caption,'') caption,
 COALESCE(d.script_text,'') script_text,COALESCE(d.body_content,'') body_content,d.deliverable_status,d.approval_status,
 COALESCE(d.review_notes,'') review_notes,COALESCE(d.copy_locked,0) copy_locked,COALESCE(d.generated_by,'') generated_by,
 COALESCE(d.output_url,'') output_url,COALESCE(d.thumbnail_url,'') thumbnail_url,COALESCE(d.published_at,'') published_at
FROM content_project_deliverables d JOIN content_projects cp ON cp.content_project_id=d.content_project_id
WHERE cp.source_type='creative_project' AND cp.source_id='7' ORDER BY d.content_project_deliverable_id;

SELECT
 (SELECT COUNT(*) FROM content_projects WHERE source_type='creative_project' AND source_id='7') content_packages,
 (SELECT COUNT(*) FROM content_project_deliverables d JOIN content_projects cp ON cp.content_project_id=d.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='7') deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables d JOIN content_projects cp ON cp.content_project_id=d.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='7' AND d.generated_by='factual_template') factual_template_deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables d JOIN content_projects cp ON cp.content_project_id=d.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='7' AND d.copy_locked=1) locked_deliverables,
 (SELECT COUNT(*) FROM content_project_deliverables d JOIN content_projects cp ON cp.content_project_id=d.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='7' AND d.approval_status='approved') approved_deliverables,
 (SELECT COUNT(*) FROM (SELECT source_id FROM content_projects WHERE source_type='creative_project' GROUP BY source_id HAVING COUNT(*)>1)) duplicate_content_source_identities;

SELECT
 (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived')) caip_assets,
 (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id='7' AND cp.project_status<>'archived')) private_upload_files,
 (SELECT COUNT(*) FROM content_publications pub JOIN content_projects cp ON cp.content_project_id=pub.content_project_id WHERE cp.source_type='creative_project' AND cp.source_id='7') publications,
 (SELECT COUNT(*) FROM social_post_queue WHERE source_type IN ('content_project','creative_project','workshop_journal')) social_rows_total,
 (SELECT COUNT(*) FROM pragma_foreign_key_check) foreign_key_violations;
