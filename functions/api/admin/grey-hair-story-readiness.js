// Release 467 Build 320 — Grey Hair Source-Evidence Review & Story-Plan Readiness.
// Read-only composition over existing CAIP evidence-review and Grey Hair story-planning authorities.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const RELEASE=467,BUILD=320,TITLE='Grey Hair Source-Evidence Review & Story-Plan Readiness';
const rows=r=>Array.isArray(r?.results)?r.results:[];
const n=v=>Number(v||0)||0;

export async function onRequestGet(context){
  const admin=await getAdminUserFromRequest(context.request,context.env);
  if(!admin)return jsonResponse({ok:false,release:RELEASE,build:BUILD,error:'Admin access required.'},401,{'Cache-Control':'no-store'});
  const db=getDb(context.env);
  if(!db)return jsonResponse({ok:false,release:RELEASE,build:BUILD,error:'Database binding is not configured.'},503,{'Cache-Control':'no-store'});
  const work=await db.prepare(`SELECT creative_work_project_id,project_key,project_title,project_status FROM creative_work_projects WHERE creative_work_project_id=6 AND project_key='CP-MSUNAL8R' AND project_title='Grey Hair' LIMIT 1`).first();
  if(!work)return jsonResponse({ok:false,release:RELEASE,build:BUILD,error:'Canonical Grey Hair Creative Project was not found.'},404,{'Cache-Control':'no-store'});
  const project=await db.prepare(`SELECT creative_project_id,creative_project_key,project_title,project_status,governance_status,content_project_id FROM creative_projects WHERE source_type='creative_work_project' AND source_id='6' AND project_status<>'archived' ORDER BY creative_project_id LIMIT 1`).first();
  if(!project)return jsonResponse({ok:false,release:RELEASE,build:BUILD,error:'Canonical Grey Hair CAIP workspace was not found.'},409,{'Cache-Control':'no-store'});
  const id=n(project.creative_project_id);
  const counts=await db.prepare(`SELECT
    (SELECT COUNT(*) FROM creative_assets WHERE creative_project_id=? AND asset_status<>'archived') active_assets,
    (SELECT COUNT(*) FROM creative_media_evidence_ranges WHERE creative_project_id=? AND marker_status='active') active_source_evidence,
    (SELECT COUNT(*) FROM creative_media_evidence_ranges WHERE creative_project_id=? AND marker_status='active' AND review_status='approved') approved_source_evidence,
    (SELECT COUNT(*) FROM creative_media_evidence_ranges WHERE creative_project_id=? AND marker_status='active' AND review_status='needs_review') evidence_needs_review,
    (SELECT COUNT(*) FROM caip_capture_groups WHERE creative_project_id=? AND sync_status='confirmed') confirmed_capture_groups,
    (SELECT COUNT(*) FROM caip_capture_tracks t JOIN caip_capture_groups g ON g.caip_capture_group_id=t.caip_capture_group_id WHERE g.creative_project_id=? AND t.review_status='confirmed') confirmed_capture_tracks,
    (SELECT COUNT(*) FROM caip_story_builder_drafts WHERE creative_project_id=? AND story_status IN ('review','approved')) reviewed_story_plans,
    (SELECT COUNT(*) FROM caip_story_builder_drafts WHERE creative_project_id=? AND story_status='approved') approved_story_plans,
    (SELECT COUNT(*) FROM caip_story_builder_items i JOIN caip_story_builder_drafts d ON d.caip_story_builder_draft_id=i.caip_story_builder_draft_id WHERE d.creative_project_id=? AND d.story_status IN ('review','approved') AND i.creative_media_evidence_range_id IS NOT NULL) source_backed_story_items,
    (SELECT COUNT(*) FROM creative_project_maker_story_profiles WHERE creative_work_project_id=6) maker_story_profiles,
    (SELECT COUNT(*) FROM creative_assets WHERE creative_project_id=? AND source_safety_status='public_allowed') public_allowed_assets,
    (SELECT COUNT(*) FROM caip_media_upload_files WHERE creative_project_id=? AND consent_state='public_allowed' AND rights_status='public_allowed') public_allowed_uploads
  `).bind(id,id,id,id,id,id,id,id,id,id,id).first();
  const evidence=rows(await db.prepare(`SELECT creative_media_evidence_range_id,evidence_category,title,note_text,transcript_excerpt,start_seconds,end_seconds,verification_status,review_status,visibility,story_candidate,marker_status,reviewed_at
    FROM creative_media_evidence_ranges WHERE creative_project_id=? AND marker_status='active'
    ORDER BY CASE review_status WHEN 'approved' THEN 0 WHEN 'needs_review' THEN 1 ELSE 2 END,start_seconds,creative_media_evidence_range_id LIMIT 80`).bind(id).all());
  const plans=rows(await db.prepare(`SELECT d.caip_story_builder_draft_id,d.story_key,d.title,d.story_status,d.opening_summary,d.lesson_summary,d.recommendation_summary,d.reviewed_by_user_id,d.reviewed_at,
    (SELECT COUNT(*) FROM caip_story_builder_items i WHERE i.caip_story_builder_draft_id=d.caip_story_builder_draft_id) item_count,
    (SELECT COUNT(*) FROM caip_story_builder_items i WHERE i.caip_story_builder_draft_id=d.caip_story_builder_draft_id AND i.creative_media_evidence_range_id IS NOT NULL) source_backed_item_count
    FROM caip_story_builder_drafts d WHERE d.creative_project_id=? ORDER BY datetime(d.updated_at) DESC,d.caip_story_builder_draft_id DESC LIMIT 20`).bind(id).all());
  const approved=n(counts?.approved_source_evidence),groups=n(counts?.confirmed_capture_groups),reviewed=n(counts?.reviewed_story_plans),items=n(counts?.source_backed_story_items);
  let state='SOURCE_EVIDENCE_REVIEW_REQUIRED';
  if(approved>=2&&groups<1)state='STORY_PLANNING_PREREQUISITE_SYNC_REQUIRED';
  else if(approved>=2&&(reviewed<1||items<2))state='HUMAN_REVIEWED_STORY_PLAN_REQUIRED';
  else if(approved>=2&&reviewed>=1&&items>=2)state='GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION';
  return jsonResponse({
    ok:true,release:RELEASE,build:BUILD,title:TITLE,work_project:work,caip_project:project,counts,evidence,story_plans:plans,readiness_state:state,
    readiness_rule:{approved_source_evidence_min:2,reviewed_story_plans_min:1,source_backed_story_items_min:2,maker_story_profile_auto_created:false},
    actions:{
      evidence_review:'/admin/creative-assets/',
      sync_alignment:'/admin/grey-hair-sync-alignment/',
      story_planning:'/admin/grey-hair-story-edit-planning/'
    },
    policy:{read_only:true,private_media_only:true,raw_private_urls:false,media_rights_inference:false,automatic_evidence_approval:false,automatic_story_plan_review:false,automatic_maker_story_profile:false,automatic_publication:false,provider_execution:false,r2_mutation:false,production_d1_contact:false}
  },200,{'Cache-Control':'no-store'});
}
