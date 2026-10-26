/* Build 484: decision is a private, non-executing annotation of an independent reassessment. */
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const safe=v=>/^[a-zA-Z0-9 _.-]{8,120}$/.test(String(v??'').trim());
export const decisions484=Object.freeze(['continue_evidence_collection','owner_manual_followup','external_approval_hold','schedule_independent_recheck']);
export function assessDecision484({form={},portfolio}={}){
 const holds=[],orderId=id(form.order_id),sourceId=id(form.source_receipt_id),priorityId=id(form.priority_receipt_id),handoffId=id(form.handoff_receipt_id),reassessmentId=id(form.reassessment_receipt_id);
 const row=Array.isArray(portfolio?.cases)?portfolio.cases.find(r=>id(r.order_id)===orderId&&id(r.evidence_id)===sourceId):null;
 if(portfolio?.bounded_sample!==true||!row||!reassessmentId||id(row.priority_receipt_id)!==priorityId||id(row.handoff_receipt_id)!==handoffId||id(row.reassessment_receipt_id)!==reassessmentId)holds.push('Select a verified Build 483 independent reassessment from a freshly loaded bounded sample.');
 if(row?.decision_receipt_id)holds.push('An owner decision receipt is already recorded against this reassessment.');
 if(!decisions484.includes(form.decision))holds.push('Select a supported non-executing owner follow-up decision.');
 if(!safe(form.evidence_reference))holds.push('Provide an existing private evidence reference (8–120 safe characters, no PII).');
 if(form.observed!==true)holds.push('A different Admin from the independent reassessment reviewer must inspect the original evidence and attest.');
 return Object.freeze({ready:holds.length===0,holds,order_id:orderId,source_receipt_id:sourceId,priority_receipt_id:priorityId,handoff_receipt_id:handoffId,reassessment_receipt_id:reassessmentId,case_closed:false,external_action:false});
}
export function decisionPayload484({decision,form,requestKey}){
 if(!decision?.ready||!/^[a-zA-Z0-9_-]{16,80}$/.test(String(requestKey??'')))return null;
 return {order_id:decision.order_id,source_receipt_id:decision.source_receipt_id,priority_receipt_id:decision.priority_receipt_id,handoff_receipt_id:decision.handoff_receipt_id,reassessment_receipt_id:decision.reassessment_receipt_id,
  decision:form.decision,evidence_reference:String(form.evidence_reference).trim(),owner_observed:true,request_key:requestKey};
}
