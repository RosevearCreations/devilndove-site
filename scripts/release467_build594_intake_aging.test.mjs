import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {authenticityMatrix593} from '../public/js/admin-channel-authenticity-matrix-593.mjs';
import {intakeAging594,intakeCandidate594,agingBucket594,FORMAT_594} from
  '../public/js/admin-channel-intake-aging-594.mjs';
import {fixture593} from './release467_build593_authenticity_matrix.test.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {source,args,pending,ownerPending,asOf}=fixture593;
const exact=authenticityMatrix593(source,args,[pending,ownerPending],asOf);
const sourceArgs=[source,args,[pending,ownerPending]];
const provider=exact.cases.find(c=>c.followup_type==='INDEPENDENT_RECEIPT_WITNESS');
const owner=exact.cases.find(c=>c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION');
const providerRow={response_pin:provider.response_pin,next_action:'REQUEST_ORIGINAL_PROVIDER_SOURCE',
  source_response_ref:provider.source_response_ref,
  original_provider_record_ref:'Original provider portal document unverified',
  provider_issuer_ref:'Provider issuer candidate',custody_chain_ref:'Source custody chain candidate',
  independent_reviewer_ref:provider.latest_review?.independent_reviewer_ref||'Reviewer not yet confirmed',
  independent_witness_ref:provider.latest_review?.independent_witness_ref||'Witness not yet confirmed',
  owner_decision_ref:'',owner_signer_ref:'',account_id:provider.account_id,
  product_ref:provider.product_ref,action_scope:provider.action,
  recorded_at:'2026-11-03T15:01:00Z',next_review_at:'2026-11-04T15:00:00Z',
  reason:'Original provider response and issuer/custody evidence requires independent verification.'};
const ownerRow={...providerRow,response_pin:owner.response_pin,
  next_action:'ESCALATE_OVERDUE_OWNER_DECISION',source_response_ref:owner.source_response_ref,
  account_id:owner.account_id,product_ref:owner.product_ref,action_scope:owner.action,
  independent_reviewer_ref:owner.latest_review?.independent_reviewer_ref||'',
  independent_witness_ref:owner.latest_review?.independent_witness_ref||'',
  owner_decision_ref:'Candidate paper owner decision, NOT signed or verified',
  owner_signer_ref:'Owner signer candidate, not authenticated',
  recorded_at:'2026-11-03T15:02:00Z',next_review_at:'2026-11-04T15:00:00Z'};

test('original source-pinned intake identifies aging owner trial decision without granting provider access',()=>{
  const packet=intakeAging594(exact,sourceArgs,[providerRow,ownerRow],'2026-11-13T15:00:00Z');
  assert.equal(packet.format,FORMAT_594);
  assert.equal(packet.open_intake_cases,2);
  assert.equal(packet.pending_owner_trial_decisions,1);
  assert.equal(packet.overdue_owner_trial_decisions,1);
  assert.equal(packet.severe_owner_trial_decisions,1);
  assert.equal(packet.cases.find(c=>c.owner_trial_decision_pending).bucket,'OVERDUE_SEVERE');
  assert.ok(packet.unresolved_provenance_gaps>0);
  assert.equal(packet.externally_verified_provider_responses,0);
  assert.equal(packet.independently_authenticated_responses,0);
  assert.equal(packet.verified_owner_trial_decisions,0);
  assert.equal(packet.approved_trials,0);
  assert.equal(packet.closed_exceptions,0);
  assert.equal(packet.provider_writes,0);
  assert.equal(packet.d1_operations,0);
});
test('issuer, witness, response and exact account/product/action conflicts remain open',()=>{
  const bad={...providerRow,source_response_ref:'substituted source',
    provider_issuer_ref:'same-party',independent_reviewer_ref:'same-party',
    independent_witness_ref:'same-party',account_id:'wrong account',
    product_ref:'wrong product',action_scope:'PUBLISH'};
  const packet=intakeAging594(exact,sourceArgs,[bad],asOf);
  const review=packet.cases.find(c=>c.followup_type==='INDEPENDENT_RECEIPT_WITNESS')
    .latest_intake;
  for(const expected of ['ORIGINAL_PROVIDER_RESPONSE_CHANGED','PROVIDER_ISSUER_IS_OWN_REVIEWER',
    'REVIEWER_WITNESS_NOT_INDEPENDENT','ACCOUNT_SCOPE_CONFLICT','PRODUCT_SCOPE_CONFLICT',
    'EXACT_ACTION_SCOPE_CONFLICT'])assert.ok(review.source_conflicts.includes(expected),expected);
  assert.equal(review.documentary_intake_ready,false);
  assert.equal(review.externally_verified,false);
});
test('stale/forged sources, unsafe approvals, missing owner dates and invalid records fail closed',()=>{
  const packet=intakeAging594(exact,sourceArgs,[{...providerRow,response_pin:providerRow.response_pin+'x'}],asOf);
  assert.equal(packet.stale_intake_candidates.length,1);
  assert.equal(packet.missing_intake_reviews,2);
  assert.throws(()=>intakeAging594({...exact,source_pin:'altered'},sourceArgs,[],asOf));
  assert.throws(()=>intakeAging594(exact,sourceArgs,[{...providerRow,
    next_action:'REQUEST_EXACT_OWNER_DECISION'}],asOf));
  assert.throws(()=>intakeCandidate594({...providerRow,owner_trial_authorized:true}));
  assert.throws(()=>intakeCandidate594({...providerRow,original_provider_record_ref:'Bearer hidden-value'}));
  assert.throws(()=>intakeCandidate594({...providerRow,next_action:'POST_TO_META'}));
  assert.throws(()=>intakeAging594(exact,sourceArgs,Array(101).fill(providerRow),asOf));
  assert.deepEqual(agingBucket594(null,asOf),{bucket:'UNKNOWN_DUE_DATE',overdue_days:0});
  assert.equal(agingBucket594('2026-11-15T00:00:00Z',asOf).bucket,'NOT_DUE');
});
test('Build 594 Admin route, CI and marker include safe review-only source intake',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd594Review','dd594Case','dd594Action','dd594Response',
    'dd594Original','dd594Issuer','dd594Custody','dd594Reviewer','dd594Witness',
    'dd594Owner','dd594Signer','dd594Account','dd594Product','dd594Scope',
    'dd594Due','dd594Reason','dd594Ack','dd594Save','dd594Copy','dd594Output'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build (?:594|595|596|597|598|599)/);
  assert.match(html,/admin-channel-intake-aging-594\.mjs\?v=594/);
  const js=read('public/js/admin-channel-intake-aging-594.mjs');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build594_intake_aging\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":59[456789]/);
});
