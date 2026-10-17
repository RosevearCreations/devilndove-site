// Release 467 Build 414 — follow-up completion, SLA exception routing and verified handoff governance.
// Pure D1 evidence rules; never a provider permission, publishing, or notification mechanism.
import {parseReceipt} from './listingSyncOperator408.mjs';
import {assigneeId,noteValid} from './providerWorkQueue412.mjs';
import {FOLLOWUP_PLANS} from './providerFollowup413.mjs';
const receipt=r=>Number(r?.admin_action_audit_id||0);
export const COMPLETION_TYPE='provider_escalation_414_completion';
export const ROUTE_TYPE='provider_escalation_414_sla_exception';
export const GOVERNANCE_TYPE='provider_escalation_414_handoff_governance';
export const ROUTE_CHOICES=Object.freeze(['OWNER_MANUAL_REVIEW','ASSIGNMENT_REVIEW','EVIDENCE_RECONCILIATION']);
const normalized=r=>parseReceipt(r);
export function verifyHandoffChain({handoff,ackRow,requestRow,assignment,escalationReceipt}={}){
 if(handoff?.status==='NONE')return {status:'NOT_REQUIRED',verified:true,request_receipt:0,ack_receipt:0};
 if(handoff?.status!=='ACKNOWLEDGED')return {status:'HANDOFF_NOT_ACKNOWLEDGED',verified:false,request_receipt:handoff?.request_receipt||0,ack_receipt:handoff?.receipt||0};
 const ack=normalized(ackRow),request=normalized(requestRow);
 const good=receipt(ackRow)>0&&receipt(requestRow)>0&&
 receipt(ackRow)>receipt(requestRow)&&ack.action==='ack_handoff'&&request.action==='request_handoff'&&
 Number(ack.request_receipt)===receipt(requestRow)&&Number(ack.escalation_receipt)===Number(escalationReceipt)&&
 Number(request.escalation_receipt)===Number(escalationReceipt)&&
 Number(ack.target_user_id)===Number(request.target_user_id)&&
 Number(ack.from_user_id)===Number(request.from_user_id)&&
 Number(ack.base_assignment_receipt)===Number(assignment?.receipt)&&
 Number(ack.target_user_id)===Number(assignment?.assignee_user_id)&&
 ack.provider_called===false&&ack.publication_performed===false&&
 request.provider_called===false&&request.publication_performed===false;
 return {status:good?'VERIFIED_HANDOFF_CHAIN':'HANDOFF_CHAIN_CONFLICT_HOLD',verified:good,
  request_receipt:receipt(requestRow),ack_receipt:receipt(ackRow)};
}
export function governanceProof({row,handoffChain,assignment,escalationReceipt}={}){
 const p=normalized(row);
 const valid=handoffChain?.verified===true&&handoffChain.status==='VERIFIED_HANDOFF_CHAIN'&&
 receipt(row)>0&&p.action==='verify_handoff'&&p.provider_called===false&&
 Number(p.escalation_receipt)===Number(escalationReceipt)&&
 Number(p.assignment_receipt)===Number(assignment?.receipt)&&
 Number(p.handoff_ack_receipt)===Number(handoffChain.ack_receipt)&&
 Number(p.handoff_request_receipt)===Number(handoffChain.request_receipt)&&
 Number(p.reviewer_user_id)===Number(assignment?.assignee_user_id);
 return {receipt:receipt(row),verified:valid,status:handoffChain?.status==='NOT_REQUIRED'?'NOT_REQUIRED':
   valid?'VERIFIED':'MISSING_OR_STALE_HOLD'};
}
export function followupProof({row,assignment,escalationReceipt}={}){
 const p=normalized(row),valid=receipt(row)>0&&p.action==='record_followup'&&
 FOLLOWUP_PLANS.includes(p.plan)&&p.confirmed_manual_owner_followup===true&&
 p.provider_called===false&&p.publication_performed===false&&
 Number(p.escalation_receipt)===Number(escalationReceipt)&&
 Number(p.assignment_receipt)===Number(assignment?.receipt);
 return {receipt:receipt(row),verified:valid,plan:valid?p.plan:null};
}
export function completionProof({row,followup,assignment,escalationReceipt,sourceSignature,handoff,governance}={}){
 const p=normalized(row);
 const current=receipt(row)>0&&p.action==='complete_followup'&&
 p.confirm_local_followup_completed===true&&p.provider_called===false&&p.publication_performed===false&&
 Number(p.escalation_receipt)===Number(escalationReceipt)&&
 Number(p.assignment_receipt)===Number(assignment?.receipt)&&
 Number(p.followup_receipt)===Number(followup?.receipt)&&followup?.verified===true&&
 p.source_signature===sourceSignature&&
 (handoff?.status==='NOT_REQUIRED'||(handoff?.verified&&governance?.verified&&
 Number(p.governance_receipt)===Number(governance.receipt)));
 return {receipt:receipt(row),current,status:current?'COMPLETED_WITH_LOCAL_EVIDENCE':
 receipt(row)?'STALE_COMPLETION_HOLD':'NOT_COMPLETED'};
}
export function exceptionReasons({sla,escalationOpen,assignedActive,assignment,sourceCurrent,handoff,governance,followup,completion}={}){
 if(!escalationOpen||completion?.current)return [];
 const issues=[];
 if(sla?.status==='UNKNOWN_ESCALATION_TIME')issues.push('UNKNOWN_ESCALATION_AGE');
 if(sla?.initial_overdue)issues.push('INITIAL_REVIEW_SLA_DUE');
 if(sla?.followup_overdue)issues.push('OWNER_FOLLOWUP_SLA_DUE');
 if(!assignedActive||!assigneeId(assignment?.assignee_user_id))issues.push('NO_ACTIVE_ASSIGNED_ADMIN');
 if(!sourceCurrent)issues.push('SOURCE_EVIDENCE_STALE');
 if(handoff?.status!=='NOT_REQUIRED'&&(!handoff?.verified||!governance?.verified))issues.push('HANDOFF_GOVERNANCE_INCOMPLETE');
 if(!followup?.verified)issues.push('FOLLOWUP_PLAN_MISSING_OR_STALE');
 return issues;
}
export function routeStatus({row,escalationReceipt,assignment,followup,sourceSignature}={}){
 const x=normalized(row);
 const current=receipt(row)>0&&x.action==='route_exception'&&
 Number(x.escalation_receipt)===Number(escalationReceipt)&&
 Number(x.assignment_receipt)===Number(assignment?.receipt||0)&&
 Number(x.followup_receipt)===Number(followup?.receipt||0)&&
 x.source_signature===sourceSignature&&x.provider_called===false;
 return {receipt:receipt(row),status:current?'ROUTED_FOR_MANUAL_REVIEW':receipt(row)?'OLDER_ROUTE_REVIEW_DUE':'NOT_ROUTED',
 route_choice:current&&ROUTE_CHOICES.includes(x.route_choice)?x.route_choice:null,
 routed_to_user_id:current&&assigneeId(x.route_to_user_id)?Number(x.route_to_user_id):null};
}
export function canRecord({action,viewer,admins,assignment,escalationOpen,sourceCurrent,handoff,governance,followup,
 completion,issues,body}={}){
 if(!escalationOpen||!noteValid(body?.owner_note)||body.no_provider_retry!==true||
 body.no_publication!==true||body.us_shipping_suspended!==true)return false;
 const people=admins||[],active=n=>people.some(u=>Number(u.user_id)===Number(n));
 const assigned=Number(assignment?.assignee_user_id||0);
 if(action==='route_exception'){
  return issues?.length>0&&ROUTE_CHOICES.includes(body.route_choice)&&
   assigneeId(body.route_to_user_id)&&active(body.route_to_user_id)&&
   body.confirm_manual_exception_review===true;
 }
 if(!assignment?.receipt||!active(assigned)||assigned!==Number(viewer))return false;
 if(action==='verify_handoff')return sourceCurrent&&handoff?.status==='VERIFIED_HANDOFF_CHAIN'&&
 handoff?.verified===true&&body.confirm_verified_handoff_chain===true;
 if(action==='complete_followup')return sourceCurrent&&followup?.verified===true&&
 !completion?.current&&
 (handoff?.status==='NOT_REQUIRED'||(handoff?.verified&&governance?.verified))&&
 body.confirm_local_followup_completed===true&&body.confirm_no_provider_completion_claim===true;
 return false;
}
