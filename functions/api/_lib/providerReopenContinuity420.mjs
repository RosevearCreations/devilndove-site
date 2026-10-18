// Release 467 Build 420 — deterministic read-only continuity reconciliation.
// This report describes immutable local decisions. It cannot reopen, close, publish or notify.
import {TYPE as APPROVAL_TYPE} from './providerClosureApproval417.mjs';
import {DECISION_TYPE,DECISIONS} from './providerReopenDecision419.mjs';
const positive=n=>Number.isSafeInteger(n)&&n>0;
const int=n=>positive(n)?n:0;
const receiptKeys=['escalation','assignment','handoff','followup','completion','route','governance'];
function parse(row){
 let data;
 try{data=JSON.parse(row?.details_json||'{}');}catch{return {receipt:int(row?.admin_action_audit_id),invalid:true};}
 if(!data||typeof data!=='object')return {receipt:int(row?.admin_action_audit_id),invalid:true};
 const out={receipt:int(row?.admin_action_audit_id),actor_user_id:int(row?.actor_user_id),
  action_type:row?.action_type,created_at:row?.created_at||null,
  escalation_receipt:int(data.expected_receipts?.escalation||data.escalation_receipt),
  approval_receipt:int(data.approval_receipt),previous_review_receipt:int(data.previous_review_receipt),
  source_signature:data.source_signature,decision:data.decision,
  source_receipts:data.expected_receipts,
  local_only:data.local_only===true&&data.provider_called===false&&
    data.publication_performed===false&&data.automatic_reopen!==true&&
    data.notifications_sent!==true,invalid:false};
 return out;
}
export function reconcileContinuity420({rows=[],snapshot=null,scanComplete=false}={}){
 const reasons=[];
 if(!Array.isArray(rows)||!snapshot||!scanComplete)reasons.push('HISTORY_INCOMPLETE_OR_UNAVAILABLE');
 if(!positive(snapshot?.evidence_receipts?.escalation))reasons.push('CURRENT_ESCALATION_MISSING');
 if(snapshot?.escalation_status!=='OPEN_OWNER_REVIEW')reasons.push('ESCALATION_NOT_CURRENTLY_OPEN');
 if(snapshot?.source_snapshot_current!==true)reasons.push('CURRENT_SOURCE_STALE');
 const person=Number(snapshot?.assigned_user_id);
 if(!positive(person)||!Array.isArray(snapshot?.admins)||!snapshot.admins.some(x=>Number(x.user_id)===person))
  reasons.push('CURRENT_OWNER_NOT_ACTIVE');
 const records=(Array.isArray(rows)?rows:[]).map(parse).sort((a,b)=>a.receipt-b.receipt);
 const currentEscalation=snapshot?.evidence_receipts?.escalation;
 const current=records.filter(x=>x.escalation_receipt===currentEscalation);
 const approvals=current.filter(x=>x.action_type===APPROVAL_TYPE);
 const decisions=current.filter(x=>x.action_type===DECISION_TYPE);
 if(records.some(x=>x.invalid||!x.local_only||!positive(x.receipt)))reasons.push('INVALID_OR_NONLOCAL_AUDIT_RECORD');
 if(approvals.length!==1)reasons.push('EXACT_ONE_CURRENT_APPROVAL_REQUIRED');
 const approval=approvals[0];
 if(approval&&approval.source_signature!==snapshot?.source_signature)reasons.push('APPROVAL_SOURCE_CHANGED');
 if(approval&&!receiptKeys.every(k=>Number(approval.source_receipts?.[k]||0)===Number(snapshot?.evidence_receipts?.[k]||0)))
  reasons.push('APPROVAL_RECEIPTS_CHANGED');
 let preceding=0;
 const exceptionHistory=[];
 const timeline=[];
 for(const d of decisions){
  const flags=[];
  if(!DECISIONS.includes(d.decision))flags.push('UNKNOWN_MANUAL_DECISION');
  if(d.previous_review_receipt!==preceding)flags.push('BROKEN_DECISION_CHAIN');
  if(d.approval_receipt!==approval?.receipt)flags.push('APPROVAL_RECEIPT_MISMATCH');
  if(d.source_signature!==snapshot?.source_signature)flags.push('DECISION_SOURCE_CHANGED');
  if(d.actor_user_id!==person)flags.push('OWNER_CHANGED_SINCE_DECISION');
  if(!receiptKeys.every(k=>Number(d.source_receipts?.[k]||0)===Number(snapshot?.evidence_receipts?.[k]||0)))
   flags.push('DECISION_RECEIPTS_CHANGED');
  if(approval&&d.receipt<=approval.receipt)flags.push('DECISION_PRECEDES_APPROVAL');
  if(!d.local_only)flags.push('NONLOCAL_DECISION');
  if(flags.length)reasons.push(...flags);
  const event={receipt:d.receipt,created_at:d.created_at,decision:d.decision,actor_user_id:d.actor_user_id,
   linked_approval_receipt:d.approval_receipt,previous_review_receipt:d.previous_review_receipt,holds:[...flags]};
  timeline.push(event);
  if(d.decision==='ESCALATE_FOR_MANUAL_EXCEPTION'||d.decision==='HOLD_FOR_EVIDENCE_RECONCILIATION')
   exceptionHistory.push(event);
  preceding=d.receipt;
 }
 const unique=[...new Set(reasons)];
 const latest=timeline.at(-1)||null;
 const latestDecision=latest?.decision||null;
 return Object.freeze({build:420,read_only:true,
  status:unique.length?'HOLD_FOR_MANUAL_RECONCILIATION':!latest?'AWAITING_MANUAL_OWNER_DECISION':
    latestDecision==='REQUEST_MANUAL_REOPEN_REVIEW'?'LOCAL_REOPEN_REVIEW_REQUESTED':
    latestDecision==='ESCALATE_FOR_MANUAL_EXCEPTION'?'LOCAL_EXCEPTION_ESCALATED':'LOCAL_EVIDENCE_HOLD_RECORDED',
  holds:unique,scan_complete:scanComplete===true,
  current_escalation_receipt:int(currentEscalation),current_owner_user_id:int(person),
  approval_receipt:approval?.receipt||0,latest_decision_receipt:latest?.receipt||0,
  decision_count:timeline.length,decision_history:timeline,exception_history:exceptionHistory,
  manual_owner_action_required:unique.length>0||Boolean(latest),
  provider_called:false,automatic_reopen:false,automatic_closure:false,
  publication_performed:false,notifications_sent:false,us_shipping_suspended:true});
}
