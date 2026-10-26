/* Build 475: original-ledger reconciliation, not a refund, resolution or case-closing executor. */
import {evaluateTrial474,trialPayload474} from './maker-fulfillment-trial-policy-474.mjs';

const integer=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const safeRef=v=>{
 const s=String(v??'').trim();
 return s.length>=8&&s.length<=120&&!/[<>\r\n@]/.test(s)&&!/^https?:\/\//i.test(s)&&!/(?:token|secret|password|key)=/i.test(s);
};
const eligibleKinds=new Set(['damage_hold','return_hold','repair_followup']);
export function reconcileClosure475({detail,fulfillment,form={}}={}){
 const mapped={...form,route:form.route==='closure_review'?'aftercare':form.route};
 const earlier=evaluateTrial474({detail,fulfillment,form:mapped});
 if(form.route!=='closure_review')return earlier;
 const holds=[...earlier.holds],ledger=Array.isArray(fulfillment?.evidence)?fulfillment.evidence:[];
 const originalId=integer(form.source_hold_receipt_id);
 const source=ledger.find(e=>integer(e.evidence_id)===originalId&&eligibleKinds.has(e.event_kind));
 if(fulfillment?.history_truncated)holds.push('The evidence ledger is truncated; inspect the full original history before reconciling a case.');
 if(!source)holds.push('Select an actual damage, return or repair HOLD receipt from this order’s original ledger.');
 if(!safeRef(form.case_reference))holds.push('Use the original private case reference (8–120 characters, no personal information).');
 if(source&&safeRef(form.case_reference)&&!String(source.review_note||'').includes(`Trial II case ref=${String(form.case_reference).trim()};`))
  holds.push('Selected original HOLD receipt does not contain the same source-linked Trial II case reference.');
 if(!safeRef(form.closure_reference))holds.push('An independently checked owner follow-up or resolution-evidence reference is required.');
 if(!['open_followup','external_review_pending','owner_review_complete'].includes(form.closure_disposition))
  holds.push('Classify the actual follow-up disposition; none represents automated case closure.');
 if(!form.closure_observed)holds.push('The owner must attest to independently reviewing the cited source and follow-up evidence.');
 if(ledger.some(e=>e.event_kind==='aftercare_followup'&&String(e.review_note||'').includes(`Build 475 closure review; source hold #${originalId};`)))
  holds.push('A Build 475 review already exists for this original HOLD receipt; inspect it before further follow-up.');
 const can_append_existing_receipt=earlier.can_append_existing_receipt&&holds.length===0;
 return Object.freeze({...earlier,route:'closure_review',event_kind:'aftercare_followup',holds,
  state:can_append_existing_receipt?'READY_TO_APPEND_OWNER_REVIEW':'HOLD_SOURCE_OR_OWNER_REVIEW',can_append_existing_receipt,
  source_hold_receipt_id:originalId,owner_closure_review_recorded:false,case_closed:false,
  refund_authorized:false,customer_message:false,automatic_order_transition:false});
}
export function closurePayload475({decision,form,orderId,requestKey}){
 if(!decision?.can_append_existing_receipt||decision.route!=='closure_review')return null;
 const mapped={...form,route:'aftercare'};
 const base=trialPayload474({decision:{...decision,route:'aftercare'},form:mapped,orderId,requestKey});
 if(!base)return null;
 const suffix=` Build 475 closure review; source hold #${decision.source_hold_receipt_id}; case=${String(form.case_reference).trim()}; owner evidence=${String(form.closure_reference).trim()}; disposition=${form.closure_disposition}; no case closure, external action or consent verification.`;
 return {...base,event_kind:'aftercare_followup',review_note:(base.review_note.slice(0,1200-suffix.length)+suffix).slice(0,1200)};
}
