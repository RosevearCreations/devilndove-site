import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildSourceReport,validateSourceReport,localRevision,contractPath} from './release467_build666_ai_data_source_report.mjs';

const contract=JSON.parse(readFileSync(new URL('../'+contractPath,import.meta.url),'utf8'));
const rev='f'.repeat(40);
const report=()=>buildSourceReport({revision:rev,now:Date.parse('2026-11-10T06:00:00Z')});
const invalid=mutate=>{const r=structuredClone(report());mutate(r);return validateSourceReport(r,contract)};

test('actual local Git revision can be reported without claiming independent custody',()=>{
  const r=buildSourceReport({revision:localRevision()});
  assert.equal(r.sourceRevision,localRevision());
  assert.equal(r.status,'HOLD_INDEPENDENT_SOURCE_AND_MASTER_APPROVAL');
  assert.equal(r.receipt.sourceSignerEnrolled,false);
  assert.equal(validateSourceReport(r,contract).ok,true);
});

test('read model preserves source identity, audience, and fixed non-publishing scope',()=>{
  const r=report();
  assert.equal(r.sourceId,'devilndove');
  assert.equal(r.sourceRole,'owned_business_shell');
  assert.equal(r.intendedConsumer,'ai-data-platform');
  assert.equal(r.events.enabledFamilies,0);
  assert.equal(r.transport,'OFFLINE_OWNER_REVIEW_NO_EVENT_PUBLISHER');
});

test('stale manifest remains STALE and matching local revision still cannot attest signer',()=>{
  const r=report();
  assert.equal(r.manifest.freshness,'STALE_REVISION');
  assert.ok(invalid(x=>x.manifest.freshness='MATCHES_LOCAL_REVISION_UNATTESTED').errors.includes('manifest_revision_comparison'));
  const matching=buildSourceReport({revision:r.manifest.declaredRevision});
  assert.equal(matching.manifest.freshness,'MATCHES_LOCAL_REVISION_UNATTESTED');
  assert.equal(validateSourceReport(matching,contract).ok,true);
  assert.equal(matching.manifest.independentlySigned,false);
});

test('unsigned local snapshot does not certify denominator or module percentage',()=>{
  assert.ok(invalid(r=>r.readiness.certifiedModuleCompletionPercentage=100).errors.includes('unverified_readiness'));
  assert.ok(invalid(r=>r.readiness.proposedModuleDenominator='APPROVED').errors.includes('unverified_readiness'));
});

test('freshness is evidence-based, and no unverified witness is silently current',()=>{
  const r=report();
  assert.equal(r.readiness.independentlyCurrentEvidence,0);
  assert.ok(r.evidence.length>=6);
  assert.ok(r.evidence.every(e=>e.originalIndependentVerification===false));
  assert.ok(invalid(x=>x.evidence[0].originalIndependentVerification=true).errors.includes('evidence_freshness_hold'));
  assert.ok(invalid(x=>x.evidence[0].freshness='CURRENT').errors.includes('evidence_freshness_hold'));
});

test('fake signed receipt or approved audience never upgrades source report',()=>{
  assert.ok(invalid(r=>r.receipt.state='SIGNED').errors.includes('signed_receipt_hold'));
  assert.ok(invalid(r=>r.receipt.approvedAudienceVerified=true).errors.includes('signed_receipt_hold'));
  assert.ok(invalid(r=>r.readiness.masterConnection='CONNECTED').errors.includes('unverified_readiness'));
});

test('event transport, communications and cross-tenant fields fail closed',()=>{
  assert.ok(invalid(r=>r.events.messagePublishingEnabled=true).errors.includes('event_transport_hold'));
  assert.ok(invalid(r=>r.privacy.otherBusinessTenantDataIncluded=true).errors.includes('privacy_boundary'));
  assert.ok(invalid(r=>r.customer={email:'not-allowed'}).errors.includes('report_field_allowlist'));
});

test('source revision and report fingerprint must be valid exact hashes',()=>{
  assert.throws(()=>buildSourceReport({revision:'unknown'}),/INVALID_SOURCE_REVISION/);
  assert.ok(invalid(r=>r.sourceRevision='main').errors.includes('local_provenance'));
  assert.ok(invalid(r=>r.localEvidenceFingerprint='fake').errors.includes('local_provenance'));
  assert.ok(invalid(r=>r.localEvidenceFingerprint='a'.repeat(64)).errors.includes('local_checksum_mismatch'));
});

test('the contract cannot grant live publisher, signer or certified completion',()=>{
  const changed=structuredClone(contract);changed.event_publishing_enabled=true;
  assert.ok(validateSourceReport(report(),changed).errors.includes('contract_authority'));
  changed.event_publishing_enabled=false;changed.completion_percentage_certified=true;
  assert.ok(validateSourceReport(report(),changed).errors.includes('contract_authority'));
});

test('build fails if source code readiness or provider HOLD register is falsified',()=>{
  const registry=JSON.parse(readFileSync(new URL('../docs/operations/RELEASE_467_BUILD_655_SOURCE_READINESS_REGISTER.json',import.meta.url),'utf8'));
  registry.connection.authenticated=true;
  assert.throws(()=>buildSourceReport({revision:rev,registry}),/SOURCE_EVIDENCE_CONTRACT_FAILED/);
});
