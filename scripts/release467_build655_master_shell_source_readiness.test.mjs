import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {freshnessOf,readSourceRegister,validateReadiness} from './release467_build655_master_shell_source_readiness.mjs';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const data=readSourceRegister();
const manifest=JSON.parse(readFileSync(resolve(root,'.well-known/rosevear-integration-manifest.json'),'utf8'));
const validated=d=>validateReadiness(d,{manifest,checkPaths:true});
const corrupt=(mutator)=>{const copy=structuredClone(data);mutator(copy);return validated(copy);};

test('Build 655 source register is deterministic, matches actual source paths and holds all private authority',()=>{
  const r=validated(data);
  assert.deepEqual(r.errors,[]);
  assert.equal(r.sourceId,'devilndove');
  assert.equal(r.registration,'NOT_ENROLLED');
  assert.equal(r.connection,'DISCONNECTED / HOLD');
  assert.equal(r.registeredV1Record,false);
  assert.ok(r.registryFields.held>=9);
  assert.equal(r.independentCurrentEvidence,0);
  assert.equal(r.eventFamilies.proposed,8);
  assert.equal(r.eventFamilies.enabled,0);
});

test('Build 655 cannot turn registry preparation into a source-signed enrolled identity',()=>{
  const r=corrupt(d=>{d.connection.authenticated=true;d.connection.eventPublishingEnabled=true;
    d.connection.state='CONNECTED';d.registryFieldReadiness.find(x=>x.field==='status').value='CONNECTED';});
  assert.ok(r.errors.some(e=>e.includes('authority')||e.includes('transport')));
  assert.ok(r.errors.some(e=>e.includes('cannot claim CONNECTED')));
});

test('Build 655 rejects invented signer, origin, roles and source acceptance without original evidence',()=>{
  const r=corrupt(d=>{
    for(const k of ['signerKeyId','signerFingerprint','approvedOrigin','rolesAllowed']){
      const f=d.registryFieldReadiness.find(x=>x.field===k);f.value='fabricated';f.state='SOURCE_OBSERVED';f.evidence='docs/operations/RELEASE_467_BUILD_654_MASTER_SHELL_ASSESSMENT.md';
    }
  });
  assert.ok(r.errors.filter(e=>e.includes('must stay HOLD')).length>=4);
});

test('Build 655 rejects source ID, shell ID, tenancy and manifest divergence',()=>{
  const r=corrupt(d=>{d.source.sourceId='devil-n-dove-child';d.source.shellId='another-company';
    d.source.tenancyModel='platform-shell-with-child-tenants';});
  assert.ok(r.errors.some(e=>e.includes('exact Devil n Dove source/shell ID')));
  assert.ok(r.errors.some(e=>e.includes('tenancy')));
});

test('Build 655 rejects duplicated or omitted registry fields and false acceptance clock',()=>{
  const r=corrupt(d=>{d.registryFieldReadiness.push({...d.registryFieldReadiness[0]});
    d.registryFieldReadiness.find(x=>x.field==='statusObservedAt').value='2099-01-01T00:00:00.000Z';});
  assert.ok(r.errors.some(e=>e.includes('exact count')));
  assert.ok(r.errors.some(e=>e.includes('duplicate')));
  assert.ok(r.errors.some(e=>e.includes('held field must have null value')));
});

test('Build 655 freshness is explicitly held without independent proof, stale past TTL, and future-dated proof rejected',()=>{
  const now=Date.parse('2026-11-09T02:00:00.000Z');
  const item={maxAgeHours:1,verificationState:'SOURCE_OBSERVED',independentlyVerifiedAt:null};
  assert.equal(freshnessOf(item,now),'NO_CURRENT_INDEPENDENT_EVIDENCE');
  item.independentlyVerifiedAt='2026-11-09T01:45:00.000Z';
  assert.equal(freshnessOf(item,now),'NO_CURRENT_INDEPENDENT_EVIDENCE');
  item.verificationState='INDEPENDENTLY_VERIFIED';
  assert.equal(freshnessOf(item,now),'CURRENT');
  item.independentlyVerifiedAt='2026-11-08T23:00:00.000Z';
  assert.equal(freshnessOf(item,now),'STALE');
  item.independentlyVerifiedAt='2026-11-09T02:00:09.000Z';
  assert.equal(freshnessOf(item,now),'INVALID_OR_FUTURE_EVIDENCE');
});

test('Build 655 rejects dishonest evidence freshness and missing source custody',()=>{
  const r=corrupt(d=>{d.evidenceOwnership[0].independentlyVerifiedAt='2026-11-09T02:00:00.000Z';
    d.evidenceOwnership[1].custodian='';d.evidenceOwnership[2].evidence='not/a/real/source.mjs';});
  assert.ok(r.errors.some(e=>e.includes('cannot carry independent timestamp')));
  assert.ok(r.errors.some(e=>e.includes('source custodian')));
  assert.ok(r.errors.some(e=>e.includes('missing evidence source path')));
});

test('Build 655 proposed V1 event families remain held, audience scoped, and customer fields excluded',()=>{
  const r=corrupt(d=>{const p=d.eventProposals.find(x=>x.eventType==='workflow.status.changed');
    p.state='ACTIVE';p.audience.push('devilndove-child');p.payloadAllowlist.push('customerEmail');});
  assert.ok(r.errors.some(e=>e.includes('remain held')));
  assert.ok(r.errors.some(e=>e.includes('audience')));
  assert.ok(r.errors.some(e=>e.includes('redacted')));
});

test('Build 655 checks all AI Data V1 families and denies unapproved invented contracts',()=>{
  const r=corrupt(d=>{d.eventProposals[0].eventType='inventory.adjusted';
    d.referenceContract.approvedForDevilNDovePublication=true;});
  assert.ok(r.errors.some(e=>e.includes('unknown or duplicate proposed V1 event type')));
  assert.ok(r.errors.some(e=>e.includes('reference V1 contract is not a live source grant')));
});

test('Build 655 preserves the provisional Build 652 baseline and previous guarded handlers',()=>{
  const baseline=readFileSync(resolve(root,'docs/operations/RELEASE_467_BUILD_652_MODULE_READINESS_BASELINE.md'),'utf8');
  assert.match(baseline,/provisional engineering estimates/i);
  assert.equal(data.evidenceOwnership.find(x=>x.id==='module.requirements.acceptance').verificationState,'PROVISIONAL');
  assert.equal(data.connection.oneUsePrivateTestVerified,false);
  assert.ok(data.source.existingQl364Handler.endsWith('/ql364-source-health.mjs'));
  const script=readFileSync(resolve(root,'scripts/release467_build655_master_shell_source_readiness.mjs'),'utf8');
  assert.doesNotMatch(script,/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/);
});
