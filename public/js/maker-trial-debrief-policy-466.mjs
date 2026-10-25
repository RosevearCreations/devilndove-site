/* Build 466 — bounded original-receipt reconciliation; never a real-world release authority. */
export const TRIAL_PATHS_466=Object.freeze({
 jewellery_metal:['source_identity','actual_materials','process_quality','physical_safety','media_rights'],
 resin_clay:['source_identity','actual_materials','process_quality','physical_safety','media_rights'],
 digital_fabrication:['source_identity','design_provenance','process_quality','physical_safety','media_rights'],
 failed_salvage:['source_identity','actual_materials','process_quality','media_rights'],
 private_therapeutic:['source_identity','privacy_control','process_quality','media_rights'],
 custom_commission:['source_identity','customer_approval','cost_handoff','process_quality','delivery_hold']
});
export const SOURCE_KINDS_466=Object.freeze({
 source_identity:['project','custom_request'],actual_materials:['event','cost_review'],
 design_provenance:['design_revision'],process_quality:['traveler_run','quality_attempt','commission_review'],
 physical_safety:['traveler_run','quality_attempt'],media_rights:['event','media_story'],
 privacy_control:['project','media_story'],customer_approval:['customer_proof'],
 cost_handoff:['commission_review'],delivery_hold:['commission_review']
});
export const OUTCOMES_466=Object.freeze(['observed_complete','work_in_progress','rework_or_salvage','private_learning','not_yet_observed']);
const positive=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):0;
const clean=(value,max)=>String(value??'').trim().slice(0,max+1);
const sameScope=(selected,scenario,sourceId)=>scenario==='custom_commission'
 ?positive(selected?.custom_request_id)===sourceId:positive(selected?.creative_work_project_id)===sourceId;
const expectedKind=(scenario,checkpoint,kind)=>{
 if(!SOURCE_KINDS_466[checkpoint]?.includes(kind))return false;
 if(checkpoint==='source_identity')return kind===(scenario==='custom_commission'?'custom_request':'project');
 if(scenario==='custom_commission')return ['custom_request','customer_proof','commission_review'].includes(kind);
 return kind!=='custom_request'&&kind!=='commission_review';
};

