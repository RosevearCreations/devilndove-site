// Release 467 Build 423 — deterministic bounded, read-only owner handoff governance.
// This is local audit evidence, not provider verification, case resolution, reassignment or publication.
import {HANDOFF_TYPE} from './providerFollowup413.mjs';
import {ACK_TYPE,ACK_CHOICES,RECEIPT_KEYS} from './providerExceptionAck422.mjs';
const pos=x=>Number.isSafeInteger(x)&&x>0;
const nonneg=x=>Number.isSafeInteger(x)&&x>=0;
function parse(row){
 let d;
 try{d=JSON.parse(row?.details_json||'null');}catch{return {receipt:Number(row?.admin_action_audit_id)||0,invalid:true};}
 const receipt=Number(row?.admin_action_audit_id),actor=Number(row?.actor_user_id);
 if(!pos(receipt)||!pos(actor)||!d||typeof d!=='object'||Array.isArray(d))
  return {receipt,invalid:true};
 return {receipt,actor,created_at:row?.created_at||null,type:row?.action_type,data:d,invalid:false};
}
function safe(row){
 const d=row.data;
 return d?.provider_called===false&&d?.publication_performed===false;
}
export function reconcileHandoffGovernance423({
 snapshot=null,continuity=null,followup=null,ownerReview=null,
 handoffRows=[],ackRows=[],handoffScanComplete=false,ackScanComplete=false
}={}){
 const holds=[];
 if(!Array.isArray(handoffRows)||!handoffScanComplete)holds.push('HANDOFF_HISTORY_INCOMPLETE');
 if(!Array.isArray(ackRows)||!ackScanComplete)holds.push('OWNER_ACK_HISTORY_INCOMPLETE');
 if(!snapshot?.source_snapshot_current||snapshot?.escalation_status!=='OPEN_OWNER_REVIEW')
  holds.push('CURRENT_SOURCE_REVIEW_REQUIRED');
 if(continuity?.holds?.length||continuity?.scan_complete!==true||!continuity)
  holds.push('OWNER_DECISION_CONTINUITY_HOLD');
 if(followup?.holds?.length||followup?.scan_complete!==true||!followup)
  holds.push('FOLLOWUP_CONTINUITY_HOLD');
 if(ownerReview?.holds?.length||!ownerReview||ownerReview?.review_ready!==true)
  holds.push('OWNER_ACKNOWLEDGEMENT_REVIEW_HOLD');
 const source=snapshot?.evidence_receipts||{},assigned=Number(snapshot?.assigned_user_id);
 if(!pos(assigned)||!snapshot?.admins?.some(a=>Number(a.user_id)===assigned))
  holds.push('ACTIVE_ASSIGNED_OWNER_REQUIRED');
 const hr=(Array.isArray(handoffRows)?handoffRows:[]).map(parse).sort((a,b)=>a.receipt-b.receipt);
 const ar=(Array.isArray(ackRows)?ackRows:[]).map(parse).sort((a,b)=>a.receipt-b.receipt);
 if(hr.some(x=>x.invalid||x.type!==HANDOFF_TYPE||!safe(x))||
    ar.some(x=>x.invalid||x.type!==ACK_TYPE||!safe(x)||x.data?.local_only!==true||
      x.data?.notifications_sent!==false||x.data?.us_shipping_suspended!==true))
  holds.push('INVALID_OR_NONLOCAL_AUDIT_RECORD');
 const latestHandoff=hr.at(-1)||null,latestAck=ar.at(-1)||null;
 if((latestHandoff?.receipt||0)!==Number(source.handoff||0))
  holds.push('LATEST_HANDOFF_RECEIPT_CHANGED');
 if((latestAck?.receipt||0)!==Number(ownerReview?.latest_ack_receipt||0))
  holds.push('LATEST_OWNER_ACK_RECEIPT_CHANGED');
 const handoffStatus=snapshot?.handoff?.status;
 if(!['NOT_REQUIRED','VERIFIED_HANDOFF_CHAIN'].includes(handoffStatus)||
   snapshot?.handoff?.verified!==true)holds.push('HANDOFF_ACKNOWLEDGEMENT_PENDING');
 let chain={status:'NOT_REQUIRED',request_receipt:0,ack_receipt:0,from_user_id:0,to_user_id:0};
 if(latestHandoff){
  const d=latestHandoff.data||{},requestNo=Number(d.request_receipt);
  const request=hr.find(x=>x.receipt===requestNo&&x.data?.action==='request_handoff');
  if(d.action!=='ack_handoff'||!request||request.receipt>=latestHandoff.receipt||
     d.from_user_id!==request.data?.from_user_id||d.target_user_id!==request.data?.target_user_id||
     !pos(Number(d.target_user_id))||Number(d.target_user_id)!==assigned||
     !pos(Number(d.from_user_id))||Number(d.from_user_id)===assigned||
     Number(d.base_assignment_receipt)!==Number(source.assignment)||
     Number(d.escalation_receipt)!==Number(source.escalation)||
     Number(request.data?.escalation_receipt)!==Number(source.escalation)||
     d.source_signature!==snapshot?.source_signature||request.data?.source_signature!==snapshot?.source_signature||
     latestHandoff.receipt!==Number(snapshot?.handoff?.ack_receipt))
   holds.push('HANDOFF_REQUEST_ACK_CHAIN_HOLD');
  chain={status:holds.includes('HANDOFF_REQUEST_ACK_CHAIN_HOLD')?'INVALID_REVIEW_HOLD':'LOCAL_REQUEST_ACK_OBSERVED',
   request_receipt:request?.receipt||0,ack_receipt:latestHandoff.receipt,
   from_user_id:Number(d.from_user_id)||0,to_user_id:Number(d.target_user_id)||0};
 }
 const acknowledgements=ar.map(x=>{
  const d=x.data||{},flags=[];
  if(!ACK_CHOICES.includes(d.choice)||d.action!=='ack_exception_followup')flags.push('INVALID_ACK_CHOICE');
  if(Number(d.actor_user_id)!==x.actor)flags.push('ACK_ACTOR_MISMATCH');
  if(!RECEIPT_KEYS.every(k=>nonneg(Number(d.expected_receipts?.[k]))))
   flags.push('ACK_RECEIPTS_INCOMPLETE');
  if(Number(d.exception_decision_receipt)!==Number(continuity?.latest_decision_receipt))
   flags.push('ACK_REFERENCES_OLDER_DECISION');
  if(d.source_signature!==snapshot?.source_signature)
   flags.push('ACK_SOURCE_CHANGED');
  if(Number(d.expected_receipts?.assignment)!==Number(source.assignment))
   flags.push('ACK_ASSIGNMENT_CHANGED');
  if(x.actor!==assigned)flags.push('ACK_OWNER_CHANGED');
  if(latestHandoff&&x.receipt<=latestHandoff.receipt)
   flags.push('ACK_BEFORE_LATEST_HANDOFF');
  return {receipt:x.receipt,created_at:x.created_at,actor_user_id:x.actor,
   choice:d.choice||null,exception_decision_receipt:Number(d.exception_decision_receipt)||0,
   review_flags:flags};
 });
 if(acknowledgements.some(x=>x.review_flags.length))holds.push('ACKNOWLEDGEMENT_CONTINUITY_REVIEW_HOLD');
 const latest=acknowledgements.at(-1)||null;
 if(!latest)holds.push('EXPLICIT_OWNER_ACKNOWLEDGEMENT_REQUIRED');
 if(latest?.choice==='EXCEPTION_HANDOFF_REQUIRED')
  holds.push('OWNER_REQUIRES_MANUAL_HANDOFF');
 if(latest?.choice==='EVIDENCE_MISMATCH_HOLD')
  holds.push('OWNER_EVIDENCE_RECONCILIATION_HOLD');
 // All outcomes are advisory and explicitly prevent automatic state mutation.
 const reasons=[...new Set(holds)];
 const status=reasons.length?'HOLD_MANUAL_OWNER_GOVERNANCE':'LOCAL_RECEIPTS_RECONCILED_FOR_MANUAL_REVIEW';
 return Object.freeze({build:423,status,holds:reasons,
  latest_handoff_receipt:latestHandoff?.receipt||0,
  latest_owner_ack_receipt:latest?.receipt||0,
  decision_receipt:Number(continuity?.latest_decision_receipt)||0,
  handoff_chain:chain,owner_review_history:acknowledgements,
  manual_followup_required:true,provider_status_verified_now:false,exception_resolved:false,
  owner_reassignment_performed:false,automatic_reopen:false,automatic_closure:false,
  publication_performed:false,notifications_sent:false,provider_called:false,
  us_shipping_suspended:true,read_only:true});
}
