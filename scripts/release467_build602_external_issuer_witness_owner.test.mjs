import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {fixture595} from './release467_build595_source_verification.test.mjs';
import {sourceVerification595} from '../public/js/admin-channel-source-verification-595.mjs';
import {evidenceWorkboard596} from '../public/js/admin-channel-review-workboard-596.mjs';
import {reconcileSource597} from '../public/js/admin-channel-source-disposition-597.mjs';
import {issuerResponseReview598,receiptIntake599,decisionRegister600,
  reconcileEscalations601,FORMAT_602,evidenceCandidate602,localFileDigest602,
  recheckExternalEvidence602,filterExternalEvidence602,unsignedEvidenceHandoff602}
  from '../public/js/admin-channel-issuer-response-598.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {exact594,upstream594,providerRow,ownerRow,asOf}=fixture595;
const s595=[exact594,upstream594,[providerRow,ownerRow]],e595=sourceVerification595(...s595,asOf);
const s596=[e595,s595],e596=evidenceWorkboard596(...s596,[],asOf);
const s597=[e596,s596,[]],e597=reconcileSource597(...s597,[],asOf);
const s598=[e597,s597,[]],e598=issuerResponseReview598(...s598,[],asOf);
const s599=[e598,s598,[]],e599=receiptIntake599(...s599,[],asOf);
const s600=[e599,s599,[]],e600=decisionRegister600(...s600,[],asOf);
const s601=[e600,s600,[]],e601=reconcileEscalations601(...s601,[],asOf);
const provider=e601.cases.find(c=>!c.owner_trial_decision_pending);
const owner=e601.cases.find(c=>c.owner_trial_decision_pending);
const row=c=>({case_pin:c.case_pin,exception_code:c.open_exceptions[0],
  evidence_type:c.owner_trial_decision_pending?'EXACT_OWNER_SIGNED_SCOPE':'ORIGINAL_ISSUER_EVIDENCE',
  source_method:'LOCAL_FILE_SHA256_ONLY',
  next_action:c.owner_trial_decision_pending?'REQUEST_EXACT_OWNER_SIGNED_RECEIPT':
    'REQUEST_ORIGINAL_ISSUER_DECISION',
  original_artifact_ref:'unverified-original-artifact',issuer_identity_ref:c.expected_issuer_ref||'',
  authority_locator_ref:'independent-authority-claim',original_document_sha256:c.source_digest||'',
  custody_receipt_ref:c.expected_custody_ref||'',issuer_decision_ref:'issuer-decision-unverified',
  closure_decision_ref:'',reviewer_ref:'reviewer-602',witness_ref:'witness-602',
  witness_attestation_ref:'',owner_signer_ref:c.owner_trial_decision_pending?
    c.expected_owner_signer_ref||'owner-602':'',owner_signed_receipt_ref:'',
  owner_account:c.owner_trial_decision_pending?c.account_id:'',
  owner_product:c.owner_trial_decision_pending?c.product_ref:'',
  owner_action:c.owner_trial_decision_pending?c.exact_action:'',
  reason:'Original issuer proof, witness attestation and exact owner permission are unverified.',
  observed_at:'2026-11-03T17:00:00Z',witness_attested_at:'',
  recorded_at:'2026-11-03T20:00:00Z',next_review_at:'2026-11-04T21:00:00Z'});
const issuerRow=row(provider),ownerRow602=row(owner);

