import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture595} from './release467_build595_source_verification.test.mjs';
import {sourceVerification595} from '../public/js/admin-channel-source-verification-595.mjs';
import {evidenceWorkboard596} from '../public/js/admin-channel-review-workboard-596.mjs';
import {reconcileSource597} from '../public/js/admin-channel-source-disposition-597.mjs';
import {issuerResponseReview598} from '../public/js/admin-channel-issuer-response-598.mjs';
import {FORMAT_599,receiptCandidate599,receiptIntake599,filterReceipt599,
  unresolvedWitnessPacket599,exactConsentPreflight599} from
  '../public/js/admin-channel-issuer-receipt-599.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {exact594,upstream594,providerRow,ownerRow,asOf}=fixture595;
const source595=[exact594,upstream594,[providerRow,ownerRow]];
const exact595=sourceVerification595(...source595,asOf);
const source596=[exact595,source595],exact596=evidenceWorkboard596(...source596,[],asOf);
const source597=[exact596,source596,[]],exact597=reconcileSource597(...source597,[],asOf);
const source598=[exact597,source597,[]],exact598=issuerResponseReview598(...source598,[],asOf);
const provider=exact598.cases.find(c=>!c.owner_trial_decision_pending);
const owner=exact598.cases.find(c=>c.owner_trial_decision_pending);
const row=c=>({case_pin:c.case_pin,exception_code:c.open_exceptions[0],
  issuer_receipt_ref:'original-issued-receipt-'+(c.owner_trial_decision_pending?'owner':'provider'),
  issuer_identity_ref:c.expected_issuer_ref||'',authority_source_ref:'',
  receipt_sha256:c.source_digest||'',custody_receipt_ref:c.expected_custody_ref||'',
  response_correlation_ref:'',reviewer_ref:'reviewer-599',witness_ref:'witness-599',
  owner_signer_ref:c.owner_trial_decision_pending?c.expected_owner_signer_ref||'signer-599':'',
  owner_signed_receipt_ref:'',owner_signed_sha256:'',
  owner_account:c.owner_trial_decision_pending?c.account_id:'',
  owner_product:c.owner_trial_decision_pending?c.product_ref:'',
  owner_action:c.owner_trial_decision_pending?c.exact_action:'',
  source_method:'OFFICIAL_PROVIDER_PORTAL_CLAIM',
  next_action:c.owner_trial_decision_pending?'REQUEST_EXACT_SIGNED_OWNER_CONSENT':
    'REQUEST_ORIGINAL_ISSUER_RECEIPT',
  state:c.owner_trial_decision_pending?'OWNER_CONSENT_PENDING':'ISSUER_RECEIPT_CLAIM_RECORDED',
  reason:'Independent issuer authentication and signed owner scope are not verified yet.',
  received_at:'2026-11-03T18:00:00Z',recorded_at:'2026-11-03T19:00:00Z',
  next_review_at:'2026-11-04T19:30:00Z'});
