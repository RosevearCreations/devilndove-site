/* Build 480: sampled, advisory portfolio trends from genuine append-only receipts. */
const knownStates=new Set(['evidence_still_missing','awaiting_owner_action','awaiting_external_decision','reassessment_complete_case_open']);
export function summarizeAftercarePortfolio480(receipts,{sampleLimit=250,hasMore=false}={}){
 const input=Array.isArray(receipts)?receipts.slice(0,sampleLimit):[];
 const latest=new Map(),byMonth=new Map(),annotations=new Map(),handoffs=new Map(),followupsByOrder=new Map();let unclassified=0,recognized=0,annotationReceipts=0,handoffReceipts=0;
 for(const receipt of input){
  const note=String(receipt?.review_note??'');
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
    if(!prior||receiptId>prior.receipt_id)handoffs.set(sourceId,{receipt_id:receiptId,priority_receipt_id:priorityId,disposition:handoff[3]});
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
   if(handoff?.priority_receipt_id===match.receipt_id){row.handoff_receipt_id=handoff.receipt_id;row.handoff_disposition=handoff.disposition;}
  }
 }
 return Object.freeze({sampled_receipts:input.length,recognized_receipts:recognized,priority_annotation_receipts:annotationReceipts,handoff_receipts:handoffReceipts,unclassified_receipts:unclassified,
  orders_with_repeated_followups_in_sample:[...followupsByOrder.values()].filter(n=>n>1).length,
  distinct_orders_in_sample:latest.size,priority_annotations_in_sample:annotations.size,states,trend:[...byMonth].sort(([a],[b])=>a.localeCompare(b)).map(([month,count])=>({month,count})),
  cases:[...latest.values()].sort((a,b)=>b.evidence_id-a.evidence_id).slice(0,25),
  bounded_sample:true,history_incomplete:Boolean(hasMore),case_closure_verified:false,customer_consent_verified:false,
  note:'Sampled recent follow-up receipts only. Recurrence means multiple Build 479 receipts for an order in this sample, not verified repeat incidents. Counts are not all-time case totals, closure evidence, SLA performance or customer consent.'});
}
