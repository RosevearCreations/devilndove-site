import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {netContribution679} from '../functions/api/admin/social-post-queue.js';
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
console.log('BUILD 679 independent cost, source net and Master HOLD contract: PASS');
