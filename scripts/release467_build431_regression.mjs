// Build 431: deterministic, no-network exact SHA release dashboard regression.
import assert from 'node:assert/strict';
import {classifyRuns431,summarizeGate431,SHA_431,RELEASE_PROOFS_431} from '../functions/api/_lib/releaseGate431.mjs';
const SHA='a'.repeat(40);
const pass={id:10,head_sha:SHA,head_branch:'dev',status:'completed',conclusion:'success',
  html_url:'https://github.com/RosevearCreations/devilndove-site/actions/runs/10',updated_at:'2026-10-21T10:00:00Z'};
assert.equal(SHA_431.test(SHA),true);
assert.equal(RELEASE_PROOFS_431.length,4);
const green=classifyRuns431({workflow_runs:[pass]},SHA,'dev');
assert.equal(green.status,'GREEN');assert.equal(green.run_id,10);
assert.equal(classifyRuns431({workflow_runs:[{...pass,head_sha:'b'.repeat(40)}]},SHA,'dev').status,'MISSING');
assert.equal(classifyRuns431({workflow_runs:[{...pass,head_branch:'main'}]},SHA,'dev').status,'MISSING');
assert.equal(classifyRuns431({workflow_runs:[{...pass,status:'in_progress',conclusion:null}]},SHA,'dev').status,'PENDING');
assert.equal(classifyRuns431({workflow_runs:[{...pass,conclusion:'failure'}]},SHA,'dev').status,'FAILED');
assert.equal(classifyRuns431(null,SHA,'dev').status,'UNKNOWN');
assert.equal(classifyRuns431({workflow_runs:[{...pass,html_url:'javascript:alert(1)'}]},SHA,'dev').run_url,null);
const checks=RELEASE_PROOFS_431.map(x=>({...x,status:'GREEN'}));
const summary=summarizeGate431({dev_sha:SHA,main_sha:SHA,checks,production:{status:'GREEN'}});
assert.equal(summary.status,'LIVE_VERSION_REQUIRED');
assert.equal(summary.production_green,false);
assert.equal(summarizeGate431({dev_sha:SHA,main_sha:'b'.repeat(40),checks,production:{status:'GREEN'}}).status,'NOT_ON_MAIN');
assert.equal(summarizeGate431({dev_sha:SHA,main_sha:SHA,checks:[...checks.slice(0,3),{status:'UNKNOWN'}],production:{status:'GREEN'}}).status,'DEVELOPMENT_HOLD');
console.log('Build 431 exact-SHA gate and fail-closed dashboard regression: PASS');
