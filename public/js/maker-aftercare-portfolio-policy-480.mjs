/* Build 480: sampled, advisory portfolio trends from genuine append-only receipts. */
const knownStates=new Set(['evidence_still_missing','awaiting_owner_action','awaiting_external_decision','reassessment_complete_case_open']);
export function summarizeAftercarePortfolio480(receipts,{sampleLimit=250,hasMore=false}={}){
 const input=Array.isArray(receipts)?receipts.slice(0,sampleLimit):[];
 const latest=new Map(),byMonth=new Map();let unclassified=0;
 for(const receipt of input){
  const note=String(receipt?.review_note??'');
  const found=/Build 479 outstanding review; owner #(\d+); audit #(\d+); source hold #(\d+); follow-up #(\d+); case=[a-zA-Z0-9 _.-]{8,120}; evidence=[a-zA-Z0-9 _.-]{8,120}; state=([a-z_]+); case remains open, no external action\./.exec(note);
  if(!found||receipt.event_kind!=='aftercare_followup'||!knownStates.has(found[5])){unclassified++;continue;}
  const orderId=Number(receipt.order_id),evidenceId=Number(receipt.evidence_id);
  if(!Number.isSafeInteger(orderId)||orderId<1||!Number.isSafeInteger(evidenceId)||evidenceId<1){unclassified++;continue;}
  const month=String(receipt.created_at??'').slice(0,7);
  if(/^\d{4}-(0[1-9]|1[0-2])$/.test(month))byMonth.set(month,(byMonth.get(month)||0)+1);
  const prior=latest.get(orderId);
  if(!prior||evidenceId>prior.evidence_id)latest.set(orderId,{order_id:orderId,evidence_id:evidenceId,state:found[5],created_at:String(receipt.created_at??'').slice(0,19)});
 }
 const states=Object.fromEntries([...knownStates].map(s=>[s,0]));
 for(const row of latest.values())states[row.state]++;
 return Object.freeze({sampled_receipts:input.length,recognized_receipts:input.length-unclassified,unclassified_receipts:unclassified,
  distinct_orders_in_sample:latest.size,states,trend:[...byMonth].sort(([a],[b])=>a.localeCompare(b)).map(([month,count])=>({month,count})),
  cases:[...latest.values()].sort((a,b)=>b.evidence_id-a.evidence_id).slice(0,25),
  bounded_sample:true,history_incomplete:Boolean(hasMore),case_closure_verified:false,customer_consent_verified:false,
  note:'Sampled recent follow-up receipts only. Counts are not all-time case totals, closure evidence, SLA performance or customer consent.'});
}
