import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceReplayProfile611}
 from './release467_build611_replay_profile.mjs';

const stage=n=>({file:'scripts/release467_build'+n+'_test.test.mjs',
 passed:true,duration_ms:Math.max(1,(n===601?14000:6000)),tests:5,
 timed_out:false,exit_code:0});
const good=()=>({
 schema:'devilndove-build610-exact-source-test-budget-v1',
 source_sha:'a'.repeat(40),tested_files:14,executed_files:14,
 elapsed_ms:22000,all_passed:true,failures:0,
 results:Array.from({length:14},(_,n)=>stage(n+595))
});
test('Build 611 profiling derives measured times from complete real test report',()=>{
 const p=sourceReplayProfile611(good());
 assert.equal(p.stage_profiles.length,8);
 assert.equal(p.all_tests_passed,true);
 assert.equal(p.baseline_replay_ms,133000);
 assert.equal(p.current_replay_ms,22000);
 assert.ok(p.replay_speedup_percent>0);
 assert.ok(p.remaining_hotspots.some(s=>s.build===601));
 assert.equal(p.release_authority,'UNCHANGED_PROTECTED_GATES_EXTERNAL_PROVIDER_OWNER_HOLD');
});
test('Build 611 profiler refuses missing, spoofed or failed evidence',()=>{
 for(const r of [
 {...good(),all_passed:false},
 {...good(),tested_files:13},
 {...good(),results:good().results.slice(1)},
 {...good(),results:good().results.map((r,i)=>i===7?{...r,passed:false}:r)},
 {...good(),elapsed_ms:NaN},
 {...good(),schema:'invented-release-pass'},
 ]) assert.throws(()=>sourceReplayProfile611(r));
});
