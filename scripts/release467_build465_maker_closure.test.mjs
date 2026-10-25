import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import {CLOSURE_CHECKS_465,NEXT_MAKER_BUILDS_466_475,deriveMakerClosure465} from '../public/js/maker-pilot-closure-policy-465.mjs';
test('Build 465 is fail-closed without actual owner, carrier, provider or external approval',()=>{
 const x=deriveMakerClosure465();assert.equal(x.state,'HOLD_INDEPENDENT_REAL_WORLD_ACCEPTANCE');assert.equal(x.closed,false);
 assert.equal(x.required,8);assert.equal(x.ownerReviewCount,0);
 assert.equal(x.results.every(r=>r.status==='HOLD_OWNER_REVIEW_INCOMPLETE'),true);
 for(const key of ['automaticallyCertified','approvedEtsyPublication','verifiedProductSafety','deliveredOrRefunded','providerBillingVerified','customerConsentVerified','automaticExternalAction'])assert.equal(x[key],false);
 assert.deepEqual(NEXT_MAKER_BUILDS_466_475.map(x=>x.number),[466,467,468,469,470,471,472,473,474,475]);
 assert.equal(new Set(CLOSURE_CHECKS_465.map(x=>x.key)).size,8);
});
test('Build 465 only recognizes genuine scoped, current append-only owner receipts as one-case progress',()=>{
 const checks=['source_identity','actual_materials','process_quality','physical_safety','media_rights'];
 const history=checks.map((key,i)=>({maker_owner_trial_review_id:i+1,checkpoint_key:key,decision:'accepted',personally_observed:1,source_id:i+10}));
 const accepted={ok:true,selected:{creative_work_project_id:3},summary:{required:5,accepted:5,checklist_recorded:true},history,history_truncated:false};
 const x=deriveMakerClosure465({ownerTrial:accepted,ownerScenario:'jewellery_metal'});
 const maker=x.results.find(c=>c.key==='owner_trials');assert.equal(maker.sourceStatus,'REAL_ONE_CASE_OWNER_RECEIPTS_RECORDED');assert.deepEqual(maker.sourceReceiptIds,[1,2,3,4,5]);assert.equal(x.closed,false);
 const missing={...accepted,history:history.map((r,i)=>i===3?{...r,decision:'hold'}:r)};
 assert.equal(deriveMakerClosure465({ownerTrial:missing}).results[0].sourceStatus,'HOLD_OWNER_SOURCE_CHECKPOINTS');
 assert.equal(deriveMakerClosure465({ownerTrial:{...accepted,history_truncated:true}}).results[0].sourceStatus,'HOLD_OWNER_SOURCE_CHECKPOINTS');
 assert.equal(deriveMakerClosure465({ownerTrial:{...accepted,selected:null}}).results[0].sourceStatus,'HOLD_SOURCE_UNAVAILABLE');
});
test('Build 465 fulfillment receipt and manual notes remain owner assertion, never closure',()=>{
 const fulfillment={ok:true,order:{order_id:42},evidence:[{evidence_id:88,event_kind:'shipping_receipt'}],history_truncated:false};
 const manual=Object.fromEntries(CLOSURE_CHECKS_465.map(c=>[c.key,{reference:'Original Module #42',note:'I inspected the actual original source today.',observed:true}]));
 const x=deriveMakerClosure465({fulfillment,manual});assert.equal(x.ownerReviewCount,8);assert.equal(x.closed,false);
 assert.equal(x.results.every(c=>c.status==='OWNER_REVIEW_RECORDED_IN_SESSION_NOT_CLOSED'),true);
 const order=x.results.find(c=>c.key==='fulfillment');assert.equal(order.sourceStatus,'REAL_ORDER_RECEIPTS_RECORDED_DELIVERY_UNVERIFIED');assert.deepEqual(order.sourceReceiptIds,[88]);
 const history=deriveMakerClosure465({fulfillment:{...fulfillment,history_truncated:true}}).results.find(c=>c.key==='fulfillment');assert.equal(history.sourceStatus,'HOLD_FULFILLMENT_LEDGER_TRUNCATED');
 const incomplete={...manual,etsy:{reference:'',note:'',observed:true}};assert.equal(deriveMakerClosure465({manual:incomplete}).ownerReviewCount,7);
});
test('Build 465 Admin operator has bounded explicit reads, owner Help, no POST or fake acceptance',()=>{
 const page=readFileSync(new URL('../admin/maker-pilot-closure/index.html',import.meta.url),'utf8');const ui=readFileSync(new URL('../public/js/admin-maker-pilot-closure-465.js',import.meta.url),'utf8');const link=readFileSync(new URL('../public/js/maker-workbench-policy-457.mjs',import.meta.url),'utf8');const roadmap=readFileSync(new URL('../docs/operations/RELEASE_467_MAKER_NEXT_QUEUE_466_475.md',import.meta.url),'utf8');
 assert.match(page,/pcRead/);assert.match(page,/pcDownload/);assert.match(page,/aria-live="polite"/);assert.match(page,/➍|ⓘ/);
 assert.match(ui,/api\/admin\/maker-owner-trials/);assert.match(ui,/api\/admin\/maker-fulfillment-evidence/);assert.match(ui,/Promise\.allSettled/);assert.match(ui,/no_automatic_external_action:true/);
 assert.doesNotMatch(ui,/method:'POST'|method:"POST"|method:'PATCH'|method:'DELETE'|\.localStorage/);
 assert.match(link,/key:'maker-closure'/);assert.match(roadmap,/Builds 466–475/);assert.match(roadmap,/proposed/i);
});
