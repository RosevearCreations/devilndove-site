/* Build 486: independently received handoff outcomes require owner evidence reconciliation. */
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
export const outcomes486=Object.freeze(['more_source_evidence_required','owner_reconciliation_pending','separate_authorization_pending','reviewed_no_case_closure']);
export function assessOutcome486({form={},portfolio}={}){
 const holds=[],order=id(form.order_id),source=id(form.source_receipt_id),priority=id(form.priority_receipt_id),handoff=id(form.handoff_receipt_id),reassessment=id(form.reassessment_receipt_id),decision=id(form.decision_receipt_id),independent=id(form.independent_decision_handoff_receipt_id);
 const row=Array.isArray(portfolio?.cases)?portfolio.cases.find(x=>id(x.order_id)===order&&id(x.evidence_id)===source):null;
 if(portfolio?.bounded_sample!==true||!row||!independent||id(row.priority_receipt_id)!==priority||id(row.handoff_receipt_id)!==handoff||id(row.reassessment_receipt_id)!==reassessment||id(row.decision_receipt_id)!==decision||id(row.independent_decision_handoff_receipt_id)!==independent)holds.push('Select a genuine Build 485 independent handoff from the fresh bounded sample.');
 if(row?.outcome_receipt_id)holds.push('An outcome reconciliation is already recorded for this handoff.');
 if(!outcomes486.includes(form.outcome))holds.push('Choose a non-executing reconciliation outcome.');
 if(!/^[a-zA-Z0-9 _.-]{8,120}$/.test(String(form.evidence_reference||'').trim()))holds.push('Enter a private existing evidence reference, 8–120 safe characters.');
 if(form.observed!==true)holds.push('An independent Admin from the Build 485 receiving reviewer must inspect actual sources and attest.');
 return Object.freeze({ready:!holds.length,holds,order_id:order,source_receipt_id:source,priority_receipt_id:priority,handoff_receipt_id:handoff,reassessment_receipt_id:reassessment,decision_receipt_id:decision,independent_decision_handoff_receipt_id:independent,case_closed:false,external_action:false});
}
export function outcomePayload486({assessment,form,requestKey}){if(!assessment?.ready||!/^[a-zA-Z0-9_-]{16,80}$/.test(String(requestKey||'')))return null;
 return {order_id:assessment.order_id,source_receipt_id:assessment.source_receipt_id,priority_receipt_id:assessment.priority_receipt_id,handoff_receipt_id:assessment.handoff_receipt_id,reassessment_receipt_id:assessment.reassessment_receipt_id,decision_receipt_id:assessment.decision_receipt_id,independent_decision_handoff_receipt_id:assessment.independent_decision_handoff_receipt_id,outcome:form.outcome,evidence_reference:String(form.evidence_reference).trim(),owner_reconciled:true,request_key:requestKey};}
