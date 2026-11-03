import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture595} from './release467_build595_source_verification.test.mjs';
import {sourceVerification595} from '../public/js/admin-channel-source-verification-595.mjs';
import {evidenceWorkboard596} from '../public/js/admin-channel-review-workboard-596.mjs';
import {reconcileSource597} from '../public/js/admin-channel-source-disposition-597.mjs';
import {issuerResponseReview598,receiptIntake599,
  FORMAT_600,decisionCandidate600,decisionRegister600,aging600,filterDecision600,
  unsignedOwnerReadiness600} from '../public/js/admin-channel-issuer-response-598.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {exact594,upstream594,providerRow,ownerRow,asOf}=fixture595;
const source595=[exact594,upstream594,[providerRow,ownerRow]],exact595=sourceVerification595(...source595,asOf);
const source596=[exact595,source595],exact596=evidenceWorkboard596(...source596,[],asOf);
const source597=[exact596,source596,[]],exact597=reconcileSource597(...source597,[],asOf);
const source598=[exact597,source597,[]],exact598=issuerResponseReview598(...source598,[],asOf);
const source599=[exact598,source598,[]],exact599=receiptIntake599(...source599,[],asOf);
const provider=exact599.cases.find(c=>!c.owner_trial_decision_pending);
const owner=exact599.cases.find(c=>c.owner_trial_decision_pending);
const row=c=>({case_pin:c.case_pin,exception_code:c.open_exceptions[0],
  state:c.owner_trial_decision_pending?'EXACT_OWNER_SIGNED_SCOPE_PENDING':'ISSUER_AUTHENTICITY_PENDING',
  next_action:c.owner_trial_decision_pending?'REQUEST_EXACT_OWNER_SIGNED_AUTHORIZATION':
    'REQUEST_ORIGINAL_ISSUER_AUTHORITY',
  decision_ref:'independent-decision-check-pending',issuer_authority_ref:'original-authority-claim',
  original_issuer_ref:c.expected_issuer_ref||'',issuer_receipt_ref:'',
  receipt_sha256:c.source_digest||'',custody_receipt_ref:c.expected_custody_ref||'',
  reviewer_ref:'reviewer-600',witness_ref:'witness-600',
  owner_signer_ref:c.owner_trial_decision_pending?c.expected_owner_signer_ref||'signer-600':'',
  owner_signed_receipt_ref:'',
  owner_account:c.owner_trial_decision_pending?c.account_id:'',
  owner_product:c.owner_trial_decision_pending?c.product_ref:'',
  owner_action:c.owner_trial_decision_pending?c.exact_action:'',
  reason:'Original issuer authenticity and signed exact owner scope remain independently unverified.',
  recorded_at:'2026-11-03T20:00:00Z',next_review_at:'2026-11-04T21:00:00Z'});
