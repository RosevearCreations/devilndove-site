// Release 467 Build 214 — manufacturing maturity read/transition contract.
import { loadCustomRequestProofReadiness } from './customRequestProofReadiness.js';

export const BUILD214_STAGES=Object.freeze([
  'concept','prototype','prototype_failed_rework','sample_candidate','approved_sample',
  'production_authorized','production_run','qa_rework','completed'
]);

export const BUILD214_TRANSITIONS=Object.freeze({
  concept:['prototype'],
  prototype:['prototype_failed_rework','sample_candidate'],
  prototype_failed_rework:['prototype','sample_candidate'],
  sample_candidate:['prototype_failed_rework','approved_sample'],
  approved_sample:['sample_candidate','production_authorized'],
  production_authorized:['sample_candidate','production_run'],
  production_run:['qa_rework','completed'],
  qa_rework:['production_run','completed'],
  completed:[],
});

const rows=r=>Array.isArray(r?.results)?r.results:[];
const id=v=>{const n=Number(v||0);return Number.isInteger(n)&&n>0?n:0;};

export function allowedManufacturingTransitions(stage){
  return BUILD214_TRANSITIONS[String(stage||'concept')]||[];
}

export async function loadManufacturingMaturityReadiness(db,lifecycleId){
  const lid=id(lifecycleId);if(!lid)return null;
  const lifecycle=await db.prepare(`SELECT * FROM creative_project_manufacturing_lifecycles
    WHERE creative_project_manufacturing_lifecycle_id=? LIMIT 1`).bind(lid).first().catch(()=>null);
  if(!lifecycle)return null;
  const proof=lifecycle.custom_request_id
    ? await loadCustomRequestProofReadiness(db,lifecycle.custom_request_id)
    : null;
  const approvedEvidence=Boolean(lifecycle.approved_sample_proof_version_id||lifecycle.approved_sample_creative_work_event_id);
  const blockers=[];
  if(['approved_sample','production_authorized','production_run','qa_rework','completed'].includes(String(lifecycle.current_stage||''))&&!approvedEvidence){
    blockers.push('Approved-sample stage or later is missing exact sample evidence.');
  }
  if(String(lifecycle.current_stage||'')==='approved_sample'&&proof?.proof_required&&!proof.production_ready){
    blockers.push(...(proof.blockers||[]));
  }
  return {
    lifecycle,
    allowed_next_stages:allowedManufacturingTransitions(lifecycle.current_stage),
    approved_sample_evidence_present:approvedEvidence,
    custom_request_proof_readiness:proof,
    production_authorization_ready:approvedEvidence&&(!proof?.proof_required||Boolean(proof.production_ready)),
    blockers,
    automatic_production_start:false,
    inventory_mutation:false,
    product_production_run_mutation:false,
    publication_authorized:false,
  };
}
