/* Build 485: bounded advisory aging and source-linked independent decision handoff. */
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const safe=v=>/^[a-zA-Z0-9 _.-]{8,120}$/.test(String(v??'').trim());
export const dispositions485=Object.freeze(['accepted_for_manual_triage','needs_original_evidence','awaits_separate_authorization']);
export function decisionAge485(value,now=Date.now()){
 const parsed=Date.parse(String(value??'').replace(' ','T')+'Z');
 const days=Number.isFinite(parsed)&&Number.isFinite(now)&&parsed<=now?Math.floor((now-parsed)/86400000):null;
 return Object.freeze({days,band:days===null?'unknown':days>=30?'30+ days':days>=14?'14–29 days':days>=7?'7–13 days':'0–6 days',advisory_only:true,not_sla:true});
}
export function assessDecisionHandoff485({form={},portfolio}={}){
 const holds=[],orderId=id(form.order_id),sourceId=id(form.source_receipt_id),priorityId=id(form.priority_receipt_id),handoffId=id(form.handoff_receipt_id),reviewId=id(form.reassessment_receipt_id),decisionId=id(form.decision_receipt_id);
 const row=Array.isArray(portfolio?.cases)?portfolio.cases.find(r=>id(r.order_id)===orderId&&id(r.evidence_id)===sourceId):null;
 if(portfolio?.bounded_sample!==true||!row||!decisionId||id(row.priority_receipt_id)!==priorityId||id(row.handoff_receipt_id)!==handoffId||id(row.reassessment_receipt_id)!==reviewId||id(row.decision_receipt_id)!==decisionId)holds.push('Select the genuine Build 484 owner decision from a freshly loaded sampled source chain.');
 if(row?.independent_decision_handoff_receipt_id)holds.push('An independent handoff receipt is already recorded for this decision.');
 if(!dispositions485.includes(form.disposition))holds.push('Select a non-executing receiving disposition.');
 if(!safe(form.evidence_reference))holds.push('Use an existing private evidence reference (8–120 safe characters, no customer details).');
 if(form.observed!==true)holds.push('A different authenticated Admin from the Build 484 decision writer must inspect the original evidence and attest.');
 return Object.freeze({ready:holds.length===0,holds,order_id:orderId,source_receipt_id:sourceId,priority_receipt_id:priorityId,handoff_receipt_id:handoffId,reassessment_receipt_id:reviewId,decision_receipt_id:decisionId,case_closed:false,external_action:false});
}
export function decisionHandoffPayload485({assessment,form,requestKey}){
 if(!assessment?.ready||!/^[a-zA-Z0-9_-]{16,80}$/.test(String(requestKey??'')))return null;
 return {order_id:assessment.order_id,source_receipt_id:assessment.source_receipt_id,priority_receipt_id:assessment.priority_receipt_id,handoff_receipt_id:assessment.handoff_receipt_id,reassessment_receipt_id:assessment.reassessment_receipt_id,decision_receipt_id:assessment.decision_receipt_id,
  disposition:form.disposition,evidence_reference:String(form.evidence_reference).trim(),receiver_observed:true,request_key:requestKey};
}