const providerRow600=row(provider),ownerRow600=row(owner);
test('Build 600 register keeps source pinned conflicts and exact owner authorization HOLD',()=>{
  const p=decisionRegister600(exact599,source599,[],[providerRow600,ownerRow600],
    '2026-11-13T20:00:00Z');
  assert.equal(p.format,FORMAT_600);assert.equal(p.open_cases,2);
  assert.equal(p.issuer_cases,1);assert.equal(p.owner_cases,1);
  assert.equal(p.overdue_cases,2);assert.equal(p.overdue_owner_cases,1);
  assert.equal(p.issuer_decisions_authenticated,0);
  assert.equal(p.independent_conflicts_closed,0);assert.equal(p.exact_owner_signatures_verified,0);
  assert.equal(p.authorized_trials,0);assert.equal(p.provider_reads,0);
  assert.equal(p.provider_writes,0);assert.equal(p.d1_operations,0);
  assert.ok(p.cases.every(c=>c.open_exceptions.length>0&&!c.trial_authorized));
});
test('issuer digest, custody and independent reviewer conflicts remain open even if claim filed',()=>{
  const p=decisionRegister600(exact599,source599,[],[{...providerRow600,
    issuer_authority_ref:'same-ref',decision_ref:'same-ref',
    original_issuer_ref:'substituted-issuer',receipt_sha256:'f'.repeat(64),
    custody_receipt_ref:'substituted-receipt',
    reviewer_ref:'same-party',witness_ref:'same-party'}],asOf);
  const r=p.cases.find(c=>!c.owner_trial_decision_pending).latest_decision;
  for(const x of ['SELF_REFERENTIAL_ISSUER_DECISION','ISSUER_IDENTITY_SUBSTITUTION_CONFLICT',
    'SOURCE_DIGEST_DISPUTE_OPEN','CUSTODY_RECEIPT_CONFLICT','REVIEWER_EQUALS_WITNESS'])
    assert.ok(r.conflicts.includes(x),x);
  assert.equal(r.issuer_authenticated,false);assert.equal(r.independent_conflict_closed,false);
});
test('review aging reports due soon and specific overdue ranges',()=>{
  assert.equal(aging600('','2026-11-03T20:00:00Z').bucket,'NO_REVIEW_DEADLINE');
  assert.equal(aging600('2026-11-04T20:00:00Z','2026-11-03T20:00:00Z').bucket,'ON_TRACK');
  assert.equal(aging600('2026-11-03T19:00:00Z','2026-11-03T20:00:00Z').bucket,'OVERDUE_LT_1D');
  assert.equal(aging600('2026-10-20T19:00:00Z','2026-11-03T20:00:00Z').bucket,'OVERDUE_8D_PLUS');
});
test('exact owner consent packet stays unsigned with independent witness blockers',()=>{
  const p=decisionRegister600(exact599,source599,[],[{...ownerRow600,
    reviewer_ref:'single-actor',witness_ref:'single-actor',
    owner_signer_ref:'single-actor',owner_signed_receipt_ref:'unsigned-copy'}],asOf);
  const c=p.cases.find(c=>c.owner_trial_decision_pending);
  for(const x of ['REVIEWER_EQUALS_WITNESS','OWNER_SIGNER_EQUALS_REVIEWER','OWNER_SIGNER_EQUALS_WITNESS'])
    assert.ok(c.latest_decision.conflicts.includes(x),x);
  const packet=unsignedOwnerReadiness600(p,c.case_pin);
  assert.equal(packet.exact_shop_account,c.account_id);
  assert.equal(packet.exact_product_sku,c.product_ref);
  assert.equal(packet.exact_action,c.exact_action);
  assert.equal(packet.owner_signature_authenticated,false);
  assert.equal(packet.trial_authorized,false);
  assert.throws(()=>unsignedOwnerReadiness600(p,provider.case_pin));
});
test('forged upstream sources, wrong scope, secret and authority-claiming status fail closed',()=>{
  assert.throws(()=>decisionRegister600({...exact599,build:0},source599,[],[],asOf));
  assert.throws(()=>decisionRegister600(exact599,source599,[],[
    {...providerRow600,exception_code:'NONEXISTENT'}],asOf));
  assert.throws(()=>decisionRegister600(exact599,source599,[],[
    {...ownerRow600,owner_action:'POST_NOW'}],asOf));
  assert.throws(()=>decisionRegister600(exact599,source599,[],[
    {...providerRow600,next_action:'REQUEST_EXACT_OWNER_SIGNED_AUTHORIZATION'}],asOf));
  for(const d of [{...providerRow600,trial_authorized:true},
    {...providerRow600,decision_ref:'Bearer stolen-token'},
    {...providerRow600,receipt_sha256:'invalidhash'},
    {...providerRow600,state:'AUTHENTICATED'}])
    assert.throws(()=>decisionCandidate600(d));
  const p=decisionRegister600(exact599,source599,[],[
    {...providerRow600,case_pin:providerRow600.case_pin+'-stale'}],asOf);
  assert.equal(p.stale_unmatched_decisions.length,1);
});
test('filters only include grounded issuer, owner, conflict and overdue cases',()=>{
  const p=decisionRegister600(exact599,source599,[],[providerRow600,ownerRow600],
    '2026-11-13T20:00:00Z');
  assert.equal(filterDecision600(p,'OWNER').length,1);
  assert.equal(filterDecision600(p,'ISSUER').length,1);
  assert.equal(filterDecision600(p,'OVERDUE').length,2);
  assert.equal(filterDecision600(p,'OWNER',owner.product_ref).length,1);
  assert.throws(()=>filterDecision600(p,'APPROVED'));
});
test('Build 600 Admin controls, CI, immutable release marker and zero-network boundary',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd600Refresh','dd600Filter','dd600Search','dd600Rows',
    'dd600Metrics','dd600Case','dd600Exception','dd600State','dd600Action',
    'dd600DecisionRef','dd600Authority','dd600Issuer','dd600Receipt','dd600Digest',
    'dd600Custody','dd600Reviewer','dd600Witness','dd600Signer','dd600OwnerReceipt',
    'dd600Account','dd600Product','dd600Scope','dd600Due','dd600Reason',
    'dd600Ack','dd600Save','dd600Copy','dd600Status','dd600Output',
    'dd600Prepare','dd600CopyOwner','dd600OwnerPacket'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build 600/);
  assert.match(html,/admin-channel-issuer-response-598\.mjs\?v=600/);
  const js=read('public/js/admin-channel-issuer-response-598.mjs');
  assert.match(js,/export const FORMAT_600=/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build600_decision_register_aging\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":600/);
});
