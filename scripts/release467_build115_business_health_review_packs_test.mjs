import assert from 'node:assert/strict';
import { buildBusinessHealthActionQueue } from '../functions/api/_lib/businessHealthActionQueue.js';
import { buildBusinessHealthReviewPacks, BUSINESS_HEALTH_REVIEW_PACKS_BUILD } from '../functions/api/_lib/businessHealthReviewPacks.js';

const base=()=>({
  period_month:'2026-09',
  financial_anomalies:{findings:[]},
  month_end_readiness:{score:100,status:'ready',checks:[{key:'bank_reconciled',label:'Bank/reconciliation reviewed',weight:20,pass:true}]},
  profitability:{rows:[{creative_work_project_id:1,project_title:'Healthy project',severity:'ok',status:'healthy_margin',margin_percent:45,project_profit_cents:4500}]},
  it_health:{score:100,status:'green',checks:[{key:'foreign_keys',label:'Foreign-key integrity',weight:20,pass:true}]}
});
assert.equal(BUSINESS_HEALTH_REVIEW_PACKS_BUILD,115);

const readyHealth=base();
const readyQueue=buildBusinessHealthActionQueue(readyHealth);
const ready=buildBusinessHealthReviewPacks(readyHealth,readyQueue);
assert.equal(ready.state,'ready');
assert.equal(ready.summary.pack_count,0);
assert.equal(ready.boundaries.mutation_capability,'none');
assert.equal(ready.boundaries.acknowledgement_persistence,false);
assert.equal(ready.boundaries.period_close,false);

const health=base();
health.financial_anomalies.findings=[{kind:'duplicate_payment_reference',severity:'high',label:'Duplicate payment reference',details:{transaction_reference:'tx-1'}}];
health.month_end_readiness={score:70,status:'review',checks:[{key:'receipts_attached',label:'Receipt/bill support reviewed',weight:15,pass:false}]};
health.profitability.rows=[{creative_work_project_id:9,project_title:'Loss project',severity:'high',status:'loss',reason:'Captured cost exceeds recorded revenue.',margin_percent:-10,project_profit_cents:-500}];
health.it_health={score:60,status:'red',checks:[{key:'foreign_keys',label:'Foreign-key integrity',weight:20,pass:false}]};
const queue=buildBusinessHealthActionQueue(health);
const result=buildBusinessHealthReviewPacks(health,queue);
assert.equal(result.state,'blocked');
assert.equal(result.summary.pack_count,4);
assert.equal(result.summary.action_count,4);
assert.ok(result.packs.some(pack=>pack.owner_key==='finance'&&pack.state==='blocking'));
assert.ok(result.packs.some(pack=>pack.owner_key==='month_end'&&pack.href==='/admin/month-end/'));
assert.ok(result.packs.some(pack=>pack.owner_key==='creator_finance'&&pack.actions[0].human_review_required===true));
assert.ok(result.packs.some(pack=>pack.owner_key==='it'&&pack.review_steps.length===3));
const finance=result.packs.find(pack=>pack.owner_key==='finance');
assert.equal(finance.actions[0].evidence.transaction_reference,'tx-1');
assert.equal(finance.acknowledgement_persistence,false);
assert.equal(finance.mutation_capability,'none');

console.log('Release 467 Build 115 Business Health Review Packs runtime proof: PASS');