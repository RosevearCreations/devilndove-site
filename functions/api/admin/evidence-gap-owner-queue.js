// Release 467 Build 325 — GET-only Evidence Gap Owner Queue & Operator Action Traceability.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
const BUILD=325,TITLE='Evidence Gap Owner Queue & Operator Action Traceability';
const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const n=v=>Number(v||0)||0; const s=v=>String(v??'').trim();
const rows=r=>Array.isArray(r?.results)?r.results:[];
const SAFETY=Object.freeze({read_only:true,shadow_task_table:false,owner_assignment_persistence:false,acknowledgement_persistence:false,resolution_persistence:false,no_completion_by_queue_state:true,business_data_mutation:false,evidence_mutation:false,story_mutation:false,search_console_mutation:false,seo_mutation:false,provider_execution:false,r2_mutation:false,production_d1_contact:false});
function item(x){return {...x,write_capability:'none',owner_assignment_persistence:false,acknowledgement_persistence:false,resolution_persistence:false};}

export async function onRequestGet(context){
 const admin=await getAdminUserFromRequest(context.request,context.env);
 if(!admin)return json({ok:false,release:467,build:BUILD,error:'Admin access required.',safety:SAFETY},401);
 const db=getDb(context.env); if(!db)return json({ok:false,release:467,build:BUILD,error:'Database binding is not configured.',safety:SAFETY},503);
 try{
  const [promo,grey,search,unprofiledResult]=await Promise.all([
   db.prepare(`SELECT w.creative_work_project_id,w.project_key,w.project_title,
    COALESCE((SELECT m.story_review_status FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id LIMIT 1),'') story_review_status,
    COALESCE((SELECT m.public_story_candidate FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id LIMIT 1),0) public_story_candidate,
    COALESCE((SELECT m.outcome_status FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id LIMIT 1),'') outcome_status,
    (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type IN ('setup','process','mistake','repair','milestone','result','lesson')) execution_events,
    (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type='result') result_events,
    (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id AND COALESCE(e.entry_status,'active')='active' AND e.event_type='lesson') lesson_events,
    COALESCE((SELECT MAX(e.occurred_at) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id),'') latest_project_event_at,
    COALESCE((SELECT MAX(a.created_at) FROM admin_action_audit a WHERE a.action_type='creative_process_record_story_execution_evidence' AND a.target_type='creative_work_project' AND a.target_id=w.creative_work_project_id),'') latest_execution_intake_audit_at
    FROM creative_work_projects w WHERE w.creative_work_project_id=5`).first(),
   db.prepare(`SELECT w.creative_work_project_id,w.project_key,w.project_title,cp.creative_project_id caip_project_id,
    (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=cp.creative_project_id AND r.marker_status='active') active_source_evidence,
    (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=cp.creative_project_id AND r.marker_status='active' AND r.review_status='approved') approved_source_evidence,
    (SELECT COUNT(*) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=cp.creative_project_id AND r.marker_status='active' AND r.review_status='needs_review') source_evidence_needs_review,
    (SELECT COUNT(*) FROM caip_story_builder_drafts d WHERE d.creative_project_id=cp.creative_project_id AND d.story_status IN ('review','approved')) reviewed_story_plans,
    (SELECT COUNT(*) FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id) maker_story_profiles,
    COALESCE((SELECT MAX(r.reviewed_at) FROM creative_media_evidence_ranges r WHERE r.creative_project_id=cp.creative_project_id AND r.marker_status='active' AND TRIM(COALESCE(r.reviewed_at,''))<>''),'') latest_evidence_review_at
    FROM creative_work_projects w JOIN creative_projects cp ON cp.source_type='creative_work_project' AND cp.source_id=CAST(w.creative_work_project_id AS TEXT) AND cp.project_status<>'archived'
    WHERE w.creative_work_project_id=6`).first(),
   db.prepare(`SELECT (SELECT COUNT(*) FROM search_console_import_batches) import_batches,(SELECT COUNT(*) FROM search_console_page_queries) live_rows,
    COALESCE((SELECT SUM(clicks) FROM search_console_page_queries),0) clicks,COALESCE((SELECT SUM(impressions) FROM search_console_page_queries),0) impressions,
    (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='search_console_import') import_audits,
    (SELECT COUNT(*) FROM admin_action_audit WHERE action_type='search_console_delete_batch') revert_audits,
    COALESCE((SELECT MAX(created_at) FROM admin_action_audit WHERE action_type IN ('search_console_import','search_console_delete_batch')),'') latest_search_console_audit_at`).first(),
   db.prepare(`SELECT w.creative_work_project_id,w.project_key,w.project_title,w.project_status,
    (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id AND COALESCE(e.entry_status,'active')='active') active_events,
    (SELECT COUNT(*) FROM creative_project_evidence_selections es WHERE es.creative_work_project_id=w.creative_work_project_id AND es.selected=1) selected_evidence_rows,
    COALESCE((SELECT MAX(e.occurred_at) FROM creative_work_events e WHERE e.creative_work_project_id=w.creative_work_project_id),'') latest_project_event_at
    FROM creative_work_projects w WHERE COALESCE(w.project_status,'')<>'archived'
      AND NOT EXISTS (SELECT 1 FROM creative_project_maker_story_profiles m WHERE m.creative_work_project_id=w.creative_work_project_id)
    ORDER BY w.creative_work_project_id`).all()
  ]);
  const queue=[];
  if(s(promo?.outcome_status||'unknown')==='unknown'||s(promo?.story_review_status)!=='reviewed'||n(promo?.public_story_candidate)!==1)queue.push(item({
   gap_key:'35th_promo_real_outcome_evidence',gap_family:'35TH_PROMO_REAL_OUTCOME_EVIDENCE',priority:1,owner_module:'creator',owner_label:'Creator / Creative Process',
   target_type:'creative_work_project',target_id:5,target_title:s(promo?.project_title)||'35th promo',current_state:'FACTUAL_OUTCOME_EVIDENCE_REQUIRED',
   blocker:'Real execution, result and lesson evidence must exist before story review/public candidacy can advance.',
   action_text:'Record only the real execution/result/lesson evidence that actually happened, then remeasure the existing Maker Story.',
   workspace_href:'/admin/creative-process/?project_id=5',traceability_source:'creative_work_events + admin_action_audit',last_observed_at:s(promo?.latest_execution_intake_audit_at||promo?.latest_project_event_at)
  }));
  if(n(grey?.source_evidence_needs_review)>0||n(grey?.reviewed_story_plans)===0||n(grey?.maker_story_profiles)===0)queue.push(item({
   gap_key:'grey_hair_source_evidence_review',gap_family:'GREY_HAIR_SOURCE_EVIDENCE_REVIEW',priority:1,owner_module:'creator_caip',owner_label:'Creator / CAIP Review',
   target_type:'creative_work_project',target_id:6,target_title:s(grey?.project_title)||'Grey Hair',current_state:n(grey?.source_evidence_needs_review)>0?'SOURCE_EVIDENCE_REVIEW_REQUIRED':'STORY_PLAN_OR_PROFILE_READINESS_REQUIRED',
   blocker:`${n(grey?.source_evidence_needs_review)} active source-evidence range(s) still require explicit review; reviewed story planning/profile creation remains downstream.`,
   action_text:'Review the existing source ranges explicitly in the Grey Hair readiness workspace; do not infer media rights or auto-create a Maker Story.',
   workspace_href:'/admin/grey-hair-story-readiness/',traceability_source:'creative_media_evidence_ranges + caip_story_builder_drafts',last_observed_at:s(grey?.latest_evidence_review_at)
  }));
  if(n(search?.import_batches)===0||n(search?.live_rows)===0)queue.push(item({
   gap_key:'real_search_console_export',gap_family:'REAL_SEARCH_CONSOLE_EXPORT',priority:1,owner_module:'seo_discovery',owner_label:'SEO / Discovery',
   target_type:'search_console',target_id:null,target_title:'Google Search Console evidence',current_state:'EVIDENCE_PENDING_NO_REAL_EXPORT',
   blocker:'No real operator Search Console Performance export is staged.',
   action_text:'Import a genuine Search Console Performance CSV through the existing operator-controlled intake; do not synthesize clicks, impressions or queries.',
   workspace_href:'/admin/release-control/runtime-storefront-intelligence/',traceability_source:'search_console_import_batches + search_console_page_queries + admin_action_audit',last_observed_at:s(search?.latest_search_console_audit_at)
  }));
  const unprofiled=rows(unprofiledResult);
  for(const p of unprofiled){if(n(p.creative_work_project_id)===6)continue;queue.push(item({
   gap_key:`unprofiled_project_${n(p.creative_work_project_id)}`,gap_family:'UNPROFILED_MAKER_STORY_EVIDENCE',priority:2,owner_module:'creator',owner_label:'Creator / Creative Process',
   target_type:'creative_work_project',target_id:n(p.creative_work_project_id),target_title:s(p.project_title)||'Unprofiled project',current_state:'MAKER_STORY_EVIDENCE_REQUIRED',
   blocker:'No Maker Story profile exists and the project has not yet met the factual readiness rule.',
   action_text:'Capture/review real project events and evidence in Creative Process. Maker Story creation remains blocked until the factual prerequisites are satisfied.',
   workspace_href:`/admin/creative-process/?project_id=${n(p.creative_work_project_id)}`,traceability_source:'creative_work_events + creative_project_evidence_selections',last_observed_at:s(p.latest_project_event_at)
  }));}
  queue.sort((a,b)=>a.priority-b.priority||a.target_title.localeCompare(b.target_title));
  const families=[...new Set(queue.map(x=>x.gap_family))];
  return json({ok:true,release:467,build:BUILD,title:TITLE,role:'read_only_evidence_gap_owner_queue',
   queue,summary:{active_queue_rows:queue.length,active_gap_families:families.length,gap_families:families,unprofiled_projects:unprofiled.length},
   source_state:{promo,grey_hair:grey,search_console:search},safety:SAFETY});
 }catch(error){return json({ok:false,release:467,build:BUILD,error:error?.message||'Evidence Gap Owner Queue could not load.',safety:SAFETY},500);}
}
