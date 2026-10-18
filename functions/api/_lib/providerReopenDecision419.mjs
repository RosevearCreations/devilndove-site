// Build 419 — fail-closed manual local reopen-review and exception decision contract.
// These decisions are audit-only: no provider API, escalation state change or notification.
import {TYPE as APPROVAL_TYPE,validKey} from './providerClosureApproval417.mjs';
export const DECISION_TYPE='provider_escalation_419_reopen_decision';
export const DECISIONS=Object.freeze(['REQUEST_MANUAL_REOPEN_REVIEW','HOLD_FOR_EVIDENCE_RECONCILIATION','ESCALATE_FOR_MANUAL_EXCEPTION']);
const receipts=['escalation','assignment','handoff','followup','completion','route','governance'];
const positive=x=>Number.isSafeInteger(x)&&x>0;
export function validateManualReopen419({snapshot,history,viewer,body}={}){
 const blockers=[];
 const expected=body?.expected_receipts,actual=snapshot?.evidence_receipts;
 if(!snapshot||!history||!actual||!expected)blockers.push('CURRENT_EVIDENCE_REQUIRED');
 if(!DECISIONS.includes(body?.decision)||body?.action!=='record_manual_reopen_decision')blockers.push('EXPLICIT_DECISION_REQUIRED');
 if(!positive(Number(viewer))||Number(viewer)!==Number(snapshot?.assigned_user_id)||
 !Array.isArray(snapshot?.admins)||!snapshot.admins.some(a=>Number(a.user_id)===Number(viewer)))blockers.push('ACTIVE_ASSIGNED_ADMIN_REQUIRED');
 if(!validKey(body?.request_key))blockers.push('VALID_IDEMPOTENCY_KEY_REQUIRED');
 if(typeof body?.owner_note!=='string'||body.owner_note.trim().length<20||body.owner_note.trim().length>600)blockers.push('SUBSTANTIVE_REASON_REQUIRED');
 if(body?.confirm_manual_review!==true||body?.confirm_local_only!==true||
 body?.confirm_no_provider_action!==true||body?.confirm_no_publication!==true||
 body?.confirm_us_shipping_suspended!==true)blockers.push('EXPLICIT_ACKNOWLEDGEMENTS_REQUIRED');
 if(typeof body?.expected_source_signature!=='string'||body.expected_source_signature!==snapshot?.source_signature)blockers.push('SOURCE_SIGNATURE_CHANGED');
 if(!receipts.every(k=>Number.isSafeInteger(expected?.[k])&&expected[k]>=0&&expected[k]===Number(actual?.[k]||0)))blockers.push('LATEST_AUDIT_RECEIPT_MISMATCH');
 if(!positive(Number(actual?.escalation))||snapshot?.escalation_status!=='OPEN_OWNER_REVIEW')blockers.push('CURRENT_OPEN_ESCALATION_REQUIRED');
 if(history?.holds?.includes('BOUNDED_AUDIT_HISTORY_NOT_EXHAUSTIVE'))blockers.push('AUDIT_SCAN_NOT_EXHAUSTIVE');
 const approvals=(history?.history||[]).filter(x=>x.action_type===APPROVAL_TYPE&&x.escalation_receipt===Number(actual?.escalation)&&x.safe_local_only&&x.source_signature===snapshot?.source_signature);
 if(approvals.length!==1||Number(body?.expected_approval_receipt)!==approvals[0]?.receipt)blockers.push('CURRENT_VERIFIED_APPROVAL_REQUIRED');
 if(body?.decision==='REQUEST_MANUAL_REOPEN_REVIEW'&&
 (!Array.isArray(history?.holds)||history.holds.length>0||snapshot?.source_snapshot_current!==true))blockers.push('REOPEN_REVIEW_EVIDENCE_HOLD');
 if(!Array.isArray(history?.history)||history.history.some(x=>x.status==='INVALID_AUDIT_HOLD'))blockers.push('AUDIT_HISTORY_INVALID');
 // A held exception is permitted only as a local triage decision, never as authority to reopen.
 return {allowed:blockers.length===0,blockers};
}
export function immutableDecision419({snapshot,body,actorId,approvalReceipt,previousReviewReceipt=0}){
 return {build:419,action:'record_manual_reopen_decision',decision:body.decision,
  request_key:body.request_key,product_id:snapshot.product_id,destination:snapshot.destination,
  draft_id:snapshot.draft_id||null,escalation_receipt:snapshot.evidence_receipts.escalation,
  approval_receipt:approvalReceipt,previous_review_receipt:previousReviewReceipt,
  expected_receipts:snapshot.evidence_receipts,source_signature:snapshot.source_signature,
  actor_user_id:actorId,owner_note:body.owner_note.trim(),local_only:true,
  confirm_manual_review:true,provider_called:false,publication_performed:false,
  automatic_reopen:false,automatic_closure:false,notifications_sent:false,
  us_shipping_suspended:true};
}
