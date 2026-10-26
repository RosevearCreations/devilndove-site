/* Build 480: sampled, advisory portfolio trends from genuine append-only receipts. */
const knownStates=new Set(['evidence_still_missing','awaiting_owner_action','awaiting_external_decision','reassessment_complete_case_open']);
export function summarizeAftercarePortfolio480(receipts,{sampleLimit=250,hasMore=false}={}){
 const input=Array.isArray(receipts)?receipts.slice(0,sampleLimit):[];
 const latest=new Map(),byMonth=new Map(),annotations=new Map(),handoffs=new Map(),reassessments=new Map(),decisions=new Map(),decisionHandoffs=new Map(),followupsByOrder=new Map();let unclassified=0,recognized=0,annotationReceipts=0,handoffReceipts=0,reassessmentReceipts=0,decisionReceipts=0,independentDecisionHandoffReceipts=0;
 for(const receipt of input){
  const note=String(receipt?.review_note??'');
  const independent=/^Build 485 independent decision handoff; source follow-up #(\d+); priority receipt #(\d+); handoff receipt #(\d+); reassessment receipt #(\d+); decision receipt #(\d+); disposition=(accepted_for_manual_triage|needs_original_evidence|awaits_separate_authorization); evidence=[a-zA-Z0-9 _.-]{8,120}; receiver independently verified; case remains open; no external action\.$/.exec(note);
  if(independent&&receipt.event_kind==='aftercare_followup'){
   independentDecisionHandoffReceipts++;
   const [sourceId,priorityId,handoffId,reassessmentId,decisionId]=independent.slice(1,6).map(Number),receiptId=Number(receipt.evidence_id);
   if([sourceId,priorityId,handoffId,reassessmentId,decisionId,receiptId].every(x=>Number.isSafeInteger(x)&&x>0)){
    const prior=decisionHandoffs.get(sourceId);
    if(!prior||receiptId>prior.receipt_id)decisionHandoffs.set(sourceId,{receipt_id:receiptId,priority_receipt_id:priorityId,handoff_receipt_id:handoffId,reassessment_receipt_id:reassessmentId,decision_receipt_id:decisionId,disposition:independent[6]});
   }
   continue;
  }
  const annotation=/Build 481 priority review; source follow-up #(\d+); priority=(routine|priority|urgent_manual_review); next=(collect_missing_evidence|owner_followup|external_decision_pending|reassess_without_closure); evidence=[a-zA-Z0-9 _.-]{8,120}; owner observed; case remains open; no customer action\./.exec(note);
  if(annotation&&receipt.event_kind==='aftercare_followup'){
   annotationReceipts++;
   const sourceId=Number(annotation[1]),receiptId=Number(receipt.evidence_id);
   if(Number.isSafeInteger(sourceId)&&sourceId>0&&Number.isSafeInteger(receiptId)&&receiptId>0){
    const existing=annotations.get(sourceId);
    if(!existing||receiptId>existing.receipt_id)annotations.set(sourceId,{receipt_id:receiptId,priority:annotation[2],next_action:annotation[3]});
   }
   continue;
  }
  const handoff=/Build 482 owner handoff; source follow-up #(\d+); priority receipt #(\d+); disposition=(accepted_for_manual_review|missing_evidence_recheck|await_external_authorization); evidence=[a-zA-Z0-9 _.-]{8,120}; receiver independently verified; case remains open; no external action\./.exec(note);
  if(handoff&&receipt.event_kind==='aftercare_followup'){
   handoffReceipts++;
   const sourceId=Number(handoff[1]),priorityId=Number(handoff[2]),receiptId=Number(receipt.evidence_id);
   if(Number.isSafeInteger(sourceId)&&sourceId>0&&Number.isSafeInteger(priorityId)&&priorityId>0&&Number.isSafeInteger(receiptId)&&receiptId>0){
    const prior=handoffs.get(sourceId);
    if(!prior||receiptId>prior.receipt_id)handoffs.set(sourceId,{receipt_id:receiptId,priority_receipt_id:priorityId,disposition:handoff[3],created_at:String(receipt.created_at??'').slice(0,19)});
   }
   continue;
  }
  const reassessment=/Build 483 handoff reassessment; source follow-up #(\d+); priority receipt #(\d+); handoff receipt #(\d+); finding=(further_evidence_required|owner_action_pending|external_authorization_pending|manual_reassessment_complete_case_open); evidence=[a-zA-Z0-9 _.-]{8,120}; independently reassessed; case remains open; no external action\./.exec(note);
  if(reassessment&&receipt.event_kind==='aftercare_followup'){
   reassessmentReceipts++;
   const sourceId=Number(reassessment[1]),priorityId=Number(reassessment[2]),handoffId=Number(reassessment[3]),receiptId=Number(receipt.evidence_id);
   if([sourceId,priorityId,handoffId,receiptId].every(x=>Number.isSafeInteger(x)&&x>0)){
    const prior=reassessments.get(sourceId);
    if(!prior||receiptId>prior.receipt_id)reassessments.set(sourceId,{receipt_id:receiptId,priority_receipt_id:priorityId,handoff_receipt_id:handoffId,finding:reassessment[4]});
   }
   continue;
  }
  const decision=/Build 484 follow-up decision; source follow-up #(\d+); priority receipt #(\d+); handoff receipt #(\d+); reassessment receipt #(\d+); decision=(continue_evidence_collection|owner_manual_followup|external_approval_hold|schedule_independent_recheck); evidence=[a-zA-Z0-9 _.-]{8,120}; owner separately reviewed; case remains open; no external action\./.exec(note);
  if(decision&&receipt.event_kind==='aftercare_followup'){
   decisionReceipts++;
   const sourceId=Number(decision[1]),priorityId=Number(decision[2]),handoffId=Number(decision[3]),reassessmentId=Number(decision[4]),receiptId=Number(receipt.evidence_id);
   if([sourceId,priorityId,handoffId,reassessmentId,receiptId].every(x=>Number.isSafeInteger(x)&&x>0)){
    const prior=decisions.get(sourceId);
    if(!prior||receiptId>prior.receipt_id)decisions.set(sourceId,{receipt_id:receiptId,priority_receipt_id:priorityId,handoff_receipt_id:handoffId,reassessment_receipt_id:reassessmentId,decision:decision[5],created_at:String(receipt.created_at??'').slice(0,19)});
   }
   continue;
  }
  const found=/Build 479 outstanding review; owner #(\d+); audit #(\d+); source hold #(\d+); follow-up #(\d+); case=[a-zA-Z0-9 _.-]{8,120}; evidence=[a-zA-Z0-9 _.-]{8,120}; state=([a-z_]+); case remains open, no external action\./.exec(note);
  if(!found||receipt.event_kind!=='aftercare_followup'||!knownStates.has(found[5])){unclassified++;continue;}
  const orderId=Number(receipt.order_id),evidenceId=Number(receipt.evidence_id);
  if(!Number.isSafeInteger(orderId)||orderId<1||!Number.isSafeInteger(evidenceId)||evidenceId<1){unclassified++;continue;}
  recognized++;
  followupsByOrder.set(orderId,(followupsByOrder.get(orderId)||0)+1);
  const month=String(receipt.created_at??'').slice(0,7);
  if(/^\d{4}-(0[1-9]|1[0-2])$/.test(month))byMonth.set(month,(byMonth.get(month)||0)+1);
  const prior=latest.get(orderId);
  if(!prior||evidenceId>prior.evidence_id)latest.set(orderId,{order_id:orderId,evidence_id:evidenceId,state:found[5],created_at:String(receipt.created_at??'').slice(0,19)});
 }
 const states=Object.fromEntries([...knownStates].map(s=>[s,0]));
 for(const row of latest.values()){
  states[row.state]++;
  row.recurrence_count_in_sample=followupsByOrder.get(row.order_id)||1;
  const match=annotations.get(row.evidence_id);
  if(match){row.priority=match.priority;row.next_action=match.next_action;row.priority_receipt_id=match.receipt_id;
   const handoff=handoffs.get(row.evidence_id);
   if(handoff?.priority_receipt_id===match.receipt_id){row.handoff_receipt_id=handoff.receipt_id;row.handoff_disposition=handoff.disposition;row.handoff_created_at=handoff.created_at;
    const reassessment=reassessments.get(row.evidence_id);
    if(reassessment?.priority_receipt_id===match.receipt_id&&reassessment.handoff_receipt_id===handoff.receipt_id){row.reassessment_receipt_id=reassessment.receipt_id;row.reassessment_finding=reassessment.finding;
     const decision=decisions.get(row.evidence_id);
     if(decision?.priority_receipt_id===match.receipt_id&&decision.handoff_receipt_id===handoff.receipt_id&&decision.reassessment_receipt_id===reassessment.receipt_id){row.decision_receipt_id=decision.receipt_id;row.owner_decision=decision.decision;row.decision_created_at=decision.created_at;
      const independent=decisionHandoffs.get(row.evidence_id);
      if(independent?.priority_receipt_id===match.receipt_id&&independent.handoff_receipt_id===handoff.receipt_id&&independent.reassessment_receipt_id===reassessment.receipt_id&&independent.decision_receipt_id===decision.receipt_id){row.independent_decision_handoff_receipt_id=independent.receipt_id;row.independent_decision_handoff_disposition=independent.disposition;}
     }
    }
   }
  }
 }
 const cases=[...latest.values()].sort((a,b)=>b.evidence_id-a.evidence_id).slice(0,25);
 const exceptionLedger=cases.map(row=>({order_id:row.order_id,source_receipt_id:row.evidence_id,state:row.state,priority:row.priority||'unassessed',handoff_receipt_id:row.handoff_receipt_id||null,reassessment_receipt_id:row.reassessment_receipt_id||null,
  reassessment_finding:row.reassessment_finding||'not_recorded',owner_decision:row.owner_decision||'not_recorded',decision_receipt_id:row.decision_receipt_id||null,decision_created_at:row.decision_created_at||null,recurrence_count_in_sample:row.recurrence_count_in_sample||1,independent_decision_handoff_receipt_id:row.independent_decision_handoff_receipt_id||null,independent_decision_handoff_disposition:row.independent_decision_handoff_disposition||'not_recorded',case_closed:false,external_action:false}));
 return Object.freeze({sampled_receipts:input.length,recognized_receipts:recognized,priority_annotation_receipts:annotationReceipts,handoff_receipts:handoffReceipts,reassessment_receipts:reassessmentReceipts,decision_receipts:decisionReceipts,independent_decision_handoff_receipts:independentDecisionHandoffReceipts,unclassified_receipts:unclassified,
  orders_with_repeated_followups_in_sample:[...followupsByOrder.values()].filter(n=>n>1).length,
  distinct_orders_in_sample:latest.size,priority_annotations_in_sample:annotations.size,states,trend:[...byMonth].sort(([a],[b])=>a.localeCompare(b)).map(([month,count])=>({month,count})),
  cases,exception_ledger:exceptionLedger,ledger_scope:'latest 25 recognized orders in sampled latest 250 aftercare receipts',
  bounded_sample:true,history_incomplete:Boolean(hasMore),case_closure_verified:false,customer_consent_verified:false,
  note:'Sampled recent follow-up receipts only. Recurrence means multiple Build 479 receipts for an order in this sample, not verified repeat incidents. Counts are not all-time case totals, closure evidence, SLA performance or customer consent.'});
}
