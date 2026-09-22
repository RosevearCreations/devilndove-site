// Release 467 Build 229 — First Creative Project Prototype-to-Run Pilot.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
const BUILD=229;
const rows=r=>Array.isArray(r?.results)?r.results:[];
const json=(data,status=200)=>jsonResponse({build:BUILD,...data},status,{'Cache-Control':'no-store'});
const REQUIRED=Object.freeze(['creative_work_projects','creative_project_operations','creative_project_manufacturing_lifecycles','creative_project_manufacturing_lifecycle_events','creative_project_job_travelers','creative_project_production_runs','creative_project_production_run_qa_checks','creative_project_production_run_handoffs']);
const STEPS=Object.freeze([
 {key:'operations',build:212,label:'Creative Project Operation Plan',href:'/admin/creative-process/#creativeOperations212Mount'},
 {key:'prototype',build:214,label:'Prototype / Rework Evidence',href:'/admin/custom-request/#customWorkLifecycle214Mount'},
 {key:'sample',build:214,label:'Approved Sample',href:'/admin/custom-request/#customWorkLifecycle214Mount'},
 {key:'authorization',build:214,label:'Production Authorization',href:'/admin/custom-request/#customWorkLifecycle214Mount'},
 {key:'traveler',build:219,label:'Reviewed Job Traveler',href:'/admin/custom-request/#customWorkJobTraveler219Mount'},
 {key:'run',build:220,label:'Reviewed Production Run',href:'/admin/custom-request/#customWorkProductionRun220Mount'},
 {key:'qa',build:220,label:'QA / Rework / Scrap Evidence',href:'/admin/custom-request/#customWorkProductionRun220Mount'},
 {key:'handoff',build:220,label:'Handoff Evidence',href:'/admin/custom-request/#customWorkProductionRun220Mount'}
]);
async function access(request,env){
 const admin=await getAdminUserFromRequest(request,env);if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
 const db=getDb(env);if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
 const q=REQUIRED.map(()=>'?').join(',');const schema=rows(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ("+q+")").bind(...REQUIRED).all());
 const present=new Set(schema.map(x=>String(x.name||''))),missing=REQUIRED.filter(x=>!present.has(x));
 if(missing.length)return {error:json({ok:false,error:'Existing Creative Project manufacturing authority is incomplete.',code:'build229_existing_authority_missing',classification:'BROKEN_EXISTING_AUTHORITY',missing_tables:missing},503)};
 return {admin,db};
}
function stepState(key,c){
 if(key==='operations')return Number(c.operation_plan_projects||0)>0?'evidence_present':'next';
 if(key==='prototype')return Number(c.prototype_projects||0)>0?'evidence_present':Number(c.operation_plan_projects||0)>0?'next':'waiting';
 if(key==='sample')return Number(c.approved_sample_projects||0)>0?'evidence_present':Number(c.prototype_projects||0)>0?'next':'waiting';
 if(key==='authorization')return Number(c.production_authorized_projects||0)>0?'evidence_present':Number(c.approved_sample_projects||0)>0?'next':'waiting';
 if(key==='traveler')return Number(c.reviewed_travelers||0)>0?'evidence_present':Number(c.production_authorized_projects||0)>0?'next':'waiting';
 if(key==='run')return Number(c.reviewed_runs||0)>0?'evidence_present':Number(c.reviewed_travelers||0)>0?'next':'waiting';
 if(key==='qa')return Number(c.qa_checks||0)>0?'evidence_present':Number(c.reviewed_runs||0)>0?'next':'waiting';
 if(key==='handoff')return Number(c.handoffs||0)>0?'evidence_present':Number(c.qa_checks||0)>0?'next':'waiting';
 return 'waiting';
}
async function snapshot(db){
 const c=await db.prepare(`SELECT
  (SELECT COUNT(*) FROM creative_work_projects w WHERE EXISTS (SELECT 1 FROM creative_project_operations o WHERE o.creative_work_project_id=w.creative_work_project_id) OR EXISTS (SELECT 1 FROM creative_project_manufacturing_lifecycles l WHERE l.creative_work_project_id=w.creative_work_project_id)) real_projects,
  (SELECT COUNT(DISTINCT creative_work_project_id) FROM creative_project_operations WHERE COALESCE(plan_status,'planned')<>'retired') operation_plan_projects,
  (SELECT COUNT(*) FROM creative_project_manufacturing_lifecycles) manufacturing_lifecycles,
  (SELECT COUNT(DISTINCT l.creative_work_project_id) FROM creative_project_manufacturing_lifecycles l WHERE l.creative_work_project_id IS NOT NULL AND EXISTS (SELECT 1 FROM creative_project_manufacturing_lifecycle_events e WHERE e.creative_project_manufacturing_lifecycle_id=l.creative_project_manufacturing_lifecycle_id AND e.to_stage IN ('prototype','prototype_failed_rework'))) prototype_projects,
  (SELECT COUNT(*) FROM creative_project_manufacturing_lifecycles WHERE creative_work_project_id IS NOT NULL AND (approved_sample_at IS NOT NULL OR current_stage IN ('approved_sample','production_authorized','production_run','qa_rework','completed'))) approved_sample_projects,
  (SELECT COUNT(*) FROM creative_project_manufacturing_lifecycles WHERE creative_work_project_id IS NOT NULL AND (production_authorized_at IS NOT NULL OR current_stage IN ('production_authorized','production_run','qa_rework','completed'))) production_authorized_projects,
  (SELECT COUNT(*) FROM creative_project_job_travelers WHERE traveler_status='reviewed') reviewed_travelers,
  (SELECT COUNT(*) FROM creative_project_production_runs WHERE run_status='reviewed') reviewed_runs,
  (SELECT COUNT(*) FROM creative_project_production_run_qa_checks) qa_checks,
  (SELECT COUNT(*) FROM creative_project_production_run_handoffs) handoffs,
  (SELECT COUNT(*) FROM creative_project_manufacturing_lifecycles WHERE creative_work_project_id IS NOT NULL AND (completed_at IS NOT NULL OR current_stage='completed')) completed_lifecycles,
  (SELECT COUNT(DISTINCT l.creative_work_project_id) FROM creative_project_manufacturing_lifecycles l WHERE l.creative_work_project_id IS NOT NULL AND (l.completed_at IS NOT NULL OR l.current_stage='completed') AND EXISTS (SELECT 1 FROM creative_project_operations o WHERE o.creative_work_project_id=l.creative_work_project_id AND COALESCE(o.plan_status,'planned')<>'retired') AND EXISTS (SELECT 1 FROM creative_project_manufacturing_lifecycle_events e WHERE e.creative_project_manufacturing_lifecycle_id=l.creative_project_manufacturing_lifecycle_id AND e.to_stage IN ('prototype','prototype_failed_rework')) AND l.approved_sample_at IS NOT NULL AND l.production_authorized_at IS NOT NULL AND EXISTS (SELECT 1 FROM creative_project_job_travelers jt WHERE jt.creative_project_manufacturing_lifecycle_id=l.creative_project_manufacturing_lifecycle_id AND jt.traveler_status='reviewed') AND EXISTS (SELECT 1 FROM creative_project_production_runs pr WHERE pr.creative_project_manufacturing_lifecycle_id=l.creative_project_manufacturing_lifecycle_id AND pr.run_status='reviewed' AND EXISTS (SELECT 1 FROM creative_project_production_run_qa_checks q WHERE q.creative_project_production_run_id=pr.creative_project_production_run_id) AND EXISTS (SELECT 1 FROM creative_project_production_run_handoffs h WHERE h.creative_project_production_run_id=pr.creative_project_production_run_id))) proven_projects`).first();
 const counts=c||{},noRealProject=Number(counts.real_projects||0)===0&&Number(counts.manufacturing_lifecycles||0)===0,proven=Number(counts.proven_projects||0)>0;
 const classification=noRealProject?'HOLD_NO_REAL_PROJECT':proven?'PROVEN_REAL_REVIEWED_EVIDENCE':'REAL_PROJECT_PILOT_IN_PROGRESS';
 return {ok:true,classification,counts,path:STEPS.map(s=>({...s,state:stepState(s.key,counts)})),software_acceptance:'GREEN_READ_ONLY_PROTOTYPE_TO_RUN_ORCHESTRATION',exit_condition:noRealProject?'No legitimate Creative Project manufacturing record exists. Software readiness is GREEN and the pilot closes HOLD without fabricated project or production evidence.':proven?'At least one legitimate Creative Project has correlated reviewed operation, prototype, sample, authorization, traveler, run, QA and handoff evidence.':'Legitimate Creative Project manufacturing evidence exists and remains in the existing owner workflows.',synthetic_project_or_production_records:false,mutation_authority:'NONE_BUILD229_READ_ONLY',provider_execution:false,production_copy:false};
}
export async function onRequestGet({request,env}){const a=await access(request,env);if(a.error)return a.error;try{return json(await snapshot(a.db));}catch(error){return json({ok:false,error:'Unable to evaluate the Creative Project prototype-to-run pilot.',code:'build229_read_failed',classification:'BROKEN_EXISTING_AUTHORITY',detail:String(error?.message||error)},500);}}
