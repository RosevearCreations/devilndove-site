// Release 467 Build 228 — First Real Custom Work Route-to-Proof Pilot.
// Read-only pilot evidence over existing Custom Work authorities. No synthetic Production records.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const BUILD=228;
const rows=r=>Array.isArray(r?.results)?r.results:[];
const json=(data,status=200)=>jsonResponse({build:BUILD,...data},status,{'Cache-Control':'no-store'});
const REQUIRED=Object.freeze([
  'custom_requests','custom_request_manufacturing_triage','custom_request_route_processes',
  'custom_request_quote_drafts','custom_request_proof_versions'
]);
const STEPS=Object.freeze([
  {key:'intake',build:210,label:'Custom Work Intake',href:'/admin/custom-request/#customWorkBuild151Mount'},
  {key:'triage',build:211,label:'Manufacturing Triage',href:'/admin/custom-request/#customWorkTriage211Mount'},
  {key:'route',build:211,label:'Canonical Route',href:'/admin/custom-request/#customWorkTriage211Mount'},
  {key:'quote',build:215,label:'Quote Assumptions',href:'/admin/custom-request/#customWorkBatchQuote215Mount'},
  {key:'proof',build:213,label:'Proof / Version',href:'/admin/custom-request/#customWorkProof213Mount'},
  {key:'approval',build:213,label:'Customer / Internal Approval',href:'/admin/custom-request/#customWorkProof213Mount'}
]);

