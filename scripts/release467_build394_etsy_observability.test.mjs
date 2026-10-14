import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyEtsyConnection } from '../functions/api/_lib/etsyConnectionObservability.mjs';
const now = Date.parse('2026-10-13T19:00:00Z');
const at = (n) => new Date(now+n*86400000).toISOString();
const connected = {connection_status:'connected',access_expires_at:at(2),refresh_expires_at:at(60),updated_at:at(-1)};
const shop = {acceptance_status:'connected_verified',verified_at:at(-1)};
test('verified shop is reported from stored evidence, not as live polling', () => {
  const result = classifyEtsyConnection(connected,shop,now);
  assert.equal(result.status,'connected_verified');
  assert.equal(result.verification_age_days,1);
  assert.equal(result.provider_calls_performed,false);
  assert.equal(result.database_mutations_performed,false);
  assert.equal(result.listing_changes_performed,false);
});
test('missing and disconnected records never claim verification', () => {
  assert.equal(classifyEtsyConnection(null,null,now).status,'not_connected');
  assert.equal(classifyEtsyConnection({connection_status:'disconnected'},shop,now).status,'disconnected');
});
test('unverified shop and future verification timestamps require review', () => {
  assert.equal(classifyEtsyConnection(connected,{acceptance_status:'unverified'},now).status,'verification_unknown');
  assert.equal(classifyEtsyConnection(connected,{...shop,verified_at:at(3)},now).status,'verification_unknown');
});
test('old verification is flagged without falsely disconnecting the account', () => {
  assert.equal(classifyEtsyConnection(connected,{...shop,verified_at:at(-30)},now).status,'verification_review_due');
});
test('expired refresh takes priority over stored shop verification', () => {
  assert.equal(classifyEtsyConnection({...connected,refresh_expires_at:at(-1)},shop,now).status,'reauthorization_required');
});
test('expired access when refresh may still work is due, not revoked', () => {
  assert.equal(classifyEtsyConnection({...connected,access_expires_at:at(-1)},shop,now).status,'refresh_due');
});
test('SQLite naive timestamps are UTC', () => {
  const result=classifyEtsyConnection(connected,{...shop,verified_at:'2026-10-12 19:00:00'},now);
  assert.equal(result.verification_age_days,1);
});
test('pure summary returns no tokens even if connection row had a secret', () => {
  const result=classifyEtsyConnection({...connected,access_token_ciphertext:'supersecret'},shop,now);
  assert.equal(JSON.stringify(result).includes('supersecret'),false);
});

import { readFileSync } from 'node:fs';
const readSource=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('zero-price review is bounded, admin-only, read-only and never calls an unverified price drift',()=>{
 const s=readSource('functions/api/admin/product-zero-price-review.js');
 assert.match(s,/export async function onRequestGet/);
 assert.doesNotMatch(s,/export async function onRequestPost/);
 assert.match(s,/ORDER BY product_id DESC LIMIT 26/);
 assert.match(s,/drift_confirmed:false/);
 assert.match(s,/valid_zero_price_possible:true/);
 assert.match(s,/price_monitoring_mode:'manual_source_review_only'/);
 assert.match(s,/verified_source_baseline_available:false/);
 assert.match(s,/no_automatic_price_repair:true/);
});
test('admin links to human source review instead of claiming automatic Etsy price drift',()=>{
 const html=readSource('admin/it-integrations/index.html');
 const js=readSource('public/js/admin-product-zero-price-review-v390.js');
 assert.match(html,/\/admin\/products\/#productBrowser390PriceAudit/);
 assert.match(js,/not a confirmed price error/);
 assert.match(js,/a legitimate \$0\.00 price may be correct/);
 assert.doesNotMatch(js,/fetch\([^)]*method\s*:\s*['"]POST/);
});
test('Product Editor still verifies persisted cents and refuses ambiguous automatic retries',()=>{
 const s=readSource('functions/api/admin/product-editor-save.js');
 assert.match(s,/price_cents_confirmed:true/);
 assert.match(s,/code:'product_price_readback_unconfirmed',retry_automatically:false/);
 assert.match(s,/code:'zero_price_not_confirmed'/);
});

import {normalizeSourceReview,sourcePriceOutcome,parseCadInput} from '../functions/api/_lib/priceSourceReview394.mjs';
const required={product_id:9,observed_price_cents:0,approved_price_cents:800,source_type:'prior_approved_catalog',
 source_reference:'CATALOG-APPROVAL-123',request_key:'cafe1234deadbeef0000',operator_confirmed_source:true};
test('only traceable operator-attested original price sources can be recorded',()=>{
 assert.equal(normalizeSourceReview(required)?.approved_price_cents,800);
 assert.equal(normalizeSourceReview({...required,source_reference:''}),null);
 assert.equal(normalizeSourceReview({...required,source_type:'purchase_cost'}),null);
 assert.equal(normalizeSourceReview({...required,operator_confirmed_source:false}),null);
 assert.equal(normalizeSourceReview({...required,approved_price_cents:800.5}),null);
 assert.equal(normalizeSourceReview({...required,request_key:'short'}),null);
});
test('cent parsing never rounds a float or guesses a missing amount',()=>{
 assert.equal(parseCadInput('8'),800);assert.equal(parseCadInput('8.00'),800);
 assert.equal(parseCadInput('8.7'),870);assert.equal(parseCadInput('0.00'),0);
 assert.equal(parseCadInput('8.999'),null);assert.equal(parseCadInput('-1.00'),null);
 assert.equal(parseCadInput('1,500.00'),null);assert.equal(parseCadInput(''),null);
});
test('source discrepancy is a manual review, legitimate zero remains valid',()=>{
 assert.equal(sourcePriceOutcome(0,0),'matches_approved_source');
 assert.equal(sourcePriceOutcome(0,800),'source_discrepancy_requires_manual_review');
 assert.equal(sourcePriceOutcome(800,800),'matches_approved_source');
 assert.equal(sourcePriceOutcome(800,900),'source_discrepancy_requires_manual_review');
 assert.equal(sourcePriceOutcome(800,null),'source_evidence_required');
});
test('audited source receipts are not Product writes or Etsy listings',()=>{
 const api=readSource('functions/api/admin/product-price-source-review.js');
 const ui=readSource('public/js/admin-product-price-source-review-v394.js');
 assert.match(api,/INSERT INTO admin_action_audit/);
 assert.match(api,/price_changed_since_review/);
 assert.match(api,/review_receipt_unconfirmed/);
 assert.match(api,/WHERE NOT EXISTS/);
 assert.match(readSource('functions/api/_lib/priceSourceReview394.mjs'),/operator_confirmed_source!==true/);
 assert.doesNotMatch(api,/UPDATE\s+products|INSERT INTO products|etsy\.com/i);
 assert.match(ui,/submit\.disabled=true/);
 assert.match(ui,/No automatic retry/);
 assert.match(ui,/crypto\.randomUUID/);
});
