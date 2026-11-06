import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TEST_FILES_610,BUDGET_610,workerCapacity612} from
 './release467_build610_evidence_budget.mjs';
import {STAGES_612,profileGraph612} from
 './release467_build612_source_graph_cpu.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const original=()=>({
 schema:'devilndove-build610-exact-source-test-budget-v1',
 source_sha:'a'.repeat(40),all_passed:true,complete:true,failures:0,
 tested_files:14,executed_files:14,elapsed_ms:2000,
 available_cpu_cores:4,max_concurrent:3,
 hard_per_file_ms:240000,hard_total_ms:420000,
 cpu_load_1m_start:0.5,cpu_load_1m_end:1,
 results:TEST_FILES_610.map(file=>({file,passed:true,duration_ms:300,
  timed_out:false,output_truncated:false,exit_code:0}))
});
test('Build 612 source function chain and independent exact test import graph stay complete',()=>{
 const profile=profileGraph612(original());
 assert.equal(profile.source_stages.length,8);
 assert.equal(profile.source_edges.length,7);
 assert.equal(profile.test_nodes.length,14);
 assert.equal(profile.files_executed,14);
 assert.equal(profile.all_test_files_passed,true);
 assert.equal(profile.effective_workers,3);
 assert.equal(profile.cpu_slots_available,4);
 assert.equal(profile.cpu_slots_reserved,1);
 assert.equal(profile.observed_overlap_factor,2.1);
 assert.equal(profile.cpu_contention_warning,false);
 assert.equal(profile.authorization,
  'HOLD_ORIGINAL_ISSUER_INDEPENDENT_WITNESS_EXACT_SIGNED_OWNER');
 for(const stage of STAGES_612){
  const seen=profile.source_stages.find(x=>x.build===stage.build);
  assert.equal(seen?.exact_prior,stage.prior);
 }
 assert.deepEqual(profile.test_nodes.map(n=>n.build),
  Array.from({length:14},(_,i)=>595+i));
});
test('CPU guard refuses oversubscription and reserves available execution capacity',()=>{
 assert.equal(workerCapacity612(1),1);
 assert.equal(workerCapacity612(2),1);
 assert.equal(workerCapacity612(3),2);
 assert.equal(workerCapacity612(4),3);
 assert.equal(workerCapacity612(64),3);
 for(const invalid of [0,-1,NaN,1.5,5000])
  assert.throws(()=>workerCapacity612(invalid));
 assert.throws(()=>workerCapacity612(4,5));
 for(const r of [
  {...original(),available_cpu_cores:2,max_concurrent:3},
  {...original(),available_cpu_cores:4,max_concurrent:4},
  {...original(),available_cpu_cores:0},
  {...original(),hard_per_file_ms:0},
 ])assert.throws(()=>profileGraph612(r));
});
test('cannot report a green release for missing, repeated, failed or substituted suite',()=>{
 const g=original();
 for(const r of [
 {...g,all_passed:false},
 {...g,complete:false},
 {...g,failures:1},
 {...g,results:g.results.slice(1)},
 {...g,results:[g.results[0],...g.results.slice(0,13)]},
 {...g,results:g.results.map((x,i)=>i===3?{...x,passed:false}:x)},
 {...g,results:g.results.map((x,i)=>i===3?{...x,file:'scripts/forged.test.mjs'}:x)},
 {...g,results:g.results.map((x,i)=>i===3?{...x,timed_out:true}:x)},
 {...g,results:g.results.map((x,i)=>i===3?{...x,output_truncated:true}:x)},
 {...g,results:g.results.map((x,i)=>i===3?{...x,exit_code:1}:x)},
 {...g,elapsed_ms:100},
 {...g,cpu_load_1m_start:NaN}
 ])assert.throws(()=>profileGraph612(r));
});
test('Build 612 stays inside existing mandatory Quality and independent Production gates',()=>{
 const quality=read('.github/workflows/current-application-quality.yml');
 assert.match(quality,/node --test scripts\/release467_build612_source_graph_cpu.test.mjs/);
 assert.match(quality,/node scripts\/release467_build612_source_graph_cpu.mjs/);
 assert.match(quality,/node scripts\/release467_build610_evidence_budget.mjs/);
 assert.match(quality,/node scripts\/release467_build609_ci_bundle.mjs/);
 assert.match(quality,/Build 611 evidence fixture reuse/);
 assert.match(quality,/Build 610 read-only promotion queue SLA measurements/);
 assert.match(quality,/build612-source-graph-cpu-guard.json/);
 const production=read('.github/workflows/production-pages-deploy-current.yml');
 assert.match(production,/"build":6\d{2}/);
 const proof=read('.github/workflows/production-live-resource-integrity-proof.yml');
 assert.match(proof,/workflow_run:/);
 assert.match(proof,/zero-D1/);
 assert.match(read('admin/channel-trials/index.html'),/Build 6\d{2}/);
 assert.equal(BUDGET_610.max_concurrent,3);
});
