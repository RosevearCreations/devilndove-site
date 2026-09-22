// Release 467 Build 230 — Cost, Margin, QA & Knowledge Evidence Adoption.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
const BUILD=230;
const rows=r=>Array.isArray(r?.results)?r.results:[];
const json=(data,status=200)=>jsonResponse({release:467,build:BUILD,...data},status,{'Cache-Control':'no-store'});
const REQUIRED=Object.freeze(['custom_request_quote_drafts','custom_request_quote_revisions','creative_project_production_runs','creative_project_production_cost_evidence','creative_project_production_run_qa_checks','workshop_knowledge_entries','workshop_knowledge_recipe_versions']);
const LANES=Object.freeze([
 {key:'margin_reviews',build:218,label:'Expected-cost / margin review',href:'/admin/custom-request/'},
 {key:'reviewed_cost_projects',build:217,label:'Reviewed production-cost evidence',href:'/admin/creative-process/'},
 {key:'qa_checks',build:220,label:'QA / rework / scrap evidence',href:'/admin/custom-request/'},
 {key:'reviewed_knowledge_entries',build:221,label:'Reviewed Workshop Knowledge',href:'/admin/workshop-knowledge/'},
 {key:'approved_recipe_versions',build:222,label:'Approved recipe history',href:'/admin/workshop-knowledge/'}
]);
async function access(request,env){
 const admin=await getAdminUserFromRequest(request,env);if(!admin)return {error:json({ok:false,error:'Admin authentication required.'},401)};
 const db=getDb(env);if(!db)return {error:json({ok:false,error:'Database binding is not configured.'},500)};
 const q=REQUIRED.map(()=>'?').join(',');const schema=rows(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ("+q+")").bind(...REQUIRED).all());
 const present=new Set(schema.map(x=>String(x.name||''))),missing=REQUIRED.filter(x=>!present.has(x));
 if(missing.length)return {error:json({ok:false,error:'Existing cost, margin, QA or Workshop Knowledge authority is incomplete.',code:'build230_existing_authority_missing',classification:'BROKEN_EXISTING_AUTHORITY',missing_tables:missing},503)};
 return {admin,db};
}
async function snapshot(db){
 const c=await db.prepare(`SELECT
  (SELECT COUNT(*) FROM custom_request_quote_drafts) quote_drafts,
  (SELECT COUNT(*) FROM custom_request_quote_revisions WHERE revision_type='build218_margin_review') margin_reviews,
  (SELECT COUNT(*) FROM creative_project_production_runs WHERE run_status='reviewed') reviewed_runs,
  (SELECT COUNT(DISTINCT creative_work_project_id) FROM creative_project_production_cost_evidence WHERE evidence_status='active' AND cost_evidence_state='reviewed') reviewed_cost_projects,
  (SELECT COUNT(*) FROM creative_project_production_run_qa_checks) qa_checks,
  (SELECT COUNT(*) FROM workshop_knowledge_entries WHERE review_status='reviewed') reviewed_knowledge_entries,
  (SELECT COUNT(*) FROM workshop_knowledge_recipe_versions WHERE recipe_state='approved') approved_recipe_versions,
  (SELECT COUNT(*) FROM creative_project_production_runs pr WHERE pr.run_status='reviewed'
    AND EXISTS (SELECT 1 FROM creative_project_production_run_qa_checks q WHERE q.creative_project_production_run_id=pr.creative_project_production_run_id)
    AND EXISTS (SELECT 1 FROM creative_project_production_cost_evidence ce WHERE ce.creative_work_project_id=pr.creative_work_project_id AND ce.evidence_status='active' AND ce.cost_evidence_state='reviewed')) qualifying_runs`).first();
 const counts=c||{},hasRun=Number(counts.reviewed_runs||0)>0;
 const proven=Number(counts.qualifying_runs||0)>0&&Number(counts.margin_reviews||0)>0&&Number(counts.reviewed_cost_projects||0)>0&&Number(counts.qa_checks||0)>0&&Number(counts.reviewed_knowledge_entries||0)>0&&Number(counts.approved_recipe_versions||0)>0;
 const classification=!hasRun?'HOLD_NO_QUALIFYING_REAL_RUN':proven?'PROVEN_REVIEWED_ADOPTION':'EVIDENCE_ADOPTION_IN_PROGRESS';
 return {ok:true,classification,counts,lanes:LANES.map(x=>({...x,state:Number(counts[x.key]||0)>0?'evidence_present':hasRun?'review_needed':'waiting_for_real_run'})),
  software_acceptance:'GREEN_READ_ONLY_EVIDENCE_ADOPTION_MEASUREMENT',
  exit_condition:!hasRun?'No reviewed real production run exists. Software acceptance can close GREEN as HOLD_NO_QUALIFYING_REAL_RUN without invented cost, margin, QA or knowledge evidence.':proven?'Reviewed evidence is present across the existing cost, margin, QA and knowledge authorities.':'A real reviewed run exists, but one or more evidence lanes still need human-reviewed adoption in the existing owner workflows.',
  unknown_cost_is_zero:false,worked_once_is_generalized:false,synthetic_cost_margin_qa_or_knowledge_records:false,mutation_authority:'NONE_BUILD230_READ_ONLY',provider_execution:false,production_copy:false};
}
export async function onRequestGet({request,env}){const a=await access(request,env);if(a.error)return a.error;try{return json(await snapshot(a.db));}catch(error){return json({ok:false,error:'Unable to evaluate Build 230 evidence adoption.',code:'build230_read_failed',classification:'BROKEN_EXISTING_AUTHORITY',detail:String(error?.message||error)},500);}}
