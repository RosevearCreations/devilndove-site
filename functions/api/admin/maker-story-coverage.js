// Release 467 Build 323 — read-only Maker Story coverage & publication readiness continuity.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const RELEASE=467,BUILD=323,TITLE='Maker Story Coverage & Publication Readiness Continuity';
const rows=r=>Array.isArray(r?.results)?r.results:[];
const n=v=>Number(v||0)||0;
const s=v=>String(v??'').trim();

function classify(p){
  const profile=n(p.maker_story_profiles)>0&&s(p.story_kind)!=='ordinary_project';
  const reviewed=s(p.story_review_status)==='reviewed';
  const factual=n(p.core_story_complete)>0&&s(p.outcome_status||'unknown')!=='unknown';
  const publicCandidate=n(p.public_story_candidate)===1;
  const copyReady=n(p.approved_deliverables)>0&&n(p.locked_deliverables)>0;
  const published=n(p.published_journal_rows)>0&&n(p.human_published_journal_rows)>0;
  if(published&&profile&&reviewed&&factual&&publicCandidate&&copyReady)return 'PUBLISHED_REVIEWED_STORY';
  if(!profile)return 'MAKER_STORY_EVIDENCE_REQUIRED';
  if(!factual)return 'FACTUAL_OUTCOME_EVIDENCE_REQUIRED';
  if(!reviewed)return 'MAKER_STORY_HUMAN_REVIEW_REQUIRED';
  if(!publicCandidate)return 'PUBLIC_CANDIDATE_REVIEW_REQUIRED';
  if(!copyReady)return 'CONTENT_STUDIO_REVIEW_REQUIRED';
  return 'PUBLICATION_REVIEW_READY';
}

export async function onRequestGet(context){
  const admin=await getAdminUserFromRequest(context.request,context.env);
  if(!admin)return jsonResponse({ok:false,release:RELEASE,build:BUILD,error:'Admin access required.'},401,{'Cache-Control':'no-store'});
  const db=getDb(context.env);
  if(!db)return jsonResponse({ok:false,release:RELEASE,build:BUILD,error:'Database binding is not configured.'},503,{'Cache-Control':'no-store'});
  const result=await db.prepare(`SELECT
    p.creative_work_project_id,p.project_key,p.project_title,p.project_status,
    (SELECT COUNT(*) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') caip_workspaces,
    (SELECT COUNT(*) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) content_packages,
    (SELECT COUNT(*) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=p.creative_work_project_id) maker_story_profiles,
    COALESCE((SELECT m.story_kind FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=p.creative_work_project_id LIMIT 1),'') story_kind,
    COALESCE((SELECT m.story_review_status FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=p.creative_work_project_id LIMIT 1),'') story_review_status,
    COALESCE((SELECT m.public_story_candidate FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=p.creative_work_project_id LIMIT 1),0) public_story_candidate,
    COALESCE((SELECT m.outcome_status FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=p.creative_work_project_id LIMIT 1),'') outcome_status,
    (SELECT COUNT(*) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=p.creative_work_project_id AND m.story_kind<>'ordinary_project'
      AND TRIM(COALESCE(m.what_we_are_trying,''))<>'' AND TRIM(COALESCE(m.why_we_are_trying_it,''))<>'' AND TRIM(COALESCE(m.actual_result,''))<>''
      AND COALESCE(m.outcome_status,'unknown')<>'unknown' AND TRIM(COALESCE(m.lesson_learned,''))<>'') core_story_complete,
    (SELECT COUNT(*) FROM creative_project_evidence_selections e WHERE e.creative_work_project_id=p.creative_work_project_id AND e.selected=1) selected_evidence_rows,
    (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND r.marker_status='active' AND r.review_status='approved') approved_source_evidence,
    (SELECT COUNT(*) FROM caip_story_builder_drafts d WHERE d.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND d.story_status IN ('review','approved')) reviewed_story_plans,
    (SELECT COUNT(*) FROM caip_story_builder_items i JOIN caip_story_builder_drafts d ON d.caip_story_builder_draft_id=i.caip_story_builder_draft_id WHERE d.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND d.story_status IN ('review','approved') AND i.creative_media_evidence_range_id IS NOT NULL) source_backed_story_items,
    (SELECT COUNT(*) FROM content_project_deliverables d WHERE d.content_project_id=(SELECT MIN(cp.content_project_id) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) AND d.approval_status='approved') approved_deliverables,
    (SELECT COUNT(*) FROM content_project_deliverables d WHERE d.content_project_id=(SELECT MIN(cp.content_project_id) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) AND d.copy_locked=1) locked_deliverables,
    (SELECT COUNT(*) FROM content_publications pub WHERE pub.content_project_id=(SELECT MIN(cp.content_project_id) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) AND pub.destination='workshop_journal' AND pub.content_status='published') published_journal_rows,
    (SELECT COUNT(*) FROM content_publications pub WHERE pub.content_project_id=(SELECT MIN(cp.content_project_id) FROM content_projects cp WHERE cp.source_type='creative_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT)) AND pub.destination='workshop_journal' AND pub.content_status='published' AND pub.approved_by_user_id IS NOT NULL AND pub.published_by_user_id IS NOT NULL) human_published_journal_rows,
    (SELECT COUNT(*) FROM creative_assets a WHERE a.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND a.asset_status<>'archived' AND a.source_safety_status='public_allowed') public_allowed_caip_assets,
    (SELECT COUNT(*) FROM caip_media_upload_files f WHERE f.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND f.consent_state='public_allowed' AND f.rights_status='public_allowed') public_allowed_private_uploads,
    (SELECT COUNT(*) FROM creative_assets a WHERE a.creative_project_id=(SELECT MIN(cp.creative_project_id) FROM creative_projects cp WHERE cp.source_type='creative_work_project' AND cp.source_id=CAST(p.creative_work_project_id AS TEXT) AND cp.project_status<>'archived') AND a.asset_status<>'archived' AND COALESCE(a.source_safety_status,'needs_review')<>'public_allowed') non_public_caip_assets
  FROM creative_work_projects p WHERE COALESCE(p.project_status,'')<>'archived' ORDER BY p.creative_work_project_id`).all();
  const projects=rows(result).map(p=>({
    ...p,
    readiness_state:classify(p),
    public_media_rights_state:(n(p.public_allowed_caip_assets)+n(p.public_allowed_private_uploads))>0?'EXPLICIT_PUBLIC_MEDIA_RIGHTS_PRESENT':'NO_PUBLIC_MEDIA_RIGHTS_EVIDENCE'
  }));
  const counts={};for(const p of projects)counts[p.readiness_state]=(counts[p.readiness_state]||0)+1;
  return jsonResponse({ok:true,release:RELEASE,build:BUILD,title:TITLE,read_only:true,projects,readiness_counts:counts,
    readiness_rule:{maker_story_profile_required:true,factual_core_required:true,explicit_story_review_required:true,public_story_candidate_required:true,approved_and_locked_copy_required:true,human_publication_traceability_required:true},
    policy:{publication_readiness_is_read_only_classification:true,automatic_profile_creation:false,automatic_story_review:false,automatic_public_candidate:false,automatic_content_approval:false,automatic_publication:false,automatic_social_posting:false,public_media_rights_separate:true,private_media_never_public_by_inference:true,provider_posting_independent:true,provider_execution:false,r2_mutation:false,production_d1_contact:false}
  },200,{'Cache-Control':'no-store'});
}
