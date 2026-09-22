// Release 467 Build 227 — Manufacturing Adoption Command Centre.
// Read-only adoption/readiness projection over existing Build 210–220 authorities.
// No request-time DDL, synthetic business records, Inventory/Finance mutation, publication or provider execution.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const BUILD=227;
const rows=r=>Array.isArray(r?.results)?r.results:[];
const json=(data,status=200)=>jsonResponse({build:BUILD,...data},status,{'Cache-Control':'no-store'});
const REQUIRED=Object.freeze([
  'custom_requests','custom_request_manufacturing_triage','custom_request_route_processes',
  'creative_work_projects','creative_project_operations','custom_request_proof_versions',
  'custom_request_quote_drafts','creative_project_manufacturing_lifecycles',
  'creative_project_job_travelers','creative_project_production_runs',
  'creative_project_production_run_qa_checks','creative_project_production_cost_evidence'
]);
const SURFACES=Object.freeze([
  {key:'intake',build:210,label:'Custom Work Intake',href:'/admin/custom-request/#customWorkBuild151Mount'},
  {key:'triage',build:211,label:'Manufacturing Triage & Route',href:'/admin/custom-request/#customWorkTriage211Mount'},
  {key:'operations',build:212,label:'Creative Project Operations',href:'/admin/creative-process/#creativeOperations212Mount'},
  {key:'proof',build:213,label:'Digital Proof',href:'/admin/custom-request/#customWorkProof213Mount'},
  {key:'lifecycle',build:214,label:'Manufacturing Lifecycle',href:'/admin/custom-request/#customWorkLifecycle214Mount'},
  {key:'quote',build:215,label:'Batch / Event Quote',href:'/admin/custom-request/#customWorkBatchQuote215Mount'},
  {key:'cost',build:217,label:'Production Cost Evidence',href:'/admin/creative-process/#productionCostEvidence217Mount'},
  {key:'margin',build:218,label:'Margin Guardrails',href:'/admin/custom-request/#customWorkMarginGuardrails218Mount'},
  {key:'traveler',build:219,label:'Job Traveler',href:'/admin/custom-request/#customWorkJobTraveler219Mount'},
  {key:'run_qa',build:220,label:'Production Run & QA',href:'/admin/custom-request/#customWorkProductionRun220Mount'}
]);

