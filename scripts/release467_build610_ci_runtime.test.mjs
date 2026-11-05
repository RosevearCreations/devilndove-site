import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {auditInventory610,TEST_FILES_610,BUDGET_610}
 from './release467_build610_evidence_budget.mjs';
import {summarizeQueue610}
 from './release467_build610_promotion_sla.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Build 610 retains all 595–608 exact historical source tests and protected quality gate',()=>{
 assert.deepEqual(auditInventory610(),{files:14,concurrency:3});
 assert.equal(new Set(TEST_FILES_610).size,14);
 assert.equal(BUDGET_610.per_file_hard_ms,240000);
 assert.ok(BUDGET_610.total_hard_ms>BUDGET_610.soft_total_ms);
 const quality=read('.github/workflows/current-application-quality.yml');
 for(const p of TEST_FILES_610)assert.ok(quality.includes('node --check '+p),p);
 assert.match(quality,/node scripts\/release467_build610_evidence_budget\.mjs/);
 assert.match(quality,/node scripts\/release467_build609_ci_bundle\.mjs/);
 assert.match(quality,/node scripts\/release467_build610_promotion_sla\.mjs --collect/);
 assert.match(quality,/Build 610 exact Build 595/);
});
test('Build 610 never weakens mandatory independent production or dev controls',()=>{
 const gate=['system-gate','it-admin-runtime-proof','repository-branch-hygiene'];
 for(const name of gate)assert.match(read('.github/workflows/'+name+'.yml'),/push:/);
 const prod=read('.github/workflows/production-pages-deploy-current.yml');
 assert.match(prod,/"build":610/);
 assert.match(prod,/python scripts\/main_promotion_gate\.py/);
 assert.match(prod,/Production D1 migrations|zero-D1|ZERO remote D1/i);
 const live=read('.github/workflows/production-live-resource-integrity-proof.yml');
 assert.match(live,/workflow_run:/);
 assert.match(live,/Enforce zero-D1 post-deploy proof boundary/);
 const bundle=read('scripts/release467_build609_ci_bundle.mjs');
 assert.match(bundle,/workflow_dispatch/);
 assert.match(bundle,/devilndove|legacy proof/i);
});
test('queue SLO uses original numeric sources, not made-up GREEN statuses',()=>{
 const r=summarizeQueue610([
  {workflow:'Current Application Quality Proof',branch:'dev',
    queued_s:20,runtime_s:348,run_id:1},
  {workflow:'System Gate',branch:'dev',queued_s:135,runtime_s:120,run_id:2},
  {workflow:'Production Pages Deploy',branch:'main',queued_s:4,
    runtime_s:52,run_id:3}
 ]);
 assert.equal(r.summary.observed_runs,3);
 assert.equal(r.summary.queue_slo_warnings,1);
 assert.equal(r.summary.runtime_slo_warnings,1);
 assert.equal(r.summary.p95_queue_wait_s,135);
 assert.throws(()=>summarizeQueue610([{workflow:'Forged Green',
   queued_s:0,runtime_s:0}]));
 assert.throws(()=>summarizeQueue610([{workflow:'System Gate',
   queued_s:-1,runtime_s:0}]));
 assert.throws(()=>summarizeQueue610([{workflow:'System Gate',
   queued_s:'0',runtime_s:0}]));
});
test('live report is source-specific and historical owner authorization remains HOLD',()=>{
 const quality=read('.github/workflows/current-application-quality.yml');
 assert.match(quality,/actions: read/);
 assert.match(quality,/actions\/upload-artifact@v4/);
 const code=read('scripts/release467_build610_promotion_sla.mjs');
 assert.match(code,/method:'GET'/);
 assert.doesNotMatch(code,/method:'POST'|method:'DELETE'|method:'PATCH'/);
 const page=read('admin/channel-trials/index.html');
 assert.match(page,/Build 608/);
 assert.match(page,/unverified|HOLD/i);
});
