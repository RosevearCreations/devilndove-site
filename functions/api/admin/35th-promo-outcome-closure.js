// Release 467 Build 332 — GET-only 35th Promo factual evidence completion continuity II.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
const BUILD=332;
const json=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const n=v=>Number(v||0)||0,s=v=>String(v??'').trim();
const SAFETY=Object.freeze({read_only:true,synthetic_evidence:false,evidence_mutation:false,automatic_evidence_selection:false,automatic_story_review:false,automatic_public_candidate:false,publication_mutation:false,social_mutation:false,media_rights_inference:false,provider_execution:false,production_d1_contact:false});
export async function onRequestGet(context){
 const admin=await getAdminUserFromRequest(context.request,context.env);if(!admin)return json({ok:false,release:467,build:BUILD,error:'Admin access required.',safety:SAFETY},401);
 const db=getDb(context.env);if(!db)return json({ok:false,release:467,build:BUILD,error:'Database binding is not configured.',safety:SAFETY},503);
 try{
  const target=await db.prepare(`SELECT p.creative_work_project_id,p.project_key,p.project_title,m.story_review_status,m.public_story_candidate,m.outcome_status,
   COALESCE(m.what_we_are_trying,'') what_we_are_trying,COALESCE(m.why_we_are_trying_it,'') why_we_are_trying_it,COALESCE(m.actual_result,'') actual_result,COALESCE(m.lesson_learned,'') lesson_learned,
   (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type IN ('setup','process','milestone','mistake','repair')) execution_events,
   (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type='result') result_events,
   (SELECT COUNT(*) FROM creative_work_events e WHERE e.creative_work_project_id=5 AND COALESCE(e.entry_status,'active')='active' AND e.event_type='lesson') lesson_events
   FROM creative_work_projects p JOIN creative_project_maker_story_profiles m ON m.creative_work_project_id=p.creative_work_project_id
   WHERE p.creative_work_project_id=5 AND p.project_key='CP-MSC1SUG2' AND p.project_title='35th promo'`).first();
  if(!target)return json({ok:false,release:467,build:BUILD,error:'Canonical 35th promo project/profile not found.',safety:SAFETY},409);
  const execution=n(target.execution_events),results=n(target.result_events),lessons=n(target.lesson_events);
  const eventComplete=execution>0&&results>0&&lessons>0;
  const placeholderGuard=/\b(no (?:execution|completed-result|result|lesson|outcome)|not recorded|does not claim|evidence is required|pending execution)\b/i;
  const substantiveFact=v=>s(v).length>0&&!placeholderGuard.test(s(v));
  const facts=s(target.what_we_are_trying).length>0&&s(target.why_we_are_trying_it).length>0&&substantiveFact(target.actual_result)&&substantiveFact(target.lesson_learned);
  const outcomeResolved=['win','partial_win','failure'].includes(s(target.outcome_status));
  const ready=eventComplete&&facts&&outcomeResolved;
  let closure_state='REAL_OUTCOME_EVIDENCE_STILL_REQUIRED';
  if(execution+results+lessons>0&&!eventComplete)closure_state='REAL_OUTCOME_EVIDENCE_PARTIAL';
  else if(eventComplete&&!ready)closure_state='REAL_EVENTS_COMPLETE_MAKER_STORY_FACTS_STILL_REQUIRED';
  else if(ready)closure_state='REAL_OUTCOME_FACTS_COMPLETE_READY_FOR_EXPLICIT_HUMAN_REVIEW';
  if(ready&&(s(target.story_review_status)==='reviewed'||n(target.public_story_candidate)===1))closure_state='REAL_OUTCOME_FACTS_COMPLETE_HUMAN_REVIEW_ALREADY_RECORDED';
  const missing=[];
  if(execution===0)missing.push('execution_or_process_event');if(results===0)missing.push('result_event');if(lessons===0)missing.push('lesson_event');
  if(!s(target.what_we_are_trying))missing.push('what_we_are_trying');if(!s(target.why_we_are_trying_it))missing.push('why_we_are_trying_it');if(!substantiveFact(target.actual_result))missing.push('actual_result');if(!outcomeResolved)missing.push('resolved_outcome_status');if(!substantiveFact(target.lesson_learned))missing.push('lesson_learned');
  return json({ok:true,release:467,build:BUILD,title:'35th Promo Factual Evidence Completion Continuity II',target,closure_state,missing_requirements:missing,
   readiness:{event_complete:eventComplete,profile_facts_complete:facts,outcome_resolved:outcomeResolved,ready_for_explicit_human_review:ready},
   operator_action:{record_evidence:'record_story_execution_evidence',workspace_href:'/admin/creative-process/?project_id=5',review_action:'explicit_human_review_only'},comparison_baseline:{source_build:331,execution_events:0,result_events:0,lesson_events:0,story_review_status:'needs_review',public_story_candidate:0,outcome_status:'unknown'},
   safety:SAFETY});
 }catch(error){return json({ok:false,release:467,build:BUILD,error:error?.message||'35th promo closure status could not load.',safety:SAFETY},500);}
}