export function reconcileMakerTrial466({scenario='',sourceId=0,trial=null,orderId=0,fulfillment=null,orderLinkReviewed=false,debrief={}}={}){
 const needed=TRIAL_PATHS_466[scenario]||[],selectedId=positive(sourceId),linkedOrder=positive(orderId);
 const scopeValid=!!needed.length&&!!selectedId&&trial?.ok===true&&sameScope(trial.selected,scenario,selectedId);
 const history=scopeValid&&Array.isArray(trial.history)?trial.history:[];
 const truncated=trial?.history_truncated===true||history.length>120;
 const latest=new Map();
 for(const row of [...history].sort((a,b)=>positive(b.maker_owner_trial_review_id)-positive(a.maker_owner_trial_review_id))){
  if(row?.scenario_key===scenario&&needed.includes(row.checkpoint_key)&&positive(row.maker_owner_trial_review_id)&&!latest.has(row.checkpoint_key))latest.set(row.checkpoint_key,row);
 }
 const sources=new Set(scopeValid&&Array.isArray(trial.sources)?trial.sources
  .filter(s=>positive(s?.id)&&typeof s.kind==='string').map(s=>`${s.kind}:${positive(s.id)}`):[]);
 const checks=needed.map(key=>{
  const row=latest.get(key),receiptId=positive(row?.maker_owner_trial_review_id),kind=String(row?.source_kind||''),id=positive(row?.source_id);
  let status='HOLD_MISSING_RECEIPT';
  if(!scopeValid)status='HOLD_UNVERIFIED_CASE';
  else if(truncated)status='HOLD_HISTORY_TRUNCATED';
  else if(row?.decision==='hold')status='HOLD_LATEST_OWNER_DECISION';
  else if(row){
   if(row.decision!=='accepted'||Number(row.personally_observed)!==1)status='HOLD_NOT_PERSONALLY_ACCEPTED';
   else if(!id||!expectedKind(scenario,key,kind)||(key==='source_identity'&&id!==selectedId))status='HOLD_INVALID_SOURCE_LINK';
   else if(!sources.has(`${kind}:${id}`))status='HOLD_SOURCE_OUTSIDE_BOUNDED_LIST';
   else status='SOURCE_LINKED_OWNER_RECEIPT';
  }
  return Object.freeze({checkpoint:key,receiptId,sourceKind:receiptId?kind:'',sourceId:receiptId?id:0,status});
 });
 const orderScopeValid=!!linkedOrder&&fulfillment?.ok===true&&positive(fulfillment?.order?.order_id)===linkedOrder&&Array.isArray(fulfillment?.evidence);
 const orderTruncated=fulfillment?.history_truncated===true||(fulfillment?.evidence?.length||0)>50;
 const orderReceipts=orderScopeValid?fulfillment.evidence.filter(r=>positive(r?.evidence_id))
  .map(r=>({receiptId:positive(r.evidence_id),kind:String(r.event_kind||'')})).slice(0,50):[];
 const orderStatus=!linkedOrder?'NO_ORDER_SELECTED_NOT_DELIVERY_PROOF':!orderScopeValid?'HOLD_ORDER_SOURCE_UNAVAILABLE':orderTruncated?'HOLD_ORDER_LEDGER_TRUNCATED':!orderLinkReviewed?'HOLD_CASE_ORDER_RELATION_UNVERIFIED':!orderReceipts.length?'HOLD_NO_ORDER_RECEIPTS':'OWNER_REVIEWED_ORDER_RELATION_DELIVERY_UNVERIFIED';
 const outcome=clean(debrief.outcome,40),observation=clean(debrief.observation,600),nextAction=clean(debrief.nextAction,300);
 const debriefRecorded=debrief.personallyObserved===true&&OUTCOMES_466.includes(outcome)&&observation.length>=24&&observation.length<=600&&nextAction.length>=12&&nextAction.length<=300;
 const acceptedSourceCount=checks.filter(c=>c.status==='SOURCE_LINKED_OWNER_RECEIPT').length;
 return Object.freeze({build:466,scenario,sourceId:selectedId,orderId:linkedOrder,
  state:'HOLD_INDEPENDENT_REAL_WORLD_ACCEPTANCE',scopeStatus:scopeValid?'REAL_CASE_SELECTED':'HOLD_CASE_UNVERIFIED',
  historyStatus:truncated?'HOLD_BOUNDED_HISTORY':'BOUNDED_HISTORY_READ',checks,
  acceptedSourceCount,required:needed.length,caseReceiptsReconciled:scopeValid&&!truncated&&acceptedSourceCount===needed.length,
  orderStatus,orderReceipts,orderLinkSource:'OWNER_ASSERTION_NOT_DATABASE_RELATION',
  debriefStatus:debriefRecorded?'OWNER_DEBRIEF_IN_SESSION_UNVERIFIED':'HOLD_DEBRIEF_INCOMPLETE',
  debrief:debriefRecorded?Object.freeze({outcome,observation,nextAction,personallyObserved:true}):null,
  releaseApproved:false,delivered:false,customerConsentVerified:false,productSafetyCertified:false,
  independentAcceptance:false,externalAction:false,providerBillingVerified:false});
}

export function summarizeDebriefCases466(cases=[]){
 const distinct=new Map();for(const report of cases){if(!TRIAL_PATHS_466[report?.scenario]||!positive(report.sourceId)||report.scopeStatus!=='REAL_CASE_SELECTED')continue;
  distinct.set(`${report.scenario}:${report.sourceId}`,report);}
 const entries=[...distinct.values()].slice(-12);
 const coverage=Object.keys(TRIAL_PATHS_466).map(scenario=>({scenario,cases:entries.filter(r=>r.scenario===scenario).length,
  reconciled:entries.filter(r=>r.scenario===scenario&&r.caseReceiptsReconciled&&r.debriefStatus==='OWNER_DEBRIEF_IN_SESSION_UNVERIFIED').length}));
 return Object.freeze({build:466,state:'HOLD_INDEPENDENT_REAL_WORLD_ACCEPTANCE',cases:entries,coverage,
  totalCases:entries.length,unreviewedJourneys:coverage.filter(x=>!x.cases).map(x=>x.scenario),
  independentApproval:false,automaticActions:false});
}
