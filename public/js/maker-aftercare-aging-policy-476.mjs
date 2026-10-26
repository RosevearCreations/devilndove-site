/* Build 476: advisory age bands and explicit manual escalation evidence; never an SLA or notification executor. */
import {reconcileClosure475} from './maker-fulfillment-closure-policy-475.mjs';
import {trialPayload474} from './maker-fulfillment-trial-policy-474.mjs';

const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const validRef=v=>{
 const s=String(v??'').trim();
 return s.length>=8&&s.length<=120&&!/[<>\r\n@]/.test(s)&&!/^https?:\/\//i.test(s)&&!/(?:token|secret|password|key)=/i.test(s);
};
const sourceKinds=new Set(['damage_hold','return_hold','repair_followup']);
export function agingBand476(createdAt,now=Date.now()){
 const raw=String(createdAt??'').trim();
 // D1 CURRENT_TIMESTAMP is UTC without a zone. Never interpret it as local browser time.
 const normalized=/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw)?raw.replace(' ','T')+'Z':raw;
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(normalized))return Object.freeze({band:'UNKNOWN',age_days:null});
 const time=Date.parse(normalized);
 if(!Number.isFinite(time)||!Number.isFinite(now)||time>now+60_000)return Object.freeze({band:'UNKNOWN',age_days:null});
 const age=Math.max(0,Math.floor((now-time)/86_400_000));
 return Object.freeze({band:age>=30?'REVIEW_30D':age>=14?'REVIEW_14D':age>=7?'REVIEW_7D':'RECENT',age_days:age});
}
export function reviewEscalation476({detail,fulfillment,form={},now=Date.now()}={}){
 const mapped={...form,route:form.route==='escalation_review'?'aftercare':form.route};
 const previous=reconcileClosure475({detail,fulfillment,form:mapped});
 if(form.route!=='escalation_review')return previous;
 const holds=[...previous.holds],evidence=Array.isArray(fulfillment?.evidence)?fulfillment.evidence:[];
 const sourceId=id(form.escalation_source_id),source=evidence.find(r=>id(r.evidence_id)===sourceId&&sourceKinds.has(r.event_kind));
 const band=agingBand476(source?.created_at,now);
 if(fulfillment?.history_truncated)holds.push('Source ledger history is incomplete; original escalation provenance must be inspected outside this bounded view.');
 if(!source)holds.push('Select the original source-linked damage/return/repair HOLD receipt from this order.');
 if(!validRef(form.case_reference)||!String(source?.review_note||'').includes(`Trial II case ref=${String(form.case_reference??'').trim()};`))
  holds.push('Original case reference must match the selected original HOLD receipt.');
 if(band.band==='UNKNOWN')holds.push('The original receipt timestamp is missing, invalid or in the future; no age estimate can be trusted.');
 if(!['routine','priority','critical'].includes(form.escalation_level))holds.push('Choose the owner-assessed escalation level; age bands alone do not establish SLA breaches.');
 if(!validRef(form.escalation_evidence_reference))holds.push('An original follow-up/evidence reference (8–120 chars, no PII) is required.');
 if(!['open','awaiting_customer','awaiting_carrier','awaiting_owner'].includes(form.followup_state))
  holds.push('Record a verified open follow-up state; this action cannot close the case.');
 if(!form.escalation_observed)holds.push('Owner must attest to an independent review of age, case status and original evidence.');
 if(evidence.some(r=>r.event_kind==='aftercare_followup'&&String(r.review_note||'').includes(`Build 476 escalation review; source hold #${sourceId};`)))
  holds.push('An escalation review already exists for this source HOLD receipt; inspect its original evidence before another review.');
 const can_append_existing_receipt=previous.can_append_existing_receipt&&holds.length===0;
 return Object.freeze({...previous,route:'escalation_review',event_kind:'aftercare_followup',holds,can_append_existing_receipt,
  state:can_append_existing_receipt?'READY_TO_APPEND_OWNER_REVIEW':'HOLD_SOURCE_OR_OWNER_REVIEW',source_hold_receipt_id:sourceId,
  age_band:band.band,age_days:band.age_days,automatic_escalation:false,sla_breach_confirmed:false,
  customer_message:false,case_closed:false,refund_authorized:false,external_action:false});
}
export function escalationPayload476({decision,form,orderId,requestKey}){
 if(!decision?.can_append_existing_receipt||decision.route!=='escalation_review')return null;
 const base=trialPayload474({decision:{...decision,route:'aftercare'},form:{...form,route:'aftercare'},orderId,requestKey});
 if(!base)return null;
 const suffix=` Build 476 escalation review; source hold #${decision.source_hold_receipt_id}; case=${String(form.case_reference).trim()}; age band=${decision.age_band}; age days=${decision.age_days}; owner level=${form.escalation_level}; follow-up=${form.followup_state}; evidence=${String(form.escalation_evidence_reference).trim()}; advisory only, no SLA conclusion, contact or case closure.`;
 return {...base,event_kind:'aftercare_followup',review_note:(base.review_note.slice(0,1200-suffix.length)+suffix).slice(0,1200)};
}
