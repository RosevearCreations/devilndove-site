/* Build 481: owner priority annotations never close or modify a real case. */
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const ref=v=>/^[a-zA-Z0-9 _.-]{8,120}$/.test(String(v??'').trim());
export const priorities481=Object.freeze(['routine','priority','urgent_manual_review']);
export const actions481=Object.freeze(['collect_missing_evidence','owner_followup','external_decision_pending','reassess_without_closure']);
export function assessPriority481({form={},portfolio}={}){
 const holds=[],orderId=id(form.order_id),sourceId=id(form.source_receipt_id);
 const cases=Array.isArray(portfolio?.cases)?portfolio.cases:[];
 const caseRow=cases.find(r=>id(r.order_id)===orderId&&id(r.evidence_id)===sourceId);
 if(!portfolio?.bounded_sample||!caseRow)holds.push('Select a real Build 479 follow-up receipt from a freshly loaded, bounded portfolio sample.');
 if(!priorities481.includes(form.priority))holds.push('Choose a supported manual follow-up priority.');
 if(!actions481.includes(form.next_action))holds.push('Choose a documented next review action.');
 if(!ref(form.evidence_reference))holds.push('Provide an existing private reference (8–120 safe characters; no PII).');
 if(form.observed!==true)holds.push('Owner must attest to inspecting the actual source and open-case decision.');
 if(caseRow?.priority_receipt_id)holds.push('This follow-up already has a priority annotation receipt; inspect it before further action.');
 const ready=holds.length===0;
 return Object.freeze({holds,ready,order_id:orderId,source_receipt_id:sourceId,case_closed:false,external_action:false,customer_message:false,refund_authorized:false});
}
export function priorityPayload481({decision,form,requestKey}){
 if(!decision?.ready||!/^[a-zA-Z0-9_-]{16,80}$/.test(String(requestKey??'')))return null;
 return {order_id:decision.order_id,source_receipt_id:decision.source_receipt_id,priority:form.priority,next_action:form.next_action,
  evidence_reference:String(form.evidence_reference).trim(),request_key:requestKey,owner_observed:true};
}