async function access(request,env){
  const admin=await getAdminUserFromRequest(request,env);
  if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
  const db=getDb(env);
  if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
  const q=REQUIRED.map(()=>'?').join(',');
  const schema=rows(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ("+q+")").bind(...REQUIRED).all());
  const present=new Set(schema.map(x=>String(x.name||'')));
  const missing=REQUIRED.filter(x=>!present.has(x));
  if(missing.length)return {error:json({ok:false,error:'Existing Custom Work authority is incomplete.',code:'build228_existing_authority_missing',classification:'BROKEN_EXISTING_AUTHORITY',missing_tables:missing},503)};
  return {admin,db};
}
function stepState(row,key){
  if(key==='intake')return 'complete';
  if(key==='triage')return row.triage_status==='reviewed'?'complete':row.triage_status?'in_progress':'next';
  if(key==='route')return Number(row.route_process_count||0)>0?'complete':row.triage_status==='reviewed'?'next':'waiting';
  if(key==='quote')return Number(row.quote_count||0)>0?'complete':Number(row.route_process_count||0)>0?'next':'waiting';
  if(key==='proof')return Number(row.proof_count||0)>0?'complete':Number(row.quote_count||0)>0?'next':'waiting';
  if(key==='approval'){
    if(String(row.latest_proof_status||'')==='approved' && (Number(row.internal_approval_required||0)===0 || String(row.internal_approval_status||'')==='approved'))return 'complete';
    return Number(row.proof_count||0)>0?'next':'waiting';
  }
  return 'waiting';
}
function nextAction(row){
  if(!row.triage_status || row.triage_status!=='reviewed')return STEPS[1];
  if(['not_feasible','clarification_required','on_hold','needs_review'].includes(String(row.feasibility_state||'')))return STEPS[1];
  if(Number(row.route_process_count||0)===0)return STEPS[2];
  if(Number(row.quote_count||0)===0)return STEPS[3];
  if(Number(row.proof_count||0)===0)return STEPS[4];
  if(String(row.latest_proof_status||'')!=='approved')return STEPS[5];
  if(Number(row.internal_approval_required||0)===1 && String(row.internal_approval_status||'')!=='approved')return STEPS[5];
  return {key:'complete',build:228,label:'Route-to-proof pilot evidence is complete',href:'/admin/custom-work-pilot/'};
}
function project(row){
  const next=nextAction(row);
  const fullyApproved=next.key==='complete';
  const reviewedNotFeasible=row.triage_status==='reviewed' && row.feasibility_state==='not_feasible';
  return {...row,
    pilot_state:fullyApproved?'PROVEN_REAL_ROUTE_TO_PROOF':reviewedNotFeasible?'HOLD_REVIEWED_NOT_FEASIBLE':'REAL_REQUEST_IN_PROGRESS',
    next_action:next,
    steps:STEPS.map(s=>({...s,state:stepState(row,s.key)}))
  };
}
async function snapshot(db){
  const counts=await db.prepare("SELECT "+
    "(SELECT COUNT(*) FROM custom_requests WHERE lower(COALESCE(status,'new')) NOT IN ('declined','archived')) active_custom_requests,"+
    "(SELECT COUNT(DISTINCT custom_request_id) FROM custom_request_manufacturing_triage WHERE triage_status='reviewed') reviewed_triage_requests,"+
    "(SELECT COUNT(DISTINCT custom_request_id) FROM custom_request_route_processes) routed_requests,"+
    "(SELECT COUNT(DISTINCT custom_request_id) FROM custom_request_quote_drafts) quoted_requests,"+
    "(SELECT COUNT(DISTINCT custom_request_id) FROM custom_request_proof_versions) proofed_requests,"+
    "(SELECT COUNT(DISTINCT custom_request_id) FROM custom_request_proof_versions WHERE proof_status='approved') customer_approved_requests").first();

  const requestRows=rows(await db.prepare("SELECT "+
    "r.custom_request_id,r.request_key,r.name,r.product_interest,r.status,r.quantity,r.project_intent,r.updated_at,"+
    "t.triage_status,t.feasibility_state,t.proof_sample_required,"+
    "(SELECT COUNT(*) FROM custom_request_route_processes rp WHERE rp.custom_request_id=r.custom_request_id) route_process_count,"+
    "(SELECT COUNT(*) FROM custom_request_quote_drafts q WHERE q.custom_request_id=r.custom_request_id) quote_count,"+
    "(SELECT COUNT(*) FROM custom_request_proof_versions p WHERE p.custom_request_id=r.custom_request_id AND p.proof_status NOT IN ('expired','superseded')) proof_count,"+
    "(SELECT p.proof_status FROM custom_request_proof_versions p WHERE p.custom_request_id=r.custom_request_id ORDER BY p.version_number DESC LIMIT 1) latest_proof_status,"+
    "(SELECT p.internal_production_approval_required FROM custom_request_proof_versions p WHERE p.custom_request_id=r.custom_request_id ORDER BY p.version_number DESC LIMIT 1) internal_approval_required,"+
    "(SELECT p.internal_production_approval_status FROM custom_request_proof_versions p WHERE p.custom_request_id=r.custom_request_id ORDER BY p.version_number DESC LIMIT 1) internal_approval_status "+
    "FROM custom_requests r LEFT JOIN custom_request_manufacturing_triage t ON t.custom_request_id=r.custom_request_id "+
    "WHERE lower(COALESCE(r.status,'new')) NOT IN ('declined','archived') "+
    "ORDER BY datetime(r.updated_at) DESC,r.custom_request_id DESC LIMIT 80").all()).map(project);

  const proven=requestRows.filter(r=>r.pilot_state==='PROVEN_REAL_ROUTE_TO_PROOF');
  const classification=requestRows.length===0?'HOLD_NO_REAL_REQUEST':proven.length>0?'PROVEN_REAL_REVIEWED_EVIDENCE':'REAL_REQUEST_PILOT_IN_PROGRESS';
  return {
    ok:true,
    classification,
    counts:counts||{},
    requests:requestRows,
    pilot_candidate:requestRows[0]||null,
    software_acceptance:'GREEN_READ_ONLY_ROUTE_TO_PROOF_ORCHESTRATION',
    exit_condition:classification==='HOLD_NO_REAL_REQUEST'
      ? 'No legitimate Custom Request exists. Software acceptance is GREEN and the build closes HOLD without fabricated business evidence.'
      : classification==='PROVEN_REAL_REVIEWED_EVIDENCE'
        ? 'At least one legitimate request has reviewed route-to-proof evidence.'
        : 'A legitimate request exists and remains in the existing owner workflow.',
    synthetic_business_records:false,
    mutation_authority:'NONE_BUILD228_READ_ONLY',
    provider_execution:false,
    production_copy:false
  };
}
export async function onRequestGet({request,env}){
  const a=await access(request,env);if(a.error)return a.error;
  try{return json(await snapshot(a.db));}
  catch(error){return json({ok:false,error:'Unable to evaluate the Custom Work route-to-proof pilot.',code:'build228_read_failed',classification:'BROKEN_EXISTING_AUTHORITY',detail:String(error?.message||error)},500);}
}
