/* Build 482: independent owner handoff of a real Build 481 priority receipt. */
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const ref=v=>/^[a-zA-Z0-9 _.-]{8,120}$/.test(String(v??'').trim());
export const dispositions482=Object.freeze(['accepted_for_manual_review','missing_evidence_recheck','await_external_authorization']);
export function assessHandoff482({form={},portfolio}={}){
 const holds=[],orderId=id(form.order_id),sourceId=id(form.source_receipt_id),priorityId=id(form.priority_receipt_id);
 const row=Array.isArray(portfolio?.cases)?portfolio.cases.find(x=>id(x.order_id)===orderId&&id(x.evidence_id)===sourceId):null;
 if(portfolio?.bounded_sample!==true||!row||!priorityId||id(row.priority_receipt_id)!==priorityId)holds.push('Load the current sampled portfolio and select a genuine Build 481 priority receipt for this case.');
 if(row?.handoff_receipt_id)holds.push('An owner handoff receipt already exists for this priority.');
 if(!dispositions482.includes(form.disposition))holds.push('Choose a documented manual handoff disposition.');
 if(!ref(form.evidence_reference))holds.push('Provide an existing private evidence reference (8–120 safe characters; no PII).');
 if(form.observed!==true)holds.push('An independent receiving Admin must inspect the original order and attest.');
 return Object.freeze({ready:holds.length===0,holds,order_id:orderId,source_receipt_id:sourceId,priority_receipt_id:priorityId,case_closed:false,external_action:false});
}
export function handoffPayload482({decision,form,requestKey}){
 if(!decision?.ready||!/^[a-zA-Z0-9_-]{16,80}$/.test(String(requestKey??'')))return null;
 return {order_id:decision.order_id,source_receipt_id:decision.source_receipt_id,priority_receipt_id:decision.priority_receipt_id,
  disposition:form.disposition,evidence_reference:String(form.evidence_reference).trim(),owner_observed:true,request_key:requestKey};
}
