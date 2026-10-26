import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcileClosure475,closurePayload475} from '../public/js/maker-fulfillment-closure-policy-475.mjs';

const order={order_id:475,order_number:'DN-475',order_status:'processing',payment_status:'paid',fulfillment_type:'shipping',shipping_country:'CA',currency:'CAD'};
const ledger=[{evidence_id:21,event_kind:'damage_hold',review_note:'Trial II case ref=actual-case-475; evidence source=owner_inspection; observed condition=observed_damage; disposition=HOLD_FOR_HUMAN_REVIEW.'}];
const sources=(evidence=ledger)=>({detail:{ok:true,order:{...order},diagnostics:{warnings:[]}},fulfillment:{ok:true,order:{...order},evidence,history_truncated:false}});
const form=()=>({route:'closure_review',owner_observed:true,review_note:'I inspected the original incident and follow-up evidence personally.',consent_state:'verified',consent_reference:'original-contact-consent-475',case_reference:'actual-case-475',source_hold_receipt_id:21,closure_reference:'owner-follow-up-475',closure_disposition:'owner_review_complete',closure_observed:true});

test('Build 475 requires original same-case HOLD source and independent owner follow-up',()=>{
 const ready=reconcileClosure475({...sources(),form:form()});
 assert.equal(ready.can_append_existing_receipt,true);
 assert.equal(ready.source_hold_receipt_id,21);
 const receipt=closurePayload475({decision:ready,form:form(),orderId:475,requestKey:'1234567890abcdeffedcba'});
 assert.equal(receipt.event_kind,'aftercare_followup');
 assert.match(receipt.review_note,/source hold #21/);
 assert.match(receipt.review_note,/no case closure, external action or consent verification/);
 for(const key of ['case_closed','refund_authorized','customer_message','automatic_order_transition','owner_closure_review_recorded'])assert.equal(ready[key],false);
 for(const invalid of [{source_hold_receipt_id:0},{case_reference:'another-case-475'},{closure_reference:'bad'},{closure_disposition:'case_closed'},{closure_observed:false}])
  assert.equal(reconcileClosure475({...sources(),form:{...form(),...invalid}}).can_append_existing_receipt,false);
});
test('Build 475 is fail closed on absent, truncated, cross-order or duplicate ledger evidence',()=>{
 assert.equal(reconcileClosure475({...sources([]),form:form()}).can_append_existing_receipt,false);
 const truncated=sources();truncated.fulfillment.history_truncated=true;
 assert.equal(reconcileClosure475({...truncated,form:form()}).can_append_existing_receipt,false);
 const cross=sources();cross.fulfillment.order.order_id=99;
 assert.equal(reconcileClosure475({...cross,form:form()}).can_append_existing_receipt,false);
 const duplicate=sources([...ledger,{evidence_id:22,event_kind:'aftercare_followup',review_note:'Build 475 closure review; source hold #21; duplicate'}]);
 assert.equal(reconcileClosure475({...duplicate,form:form()}).can_append_existing_receipt,false);
 assert.equal(closurePayload475({decision:{can_append_existing_receipt:false,route:'closure_review'},form:form(),orderId:475,requestKey:'1234567890abcdeffedcba'}),null);
});
test('Existing Build 474 paths remain compatible and owner interface does not execute external changes',()=>{
 const f={...form(),route:'damage',evidence_source:'owner_inspection',condition_state:'observed_damage'};
 assert.equal(reconcileClosure475({...sources(),form:f}).can_append_existing_receipt,true);
 const page=readFileSync(new URL('../admin/maker-fulfillment-pilot/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/js/admin-maker-fulfillment-pilot-464.js',import.meta.url),'utf8');
 for(const id of ['fpSourceHold','fpClosureReference','fpClosureDisposition','fpClosureObserved'])assert.match(page,new RegExp(`id="${id}"`));
 assert.match(page,/467b(47[56789]|48[0123456])/);assert.match(ui,/reconcileClosure475/);assert.match(ui,/closurePayload475/);
 assert.doesNotMatch(ui,/\/api\/admin\/update-order-status|\/api\/admin\/order-payments|\/api\/admin\/order-fulfillment-workflow/);
});
