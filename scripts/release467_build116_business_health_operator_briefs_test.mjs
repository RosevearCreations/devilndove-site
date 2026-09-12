import assert from 'node:assert/strict';
import { buildBusinessHealthOperatorBriefs, BUSINESS_HEALTH_OPERATOR_BRIEFS_BUILD } from '../functions/api/_lib/businessHealthOperatorBriefs.js';

assert.equal(BUSINESS_HEALTH_OPERATOR_BRIEFS_BUILD,116);
const ready=buildBusinessHealthOperatorBriefs({period_month:'2026-09'},{period_month:'2026-09',packs:[]});
assert.equal(ready.state,'ready');
assert.equal(ready.summary.brief_count,0);
assert.equal(ready.boundaries.server_persistence,false);
assert.equal(ready.boundaries.acknowledgement_persistence,false);
assert.match(ready.combined_markdown,/No Business Health actions are currently queued/);

const packs={period_month:'2026-09',packs:[
  {owner_key:'it',owner_label:'I.T.',href:'/admin/it/',state:'attention',actions:[{key:'it:fk',state:'attention',priority:1,label:'Foreign-key integrity',detail:'Review foreign-key evidence.',href:'/admin/it/',evidence:{foreign_key_violations:2},human_review_required:true}],review_steps:['Open I.T.','Review evidence','Rerun Business Health']},
  {owner_key:'finance',owner_label:'Finance & Accounting',href:'/admin/finance/',state:'blocking',actions:[{key:'finance:duplicate',state:'blocking',priority:0,label:'Duplicate payment reference',detail:'Review duplicate payment reference.',href:'/admin/finance/',evidence:{transaction_reference:'tx-1',amount_cents:1299},human_review_required:true}],review_steps:['Open Finance','Review transaction evidence','Rerun Business Health']}
]};
const result=buildBusinessHealthOperatorBriefs({period_month:'2026-09'},packs);
assert.equal(result.state,'blocked');
assert.equal(result.summary.brief_count,2);
assert.equal(result.summary.action_count,2);
assert.equal(result.review_plan[0].owner_key,'finance');
assert.equal(result.review_plan[0].position,1);
assert.equal(result.briefs[0].owner_label,'Finance & Accounting');
assert.equal(result.briefs[0].top_action.label,'Duplicate payment reference');
assert.ok(result.briefs[0].evidence_fact_count>=2);
assert.match(result.combined_markdown,/Finance & Accounting/);
assert.match(result.combined_markdown,/transaction reference/);
assert.equal(result.boundaries.mutation_capability,'none');
assert.equal(result.boundaries.resolution_persistence,false);
assert.equal(result.boundaries.accounting_posting,false);
assert.equal(result.boundaries.provider_execution,false);
console.log('Release 467 Build 116 Business Health Operator Briefs runtime proof: PASS');
