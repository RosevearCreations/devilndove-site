/* Build 479: follow-up on a verified owner reconciliation, with the real case remaining open. */
import {reconcileAudit478} from './maker-aftercare-owner-reconciliation-policy-478.mjs';
import {trialPayload474} from './maker-fulfillment-trial-policy-474.mjs';
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const validRef=v=>/^[a-zA-Z0-9 _.-]{8,120}$/.test(String(v??'').trim());
export const followupStates479=Object.freeze(['evidence_still_missing','awaiting_owner_action','awaiting_external_decision','reassessment_complete_case_open']);
export function followupOutstanding479({detail,fulfillment,form={}}={}){
 const prior=reconcileAudit478({detail,fulfillment,form:{...form,route:form.route==='outstanding_followup'?'aftercare':form.route}});
 if(form.route!=='outstanding_followup')return prior;
 const holds=[...prior.holds],items=Array.isArray(fulfillment?.evidence)?fulfillment.evidence:[];
 const sourceId=id(form.audit_source_hold_id),followupId=id(form.audit_followup_id),auditId=id(form.reconcile_audit_id),ownerId=id(form.outstanding_owner_id);
 const ids=[sourceId,followupId,auditId,ownerId];const caseRef=String(form.case_reference??'').trim();
 const [source,followup,audit,owner]=ids.map(i=>items.find(r=>id(r.evidence_id)===i));
 const has=(row,fragment)=>String(row?.review_note||'').includes(fragment);
 if(fulfillment?.history_truncated)holds.push('The full original evidence ledger must be inspected: visible history is truncated.');
 if(ids.some(i=>!i)||new Set(ids).size!==4||!['damage_hold','return_hold','repair_followup'].includes(source?.event_kind)||[followup,audit,owner].some(r=>r?.event_kind!=='aftercare_followup'))holds.push('Four distinct original source, follow-up, independent audit and owner reconciliation receipts are required.');
 if(!validRef(caseRef)||!has(source,`Trial II case ref=${caseRef};`)
  ||!has(followup,`source hold #${sourceId};`)||!has(followup,`case=${caseRef};`)
  ||!has(audit,`Build 477 independent audit; source hold #${sourceId}; follow-up #${followupId}; case=${caseRef};`)
  ||!has(owner,`Build 478 owner reconciliation; audit #${auditId}; source hold #${sourceId}; follow-up #${followupId}; case=${caseRef};`))
  holds.push('The owner reconciliation must reference the same original HOLD, follow-up, independent audit and case.');
 if(!id(fulfillment?.reviewer_actor_id)||!id(owner?.actor_user_id)||id(fulfillment?.reviewer_actor_id)===id(owner?.actor_user_id))holds.push('Follow-up must be reviewed by a different authenticated Admin from the owner reconciliation actor.');
 if(!validRef(form.outstanding_evidence_reference))holds.push('Provide the actual manually inspected follow-up reference (8–120 safe characters).');
 if(!followupStates479.includes(form.outstanding_state))holds.push('Select a real outstanding case finding; this is never a case-closure action.');
 if(!form.outstanding_observed)holds.push('An authorized reviewer must manually attest to the outstanding evidence and next action.');
 if(items.some(r=>r.event_kind==='aftercare_followup'&&has(r,`Build 479 outstanding review; owner #${ownerId}; audit #${auditId};`)))holds.push('This owner reconciliation already has a Build 479 follow-up receipt.');
 const ready=prior.can_append_existing_receipt&&holds.length===0;
 return Object.freeze({...prior,route:'outstanding_followup',event_kind:'aftercare_followup',holds,can_append_existing_receipt:ready,
  state:ready?'READY_TO_APPEND_OWNER_REVIEW':'HOLD_SOURCE_OR_OWNER_REVIEW',source_hold_receipt_id:sourceId,followup_receipt_id:followupId,
  audit_receipt_id:auditId,owner_reconciliation_receipt_id:ownerId,case_closed:false,refund_authorized:false,customer_message:false,external_action:false});
}
export function outstandingPayload479({decision,form,orderId,requestKey}){
 if(decision?.route!=='outstanding_followup'||!decision.can_append_existing_receipt)return null;
 const base=trialPayload474({decision:{...decision,route:'aftercare'},form:{...form,route:'aftercare'},orderId,requestKey});if(!base)return null;
 const suffix=` Build 479 outstanding review; owner #${decision.owner_reconciliation_receipt_id}; audit #${decision.audit_receipt_id}; source hold #${decision.source_hold_receipt_id}; follow-up #${decision.followup_receipt_id}; case=${String(form.case_reference).trim()}; evidence=${String(form.outstanding_evidence_reference).trim()}; state=${form.outstanding_state}; case remains open, no external action.`;
 return {...base,review_note:(base.review_note.slice(0,1200-suffix.length)+suffix).slice(0,1200),outstanding_mode:'aftercare_followup_479',outstanding_owner_id:decision.owner_reconciliation_receipt_id,
  reconcile_audit_id:decision.audit_receipt_id,audit_source_hold_id:decision.source_hold_receipt_id,audit_followup_id:decision.followup_receipt_id,audit_case_reference:String(form.case_reference).trim()};
}
