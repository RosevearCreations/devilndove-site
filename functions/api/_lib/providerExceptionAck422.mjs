// Build 422 — explicit immutable local human review acknowledgement, never a provider action.
import {validKey} from './providerClosureApproval417.mjs';
export const ACK_TYPE='provider_escalation_422_owner_followup_ack';
export const RECEIPT_KEYS=Object.freeze(['escalation','assignment','handoff','followup','completion','route','governance']);
export const ACK_CHOICES=Object.freeze(['EVIDENCE_REVIEWED_FOLLOWUP_PENDING','EXCEPTION_HANDOFF_REQUIRED','EVIDENCE_MISMATCH_HOLD']);
const id=x=>Number.isSafeInteger(x)&&x>0;
export function review422({snapshot,continuity,review,ackRows=[],complete=false}={}){
 const holds=[];
 if(!complete||!Array.isArray(ackRows))holds.push('ACK_HISTORY_NOT_EXHAUSTIVE');
 if(!snapshot||!continuity||!review)holds.push('CURRENT_REVIEW_REQUIRED');
 if(continuity?.holds?.length||continuity?.scan_complete!==true)holds.push('OWNER_DECISION_CONTINUITY_HOLD');
 if(review?.holds?.length||review?.scan_complete!==true)holds.push('EXCEPTION_FOLLOWUP_EVIDENCE_HOLD');
 if(!id(Number(snapshot?.assigned_user_id))||!snapshot?.admins?.some(x=>Number(x.user_id)===Number(snapshot.assigned_user_id)))
  holds.push('ACTIVE_ASSIGNED_ADMIN_REQUIRED');
 if(!['NOT_REQUIRED','VERIFIED_HANDOFF_CHAIN'].includes(snapshot?.handoff?.status)||
   snapshot?.handoff?.verified!==true)holds.push('HANDOFF_NOT_VERIFIED');
 if(snapshot?.source_snapshot_current!==true||snapshot?.escalation_status!=='OPEN_OWNER_REVIEW')
  holds.push('SOURCE_ESCALATION_NOT_CURRENT');
 if(!id(continuity?.latest_decision_receipt)||!review?.exception_count)holds.push('EXCEPTION_DECISION_REQUIRED');
 if(!Array.isArray(review?.exceptions)||review.exceptions.at(-1)?.exception_decision_receipt!==continuity?.latest_decision_receipt)
  holds.push('LATEST_DECISION_NOT_CURRENT_EXCEPTION');
 const entries=Array.isArray(ackRows)?ackRows.map(row=>{
  let d;try{d=JSON.parse(row.details_json||'null');}catch{d=null;}
  const valid=d?.action==='ack_exception_followup'&&ACK_CHOICES.includes(d?.choice)&&
   d?.local_only===true&&d?.provider_called===false&&d?.publication_performed===false&&
   d?.notifications_sent===false&&d?.us_shipping_suspended===true;
  if(!valid)holds.push('INVALID_ACK_RECEIPT');
  return {receipt:Number(row.admin_action_audit_id)||0,created_at:row.created_at||null,
   actor_user_id:Number(row.actor_user_id)||0,choice:valid?d.choice:null,
   exception_decision_receipt:Number(d?.exception_decision_receipt)||0,
   source_signature:d?.source_signature||null,assignment_receipt:Number(d?.expected_receipts?.assignment)||0,
   valid};
 }):[];
 const latest=entries[0]||null;
 if(latest&&(latest.actor_user_id!==Number(snapshot?.assigned_user_id)||
   latest.exception_decision_receipt!==Number(continuity?.latest_decision_receipt)||
   latest.assignment_receipt!==Number(snapshot?.evidence_receipts?.assignment)||
   latest.source_signature!==snapshot?.source_signature))holds.push('PREVIOUS_ACK_REQUIRES_OWNER_REVIEW');
 return {build:422,status:holds.length?'HOLD_FOR_HUMAN_REVIEW':latest?'LOCAL_OWNER_ACKNOWLEDGED':'AWAITING_OWNER_ACK',
  holds:[...new Set(holds)],latest_ack_receipt:latest?.receipt||0,history:entries,
  review_ready:holds.length===0,exception_resolved:false,owner_handoff_performed:false,
  provider_called:false,automatic_reopen:false,publication_performed:false,us_shipping_suspended:true};
}
export function canAck422({snapshot,continuity,review,state,body,viewer}={}){
 const blockers=[];
 if(!state?.review_ready)blockers.push('REVIEW_HOLD');
 if(!id(Number(viewer))||Number(viewer)!==Number(snapshot?.assigned_user_id))blockers.push('ASSIGNED_OWNER_ONLY');
 if(body?.action!=='ack_exception_followup'||!ACK_CHOICES.includes(body?.choice))blockers.push('EXPLICIT_CHOICE_REQUIRED');
 if(body?.confirm_local_only!==true||body?.confirm_no_provider_action!==true||
  body?.confirm_no_publication!==true||body?.confirm_no_auto_resolution!==true||
  body?.confirm_us_shipping_suspended!==true)blockers.push('OWNER_ACKNOWLEDGEMENTS_REQUIRED');
 if(!validKey(body?.request_key))blockers.push('REQUEST_KEY_INVALID');
 if(typeof body?.owner_note!=='string'||body.owner_note.trim().length<20||body.owner_note.trim().length>600)
  blockers.push('SUBSTANTIVE_OWNER_NOTE_REQUIRED');
 if(body?.expected_source_signature!==snapshot?.source_signature||!RECEIPT_KEYS.every(k=>
  Number.isSafeInteger(body?.expected_receipts?.[k])&&
  body.expected_receipts[k]===Number(snapshot?.evidence_receipts?.[k]||0)))blockers.push('SOURCE_RECEIPTS_STALE');
 if(!id(body?.expected_exception_decision_receipt)||body.expected_exception_decision_receipt!==continuity?.latest_decision_receipt)
  blockers.push('EXCEPTION_DECISION_STALE');
 if(!Number.isSafeInteger(body?.expected_previous_ack_receipt)||
  body.expected_previous_ack_receipt!==state?.latest_ack_receipt)blockers.push('PREVIOUS_ACK_STALE');
 if(body?.choice==='EVIDENCE_REVIEWED_FOLLOWUP_PENDING'&&
   review?.unresolved_evidence_count!==0)blockers.push('FOLLOWUP_EVIDENCE_PENDING');
 return {allowed:blockers.length===0,blockers};
}
