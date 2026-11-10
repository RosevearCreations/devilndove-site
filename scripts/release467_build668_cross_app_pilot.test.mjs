import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSourceReport} from './release467_build666_ai_data_source_report.mjs';
import {readPilotContract,validatePilotContract,buildCrossAppPilot,
  validatePilotResult} from './release467_build668_cross_app_pilot.mjs';

const revision='e'.repeat(40);
const sourceReport=buildSourceReport({revision});
const pilot=()=>buildCrossAppPilot({sourceReport});

test('exact six QL365D source IDs, handlers and roles are unique and tenant-safe',()=>{
  const c=readPilotContract();
  assert.deepEqual(validatePilotContract(c),{ok:true,errors:[]});
  assert.deepEqual(c.sources.map(x=>x.id),[
    'yw','icamp','rosiedazzlers','devilndove','ai-data-platform','rosevear-ai-hub']);
  assert.equal(c.sources.find(x=>x.id==='yw').role,'platform_shell');
  assert.equal(c.sources.find(x=>x.id==='icamp').role,'platform_shell');
});

test('local only pilot refuses pretending other source apps are connected',async()=>{
  const r=await pilot();
  assert.equal(r.sources.length,6);
  assert.equal(r.sources.filter(x=>x.sourceCodeObservedHere).length,1);
  assert.ok(r.sources.every(x=>x.status==='HOLD_NO_INDEPENDENT_FIELD_ACCEPTANCE'));
  assert.equal(r.transport.peerNetworkCalls,0);
});

test('negative method and child impersonation checks exercise actual source handler',async()=>{
  const r=await pilot();
  assert.equal(r.negativeProbes.methodDenied,true);
  assert.equal(r.negativeProbes.childImpersonationDenied,true);
  assert.equal(r.negativeProbes.unsignedGetHeld,true);
  assert.equal(r.authority.masterConnected,false);
});

test('bad recovery target is rejected without running HEAD or restoring data',async()=>{
  const r=await pilot();
  assert.equal(r.negativeProbes.unsafeRecoveryUrlDenied,true);
  assert.equal(r.recovery.recoveryProbeIsRestore,false);
  assert.equal(r.recovery.productionRestoreExecuted,false);
  assert.equal(r.transport.httpProviderCalls,0);
});

test('original D1/R2 snapshot, independent witness and rollback remain HOLD',async()=>{
  const r=await pilot();
  assert.match(r.recovery.d1BackupReceipt,/UNKNOWN/);
  assert.match(r.recovery.r2BackupReceipt,/UNKNOWN/);
  assert.match(r.recovery.isolatedRestore,/HOLD/);
  assert.match(r.recovery.rollback,/HOLD/);
  assert.equal(r.authority.originalSourceSignerEnrolled,false);
});

test('source code report detects stale manifest and never upgrades live trust',async()=>{
  const r=await pilot();
  assert.equal(r.originalManifestFreshness,'STALE_REVISION');
  assert.equal(r.status,'HOLD_NO_ORIGINAL_CROSS_APP_ACCEPTANCE_OR_RECOVERY');
  assert.equal(validatePilotResult(r).ok,true);
});

test('falsified independent connection receipt is rejected by pilot read-model',async()=>{
  const r=await pilot();r.sources[1].independentlyVerifiedLiveConnection=true;
  assert.ok(validatePilotResult(r).errors.includes('unverified_six_sources'));
  r.sources[1].independentlyVerifiedLiveConnection=false;
  r.authority.signedQl365dTestVerified=true;
  assert.ok(validatePilotResult(r).errors.includes('owner_authority'));
});

test('simulated recovery success cannot replace original restore receipt',async()=>{
  const r=await pilot();r.recovery.productionRestoreExecuted=true;
  assert.ok(validatePilotResult(r).errors.includes('recovery_holds'));
  r.recovery.productionRestoreExecuted=false;r.recovery.isolatedRestore='PASS';
  assert.ok(validatePilotResult(r).errors.includes('recovery_holds'));
});

test('customer, cross-tenant and device data never leave the source pilot',async()=>{
  const r=await pilot();
  assert.equal(r.transport.customerDataIncluded,false);
  assert.equal(r.transport.deviceCommandsEnabled,false);
  assert.equal(r.authority.crossTenantAccessEnabled,false);
  r.transport.customerDataIncluded=true;
  assert.ok(validatePilotResult(r).errors.includes('no_external_transport'));
});

test('owner and platform role changes are rejected without creating tenant identity',()=>{
  const c=structuredClone(readPilotContract());
  c.sources[0].id='rosevear-landscaping';
  assert.ok(validatePilotContract(c).errors.includes('six_source_identities'));
  c.sources[0].id='yw';c.sources[1].role='camp-rosevear';
  assert.ok(validatePilotContract(c).errors.includes('six_source_identities'));
});

test('original owner approval switches cannot be set true by a code-only pilot',()=>{
  for(const key of ['owner_issuer_verified','independent_witness_verified',
    'source_signer_enrolled','durable_one_use_nonce_verified',
    'comms_audience_granted','ai_data_audience_granted',
    'backup_snapshot_independently_verified','isolated_restore_witnessed']){
    const c=structuredClone(readPilotContract());c[key]=true;
    assert.ok(validatePilotContract(c).errors.includes('unverified_'+key),key);
  }
});

test('handoff evidence maps pass only local negatives and leaves external checks HOLD',async()=>{
  const r=await pilot();
  assert.equal(r.checks.length,13);
  assert.equal(r.checks.find(x=>x.checkId==='owner_signer_receipt').result,
    'HOLD_ORIGINAL_OWNER_FIELD_PROOF');
  assert.equal(r.checks.find(x=>x.checkId==='child_tenant_denial').result,
    'PASS_LOCAL_NEGATIVE_ONLY');
  assert.equal(r.checks.find(x=>x.checkId==='external_peers_not_impersonated').result,
    'PASS_NO_PEER_PROBES');
});

test('renamed probes cannot impersonate the original source access denials',async()=>{
  const r=await pilot();
  delete r.negativeProbes.unsignedGetHeld;
  r.negativeProbes.unrelatedCheck=true;
  assert.ok(validatePilotResult(r).errors.includes('negative_probes'));
});
