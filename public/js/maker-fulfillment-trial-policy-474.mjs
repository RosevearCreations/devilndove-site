/* Build 474: independent real-order trial-II evidence guard over the Build 464/454 owner ledger. */
import {evaluatePilot464,pilotPayload464} from './maker-fulfillment-pilot-policy-464.mjs';

const caseRoutes=new Set(['damage','refund','exchange','repair']);
const reference=value=>{
 const s=String(value??'').trim();
 return s.length>=8&&s.length<=120&&!/[<>\r\n]/.test(s)&&!/^https?:\/\//i.test(s)&&!/@/.test(s)&&!/(?:token|secret|password|key)=/i.test(s);
};
export function evaluateTrial474({detail,fulfillment,form={}}={}){
 const earlier=evaluatePilot464({detail,fulfillment,form});
 const holds=[...earlier.holds];
 if(caseRoutes.has(form.route)){
  if(!reference(form.case_reference))holds.push('Damage/return/repair requires a private original case or incident reference (8–120 characters; no personal data).');
  if(!['customer_report','owner_inspection','carrier_record','returned_item'].includes(form.evidence_source))
   holds.push('Identify the actual damage/return evidence source; an unverified claim cannot become a resolved case.');
  if(!['unverified','observed_damage','no_damage_observed','awaiting_item'].includes(form.condition_state))
   holds.push('Record the factual item-condition state, including unknown or awaiting inspection.');
 }
 if(['aftercare','repair'].includes(form.route)&&form.consent_state!=='verified')
  holds.push('Aftercare or repair contact requires independently reviewed original customer instructions. No message is sent.');
 if(form.consent_state==='declined'&&['packing','shipment','pickup','repair','aftercare'].includes(form.route))
  holds.push('Customer declined authorization for this path; stop and escalate to the original order owner.');
 if(form.route==='shipment'&&fulfillment?.history_truncated)
  holds.push('Shipment history was truncated; inspect full original ledger before appending another shipment receipt.');
 const can_append_existing_receipt=earlier.can_append_existing_receipt&&holds.length===0;
 return Object.freeze({...earlier,holds,state:can_append_existing_receipt?'READY_TO_APPEND_OWNER_REVIEW':'HOLD_SOURCE_OR_OWNER_REVIEW',can_append_existing_receipt,
  trial_ii_accepted:false,damage_resolved:false,return_authorized:false,refund_authorized:false,customer_consent_verified_by_system:false});
}
export function trialPayload474({decision,form,orderId,requestKey}){
 if(!decision?.can_append_existing_receipt)return null;
 const base=pilotPayload464({decision,form,orderId,requestKey});if(!base)return null;
 const caseNote=caseRoutes.has(form.route)
  ?` Trial II case ref=${String(form.case_reference).trim()}; evidence source=${form.evidence_source}; observed condition=${form.condition_state}; disposition=HOLD_FOR_HUMAN_REVIEW.`
  :' Trial II consent/source rechecked; disposition=OWNER_EVIDENCE_ONLY.';
 const suffix=caseNote.slice(0,350);
 return {...base,review_note:(base.review_note.slice(0,1200-suffix.length)+suffix).slice(0,1200)};
}