const providerReceipt=row(provider),ownerReceipt=row(owner);
test('normalized local receipt survives save and reload without inventing approval flags',()=>{
  const persisted=receiptCandidate599(providerReceipt);
  const p=receiptIntake599(exact598,source598,[],[persisted],asOf);
  assert.equal(p.cases.find(c=>!c.owner_trial_decision_pending).receipts.length,1);
  assert.equal(p.issuer_receipts_authenticated,0);
});
test('issuer intake and owner consent preflight stay open, no provider or D1 operations',()=>{
  const p=receiptIntake599(exact598,source598,[],[providerReceipt,ownerReceipt],
    '2026-11-13T19:00:00Z');
  assert.equal(p.format,FORMAT_599);assert.equal(p.open_cases,2);
  assert.equal(p.issuer_cases,1);assert.equal(p.owner_consent_cases,1);
  assert.equal(p.issuer_receipts_authenticated,0);assert.equal(p.independent_conflicts_closed,0);
  assert.equal(p.signed_owner_consents_verified,0);assert.equal(p.approved_trials,0);
  assert.equal(p.provider_reads,0);assert.equal(p.provider_writes,0);
  assert.equal(p.d1_operations,0);
  assert.ok(p.cases.every(c=>c.open_exceptions.length>0&&!c.trial_authorized));
});
test('issuer receipt local digest match never authenticates provider or resolves conflict',()=>{
  const p=receiptIntake599(exact598,source598,[],[providerReceipt],asOf);
  const r=p.cases.find(c=>!c.owner_trial_decision_pending).latest_receipt;
  assert.equal(r.local_digest_status,'MATCHED_LOCAL_BYTES_ONLY');
  assert.equal(r.issuer_independently_authenticated,false);
  assert.equal(r.conflict_independently_closed,false);
  const packet=unresolvedWitnessPacket599(p,provider.case_pin);
  assert.equal(packet.issuer_authenticated,false);
  assert.equal(packet.independent_witness_authenticated,false);
  assert.equal(packet.exception_closed,false);
  assert.ok(packet.unresolved_exceptions.length>0);
});
test('substituted issuer, receipt digest, custody and non-independent witnesses are flagged',()=>{
  const p=receiptIntake599(exact598,source598,[],[{...providerReceipt,
    issuer_identity_ref:'unrecognized-issuer',receipt_sha256:'f'.repeat(64),
    custody_receipt_ref:'unrecognized-custody',reviewer_ref:'one-person',
    witness_ref:'one-person',authority_source_ref:'self-referential',
    issuer_receipt_ref:'self-referential'}],asOf);
  const r=p.cases.find(c=>!c.owner_trial_decision_pending).latest_receipt;
  for(const x of ['ISSUER_IDENTITY_CONFLICT','ISSUER_ORIGINAL_DIGEST_CONFLICT',
    'CUSTODY_REFERENCE_CONFLICT','REVIEWER_EQUALS_WITNESS','SELF_REFERENTIAL_ISSUER_AUTHORITY'])
    assert.ok(r.conflicts.includes(x),x);
  assert.equal(r.local_digest_status,'DIGEST_MISMATCH_OPEN');
});
test('owner consent preflight is exact account/Product/action and remains unsigned',()=>{
  const claimed={...ownerReceipt,owner_signer_ref:'one-person',reviewer_ref:'one-person',
    witness_ref:'one-person',owner_signed_receipt_ref:'unverified-local-copy',
    owner_signed_sha256:'a'.repeat(64)};
  const p=receiptIntake599(exact598,source598,[],[claimed],asOf);
  const c=p.cases.find(x=>x.owner_trial_decision_pending);
  for(const x of ['OWNER_EQUALS_WITNESS','OWNER_EQUALS_REVIEWER','REVIEWER_EQUALS_WITNESS'])
    assert.ok(c.latest_receipt.conflicts.includes(x),x);
  const packet=exactConsentPreflight599(p,c.case_pin);
  assert.equal(packet.exact_shop_account,c.account_id);
  assert.equal(packet.exact_product_sku,c.product_ref);
  assert.equal(packet.exact_action,c.exact_action);
  assert.equal(packet.signed_owner_scope_verified,false);
  assert.equal(packet.consent_approved,false);assert.equal(packet.trial_authorized,false);
  assert.throws(()=>exactConsentPreflight599(p,provider.case_pin));
});
test('replayed original issuer receipt across distinct cases remains unresolved',()=>{
  const p=receiptIntake599(exact598,source598,[],[providerReceipt,
    {...ownerReceipt,issuer_receipt_ref:providerReceipt.issuer_receipt_ref}],asOf);
  assert.ok(p.cases.every(c=>c.open_exceptions.includes('ISSUER_RECEIPT_REUSED_ACROSS_CASES')));
  assert.equal(p.approved_trials,0);
});
test('forged chain, incorrect owner scope, closed exceptions, secrets and approvals fail closed',()=>{
  assert.throws(()=>receiptIntake599({...exact598,build:0},source598,[],[],asOf));
  assert.throws(()=>receiptIntake599(exact598,source598,[],[
    {...providerReceipt,exception_code:'NON_EXISTENT_CLOSED'}],asOf));
  assert.throws(()=>receiptIntake599(exact598,source598,[],[
    {...ownerReceipt,owner_action:'PUBLISH_NOW'}],asOf));
  assert.throws(()=>receiptIntake599(exact598,source598,[],[
    {...providerReceipt,next_action:'REQUEST_EXACT_SIGNED_OWNER_CONSENT'}],asOf));
  for(const r of [{...providerReceipt,issuer_authenticated:true},
    {...providerReceipt,trial_authorized:true},
    {...providerReceipt,issuer_receipt_ref:'Bearer a-secret'},
    {...providerReceipt,receipt_sha256:'not-hex'},
    {...providerReceipt,received_at:'2026-11-03T20:00:00Z'},
    {...providerReceipt,state:'AUTHENTICATED'}])
    assert.throws(()=>receiptCandidate599(r));
  const p=receiptIntake599(exact598,source598,[],[providerReceipt],asOf);
  assert.equal(filterReceipt599(p,'OWNER').length,1);
  assert.equal(filterReceipt599(p,'ISSUER').length,1);
  assert.throws(()=>filterReceipt599(p,'APPROVED'));
});
test('Build 599 Admin controls, CI gate, exact source identity and no-network boundary',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd599Refresh','dd599Filter','dd599Search','dd599Rows','dd599Case',
    'dd599Exception','dd599Action','dd599State','dd599Method','dd599Receipt',
    'dd599Issuer','dd599Authority','dd599Digest','dd599Custody','dd599Correlation',
    'dd599Reviewer','dd599Witness','dd599Signer','dd599OwnerReceipt','dd599OwnerDigest',
    'dd599Account','dd599Product','dd599Scope','dd599Received','dd599Due',
    'dd599Reason','dd599Ack','dd599Save','dd599Copy','dd599Status','dd599Output',
    'dd599PrepareWitness','dd599CopyWitness','dd599WitnessPacket',
    'dd599PrepareOwner','dd599CopyOwner','dd599OwnerPacket'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build 599/);
  assert.match(html,/admin-channel-issuer-receipt-599\.mjs\?v=599/);
  const js=read('public/js/admin-channel-issuer-receipt-599.mjs');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(js,/admin-channel-issuer-response-598\.mjs\?v=598/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build599_issuer_receipt_consent_preflight\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":599/);
});
