/* Build 477: independent actor + original evidence-pair audit; no automatic case closure. */
import {reviewEscalation476} from './maker-aftercare-aging-policy-476.mjs';
import {trialPayload474} from './maker-fulfillment-trial-policy-474.mjs';

const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const safe=v=>/^[a-zA-Z0-9 _.-]{8,120}$/.test(String(v??'').trim());
const kinds=new Set(['damage_hold','return_hold','repair_followup']);
export function auditAftercare477({detail,fulfillment,form={}}={}){
 const mapped={...form,route:form.route==='independent_audit'?'aftercare':form.route};
 const previous=reviewEscalation476({detail,fulfillment,form:mapped});
 if(form.route!=='independent_audit')return previous;
 const holds=[...previous.holds],rows=Array.isArray(fulfillment?.evidence)?fulfillment.evidence:[];
 const sourceId=id(form.audit_source_hold_id),followupId=id(form.audit_followup_id),actor=id(fulfillment?.reviewer_actor_id);
 const source=rows.find(e=>id(e.evidence_id)===sourceId&&kinds.has(e.event_kind));
 const followup=rows.find(e=>id(e.evidence_id)===followupId&&e.event_kind==='aftercare_followup');
 const caseRef=String(form.case_reference??'').trim();
 if(fulfillment?.history_truncated)holds.push('The original ledger is truncated; independently review the full source history first.');
 if(!source||!followup||sourceId===followupId)holds.push('An actual original HOLD and a separate aftercare follow-up receipt must be selected.');
 if(!safe(caseRef)||!String(source?.review_note||'').includes(`Trial II case ref=${caseRef};`)
   ||!String(followup?.review_note||'').includes(`source hold #${sourceId};`)
   ||!String(followup?.review_note||'').includes(`case=${caseRef};`))
  holds.push('Original HOLD, follow-up and private case references must reconcile exactly.');
 if(!actor||!id(source?.actor_user_id)||!id(followup?.actor_user_id)||actor===id(source?.actor_user_id)||actor===id(followup?.actor_user_id))
  holds.push('Independent authenticated reviewer must be different from both original evidence actors.');
 if(!safe(form.audit_evidence_reference))holds.push('Independent audit evidence reference (8–120 characters, no PII) required.');
 if(!['evidence_incomplete','followup_required','independent_review_complete'].includes(form.audit_disposition))
  holds.push('Select a genuine audit finding; none closes the case or authorizes financial action.');
 if(!form.audit_observed)holds.push('Independent reviewer must attest to examining both original receipts and outstanding decisions.');
 if(rows.some(e=>e.event_kind==='aftercare_followup'&&String(e.review_note||'').includes(`Build 477 independent audit; source hold #${sourceId}; follow-up #${followupId};`)))
  holds.push('An independent audit already exists for this source/follow-up pair.');
 const can_append_existing_receipt=previous.can_append_existing_receipt&&holds.length===0;
 return Object.freeze({...previous,route:'independent_audit',event_kind:'aftercare_followup',holds,can_append_existing_receipt,
  state:can_append_existing_receipt?'READY_TO_APPEND_OWNER_REVIEW':'HOLD_SOURCE_OR_OWNER_REVIEW',source_hold_receipt_id:sourceId,followup_receipt_id:followupId,
  independent_actor_checked:can_append_existing_receipt,case_closed:false,refund_authorized:false,customer_message:false,external_action:false});
}
export function auditPayload477({decision,form,orderId,requestKey}){
 if(!decision?.can_append_existing_receipt||decision.route!=='independent_audit')return null;
 const base=trialPayload474({decision:{...decision,route:'aftercare'},form:{...form,route:'aftercare'},orderId,requestKey});
 if(!base)return null;
 const suffix=` Build 477 independent audit; source hold #${decision.source_hold_receipt_id}; follow-up #${decision.followup_receipt_id}; case=${String(form.case_reference).trim()}; evidence=${String(form.audit_evidence_reference).trim()}; finding=${form.audit_disposition}; reviewer independent by authenticated actor ID, no closure or external action.`;
 return {...base,review_note:(base.review_note.slice(0,1200-suffix.length)+suffix).slice(0,1200),audit_mode:'independent_aftercare_477',
  audit_source_hold_id:decision.source_hold_receipt_id,audit_followup_id:decision.followup_receipt_id,audit_case_reference:String(form.case_reference).trim()};
}
