import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {authenticityMatrix593} from '../public/js/admin-channel-authenticity-matrix-593.mjs';
import {intakeAging594} from '../public/js/admin-channel-intake-aging-594.mjs';
import {FORMAT_595,sourcePin595,sourceCandidate595,sourceVerification595,fileSha256595} from
  '../public/js/admin-channel-source-verification-595.mjs';
import {fixture593} from './release467_build593_authenticity_matrix.test.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const {source,args,pending,ownerPending,asOf}=fixture593;
const exact593=authenticityMatrix593(source,args,[pending,ownerPending],asOf);
const upstream593=[source,args,[pending,ownerPending]];
const provider593=exact593.cases.find(c=>c.followup_type==='INDEPENDENT_RECEIPT_WITNESS');
const owner593=exact593.cases.find(c=>c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION');
const row594=c=>({response_pin:c.response_pin,
  next_action:c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'?
    'REQUEST_EXACT_OWNER_DECISION':'REQUEST_ORIGINAL_PROVIDER_SOURCE',
  source_response_ref:c.source_response_ref,
  original_provider_record_ref:'Original provider source locator '+c.product_ref,
  provider_issuer_ref:'Provider Issuer '+c.product_ref,
  custody_chain_ref:'Custody document '+c.product_ref,
  independent_reviewer_ref:c.latest_review?.independent_reviewer_ref||'Reviewer '+c.product_ref,
  independent_witness_ref:c.latest_review?.independent_witness_ref||'Witness '+c.product_ref,
  owner_decision_ref:c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'?
    'Candidate owner decision '+c.product_ref:'',
  owner_signer_ref:c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'?
    'Candidate owner signer '+c.product_ref:'',
  account_id:c.account_id,product_ref:c.product_ref,action_scope:c.action,
  reason:'External independent source and owner-scope proof still needed.',
  recorded_at:'2026-11-03T15:01:00Z',next_review_at:'2026-11-04T15:00:00Z'});
const requests594=[row594(provider593),row594(owner593)];
const upstream594=[exact593,upstream593,requests594];
const exact594=intakeAging594(...upstream594,asOf);
const provider=exact594.cases.find(c=>c.followup_type==='INDEPENDENT_RECEIPT_WITNESS');
const owner=exact594.cases.find(c=>c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION');
const verification=c=>({
  intake_pin:sourcePin595(c),
  next_action:c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'?
    'REQUEST_SEPARATELY_SIGNED_OWNER_TRIAL_SCOPE':'RECONCILE_ORIGINAL_RECEIPT_AND_CUSTODY',
  owner_outcome:c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'?
    'DECISION_REQUESTED':'UNDECIDED',
  original_response_ref:c.latest_intake.source_response_ref,
  original_provider_ref:c.latest_intake.original_provider_record_ref,
  provider_issuer_ref:c.latest_intake.provider_issuer_ref,
  original_receipt_ref:c.prior_authenticity_review?.primary_receipt_ref||'',
  custody_receipt_ref:c.latest_intake.custody_chain_ref,
  custodian_ref:'Custodian '+c.product_ref,
  independent_reviewer_ref:c.latest_intake.independent_reviewer_ref,
  independent_witness_ref:c.latest_intake.independent_witness_ref,
  issuer_expected_sha256:(c===provider?'a':'c').repeat(64),
  original_file_sha256:(c===provider?'a':'c').repeat(64),
  custody_logged_sha256:(c===provider?'b':'d').repeat(64),
  custody_file_sha256:(c===provider?'b':'d').repeat(64),
  receipt_at:'2026-11-03T12:00:00Z',custody_at:'2026-11-03T13:00:00Z',
  owner_decision_ref:c.latest_intake.owner_decision_ref,
  owner_signer_ref:c.latest_intake.owner_signer_ref,
  account_id:c.account_id,product_ref:c.product_ref,action_scope:c.action,
  reason:'Independent original document byte integrity does not authenticate provider or signed owner scope.',
  recorded_at:'2026-11-03T16:00:00Z',next_review_at:'2026-11-04T17:00:00Z'});
const providerRow=verification(provider),ownerRow=verification(owner);
export const fixture595={exact594,upstream594,providerRow,ownerRow,provider,owner,asOf};

test('matching original/custody document bytes remain evidence-only; overdue owner consent stays HOLD',()=>{
  const p=sourceVerification595(exact594,upstream594,[providerRow,ownerRow],'2026-11-13T15:00:00Z');
  assert.equal(p.format,FORMAT_595);
  assert.equal(p.open_verification_cases,2);
  assert.equal(p.pending_owner_authorization,1);
  assert.equal(p.overdue_owner_decisions,1);
  assert.equal(p.local_document_digest_pairs_consistent,2);
  assert.equal(p.cross_case_provider_document_digests.length,0);
  assert.equal(p.cases.find(c=>c.owner_trial_decision_pending).bucket,'OVERDUE_SEVERE');
  assert.equal(p.independently_authenticated_provider_sources,0);
  assert.equal(p.verified_owner_authorizations,0);
  assert.equal(p.approved_trials,0);
  assert.equal(p.closed_exceptions,0);
  assert.equal(p.provider_reads,0);assert.equal(p.provider_writes,0);
  assert.equal(p.d1_operations,0);
  assert.equal(p.cases.find(c=>!c.owner_trial_decision_pending).latest_verification.externally_authenticated,false);
});
test('digest mismatches, receipt substitution, custody chronology and independence conflicts stay open',()=>{
  const wrong={...providerRow,original_response_ref:'substitute response',
    original_receipt_ref:'substituted receipt',custody_receipt_ref:'substituted custody',
    provider_issuer_ref:'same party',independent_reviewer_ref:'same party',
    independent_witness_ref:'same party',custodian_ref:'same party',
    original_file_sha256:'e'.repeat(64),custody_file_sha256:'f'.repeat(64),
    receipt_at:'2026-11-03T14:00:00Z',custody_at:'2026-11-03T13:00:00Z',
    account_id:'wrong account',product_ref:'wrong product',action_scope:'PUBLISH'};
  const p=sourceVerification595(exact594,upstream594,[wrong],asOf);
  const review=p.cases.find(c=>!c.owner_trial_decision_pending).latest_verification;
  for(const code of ['RESPONSE_CORRELATION_CONFLICT','ORIGINAL_RECEIPT_CONFLICT',
    'CUSTODY_RECEIPT_CONFLICT','ISSUER_IS_REVIEWER','REVIEWER_IS_WITNESS',
    'ORIGINAL_BYTES_DIGEST_MISMATCH','CUSTODY_BYTES_DIGEST_MISMATCH',
    'CUSTODY_BEFORE_ORIGINAL_RECEIPT','OWNER_ACCOUNT_CONFLICT','OWNER_PRODUCT_CONFLICT',
    'OWNER_EXACT_ACTION_CONFLICT'])assert.ok(review.source_conflicts.includes(code),code);
  assert.equal(review.local_document_integrity_consistent,false);
  assert.equal(review.documentary_crosscheck_ready,false);
});
test('stale pins, owner case swapping, unsafe approvals, invalid hashes and timestamps fail closed',()=>{
  const stale=sourceVerification595(exact594,upstream594,[{...providerRow,intake_pin:'x'+providerRow.intake_pin}],asOf);
  assert.equal(stale.stale_verification_candidates.length,1);
  assert.equal(stale.missing_independent_verification,2);
  assert.throws(()=>sourceVerification595({...exact594,source_pin:'forged'},upstream594,[],asOf));
  assert.throws(()=>sourceVerification595(exact594,upstream594,[{...providerRow,
    next_action:'REQUEST_SEPARATELY_SIGNED_OWNER_TRIAL_SCOPE'}],asOf));
  assert.throws(()=>sourceCandidate595({...providerRow,owner_trial_authorized:true}));
  assert.throws(()=>sourceCandidate595({...providerRow,original_provider_ref:'Bearer secret'}));
  assert.throws(()=>sourceCandidate595({...providerRow,issuer_expected_sha256:'not-a-digest'}));
  assert.throws(()=>sourceCandidate595({...providerRow,receipt_at:'tomorrow'}));
  assert.throws(()=>sourceCandidate595({...providerRow,next_action:'PUBLISH_ETS Y'}));
  assert.throws(()=>sourceVerification595(exact594,upstream594,Array(101).fill(providerRow),asOf));
  const reused=sourceVerification595(exact594,upstream594,[providerRow,
    {...ownerRow,original_file_sha256:providerRow.original_file_sha256}],asOf);
  assert.equal(reused.cross_case_provider_document_digests.length,1);
  assert.ok(reused.cases.find(c=>!c.owner_trial_decision_pending).latest_verification
    .open_exceptions.includes('ORIGINAL_FILE_DIGEST_REUSED_ACROSS_CASES'));
  assert.equal(reused.cases.find(c=>c.owner_trial_decision_pending).latest_verification
    .documentary_crosscheck_ready,false);
});
test('selected local files can be hashed without transport or retained bytes',async()=>{
  const bytes=new TextEncoder().encode('abc');
  const file={size:bytes.byteLength,arrayBuffer:async()=>bytes.buffer};
  assert.equal(await fileSha256595(file),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  await assert.rejects(()=>fileSha256595({size:25*1024*1024+1,arrayBuffer:async()=>bytes.buffer}));
});
test('Build 595 Admin route, exact source marker and protected release gate remain review-only',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd595Review','dd595Case','dd595Action','dd595OriginalFile',
    'dd595CustodyFile','dd595Hash','dd595OriginalHash','dd595CustodyHash',
    'dd595IssuerHash','dd595CustodyLogHash','dd595Received','dd595Handoff',
    'dd595Reviewer','dd595Witness','dd595Owner','dd595Signer','dd595Account',
    'dd595Product','dd595Scope','dd595Due','dd595Reason','dd595Ack',
    'dd595Save','dd595Copy','dd595Output'])assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build (?:601|600|(?:595|596|597|598|599))/);
  assert.match(html,/admin-channel-source-verification-595\.mjs\?v=595/);
  const js=read('public/js/admin-channel-source-verification-595.mjs');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(js,/admin-channel-intake-aging-594\.mjs\?v=594/);
  assert.doesNotMatch(js,/import .*\.mjs\?v=595/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build595_source_verification\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:601|600|59[56789])/);
});
