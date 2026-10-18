// Release 467 Build 416 — bounded operator closure evidence packet, read only.
import {closureDecision,DECISIONS} from './providerClosureDecision415.mjs';
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):null;
export function closurePacket416(snapshot){
 if(!snapshot||typeof snapshot!=='object')return {ok:false,decision:DECISIONS.HOLD,holds:['MISSING_EVIDENCE'],read_only:true};
 const r=snapshot.evidence_receipts||{};
 const status=closureDecision({
 escalation:{receipt:id(r.escalation),status:snapshot.escalation_status},
 assignment:{receipt:id(r.assignment),assignee_user_id:id(snapshot.assigned_user_id)},
 followup:snapshot.followup,completion:snapshot.completion,
 handoff:snapshot.handoff,governance:snapshot.governance,
 sourceCurrent:snapshot.source_snapshot_current===true,
 assignedActive:Array.isArray(snapshot.admins)&&snapshot.admins.some(x=>id(x.user_id)===id(snapshot.assigned_user_id)),
 exceptionReasons:snapshot.exception_reasons,
 exceptionRoute:snapshot.route,
 olderEvidenceOutsideScan:snapshot.evidence_scan_exhausted!==true
 });
 const refs=Object.fromEntries(['escalation','assignment','handoff','followup','completion','route','governance'].map(k=>[k,id(r[k])]));
 const holds=[...status.reasons];
 // Explicitly distinguish a local review packet from current marketplace verification.
 if(snapshot.provider_status_verified_now!==true)holds.push('EXTERNAL_PROVIDER_NOT_VERIFIED');
 return Object.freeze({
  ok:true,build:416,product_id:id(snapshot.product_id),
  destination:['etsy','facebook'].includes(snapshot.destination)?snapshot.destination:null,
  evidence_receipts:Object.freeze(refs),
  decision:status.decision,
  local_closure_review_ready:status.decision===DECISIONS.READY,
  holds:Object.freeze([...new Set(holds)]),
  scan_limit:160,scan_complete:snapshot.evidence_scan_exhausted===true,
  provider_state_verified_now:snapshot.provider_status_verified_now===true,
  operator_action:'Review original immutable receipts in the Admin audit trail. This packet cannot close an escalation.',
  read_only:true,provider_called:false,publication_performed:false,
  automatic_closure_performed:false,us_shipping_suspended:true
 });
}
