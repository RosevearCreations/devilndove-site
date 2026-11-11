import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {campaignReturn678} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const backend=read('functions/api/admin/social-post-queue.js');
const api=read('functions/api/admin/social-post-queue.js');
const ui=read('public/js/admin-social-platform-preflight.js');
const html=read('admin/social-publishing/index.html');
assert.deepEqual(campaignReturn678(25000,5000),{
 attributed_sales_cents:25000,verified_ad_cost_cents:5000,marketing_contribution_cents:20000,
 marketing_roi_percent:400,basis:'gross_order_receipts_before_product_costs_shipping_taxes_and_overheads'});
assert.equal(campaignReturn678(1000,0),null);
assert.equal(campaignReturn678(-100,500),null);
assert.match(backend,/crypto\.subtle\.verify/);
assert.match(backend,/MARKETING_EXPENSE_VERIFIER_PUBLIC_KEY/);
assert.match(backend,/independent_expense_verified/);
assert.match(backend,/original_document_sha256/);
assert.match(backend,/source_cost_attempt_id/);
assert.match(backend,/order_settlement_changed/);
assert.match(backend,/profitability_status:'HOLD_PRODUCT_COSTS_TAXES_AND_OVERHEADS'/);
assert.match(backend,/confirm_gross_basis!==true/);
assert.match(api,/expense_attestation_678/);
assert.match(api,/owner_marketing_signoff_678/);
assert.match(api,/financial678:await financialSummary678/);
assert.match(ui,/dd678Signoff/);
assert.match(html,/dd678-finance/);
console.log('BUILD 678 independent signed expense / marketing ROI HOLD contract: PASS');
