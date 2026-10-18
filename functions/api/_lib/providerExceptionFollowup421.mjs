// Release 467 Build 421 — bounded local-only exception follow-up evidence review.
// Distinguishes post-decision local receipt observations from real exception resolution.
import {FOLLOWUP_TYPE} from './providerFollowup413.mjs';
import {COMPLETION_TYPE} from './providerCompletion414.mjs';
const positive=x=>Number.isSafeInteger(x)&&x>0;
const validRows=rows=>Array.isArray(rows);
function parseReceiptRow(row){
 const receipt=Number(row?.admin_action_audit_id);
 let d;
 try{d=JSON.parse(row?.details_json||'null');}catch{return {receipt,invalid:true};}
 if(!positive(receipt)||!d||typeof d!=='object'||Array.isArray(d))
  return {receipt,invalid:true};
 return {
  receipt,action_type:row.action_type,created_at:row.created_at||null,
  escalation_receipt:Number(d.escalation_receipt)||0,
  assignment_receipt:Number(d.assignment_receipt)||0,
  source_signature:d.source_signature||null,
  local_only:d.provider_called===false&&d.publication_performed===false&&
    d.no_publication!==false&&d.us_shipping_suspended===true,
  invalid:false
 };
}
export function reviewExceptionFollowup421({continuity,sourceRows=[],snapshot=null,scanComplete=false}={}){
 const holds=[];
 if(!continuity||!snapshot||!validRows(sourceRows)||scanComplete!==true)
  holds.push('BOUNDED_FOLLOWUP_SCAN_INCOMPLETE');
 if(continuity?.scan_complete!==true||!Array.isArray(continuity?.holds)||
   continuity.holds.length||continuity?.status==='HOLD_FOR_MANUAL_RECONCILIATION')
  holds.push('OWNER_CONTINUITY_HOLD');
 if(snapshot?.source_snapshot_current!==true||snapshot?.escalation_status!=='OPEN_OWNER_REVIEW')
  holds.push('CURRENT_ESCALATION_SOURCE_STALE');
 const latestEsc=Number(snapshot?.evidence_receipts?.escalation)||0;
 const latestAssignment=Number(snapshot?.evidence_receipts?.assignment)||0;
 if(!positive(latestEsc)||!positive(latestAssignment))
  holds.push('CURRENT_ESCALATION_ASSIGNMENT_MISSING');
 const parsed=(Array.isArray(sourceRows)?sourceRows:[])
  .filter(x=>x?.action_type===FOLLOWUP_TYPE||x?.action_type===COMPLETION_TYPE)
  .map(parseReceiptRow).sort((a,b)=>a.receipt-b.receipt);
 if(parsed.some(r=>r.invalid||!r.local_only))holds.push('INVALID_LOCAL_FOLLOWUP_RECEIPT');
 const exceptionDecisions=Array.isArray(continuity?.exception_history)?continuity.exception_history:[];
 const reviews=exceptionDecisions.map(event=>{
  const later=parsed.filter(r=>r.receipt>event.receipt);
  const exact=later.filter(r=>r.escalation_receipt===latestEsc&&
    r.assignment_receipt===latestAssignment&&r.source_signature===snapshot?.source_signature&&r.local_only);
  const mismatched=later.filter(r=>!exact.includes(r));
  if(mismatched.length)holds.push('FOLLOWUP_SOURCE_LINK_MISMATCH');
  return {
   exception_decision_receipt:event.receipt,decision:event.decision,
   owner_user_id:event.actor_user_id,
   local_followup_receipts:exact.map(r=>({receipt:r.receipt,action_type:r.action_type,created_at:r.created_at})),
   evidence_state:exact.length?'POST_DECISION_LOCAL_FOLLOWUP_OBSERVED':'AWAITING_LOCAL_FOLLOWUP_EVIDENCE',
   exception_resolved:false,provider_verified:false
  };
 });
 const reasons=[...new Set(holds)];
 const unresolved=reviews.filter(x=>x.evidence_state==='AWAITING_LOCAL_FOLLOWUP_EVIDENCE').length;
 return Object.freeze({
  build:421,read_only:true,
  status:reasons.length?'HOLD_FOR_MANUAL_REVIEW':
    reviews.length===0?'NO_LOCAL_EXCEPTION_DECISION':
    unresolved?'MANUAL_FOLLOWUP_EVIDENCE_PENDING':'LOCAL_FOLLOWUP_EVIDENCE_FOR_MANUAL_REVIEW',
  holds:reasons,scan_complete:scanComplete===true&&continuity?.scan_complete===true,
  owner_user_id:Number(snapshot?.assigned_user_id)||0,
  latest_decision_receipt:continuity?.latest_decision_receipt||0,
  exception_count:reviews.length,exceptions:reviews,unresolved_evidence_count:unresolved,
  provider_verified_now:false,exceptions_auto_resolved:false,automatic_reopen:false,
  automatic_closure:false,notifications_sent:false,publication_performed:false,
  provider_called:false,us_shipping_suspended:true,
  operator_action:'Review original scoped local audit receipts and verify provider status independently before making any manual exception decision.'
 });
}
