import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarizeAftercarePortfolio480} from '../public/js/maker-aftercare-portfolio-policy-480.mjs';
const receipt=(evidence_id,order_id,month,state)=>({evidence_id,order_id,event_kind:'aftercare_followup',created_at:`${month}-12 13:00:00`,review_note:`Actual manual observation. Build 479 outstanding review; owner #34; audit #33; source hold #31; follow-up #32; case=sample-case-480; evidence=original-reference-480; state=${state}; case remains open, no external action.`});
test('Build 480 calculates bounded counts, latest case disposition and sampled UTC trend',()=>{
 const rows=[receipt(201,70,'2026-10','awaiting_owner_action'),receipt(200,70,'2026-09','evidence_still_missing'),receipt(199,71,'2026-09','awaiting_external_decision'),{evidence_id:198,order_id:71,event_kind:'aftercare_followup',review_note:'Legacy unclassified note',created_at:'2026-09-11 00:00:00'}];
 const p=summarizeAftercarePortfolio480(rows,{sampleLimit:250,hasMore:true});
 assert.equal(p.sampled_receipts,4);assert.equal(p.recognized_receipts,3);assert.equal(p.unclassified_receipts,1);
 assert.equal(p.distinct_orders_in_sample,2);assert.equal(p.states.awaiting_owner_action,1);assert.equal(p.states.evidence_still_missing,0);
 assert.deepEqual(p.trend,[{month:'2026-09',count:2},{month:'2026-10',count:1}]);
 assert.equal(p.history_incomplete,true);assert.equal(p.case_closure_verified,false);assert.equal(p.customer_consent_verified,false);
 assert.equal(p.cases[0].order_id,70);assert.equal(p.cases[0].evidence_id,201);
 assert.equal(JSON.stringify(p).includes('original-reference-480'),false);
});
test('Build 480 holds malformed receipts and refuses false totals or case closure claims',()=>{
 const invalid=[receipt(100,1,'2026-10','closed'),receipt(99,2,'2026-10','awaiting_owner_action'),receipt(0,3,'2026-10','awaiting_owner_action')];
 invalid[1].event_kind='damage_hold';
 const p=summarizeAftercarePortfolio480(invalid,{sampleLimit:2,hasMore:true});
 assert.equal(p.sampled_receipts,2);assert.equal(p.recognized_receipts,0);assert.equal(p.unclassified_receipts,2);
 assert.equal(p.bounded_sample,true);assert.equal(p.history_incomplete,true);assert.equal(p.distinct_orders_in_sample,0);
});
test('Build 480 Admin-only read-only portfolio never fetches customer PII or triggers external work',()=>{
 const api=readFileSync(new URL('../functions/api/admin/maker-aftercare-portfolio.js',import.meta.url),'utf8');
 const page=readFileSync(new URL('../admin/maker-fulfillment-pilot/index.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/js/admin-maker-fulfillment-pilot-464.js',import.meta.url),'utf8');
 assert.match(api,/getAdminUserFromRequest/);assert.match(api,/Admin sign-in required/);
 assert.match(api,/LIMIT 251/);assert.match(api,/read_only:true/);
 assert.doesNotMatch(api,/customer_email|shipping_address|customer_phone|\.run\(\)|INSERT INTO|UPDATE maker_order/);
 for(const id of ['fpPortfolioLoad','fpPortfolioStatus','fpPortfolioSummary','fpPortfolioTrend','fpPortfolioCases'])assert.match(page,new RegExp(`id="${id}"`));
 assert.match(page,/467b48[01234]/);assert.match(ui,/maker-aftercare-portfolio/);
 assert.doesNotMatch(ui,/setInterval|setTimeout\(/);
});
