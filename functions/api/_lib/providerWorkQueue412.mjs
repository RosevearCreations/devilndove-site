// Release 467 Build 412 — bounded operator queue, active-admin assignment & destination change review.
// All statuses are LOCAL audit snapshots. No provider write, retry, inventory sync or publication.
import {parseReceipt} from './listingSyncOperator408.mjs';
import {snapshotGovernance,escalationStatus,sourceState,snapshotSignature} from './providerEvidence411.mjs';
const receiptId=r=>Number(r?.admin_action_audit_id||0);
export const ASSIGN_ACTION='provider_escalation_412_assignment';
export const REVIEW_ACTION='provider_escalation_412_destination_review';
export const DECISIONS=Object.freeze({hold:'HOLD_DESTINATION_CHANGE',review:'REVIEWED_LOCAL_EVIDENCE_ONLY'});
export const assigneeId=v=>Number.isSafeInteger(Number(v))&&Number(v)>0&&String(v).trim()===String(Number(v));
export const noteValid=v=>typeof v==='string'&&v.trim().length>=12&&v.trim().length<=600;
export function currentAssignment(row){
 const data=parseReceipt(row);
 return {receipt:receiptId(row),assignee_user_id:assigneeId(data.assignee_user_id)?Number(data.assignee_user_id):null,
  claimed_escalation_receipt:Number(data.escalation_receipt||0),
  assigned_by_user_id:Number(data.assigned_by_user_id||0),note:typeof data.owner_note==='string'?data.owner_note.slice(0,160):''};
}
export function currentReview(row){
 const d=parseReceipt(row);
 return {receipt:receiptId(row),decision:['HOLD_DESTINATION_CHANGE','REVIEWED_LOCAL_EVIDENCE_ONLY'].includes(d.decision)?d.decision:null,
  source_signature:typeof d.source_signature==='string'?d.source_signature:null,
  assigned_user_id:Number(d.assignee_user_id||0),reviewed_case_receipt:Number(d.case_receipt||0),
  verified_draft_receipt:Number(d.verified_receipt||0)};
}
export function reviewEligibility({destination,state,escalation,governance,assignment,reviewerId,assigneeActive,decision,body}={}){
 if(!body||!noteValid(body.owner_note)||body.no_provider_retry!==true||
 body.no_publication!==true||body.us_shipping_suspended!==true)return false;
 if(!state||!escalation||escalation.status!=='OPEN_OWNER_REVIEW')return false;
 if(!assignment?.receipt||!assigneeActive||Number(assignment.assignee_user_id)!==Number(reviewerId)||
 Number(assignment.claimed_escalation_receipt)!==Number(escalation.receipt))return false;
 if(decision==='hold')return true;
 if(decision!=='review')return false;
 // Review is a LOCAL verified-evidence acknowledgement. Build 410 must be closed,
 // Build 400 must match the draft, and Build 411 snapshot must be current.
 return destination==='etsy'&&state.outcome==='VERIFIED_CASE_CLOSED'&&state.closure_eligible===true&&
 state.verified_receipt>0&&state.case_receipt>0&&
 governance?.source_matches_snapshot===true&&governance?.review_due===false&&
 body.confirm_matching_build400_receipt===true&&body.confirm_matching_build410_closure===true&&
 body.confirm_local_only_review===true;
}
export function queueEntry(escalationRow,assignmentRow,reviewRow){
 const e=parseReceipt(escalationRow),assignment=currentAssignment(assignmentRow),review=currentReview(reviewRow);
 const isOpen=e.decision==='OPEN_OWNER_REVIEW';
 return {escalation_receipt:receiptId(escalationRow),product_id:Number(e.product_id||0),
  destination:e.destination,draft_id:e.destination==='etsy'?String(e.draft_id||''):null,
  claimed_outcome:e.outcome||null,source_signature:e.source_signature||null,
  escalated_at:escalationRow.created_at||null,status:isOpen?'OPEN_OWNER_REVIEW':'CLOSED_OR_INVALID',
  assignee_user_id:assignment.claimed_escalation_receipt===receiptId(escalationRow)?assignment.assignee_user_id:null,
  assignment_receipt:assignment.receipt,review_receipt:review.receipt,
  latest_review_decision:review.decision,automatic_retry:false,publication_allowed:false};
}
export function localSourceReview({destination,product,draft,claim,verified,caseReceipt,policyReceipt,channelIntent,latestSnapshot,latestEscalation}={}){
 const state=sourceState({destination,product,draft,claim,verified,caseReceipt,policyReceipt,channelIntent});
 if(!state)return null;
 const signature=snapshotSignature({state,product,draft,escalation:latestEscalation});
 return {state,signature,governance:snapshotGovernance({signature,latestSnapshot}),
  escalation:escalationStatus({latestEscalation,state})};
}
