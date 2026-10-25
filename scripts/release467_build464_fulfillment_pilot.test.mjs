import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import {PILOT_ROUTES_464,evaluatePilot464,pilotPayload464} from '../public/js/maker-fulfillment-pilot-policy-464.mjs';
const base={order_id:42,order_number:'DN-42',order_status:'processing',payment_status:'paid',fulfillment_type:'shipping',shipping_country:'CA',currency:'CAD'};
const source=order=>({detail:{ok:true,order:{...base,...order},diagnostics:{warnings:[]}},fulfillment:{ok:true,order:{...base,...order},evidence:[{evidence_id:3,event_kind:'packing_review'}],history_truncated:false}});
const form=(route='shipment')=>({route,consent_state:'verified',consent_reference:'Original order record #42',receipt_reference:'Actual receipt 54A',carrier:'Canada Post',tracking_reference:'CA-123',review_note:'Verified actual shipment at carrier receipt desk.',owner_observed:true});
test('Build 464 refuses fabricated, partial, country-mismatched, stale or unpaid source evidence',()=>{
 const missing=evaluatePilot464({form:form()});assert.equal(missing.can_append_existing_receipt,false);assert.equal(missing.real_world_pilot_accepted,false);
 for(const data of [{shipping_country:'US'},{currency:'USD'},{payment_status:'pending'},{order_status:'refunded'},{fulfillment_type:'pickup'}])assert.equal(evaluatePilot464({...source(data),form:form()}).can_append_existing_receipt,false);
 const partial=source();partial.detail.diagnostics.warnings=['order_items_query_failed'];assert.equal(evaluatePilot464({...partial,form:form()}).can_append_existing_receipt,false);
 const mismatch=source();mismatch.fulfillment.order.order_status='shipped';assert.equal(evaluatePilot464({...mismatch,form:form()}).can_append_existing_receipt,false);
 const withoutConsent=form();withoutConsent.consent_state='unknown';assert.equal(evaluatePilot464({...source(),form:withoutConsent}).can_append_existing_receipt,false);
 const withoutAttestation=form();withoutAttestation.owner_observed=false;assert.equal(evaluatePilot464({...source(),form:withoutAttestation}).can_append_existing_receipt,false);
});
test('Build 464 only prepares exact existing Build 454 receipts with manual provider and finance HOLDs',()=>{
 assert.equal(PILOT_ROUTES_464.length,8);
 const decision=evaluatePilot464({...source(),form:form()});assert.equal(decision.can_append_existing_receipt,true);assert.equal(decision.event_kind,'shipping_receipt');
 for(const prop of ['payment_execution','refund_execution','exchange_execution','carrier_booking','customer_message','automatic_order_transition','automatic_inventory_mutation','real_world_pilot_accepted','external_customer_consent_independently_verified'])assert.equal(decision[prop],false);
 const payload=pilotPayload464({decision,form:form(),orderId:42,requestKey:'0123456789abcdef0123'});
 assert.equal(payload.order_id,42);assert.equal(payload.event_kind,'shipping_receipt');assert.match(payload.review_note,/financial\/provider action=NONE/);
 assert.equal(pilotPayload464({decision,form:form(),orderId:43,requestKey:'0123456789abcdef0123'}),null);
 assert.equal(pilotPayload464({decision,form:form(),orderId:42,requestKey:'bad'}),null);
 const returnDecision=evaluatePilot464({...source(),form:{...form('refund'),consent_state:'unknown',consent_reference:''}});
 assert.equal(returnDecision.can_append_existing_receipt,true);assert.equal(returnDecision.event_kind,'return_hold');
 assert.equal(pilotPayload464({decision:returnDecision,form:{...form('refund'),consent_state:'unknown',consent_reference:''},orderId:42,requestKey:'0123456789abcdef0123'}).event_kind,'return_hold');
 const aftercare=evaluatePilot464({...source(),form:{...form('aftercare'),consent_state:'unknown'}});assert.equal(aftercare.can_append_existing_receipt,false);
 const pickupSource=source({fulfillment_type:'pickup',shipping_country:''});assert.equal(evaluatePilot464({...pickupSource,form:form('pickup')}).can_append_existing_receipt,true);
});
test('Build 464 preserves separate owner transitions and accessible real-source operator interface',()=>{
 const page=readFileSync(new URL('../admin/maker-fulfillment-pilot/index.html',import.meta.url),'utf8');const ui=readFileSync(new URL('../public/js/admin-maker-fulfillment-pilot-464.js',import.meta.url),'utf8');
 const orderPage=readFileSync(new URL('../admin/order-fulfillment-care/index.html',import.meta.url),'utf8');const links=readFileSync(new URL('../public/js/maker-workbench-policy-457.mjs',import.meta.url),'utf8');
 assert.match(page,/fpObserved/);assert.match(page,/fpConsentReference/);assert.match(page,/aria-live="polite"/);assert.match(page,/admin-module="operations"/);
 assert.match(ui,/api\/admin\/order-detail/);assert.match(ui,/api\/admin\/maker-fulfillment-evidence/);assert.match(ui,/snapshot\(fresh\)!==snapshot\(active\)/);
 assert.doesNotMatch(ui,/\/api\/admin\/update-order-status|\/api\/admin\/order-payments|\/api\/admin\/order-fulfillment-workflow/);
 assert.match(orderPage,/Open owner pilot and evidence checklist/);assert.match(links,/key:'fulfillment-pilot'/);
});
