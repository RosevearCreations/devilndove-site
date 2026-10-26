/* Build 478: human owner reconciliation against a genuine independent audit receipt. */
import {auditAftercare477} from './maker-aftercare-independent-audit-policy-477.mjs';
import {trialPayload474} from './maker-fulfillment-trial-policy-474.mjs';
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const reference=v=>/^[a-zA-Z0-9 _.-]{8,120}$/.test(String(v??'').trim());
export function reconcileAudit478({detail,fulfillment,form={}}={}){
 const previous=auditAftercare477({detail,fulfillment,form:{...form,route:form.route==='audit_reconciliation'?'aftercare':form.route}});
 if(form.route!=='audit_reconciliation')return previous;
 const holds=[...previous.holds],items=Array.isArray(fulfillment?.evidence)?fulfillment.evidence:[];
 const sourceId=id(form.audit_source_hold_id),followupId=id(form.audit_followup_id),auditId=id(form.reconcile_audit_id);
 const source=items.find(e=>id(e.evidence_id)===sourceId&&['damage_hold','return_hold','repair_followup'].includes(e.event_kind));
 const followup=items.find(e=>id(e.evidence_id)===followupId&&e.event_kind==='aftercare_followup');
 const audit=items.find(e=>id(e.evidence_id)===auditId&&e.event_kind==='aftercare_followup');
 const caseRef=String(form.case_reference??'').trim(),actor=id(fulfillment?.reviewer_actor_id);
 if(fulfillment?.history_truncated)holds.push('Incomplete ledger: inspect original history before owner reconciliation.');
 if(!source||!followup||!audit||new Set([sourceId,followupId,auditId]).size!==3)holds.push('Select three distinct existing original HOLD, follow-up and independent audit receipts.');
 if(!reference(caseRef)||!String(source?.review_note||'').includes(`Trial II case ref=${caseRef};`)
  ||!String(followup?.review_note||'').includes(`source hold #${sourceId};`)
  ||!String(followup?.review_note||'').includes(`case=${caseRef};`)
  ||!String(audit?.review_note||'').includes(`Build 477 independent audit; source hold #${sourceId}; follow-up #${followupId}; case=${caseRef};`))
  holds.push('All three receipts must identify the exact original case and evidence chain.');
 if(!actor||!id(audit?.actor_user_id)||actor===id(audit?.actor_user_id))holds.push('The owner reconciling the finding cannot self-review their independent audit.');
 if(!reference(form.reconcile_evidence_reference))holds.push('An actual owner reconciliation reference (8–120 safe characters) is required.');
 if(!['missing_evidence','owner_followup_needed','external_decision_pending','owner_evidence_reconciled'].includes(form.reconcile_disposition))holds.push('Classify the outstanding audit exception; none implies final case closure.');
 if(!form.reconcile_observed)holds.push('Owner must attest to manually checking the audit and original source receipts.');
 if(items.some(e=>e.event_kind==='aftercare_followup'&&String(e.review_note||'').includes(`Build 478 owner reconciliation; audit #${auditId}; source hold #${sourceId}; follow-up #${followupId};`)))holds.push('This independent audit already has an owner reconciliation receipt.');
 const ready=previous.can_append_existing_receipt&&holds.length===0;
 return Object.freeze({...previous,route:'audit_reconciliation',event_kind:'aftercare_followup',holds,can_append_existing_receipt:ready,
  state:ready?'READY_TO_APPEND_OWNER_REVIEW':'HOLD_SOURCE_OR_OWNER_REVIEW',source_hold_receipt_id:sourceId,followup_receipt_id:followupId,audit_receipt_id:auditId,
  case_closed:false,refund_authorized:false,customer_message:false,external_action:false});
}
export function reconciliationPayload478({decision,form,orderId,requestKey}){
 if(decision?.route!=='audit_reconciliation'||!decision.can_append_existing_receipt)return null;
 const base=trialPayload474({decision:{...decision,route:'aftercare'},form:{...form,route:'aftercare'},orderId,requestKey});if(!base)return null;
 const suffix=` Build 478 owner reconciliation; audit #${decision.audit_receipt_id}; source hold #${decision.source_hold_receipt_id}; follow-up #${decision.followup_receipt_id}; case=${String(form.case_reference).trim()}; evidence=${String(form.reconcile_evidence_reference).trim()}; exception=${form.reconcile_disposition}; review only, no closure or external action.`;
 return {...base,review_note:(base.review_note.slice(0,1200-suffix.length)+suffix).slice(0,1200),reconciliation_mode:'owner_aftercare_478',reconcile_audit_id:decision.audit_receipt_id,
  audit_source_hold_id:decision.source_hold_receipt_id,audit_followup_id:decision.followup_receipt_id,audit_case_reference:String(form.case_reference).trim()};
}
