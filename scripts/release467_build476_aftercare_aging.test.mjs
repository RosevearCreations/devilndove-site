import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {agingBand476,reviewEscalation476,escalationPayload476} from '../public/js/maker-aftercare-aging-policy-476.mjs';

const now=Date.parse('2026-10-26T12:00:00Z');
const order={order_id:476,order_number:'DN-476',order_status:'processing',payment_status:'paid',fulfillment_type:'shipping',shipping_country:'CA',currency:'CAD'};
const ledger=[{evidence_id:26,event_kind:'damage_hold',created_at:'2026-10-10 00:00:00',review_note:'Trial II case ref=source-case-476; evidence source=owner_inspection; observed condition=observed_damage; disposition=HOLD_FOR_HUMAN_REVIEW.'}];
const sources=(evidence=ledger)=>({detail:{ok:true,order:{...order},diagnostics:{warnings:[]}},fulfillment:{ok:true,order:{...order},evidence,history_truncated:false}});
const form=()=>({route:'escalation_review',owner_observed:true,review_note:'Owner checked original damage case and verified pending follow-up.',consent_state:'verified',consent_reference:'source-customer-note-476',case_reference:'source-case-476',escalation_source_id:26,escalation_level:'priority',escalation_evidence_reference:'actual-owner-review-476',followup_state:'awaiting_owner',escalation_observed:true});

test('Build 476 age bands use D1 UTC, respect thresholds and remain UNKNOWN for invalid/future stamps',()=>{
 for(const [days,band] of [[0,'RECENT'],[6,'RECENT'],[7,'REVIEW_7D'],[13,'REVIEW_7D'],[14,'REVIEW_14D'],[29,'REVIEW_14D'],[30,'REVIEW_30D']]){
  const input=new Date(now-days*86400000).toISOString().slice(0,19).replace('T',' ');
  assert.equal(agingBand476(input,now).band,band);
 }
 for(const t of ['','not-a-date','2026-10-27 00:00:00','2026-10-10','2026-10-10 00:00:00Z'])assert.equal(agingBand476(t,now).band,'UNKNOWN');
});
test('Build 476 must link exact original HOLD and never execute external escalation',()=>{
 const ready=reviewEscalation476({...sources(),form:form(),now});
 assert.equal(ready.can_append_existing_receipt,true);
 assert.equal(ready.age_band,'REVIEW_14D');
 assert.equal(ready.age_days,16);
 for(const k of ['automatic_escalation','sla_breach_confirmed','customer_message','case_closed','refund_authorized','external_action'])assert.equal(ready[k],false);
 const payload=escalationPayload476({decision:ready,form:form(),orderId:476,requestKey:'abcabcabcabcabcabc123'});
 assert.equal(payload.event_kind,'aftercare_followup');
 assert.match(payload.review_note,/source hold #26/);
 assert.match(payload.review_note,/advisory only, no SLA conclusion, contact or case closure/);
});
test('Build 476 declines missing provenance, bad references, stale ledger and duplicate escalation review',()=>{
 for(const bad of [{escalation_source_id:99},{case_reference:'wrong-case-476'},{escalation_level:''},{escalation_evidence_reference:'bad'},{followup_state:'closed'},{escalation_observed:false}]){
  assert.equal(reviewEscalation476({...sources(),form:{...form(),...bad},now}).can_append_existing_receipt,false);
 }
 assert.equal(reviewEscalation476({...sources([]),form:form(),now}).can_append_existing_receipt,false);
 const truncated=sources();truncated.fulfillment.history_truncated=true;
 assert.equal(reviewEscalation476({...truncated,form:form(),now}).can_append_existing_receipt,false);
 const duplicate=sources([...ledger,{evidence_id:27,event_kind:'aftercare_followup',created_at:'2026-10-20 00:00:00',review_note:'Build 476 escalation review; source hold #26; reviewed'}]);
 assert.equal(reviewEscalation476({...duplicate,form:form(),now}).can_append_existing_receipt,false);
 assert.equal(escalationPayload476({decision:{can_append_existing_receipt:false,route:'escalation_review'},form:form(),orderId:476,requestKey:'abcabcabcabcabcabc123'}),null);
});
test('Build 476 UI preserves Build 474/475 workflows and zero-action boundaries',()=>{
 const page=readFileSync(new URL('../admin/maker-fulfillment-pilot/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../public/js/admin-maker-fulfillment-pilot-464.js',import.meta.url),'utf8');
 for(const key of ['fpEscalationSource','fpEscalationLevel','fpEscalationEvidence','fpFollowupState','fpEscalationObserved'])assert.match(page,new RegExp(`id="${key}"`));
 assert.match(page,/467b(47[6789]|48[01234])/);assert.match(js,/reviewEscalation476/);assert.match(js,/escalationPayload476/);
 assert.match(js,/closurePayload475/);assert.match(js,/trialPayload474/);
 assert.doesNotMatch(js,/\/api\/admin\/update-order-status|\/api\/admin\/order-payments|\/api\/admin\/order-fulfillment-workflow/);
});
