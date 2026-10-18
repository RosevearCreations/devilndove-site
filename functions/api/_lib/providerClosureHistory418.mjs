// Build 418: fail-closed reconciliation of local approval receipts and reopen review.
import {TYPE} from './providerClosureApproval417.mjs';
export const REOPEN_TYPE='provider_escalation_418_reopen_review';
export const REOPEN_DECISION_419_TYPE='provider_escalation_419_reopen_decision';
const id=n=>Number.isSafeInteger(Number(n))&&Number(n)>0?Number(n):0;
export function reconcileHistory418({rows=[],snapshot=null,scanComplete=false}={}){
 const history=rows.filter(r=>r?.action_type===TYPE||r?.action_type===REOPEN_TYPE||r?.action_type===REOPEN_DECISION_419_TYPE)
  .map(r=>{let v={};try{v=JSON.parse(r.details_json||'{}');}catch{return {receipt:id(r.admin_action_audit_id),status:'INVALID_AUDIT_HOLD'};}
   return {receipt:id(r.admin_action_audit_id),action_type:r.action_type,actor_user_id:id(r.actor_user_id),
    created_at:r.created_at||null,escalation_receipt:id(v.expected_receipts?.escalation||v.escalation_receipt),
    source_signature:typeof v.source_signature==='string'?v.source_signature:null,
    safe_local_only:v.provider_called===false&&v.publication_performed===false&&v.local_only===true};});
 const current=id(snapshot?.evidence_receipts?.escalation);
 const approved=history.filter(x=>x.action_type===TYPE&&x.escalation_receipt===current&&x.safe_local_only);
 const reviews=history.filter(x=>(x.action_type===REOPEN_TYPE||x.action_type===REOPEN_DECISION_419_TYPE)&&x.escalation_receipt===current&&x.safe_local_only);
 const holds=[];
 if(!scanComplete)holds.push('BOUNDED_AUDIT_HISTORY_NOT_EXHAUSTIVE');
 if(!current)holds.push('ESCALATION_RECEIPT_MISSING');
 if(history.some(x=>!x.safe_local_only||x.status==='INVALID_AUDIT_HOLD'))holds.push('INVALID_LOCAL_AUDIT_RECEIPT');
 if(approved.length>1)holds.push('DUPLICATE_APPROVAL_EVIDENCE');
 if(approved.some(x=>x.source_signature!==snapshot?.source_signature))holds.push('APPROVAL_SOURCE_STALE');
 if(snapshot?.escalation_status!=='OPEN_OWNER_REVIEW')holds.push('SOURCE_ESCALATION_NOT_OPEN');
 return {build:418,history,approvals_for_current:approved.length,reopen_reviews_for_current:reviews.length,
  review_required:holds.length>0||reviews.length>0,holds,
  automatic_reopen:false,automatic_closure:false,provider_called:false,publication_performed:false,
  us_shipping_suspended:true};
}
export function canRequestReopen418({history,viewer,assignee,note,confirm}={}){
 return Boolean(history&&!history.holds?.length&&history.approvals_for_current===1&&
 id(viewer)===id(assignee)&&id(viewer)>0&&typeof note==='string'&&note.trim().length>=20&&note.trim().length<=600&&confirm===true);
}
