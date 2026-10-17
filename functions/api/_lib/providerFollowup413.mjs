// Release 467 Build 413 — local SLA planning, evidence-backed Admin handoff and owner follow-up.
import {parseReceipt} from './listingSyncOperator408.mjs';
import {assigneeId,noteValid} from './providerWorkQueue412.mjs';
const id=r=>Number(r?.admin_action_audit_id||0);
const utc=s=>{if(!s||typeof s!=='string')return null;const v=s.trim(),t=Date.parse(/(?:Z|[+-]\d\d:\d\d)$/i.test(v)?v:v.replace(' ','T')+'Z');return Number.isFinite(t)?t:null;};
export const HANDOFF_TYPE='provider_escalation_413_handoff';
export const FOLLOWUP_TYPE='provider_escalation_413_followup';
export const FOLLOWUP_PLANS=Object.freeze(['VERIFY_SAVED_ETS Y_DRAFT','REVIEW_SHIPPING_POLICY','REVIEW_PROVIDER_PERMISSION','GATHER_LOCAL_EVIDENCE','OWNER_DECISION_REQUIRED'].map(x=>x.replace('ETS Y','ETSY')));
export const SLA_TARGETS=Object.freeze({initial_review_hours:24,owner_followup_hours:72});
export function slaStatus({escalatedAt,now=Date.now(),isOpen=true}={}){
 const t=utc(escalatedAt);
 if(t===null)return {status:'UNKNOWN_ESCALATION_TIME',age_hours:null,initial_due_at:null,followup_due_at:null,initial_overdue:false,followup_overdue:false,targets:SLA_TARGETS,contractual:false,alerts_scheduled:false};
 const age=Math.max(0,Math.floor((now-t)/3600000)),initial=t+24*3600000,followup=t+72*3600000;
 return {status:!isOpen?'CLOSED':now>=followup?'FOLLOWUP_DUE':now>=initial?'INITIAL_REVIEW_DUE':'WITHIN_INTERNAL_TARGET',
 age_hours:age,initial_due_at:new Date(initial).toISOString(),followup_due_at:new Date(followup).toISOString(),
 initial_overdue:isOpen&&now>=initial,followup_overdue:isOpen&&now>=followup,targets:SLA_TARGETS,contractual:false,alerts_scheduled:false};
}
export function handoffStatus({latestHandoff,assignment,escalationReceipt}={}){
 const d=parseReceipt(latestHandoff),receipt=id(latestHandoff),current=Number(assignment?.assignee_user_id||0);
 if(!receipt)return {receipt:0,status:'NONE',request_receipt:0,from_user_id:null,target_user_id:null};
 if(d.escalation_receipt!==Number(escalationReceipt))return {receipt,status:'STALE_ESCALATION',request_receipt:0,from_user_id:null,target_user_id:null};
 const to=Number(d.target_user_id||0),from=Number(d.from_user_id||0),requestReceipt=d.action==='ack_handoff'?Number(d.request_receipt||0):receipt;
 const consistent=assigneeId(to)&&assigneeId(from)&&to!==from;
 if(!consistent)return {receipt,status:'INVALID_HOLD',request_receipt:requestReceipt,from_user_id:from,target_user_id:to};
 const status=d.action==='request_handoff'?(current===from?'PENDING_REASSIGNMENT':current===to?'AWAITING_RECEIVER_ACK':'UNEXPECTED_ASSIGNMENT_HOLD'):
 d.action==='ack_handoff'?(current===to&&d.base_assignment_receipt===assignment?.receipt?'ACKNOWLEDGED':'ASSIGNMENT_CHANGED_REVIEW'): 'INVALID_HOLD';
 return {receipt,status,request_receipt:requestReceipt,from_user_id:from,target_user_id:to};
}
export function followupReadiness({escalationOpen,assignedActive,assignment,handoff,sourceSnapshotCurrent,latestFollowup,escalationReceipt}={}){
 const latest=parseReceipt(latestFollowup),hasAssigned=assigneeId(assignment?.assignee_user_id)&&assignedActive===true;
 const current=!!id(latestFollowup)&&Number(latest.assignment_receipt)===Number(assignment?.receipt||0)&&
  Number(latest.escalation_receipt)===Number(escalationReceipt||0)&&
  latest.provider_called===false&&latest.publication_performed===false;
 const blockers=[];
 if(!escalationOpen)blockers.push('escalation_not_open');
 if(!hasAssigned)blockers.push('active_admin_assignment_required');
 if(handoff&&['PENDING_REASSIGNMENT','AWAITING_RECEIVER_ACK','UNEXPECTED_ASSIGNMENT_HOLD','ASSIGNMENT_CHANGED_REVIEW','INVALID_HOLD','STALE_ESCALATION'].includes(handoff.status))blockers.push('handoff_incomplete');
 if(!sourceSnapshotCurrent)blockers.push('historical_source_snapshot_needs_review');
 return {status:blockers.length?'HOLD_OWNER_FOLLOWUP':current?'FOLLOWUP_PLAN_RECORDED':'READY_TO_RECORD_OWNER_FOLLOWUP',
 blockers,latest_receipt:id(latestFollowup),latest_plan:current&&FOLLOWUP_PLANS.includes(latest.plan)?latest.plan:null,
 record_is_current:current,not_a_live_provider_check:true,automatic_notifications:false,publication_allowed:false};
}
export function canAct({action,viewerId,assignment,admins,handoff,readiness,source,body,escalationOpen}={}){
 if(!escalationOpen||!noteValid(body?.owner_note)||body.no_provider_retry!==true||body.no_publication!==true||body.us_shipping_suspended!==true)return false;
 const people=admins||[],active=n=>people.some(p=>Number(p.user_id)===Number(n));
 const assignee=Number(assignment?.assignee_user_id||0);
 if(!assignment?.receipt||!active(assignee)||!assigneeId(viewerId))return false;
 if(action==='request_handoff')return assignee===Number(viewerId)&&
 handoff?.status!=='PENDING_REASSIGNMENT'&&handoff?.status!=='AWAITING_RECEIVER_ACK'&&
 handoff?.status!=='UNEXPECTED_ASSIGNMENT_HOLD'&&handoff?.status!=='INVALID_HOLD'&&
 assigneeId(body.target_user_id)&&active(body.target_user_id)&&Number(body.target_user_id)!==assignee;
 if(action==='ack_handoff')return handoff?.status==='AWAITING_RECEIVER_ACK'&&
 Number(handoff.target_user_id)===assignee&&assignee===Number(viewerId)&&
 Number(body.expected_request_receipt)===handoff.request_receipt;
 if(action==='record_followup')return assignee===Number(viewerId)&&
 readiness?.blockers?.length===0&&FOLLOWUP_PLANS.includes(body.plan)&&body.confirm_manual_owner_followup===true;
 return false;
}