test('Build 602 exact source, separate witness and owner exception remain HOLD',()=>{
  const p=recheckExternalEvidence602(e601,s601,[],[issuerRow,ownerRow602],
    '2026-11-13T20:00:00Z');
  assert.equal(p.format,FORMAT_602);assert.equal(p.open_cases,2);
  assert.equal(p.issuer_cases,1);assert.equal(p.exact_owner_cases,1);
  assert.equal(p.overdue_cases,2);assert.equal(p.witness_gaps,2);
  for(const key of ['independently_authenticated_issuers','independently_closed_conflicts',
    'authenticated_owner_signatures','authorized_trials','provider_reads','provider_writes',
    'd1_operations'])assert.equal(p[key],0,key);
  const h=unsignedEvidenceHandoff602(p,owner.case_pin);
  assert.equal(h.exact_shop_account,owner.account_id);
  assert.equal(h.exact_product_sku,owner.product_ref);
  assert.equal(h.exact_action,owner.exact_action);
  assert.equal(h.trial_authorized,false);
  assert.equal(h.owner_signature_verified,false);
  assert.ok(h.remaining_blockers.length);
  assert.equal(filterExternalEvidence602(p,'OWNER').length,1);
  assert.equal(filterExternalEvidence602(p,'OVERDUE').length,2);
});
test('Conflicting issuer authority, custody, digest and same-party witness never close exceptions',()=>{
  const p=recheckExternalEvidence602(e601,s601,[],[{...issuerRow,
    issuer_identity_ref:'substituted-issuer',original_document_sha256:'f'.repeat(64),
    custody_receipt_ref:'substituted-custody',issuer_decision_ref:'same-document',
    authority_locator_ref:'same-document',closure_decision_ref:'same-document',
    witness_attestation_ref:'same-document',reviewer_ref:'same-actor',
    witness_ref:'same-actor',witness_attested_at:'2026-11-03T18:00:00Z'}],asOf);
  const r=p.cases.find(c=>!c.owner_trial_decision_pending).latest_external_evidence;
  for(const code of ['ORIGINAL_ISSUER_IDENTITY_SUBSTITUTION','ORIGINAL_DOCUMENT_DIGEST_MISMATCH',
    'CUSTODY_CHAIN_REFERENCE_MISMATCH','SELF_REFERENTIAL_ISSUER_AUTHORITY',
    'CLOSURE_REUSES_DISPUTED_EVIDENCE','WITNESS_ATTESTATION_NOT_SEPARATE_EVIDENCE',
    'REVIEWER_EQUALS_WITNESS'])assert.ok(r.conflicts.includes(code),code);
  assert.equal(r.local_digest_comparison,'ORIGINAL_SOURCE_DIGEST_CONFLICT_OPEN');
  assert.equal(r.original_issuer_authenticated,false);
  assert.equal(r.independent_closure_verified,false);
});
test('Locally computed file hash confirms bytes only; file is neither uploaded nor retained',async()=>{
  const bytes=new TextEncoder().encode('abc');
  const file={size:bytes.byteLength,arrayBuffer:async()=>bytes.buffer};
  assert.equal(await localFileDigest602(file,webcrypto),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  await assert.rejects(()=>localFileDigest602({size:8*1024*1024+1,arrayBuffer:async()=>bytes.buffer},webcrypto));
  await assert.rejects(()=>localFileDigest602({size:2,arrayBuffer:async()=>bytes.buffer},webcrypto));
  for(const bad of [{...issuerRow,trial_authorized:true},
    {...issuerRow,source_method:'AUTHENTICATED'},
    {...issuerRow,original_document_sha256:'bad-hash'},
    {...issuerRow,issuer_decision_ref:'Bearer dangerous-token'},
    {...issuerRow,witness_attested_at:'2026-11-03T16:00:00Z'}])
    assert.throws(()=>evidenceCandidate602(bad));
});
test('Forged upstream Build 601 and wrong exact owner scope fail closed',()=>{
  assert.throws(()=>recheckExternalEvidence602({...e601,build:0},s601,[],[],asOf));
  assert.throws(()=>recheckExternalEvidence602(e601,s601,[],[
    {...ownerRow602,owner_account:'substituted-shop'}],asOf));
  assert.throws(()=>recheckExternalEvidence602(e601,s601,[],[
    {...issuerRow,next_action:'REQUEST_EXACT_OWNER_SIGNED_RECEIPT'}],asOf));
});
test('Build 602 Admin, gated CI, local-only SHA-256 and immutable main marker',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd602Refresh','dd602Metrics','dd602Filter','dd602Search','dd602Rows',
    'dd602Case','dd602Exception','dd602Type','dd602Method','dd602Action',
    'dd602Artifact','dd602Issuer','dd602Authority','dd602Decision','dd602Custody',
    'dd602Closure','dd602File','dd602HashFile','dd602Digest','dd602Observed',
    'dd602Reviewer','dd602Witness','dd602WitnessProof','dd602WitnessAt',
    'dd602Signer','dd602OwnerReceipt','dd602Account','dd602Product','dd602Scope',
    'dd602Due','dd602Reason','dd602Ack','dd602Save','dd602Copy','dd602Status',
    'dd602Output','dd602Prepare','dd602CopyHandoff','dd602Handoff'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build (?:602|603)/);
  assert.match(html,/admin-channel-issuer-response-598\.mjs\?v=(?:602|603)/);
  const js=read('public/js/admin-channel-issuer-response-598.mjs');
  assert.match(js,/export const FORMAT_602=/);
  assert.match(js,/cryptoApi\.subtle\.digest\('SHA-256'/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build602_external_issuer_witness_owner\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":60[23]/);
});