async function access(request,env){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
  const db=getDb(env);
  if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  const q=REQUIRED.map(()=>'?').join(',');
  const schema=rows(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${q})`).bind(...REQUIRED).all());
  const present=new Set(schema.map(x=>String(x.name||'')));
  const missing=REQUIRED.filter(x=>!present.has(x));
  if(missing.length)return {error:json({
    ok:false,error:'One or more existing manufacturing authorities are unavailable.',
    code:'build227_existing_authority_missing',classification:'BROKEN_EXISTING_AUTHORITY',
    missing_tables:missing,synthetic_business_records:false
  },503)};
  return {admin,db};
}
function requestNext(row){
  if(!row.triage_status)return {key:'triage',label:'Review manufacturing triage and choose a candidate route',href:SURFACES[1].href};
  if(String(row.triage_status)!=='reviewed')return {key:'triage',label:'Complete the existing triage review',href:SURFACES[1].href};
  if(Number(row.route_process_count||0)===0)return {key:'triage',label:'Add at least one existing canonical process to the reviewed route',href:SURFACES[1].href};
  if(Number(row.proof_sample_required||0)===1 && Number(row.proof_count||0)===0)return {key:'proof',label:'Create or review the required proof/sample evidence',href:SURFACES[3].href};
  if(Number(row.quote_count||0)===0)return {key:'quote',label:'Create or review the existing Custom Work quote draft',href:SURFACES[5].href};
  if(!row.lifecycle_stage)return {key:'lifecycle',label:'Link the work to the existing manufacturing lifecycle',href:SURFACES[4].href};
  if(['production_authorized','production_run','qa_rework','completed'].includes(String(row.lifecycle_stage)) && Number(row.traveler_count||0)===0)return {key:'traveler',label:'Review the existing job traveler before run evidence',href:SURFACES[8].href};
  if(Number(row.traveler_count||0)>0 && Number(row.run_count||0)===0)return {key:'run_qa',label:'Record the reviewed production run and QA evidence',href:SURFACES[9].href};
  if(Number(row.run_count||0)>0 && Number(row.qa_count||0)===0)return {key:'run_qa',label:'Complete QA evidence for the reviewed production run',href:SURFACES[9].href};
  return {key:'continue',label:'Continue the current reviewed owner workflow',href:SURFACES[4].href};
}
function stepState(key,c){
  if(key==='intake')return Number(c.active_custom_requests||0)>0?'evidence_present':'next';
  if(key==='triage')return Number(c.active_custom_requests||0)===0?'waiting':Number(c.reviewed_triage||0)>0?'evidence_present':'next';
  if(key==='operations')return Number(c.hybrid_projects||0)>0?'evidence_present':'available';
  if(key==='proof')return Number(c.proof_versions||0)>0?'evidence_present':Number(c.reviewed_triage||0)>0?'available':'waiting';
  if(key==='lifecycle')return Number(c.manufacturing_lifecycles||0)>0?'evidence_present':Number(c.active_custom_requests||0)>0?'available':'waiting';
  if(key==='quote')return Number(c.quote_drafts||0)>0?'evidence_present':Number(c.active_custom_requests||0)>0?'available':'waiting';
  if(key==='cost')return Number(c.production_cost_evidence||0)>0?'evidence_present':Number(c.hybrid_projects||0)>0?'available':'waiting';
  if(key==='margin')return Number(c.quote_drafts||0)>0?'available':'waiting';
  if(key==='traveler')return Number(c.reviewed_travelers||0)>0?'evidence_present':Number(c.manufacturing_lifecycles||0)>0?'available':'waiting';
  if(key==='run_qa')return Number(c.reviewed_runs||0)>0?'evidence_present':Number(c.reviewed_travelers||0)>0?'available':'waiting';
  return 'available';
}

async function snapshot(db){
  const counts=await db.prepare(`SELECT
    (SELECT COUNT(*) FROM custom_requests WHERE lower(COALESCE(status,'new')) NOT IN ('declined','archived')) active_custom_requests,
    (SELECT COUNT(*) FROM custom_requests WHERE lower(COALESCE(status,'new')) NOT IN ('declined','archived') AND COALESCE(supplied_item,0)=1) supplied_item_requests,
    (SELECT COUNT(*) FROM custom_request_manufacturing_triage) triage_records,
    (SELECT COUNT(*) FROM custom_request_manufacturing_triage WHERE triage_status='reviewed') reviewed_triage,
    (SELECT COUNT(DISTINCT creative_work_project_id) FROM creative_project_operations WHERE COALESCE(plan_status,'planned')<>'retired') hybrid_projects,
    (SELECT COUNT(*) FROM custom_request_proof_versions) proof_versions,
    (SELECT COUNT(*) FROM custom_request_quote_drafts) quote_drafts,
    (SELECT COUNT(*) FROM creative_project_manufacturing_lifecycles) manufacturing_lifecycles,
    (SELECT COUNT(*) FROM creative_project_job_travelers WHERE traveler_status='reviewed') reviewed_travelers,
    (SELECT COUNT(*) FROM creative_project_production_runs WHERE run_status='reviewed') reviewed_runs,
    (SELECT COUNT(*) FROM creative_project_production_run_qa_checks) qa_checks,
    (SELECT COUNT(*) FROM creative_project_production_cost_evidence WHERE evidence_status='active') production_cost_evidence,
    (SELECT COUNT(*) FROM custom_requests r WHERE lower(COALESCE(r.status,'new')) NOT IN ('declined','archived') AND NOT EXISTS (SELECT 1 FROM custom_request_manufacturing_triage t WHERE t.custom_request_id=r.custom_request_id)) requests_missing_triage,
    (SELECT COUNT(*) FROM custom_request_manufacturing_triage t WHERE t.triage_status='reviewed' AND NOT EXISTS (SELECT 1 FROM custom_request_route_processes rp WHERE rp.custom_request_id=t.custom_request_id)) reviewed_triage_missing_route,
    (SELECT COUNT(*) FROM creative_project_manufacturing_lifecycles l WHERE l.current_stage IN ('production_authorized','production_run','qa_rework','completed') AND NOT EXISTS (SELECT 1 FROM creative_project_job_travelers j WHERE j.creative_project_manufacturing_lifecycle_id=l.creative_project_manufacturing_lifecycle_id AND j.traveler_status='reviewed')) production_stage_missing_traveler,
    (SELECT COUNT(*) FROM creative_project_production_runs r WHERE r.run_status='reviewed' AND NOT EXISTS (SELECT 1 FROM creative_project_production_run_qa_checks q WHERE q.creative_project_production_run_id=r.creative_project_production_run_id)) reviewed_run_missing_qa
  `).first();

  const requests=rows(await db.prepare(`SELECT
      r.custom_request_id,r.request_key,r.name,r.product_interest,r.status,r.quantity,r.project_intent,r.supplied_item,
      t.triage_status,t.feasibility_state,t.proof_sample_required,
      (SELECT COUNT(*) FROM custom_request_route_processes rp WHERE rp.custom_request_id=r.custom_request_id) route_process_count,
      (SELECT COUNT(*) FROM custom_request_proof_versions pv WHERE pv.custom_request_id=r.custom_request_id AND pv.proof_status NOT IN ('expired','superseded')) proof_count,
      (SELECT COUNT(*) FROM custom_request_quote_drafts qd WHERE qd.custom_request_id=r.custom_request_id) quote_count,
      (SELECT l.current_stage FROM creative_project_manufacturing_lifecycles l WHERE l.custom_request_id=r.custom_request_id ORDER BY l.creative_project_manufacturing_lifecycle_id DESC LIMIT 1) lifecycle_stage,
      (SELECT COUNT(*) FROM creative_project_job_travelers jt WHERE jt.custom_request_id=r.custom_request_id AND jt.traveler_status='reviewed') traveler_count,
      (SELECT COUNT(*) FROM creative_project_production_runs pr WHERE pr.custom_request_id=r.custom_request_id AND pr.run_status='reviewed') run_count,
      (SELECT COUNT(*) FROM creative_project_production_run_qa_checks qc JOIN creative_project_production_runs pr2 ON pr2.creative_project_production_run_id=qc.creative_project_production_run_id WHERE pr2.custom_request_id=r.custom_request_id AND pr2.run_status='reviewed') qa_count
    FROM custom_requests r
    LEFT JOIN custom_request_manufacturing_triage t ON t.custom_request_id=r.custom_request_id
    WHERE lower(COALESCE(r.status,'new')) NOT IN ('declined','archived')
    ORDER BY datetime(r.updated_at) DESC,r.custom_request_id DESC LIMIT 40`).all()).map(r=>({...r,next_action:requestNext(r)}));

  const c=counts||{};
  const noRealWork=Number(c.active_custom_requests||0)===0 &&
    Number(c.triage_records||0)===0 && Number(c.manufacturing_lifecycles||0)===0 &&
    Number(c.proof_versions||0)===0 && Number(c.quote_drafts||0)===0 &&
    Number(c.reviewed_travelers||0)===0 && Number(c.reviewed_runs||0)===0;
  const attention=Number(c.reviewed_triage_missing_route||0)+Number(c.production_stage_missing_traveler||0)+Number(c.reviewed_run_missing_qa||0);
  const classification=noRealWork?'NO_REAL_WORK_YET':attention>0?'WORKFLOW_NEEDS_ATTENTION':
    Number(c.active_custom_requests||0)>0?'REAL_WORK_IN_PROGRESS':'READY_FOR_ADOPTION';
  const adoptionPath=SURFACES.map(s=>({...s,state:stepState(s.key,c)}));
  return {
    classification,
    counts:c,
    requests,
    adoption_path:adoptionPath,
    next_valid_action:noRealWork
      ? {key:'intake',label:'Enter the first legitimate Custom Work request when real work is available.',href:SURFACES[0].href}
      : (requests.find(r=>r.next_action)?.next_action||{key:'operations',label:'Review the existing manufacturing owner surfaces.',href:SURFACES[2].href}),
    interpretation:noRealWork
      ? 'The manufacturing engine is present, but there is no real operational work to advance. This is adoption evidence, not a broken workflow.'
      : attention>0
        ? 'Existing business records are present and one or more reviewed workflow prerequisites need operator attention.'
        : 'Existing manufacturing authorities are available for human-reviewed adoption.',
    synthetic_business_records:false,
    mutation_authority:'NONE_BUILD227_READ_ONLY',
    provider_execution:false,
    publication_authorized:false
  };
}

export async function onRequestGet({request,env}){
  const a=await access(request,env);if(a.error)return a.error;
  try{return json({ok:true,...await snapshot(a.db)});}
  catch(error){return json({ok:false,error:'Unable to read the existing manufacturing authorities.',code:'build227_read_failed',classification:'BROKEN_EXISTING_AUTHORITY',detail:String(error?.message||error),synthetic_business_records:false},500);}
}
