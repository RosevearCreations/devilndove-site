import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {netContribution679,exceptionSla681} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const core=read('functions/api/admin/social-post-queue.js');
const api=read('functions/api/admin/social-post-queue.js');
const html=read('admin/social-publishing/index.html');
const browser=read('public/js/admin-social-platform-preflight.js');
assert.deepEqual(netContribution679({total_cents:11300,tax_cents:1300,
  verified_ad_cost_cents:1000,verified_operating_cost_cents:4000}),{
  tax_excluded_receipts_cents:10000,verified_ad_cost_cents:1000,verified_operating_cost_cents:4000,
  net_contribution_cents:5000,net_margin_percent:50,
  status:'VERIFIED_SOURCE_BASIS_NOT_AUDITED_FINANCIAL_STATEMENT'});
assert.equal(netContribution679({total_cents:100,tax_cents:110,verified_ad_cost_cents:0,verified_operating_cost_cents:0}),null);
for(const marker of [/PRODUCT_COST_VERIFIER_PUBLIC_KEY/,/crypto\.subtle\.verify/,/source_order_binding_id/,
  /order_settlement_or_refund_changed/,/missing_attributed_paid_orders/,/missing_verified_marketing_spend/,
  /HOLD_INDEPENDENT_MASTER_SIGNER_ENROLLMENT/,/net_campaign_owner_accepted_679/,
  /source_sha256/,/owner_reviewed!==true/])assert.match(core,marker);
assert.match(api,/financial679:await campaignNet679/);
assert.match(api,/verify_product_cost_679/);
assert.match(api,/owner_net_signoff_679/);
assert.match(html,/dd679-net/);
assert.match(browser,/dd679Signoff/);
for(const marker of [/async function finance680/,/stale_or_future_dated_cost_evidence/,/AI_DATA_MASTER_ACK_PUBLIC_KEY/,
  /crypto\.subtle\.verify/,/Master ACK nonce already admitted/,/profit_exception_open_680/,
  /HOLD_INDEPENDENT_RUNTIME_TRANSPORT_AND_MASTER_ADMISSION/,/profitability_certified:false/])
  assert.match(core,marker);
assert.match(api,/financial680:await finance680/);
assert.match(api,/master_ack_680/);
assert.match(api,/owner_profit_exception_680/);
assert.match(html,/dd680-ops/);
assert.match(browser,/dd680Exception/);

for(const marker of [/async function finance681/,/async function ownerExceptionAck681/,
 /ACK_OVERDUE/,/RESOLUTION_OVERDUE/,/PROVISIONAL_OWNER_REVIEW_TARGETS/,
 /SUPERSEDED_OR_SOURCE_MISMATCH/,/SIGNED_AT_INTAKE_RECEIPT_ONLY/,
 /owner_exception_acknowledged_681/,/HOLD_INDEPENDENT_RUNTIME_TRANSPORT_AND_MASTER_ADMISSION/,
 /Audit window incomplete/,/Master ACK nonce already admitted/])assert.match(core,marker);
assert.match(api,/financial681:await finance681/);
assert.match(api,/owner_exception_ack_681/);
assert.match(html,/dd681Open/);
assert.match(html,/dd681History/);
assert.match(browser,/dd681Sla/);

const clock=Date.parse('2026-11-11T12:00:00.000Z');
const incident={reference:'EXCEPTION_681',opened_at:'2026-11-08T06:00:00.000Z',ack_at:null,resolved_at:null};
assert.equal(exceptionSla681(incident,clock).sla,'ACK_AND_RESOLUTION_OVERDUE');
assert.equal(exceptionSla681({...incident,ack_at:'2026-11-08T07:00:00.000Z'},clock).sla,'RESOLUTION_OVERDUE');
assert.equal(exceptionSla681({...incident,resolved_at:'2026-11-08T08:00:00.000Z'},clock).sla,'RESOLVED');
assert.equal(exceptionSla681({...incident,opened_at:'2026-11-11T10:00:00.000Z'},clock).sla,'AWAITING_ACK');
assert.equal(exceptionSla681({...incident,opened_at:'not-a-date'},clock).sla,'HOLD_INVALID_CLOCK');
console.log('BUILD 679–681 source financial, SLA and Master HOLD: PASS');
