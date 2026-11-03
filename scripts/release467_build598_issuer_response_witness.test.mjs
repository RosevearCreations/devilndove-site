import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture595} from './release467_build595_source_verification.test.mjs';
import {sourceVerification595} from '../public/js/admin-channel-source-verification-595.mjs';
import {evidenceWorkboard596} from '../public/js/admin-channel-review-workboard-596.mjs';
import {reconcileSource597} from '../public/js/admin-channel-source-disposition-597.mjs';
import {FORMAT_598,issuerResponseCandidate598,issuerResponseReview598,
  filterIssuerCases598,unsignedOwnerWitnessReadiness598} from
  '../public/js/admin-channel-issuer-response-598.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {exact594,upstream594,providerRow,ownerRow,asOf}=fixture595;
const source595=[exact594,upstream594,[providerRow,ownerRow]];
const exact595=sourceVerification595(...source595,asOf);
const source596=[exact595,source595];
const exact596=evidenceWorkboard596(...source596,[],asOf);
const source597=[exact596,source596,[]];
const prior597=reconcileSource597(...source597,[],asOf);
const provider=prior597.cases.find(x=>!x.owner_trial_decision_pending);
const owner=prior597.cases.find(x=>x.owner_trial_decision_pending);
const make=c=>({case_pin:c.case_pin,exception_code:c.unresolved_exceptions[0],
  review_kind:c.owner_trial_decision_pending?'OWNER_WITNESS_REVIEW':'ISSUER_RESPONSE_REVIEW',
  review_state:c.owner_trial_decision_pending?'OWNER_SIGNATURE_WITNESS_PENDING':
    'RESPONSE_RECEIVED_UNAUTHENTICATED',
  issuer_response_ref:'issuer-original-reply-request-598',issuer_identity_ref:c.expected_issuer_ref||'',
  reply_document_sha256:c.source_digest||'',custody_receipt_ref:c.expected_custody_ref||'',
  original_attestation_ref:'separate-issuer-source-598',
  independent_reviewer_ref:'reviewer-598',independent_witness_ref:'witness-598',
  owner_signer_ref:c.owner_trial_decision_pending?c.expected_owner_signer_ref||'signer-598':'',
  owner_signed_receipt_ref:'',owner_document_sha256:'',
  owner_account:c.owner_trial_decision_pending?c.account_id:'',
  owner_product:c.owner_trial_decision_pending?c.product_ref:'',
  owner_action:c.owner_trial_decision_pending?c.exact_action:'',
  reason:'Independent original issuer and exact signed owner authorization have not yet been authenticated.',
  recorded_at:'2026-11-03T18:45:00Z',next_review_at:'2026-11-04T19:00:00Z'});
