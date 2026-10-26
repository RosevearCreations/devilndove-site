/* Build 483: UTC handoff age is advisory; reassessment is independent and never closes a case. */
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const safe=v=>/^[a-zA-Z0-9 _.-]{8,120}$/.test(String(v??'').trim());
export const findings483=Object.freeze(['further_evidence_required','owner_action_pending','external_authorization_pending','manual_reassessment_complete_case_open']);
export function handoffAge483(createdAt,now=new Date()){
 const text=String(createdAt??'');
 if(!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:Z)?$/.test(text))return {days:null,band:'unknown',advisory:true};
 const time=Date.parse(text.replace(' ','T').replace(/Z?$/,'Z'));
 const clock=now instanceof Date?now.getTime():Number.NaN;
 if(!Number.isFinite(time)||!Number.isFinite(clock)||time>clock)return {days:null,band:'unknown',advisory:true};
 const days=Math.floor((clock-time)/86400000);
 return Object.freeze({days,band:days>=30?'30+ days':days>=14?'14–29 days':days>=7?'7–13 days':'0–6 days',advisory:true});
}
export function assessReassessment483({form={},portfolio}={}){
 const holds=[],orderId=id(form.order_id),sourceId=id(form.source_receipt_id),priorityId=id(form.priority_receipt_id),handoffId=id(form.handoff_receipt_id);
 const row=Array.isArray(portfolio?.cases)?portfolio.cases.find(r=>id(r.order_id)===orderId&&id(r.evidence_id)===sourceId):null;
 if(portfolio?.bounded_sample!==true||!row||!handoffId||id(row.priority_receipt_id)!==priorityId||id(row.handoff_receipt_id)!==handoffId)holds.push('Select a genuine Build 482 handoff receipt from a freshly loaded bounded portfolio.');
 if(row?.reassessment_receipt_id)holds.push('An independent reassessment already exists for this handoff.');
 if(!findings483.includes(form.finding))holds.push('Select a supported manual reassessment finding.');
 if(!safe(form.evidence_reference))holds.push('Provide an original private evidence reference (8–120 safe characters, no PII).');
 if(form.observed!==true)holds.push('A different receiving reviewer must independently inspect the original handoff and attest.');
 return Object.freeze({ready:holds.length===0,holds,order_id:orderId,source_receipt_id:sourceId,priority_receipt_id:priorityId,handoff_receipt_id:handoffId,case_closed:false,external_action:false});
}
export function reassessmentPayload483({decision,form,requestKey}){
 if(!decision?.ready||!/^[a-zA-Z0-9_-]{16,80}$/.test(String(requestKey??'')))return null;
 return {order_id:decision.order_id,source_receipt_id:decision.source_receipt_id,priority_receipt_id:decision.priority_receipt_id,handoff_receipt_id:decision.handoff_receipt_id,
  finding:form.finding,evidence_reference:String(form.evidence_reference).trim(),owner_observed:true,request_key:requestKey};
}
