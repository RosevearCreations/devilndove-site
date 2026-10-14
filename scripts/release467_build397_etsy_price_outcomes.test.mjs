import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {connectionEvidence397,priceEvidence397,normalizePriceOutcomeDecision,decisionAllowed397,outcomeReviewState397} from '../functions/api/_lib/etsyPriceOutcomes397.mjs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-10-14T13:00:00Z'),at=d=>new Date(now+d*86400000).toISOString();
const conn={connection_status:'connected',updated_at:at(-1),access_expires_at:at(2),refresh_expires_at:at(15)};
const shop={acceptance_status:'connected_verified',verified_at:at(-1)};
test('historical callback errors cannot override a verified stored shop or emit tokens',()=>{
 const result=connectionEvidence397({...conn,secret_access_token:'SECRET'},shop,{terminal_status:'failed',diagnostic_code:'SECRET'},now);
 assert.equal(result.health_status,'connected_verified');
 assert.equal(result.callback_outcome,'historical_failure');
 assert.equal(result.connection_verified_from_stored_evidence,true);
 assert.equal(result.real_time_etsy_check_performed,false);
 assert.doesNotMatch(JSON.stringify(result),/SECRET|secret_access_token/);
});
test('expired refresh and missing verification require review; no provider calls',()=>{
 assert.equal(connectionEvidence397({...conn,refresh_expires_at:at(-1)},shop,null,now).health_status,'reauthorization_required');
 assert.equal(connectionEvidence397(conn,{acceptance_status:'pending'},null,now).manual_review_required,true);
 assert.equal(connectionEvidence397(null,null,null,now).health_status,'not_connected');
});
const product={product_id:22,price_cents:0,currency:'CAD',updated_at:'2026-10-13 09:00:00'};
const sourceReceipt={receipt_id:94,approved_price_cents:800};
test('price comparison is exact cents; zero can be a legitimate approved price',()=>{
 assert.equal(priceEvidence397(product,null).outcome,'approved_source_missing');
 assert.equal(priceEvidence397(product,sourceReceipt).outcome,'approved_source_discrepancy');
 assert.equal(priceEvidence397(product,{receipt_id:95,approved_price_cents:0}).outcome,'approved_source_matches');
 assert.equal(priceEvidence397({...product,price_cents:800},sourceReceipt).outcome,'approved_source_matches');
 assert.equal(priceEvidence397({...product,currency:'USD'},sourceReceipt).outcome,'unsupported_current_price');
 assert.equal(priceEvidence397({...product,price_cents:8.5},sourceReceipt).outcome,'unsupported_current_price');
});
test('missing original approval cannot be called resolved or match-verified',()=>{
 const none=priceEvidence397(product,null);
 assert.equal(decisionAllowed397('confirm_approved_price_match',none),false);
 assert.equal(decisionAllowed397('record_source_needed',none),true);
 const conflict=priceEvidence397(product,sourceReceipt);
 assert.equal(decisionAllowed397('record_discrepancy_review',conflict),true);
 assert.equal(decisionAllowed397('confirm_approved_price_match',conflict),false);
 const same=priceEvidence397({...product,price_cents:800},sourceReceipt);
 assert.equal(decisionAllowed397('confirm_approved_price_match',same),true);
});
test('past review is stale when product or approved source receipt changes',()=>{
 const old=priceEvidence397(product,sourceReceipt),r={action:'record_discrepancy_review',fingerprint:old.fingerprint};
 assert.equal(outcomeReviewState397(old,r),'discrepancy_investigation_recorded');
 assert.equal(outcomeReviewState397({...old,fingerprint:old.fingerprint+'|updated'},r),'review_stale_recheck_required');
 assert.equal(outcomeReviewState397(old,{...r,action:'confirm_approved_price_match'}),'review_conflicts_with_source_evidence');
});
test('operator outcome decisions need exact fingerprint, key and explicit confirmation',()=>{
 const e=priceEvidence397(product,sourceReceipt),input={product_id:22,action:'record_discrepancy_review',fingerprint:e.fingerprint,
  operator_reference:'PRICE-REVIEW-397',request_key:'abc123def4567890abcd',operator_confirmed:true};
 assert.equal(normalizePriceOutcomeDecision(input)?.action,'record_discrepancy_review');
 assert.equal(normalizePriceOutcomeDecision({...input,operator_confirmed:false}),null);
 assert.equal(normalizePriceOutcomeDecision({...input,operator_reference:'Bearer token 1234'}),null);
 assert.equal(normalizePriceOutcomeDecision({...input,request_key:'short'}),null);
 assert.equal(normalizePriceOutcomeDecision({...input,action:'apply_correction'}),null);
});
test('GET is read-only; POST has product/source/audit concurrency guards, not Product writes',()=>{
 const api=source('functions/api/admin/etsy-connection-price-outcomes.js');
 const get=api.split('export async function onRequestGet')[1].split('export async function onRequestPost')[0];
 assert.doesNotMatch(get,/\.run\(|INSERT INTO|UPDATE products/);
 assert.match(api,/INSERT INTO admin_action_audit/);
 assert.match(api,/source_changed/);
 assert.match(api,/outcome_receipt_unknown/);
 assert.match(api,/SELECT 1 FROM products WHERE product_id=\?/);
 assert.match(api,/MAX\(admin_action_audit_id\)/);
 assert.match(api,/AND admin_action_audit_id>\?/);
 assert.doesNotMatch(api,/UPDATE products|INSERT INTO products|etsy\.com|fetch\(/);
});
test('operator UI avoids double submit and verifies persisted audit receipt',()=>{
 const html=source('admin/it-integrations/index.html'),ui=source('public/js/admin-etsy-connection-price-outcomes-v397.js');
 assert.match(html,/id="etsy397ProductCheck"/);
 assert.match(ui,/button\.disabled=true/);
 assert.match(ui,/crypto\.randomUUID/);
 assert.match(ui,/const readback=await call/);
 assert.match(ui,/no automatic retry/);
});