const issuer=make(provider),signer=make(owner);
test('issuer response and exact owner witness review remain independently unverified and zero-write',()=>{
  const p=issuerResponseReview598(prior597,source597,[],[issuer,signer],'2026-11-13T18:00:00Z');
  assert.equal(p.format,FORMAT_598);assert.equal(p.open_cases,2);
  assert.equal(p.issuer_response_cases,1);assert.equal(p.owner_witness_cases,1);
  assert.equal(p.independently_authenticated_issuer_responses,0);
  assert.equal(p.independently_closed_conflicts,0);assert.equal(p.verified_owner_trial_signatures,0);
  assert.equal(p.authorized_trials,0);assert.equal(p.provider_reads,0);
  assert.equal(p.provider_writes,0);assert.equal(p.d1_operations,0);
  assert.ok(p.cases.every(x=>x.unresolved_exceptions.length>0&&!x.conflict_closed));
});
test('matching original issuer digest is a local byte comparison, not authentication',()=>{
  const p=issuerResponseReview598(prior597,source597,[],[issuer],asOf);
  const response=p.cases.find(x=>!x.owner_trial_decision_pending).latest_response;
  assert.equal(response.digest_comparison,'LOCAL_DIGEST_MATCH_UNAUTHENTICATED');
  assert.equal(response.original_issuer_authenticated,false);
  assert.equal(response.exception_closed,false);
});
test('substituted issuer identity, response bytes and custody receipt remain open conflicts',()=>{
  const p=issuerResponseReview598(prior597,source597,[],[{...issuer,
    issuer_identity_ref:'different-issuer',reply_document_sha256:'e'.repeat(64),
    custody_receipt_ref:'different-custody'}],asOf);
  const r=p.cases.find(x=>!x.owner_trial_decision_pending).latest_response;
  for(const x of ['ISSUER_IDENTITY_REFERENCE_CONFLICT',
    'ISSUER_REPLY_ORIGINAL_DIGEST_CONFLICT','ORIGINAL_CUSTODY_RECEIPT_REFERENCE_CONFLICT'])
    assert.ok(r.conflicts.includes(x),x);
  assert.equal(r.digest_comparison,'DIGEST_CONFLICT_OPEN');
});
test('owner signer and independent reviewer/witness cannot silently validate exact scope',()=>{
  const claim={...signer,owner_signer_ref:'same-598',
    independent_reviewer_ref:'same-598',independent_witness_ref:'same-598',
    owner_signed_receipt_ref:'local-owner-document',owner_document_sha256:'a'.repeat(64),
    review_state:'PROPOSED_CLOSURE_AWAITING_EXTERNAL_PROOF'};
  const p=issuerResponseReview598(prior597,source597,[],[claim],asOf);
  const c=p.cases.find(x=>x.owner_trial_decision_pending);
  for(const x of ['OWNER_SIGNER_EQUALS_WITNESS','OWNER_SIGNER_EQUALS_REVIEWER','REVIEWER_EQUALS_WITNESS'])
    assert.ok(c.latest_response.conflicts.includes(x),x);
  assert.equal(p.proposed_closures_pending_proof,1);assert.equal(p.independently_closed_conflicts,0);
  const u=unsignedOwnerWitnessReadiness598(p,c.case_pin);
  assert.equal(u.exact_account,c.account_id);assert.equal(u.exact_product,c.product_ref);
  assert.equal(u.exact_action,c.exact_action);assert.equal(u.authenticated_signature,false);
  assert.equal(u.exact_owner_trial_authorized,false);
  assert.throws(()=>unsignedOwnerWitnessReadiness598(p,provider.case_pin));
});
test('forged source, switched owner scope, closed exceptions and secret claims fail closed',()=>{
  assert.throws(()=>issuerResponseReview598({...prior597,build:0},source597,[],[],asOf));
  assert.throws(()=>issuerResponseReview598(prior597,source597,[],[{...issuer,
    exception_code:'NOT_AN_OPEN_CONFLICT'}],asOf));
  assert.throws(()=>issuerResponseReview598(prior597,source597,[],[{...signer,
    owner_action:'PUBLISH_NOW'}],asOf));
  assert.throws(()=>issuerResponseReview598(prior597,source597,[],[{...issuer,
    review_kind:'OWNER_WITNESS_REVIEW'}],asOf));
  for(const input of [{...issuer,trial_authorized:true},
    {...issuer,conflict_resolved:true},{...issuer,issuer_response_ref:'Bearer secret'},
    {...issuer,reply_document_sha256:'bad-digest'},
    {...issuer,review_state:'CLOSED'}])assert.throws(()=>issuerResponseCandidate598(input));
  const p=issuerResponseReview598(prior597,source597,[],[issuer],asOf);
  assert.equal(filterIssuerCases598(p,'OWNER').length,1);
  assert.equal(filterIssuerCases598(p,'ISSUER').length,1);
  assert.throws(()=>filterIssuerCases598(p,'CLOSED'));
});
test('Build 598 Admin section, CI gate and production release marker are review-only',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd598Refresh','dd598Filter','dd598Search','dd598Rows','dd598Case',
    'dd598Exception','dd598Kind','dd598Disposition','dd598Response','dd598Issuer',
    'dd598ReplyDigest','dd598Custody','dd598Attestation','dd598Reviewer',
    'dd598Witness','dd598Signer','dd598OwnerReceipt','dd598OwnerDigest',
    'dd598Account','dd598Product','dd598Scope','dd598Reason','dd598Due',
    'dd598Ack','dd598Save','dd598Copy','dd598State','dd598Output',
    'dd598Prepare','dd598CopyPacket','dd598Packet'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build (?:598|599)/);
  assert.match(html,/admin-channel-issuer-response-598\.mjs\?v=598/);
  const js=read('public/js/admin-channel-issuer-response-598.mjs');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(js,/admin-channel-source-disposition-597\.mjs\?v=597/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build598_issuer_response_witness.test.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:598|599)/);
});
