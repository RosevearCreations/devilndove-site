import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateTrial474,trialPayload474} from '../public/js/maker-fulfillment-trial-policy-474.mjs';

const order={order_id:474,order_number:'DN-474',order_status:'processing',payment_status:'paid',fulfillment_type:'shipping',shipping_country:'CA',currency:'CAD'};
const sources=()=>({detail:{ok:true,order:{...order},diagnostics:{warnings:[]}},fulfillment:{ok:true,order:{...order},evidence:[],history_truncated:false}});
const form=route=>({route,owner_observed:true,review_note:'Owner inspected original physical item and recorded unresolved claim.',consent_state:'verified',consent_reference:'original-order-474-note',case_reference:'case-474-actual',evidence_source:'owner_inspection',condition_state:'observed_damage',receipt_reference:'real-reference-474',carrier:'Canada Post',tracking_reference:'real-tracking-474'});
test('damage and returns remain HOLD without original case provenance',()=>{
 for(const route of ['damage','refund','exchange','repair']){
  const missing=evaluateTrial474({...sources(),form:{...form(route),case_reference:'',evidence_source:'',condition_state:''}});
  assert.equal(missing.can_append_existing_receipt,false);
  assert.ok(missing.holds.length>=3);
  assert.equal(missing.refund_authorized,false);
  assert.equal(missing.damage_resolved,false);
  const reviewed=evaluateTrial474({...sources(),form:form(route)});
  assert.equal(reviewed.can_append_existing_receipt,true);
  assert.equal(reviewed.trial_ii_accepted,false);
  const receipt=trialPayload474({decision:reviewed,form:form(route),orderId:474,requestKey:'abc0123456789def012345'});
  assert.match(receipt.review_note,/disposition=HOLD_FOR_HUMAN_REVIEW/);
  assert.equal(receipt.event_kind,route==='damage'?'damage_hold':route==='repair'?'repair_followup':'return_hold');
 }
});
test('trial II rejects inappropriate consent, fake reference and stale shipping history',()=>{
 for(const ref of ['abc','https://example.com/case','buyer@example.com','<script>bad</script>'])
  assert.equal(evaluateTrial474({...sources(),form:{...form('damage'),case_reference:ref}}).can_append_existing_receipt,false);
 assert.equal(evaluateTrial474({...sources(),form:{...form('aftercare'),consent_state:'declined'}}).can_append_existing_receipt,false);
 const stale=sources();stale.fulfillment.history_truncated=true;
 assert.equal(evaluateTrial474({...stale,form:form('shipment')}).can_append_existing_receipt,false);
 assert.equal(evaluateTrial474({...sources(),form:{...form('shipment'),consent_state:'declined'}}).can_append_existing_receipt,false);
 assert.equal(evaluateTrial474({...sources(),form:form('shipment')}).can_append_existing_receipt,true);
});
test('operator UI requires an explicit source review and preserves existing append-only endpoint',()=>{
 const html=readFileSync(new URL('../admin/maker-fulfillment-pilot/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../public/js/admin-maker-fulfillment-pilot-464.js',import.meta.url),'utf8');
 for(const id of ['fpCaseReference','fpEvidenceSource','fpCondition','fpObserved','fpConsentReference'])assert.match(html,new RegExp(`id="${id}"`));
 assert.match(html,/Build 474/);
 assert.match(js,/evaluateTrial474/);assert.match(js,/trialPayload474/);
 assert.match(js,/api\/admin\/maker-fulfillment-evidence/);
 assert.doesNotMatch(js,/\/api\/admin\/update-order-status|\/api\/admin\/order-payments|\/api\/admin\/order-fulfillment-workflow/);
});
