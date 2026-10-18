// Release 467 Build 415 — bounded, deterministic local escalation-closure decision support.
// This module never closes an escalation, calls a provider, publishes, or sends notifications.
export const DECISIONS=Object.freeze({
  HOLD:'HOLD_FOR_MANUAL_REVIEW',
  READY:'READY_FOR_EXPLICIT_OWNER_CLOSURE_REVIEW',
  CLOSED:'ALREADY_CLOSED_WITH_VERIFIED_LOCAL_RECEIPT'
});
export const CLOSURE_REASONS=Object.freeze([
 'ESCALATION_NOT_OPEN','ESCALATION_EVIDENCE_MISSING','SOURCE_STALE',
 'NO_ACTIVE_ASSIGNED_ADMIN','FOLLOWUP_NOT_RECONCILED','HANDOFF_NOT_GOVERNED',
 'UNRESOLVED_SLA_EXCEPTION','EXCEPTION_ROUTE_NOT_RECONCILED',
 'OLDER_EVIDENCE_OUTSIDE_SCAN','PROVIDER_STATE_UNVERIFIED'
]);
const positiveInt=n=>Number.isSafeInteger(n)&&n>0;
export function reconcileOwnerCompletion({escalation,assignment,followup,completion,handoff,governance,sourceCurrent,assignedActive}={}){
 const reasons=[];
 if(!positiveInt(escalation?.receipt))reasons.push('ESCALATION_EVIDENCE_MISSING');
 if(!sourceCurrent)reasons.push('SOURCE_STALE');
 if(!positiveInt(assignment?.receipt)||!positiveInt(assignment?.assignee_user_id)||!assignedActive)
   reasons.push('NO_ACTIVE_ASSIGNED_ADMIN');
 if(!followup?.verified||!positiveInt(followup?.receipt)||!completion?.current||
    !positiveInt(completion?.receipt))reasons.push('FOLLOWUP_NOT_RECONCILED');
 if(handoff?.status!=='NOT_REQUIRED'&&
    !(handoff?.verified===true&&governance?.verified===true&&positiveInt(governance?.receipt)))
    reasons.push('HANDOFF_NOT_GOVERNED');
 return {reconciled:reasons.length===0,reasons};
}
export function closureDecision({
 escalation,assignment,followup,completion,handoff,governance,
 sourceCurrent=false,assignedActive=false,exceptionReasons=[],
 exceptionRoute,olderEvidenceOutsideScan=false,providerStateVerifiedNow=false,
 closureReceipt=null
}={}){
 const owner=reconcileOwnerCompletion({escalation,assignment,followup,completion,handoff,governance,sourceCurrent,assignedActive});
 const reasons=[...owner.reasons];
 if(escalation?.status!=='OPEN_OWNER_REVIEW')reasons.unshift('ESCALATION_NOT_OPEN');
 if(!Array.isArray(exceptionReasons)||exceptionReasons.length)reasons.push('UNRESOLVED_SLA_EXCEPTION');
 if(exceptionRoute?.status==='OLDER_ROUTE_REVIEW_DUE')reasons.push('EXCEPTION_ROUTE_NOT_RECONCILED');
 if(olderEvidenceOutsideScan)reasons.push('OLDER_EVIDENCE_OUTSIDE_SCAN');
 // No current provider verification is ever inferred from D1-local receipts.
 // Even READY means human review of local audit records only, not provider closure.
 const ready=reasons.length===0;
 const verifiedClosed=positiveInt(closureReceipt?.receipt)&&closureReceipt?.verified===true&&
  closureReceipt?.escalation_receipt===escalation?.receipt&&
  closureReceipt?.assignment_receipt===assignment?.receipt&&
  closureReceipt?.completion_receipt===completion?.receipt&&
  closureReceipt?.provider_called===false&&closureReceipt?.publication_performed===false;
 return Object.freeze({
  decision:verifiedClosed?DECISIONS.CLOSED:ready?DECISIONS.READY:DECISIONS.HOLD,
  reasons:Object.freeze([...new Set(reasons)]),
  owner_completion_reconciled:owner.reconciled,
  provider_state_verified_now:providerStateVerifiedNow===true,
  provider_closure_authorized:false,
  automatic_closure_performed:false,
  provider_called:false,publication_performed:false,notifications_sent:false,
  us_shipping_suspended:true,
  operator_action:ready?'Review and explicitly record a separate verified local closure decision.':'Resolve outstanding local evidence holds before considering closure.'
 });
}
