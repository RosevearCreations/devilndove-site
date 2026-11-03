import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {escalationPin592,receiptReconciliation592} from '../public/js/admin-channel-receipt-reconciliation-592.mjs';
import {authenticityMatrix593,authenticityCandidate593,responsePin593,FORMAT_593} from '../public/js/admin-channel-authenticity-matrix-593.mjs';
import {fixture592} from './release467_build592_receipt_reconciliation.test.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {exactEscalation,escalationArgs,candidate,asOf}=fixture592;
const ownerCase=exactEscalation.cases.find(c=>c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION');
const ownerCandidate={...candidate,escalation_pin:escalationPin592(ownerCase,ownerCase.latest_followup),
  next_action:'RECONCILE_EXACT_OWNER_DECISION_LOCATOR',external_case_ref:'Owner external case 591',
  provider_account_id:'shop1',owner_decision_ref:'Unsigned owner trial decision candidate',
  owner_signer_ref:'Candidate owner signer not yet independently authenticated',
  recorded_at:'2026-11-03T13:51:00Z'};
const args=[exactEscalation,escalationArgs,[candidate,ownerCandidate]];
const source=receiptReconciliation592(...args,asOf);
const provider=source.cases.find(c=>c.followup_type==='INDEPENDENT_RECEIPT_WITNESS');
const owner=source.cases.find(c=>c.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION');
const pending={response_pin:responsePin593(provider,provider.latest_reconciliation),
  next_action:'REQUEST_PROVIDER_ORIGIN_AUTHENTICATION',owner_decision_outcome:'UNDECIDED',
  external_case_ref:'External witness case 591',
  primary_receipt_ref:'Original provider document locator unverified',
  provider_response_ref:'Candidate external provider response 592',
  provider_origin_ref:'Candidate provider portal originating custodian',
  independent_reviewer_ref:'Independent reviewer pending',
  independent_witness_ref:'Other candidate witness',owner_decision_ref:'',owner_signer_ref:'',
  provider_account_id:'shop1',product_ref:'54',action_scope:'UPLOAD_IMAGE',
  reason:'Provider original response and independent witness authentication remain unverified.',
  recorded_at:'2026-11-03T14:02:00Z',next_review_at:'2026-11-04T14:00:00Z'};
const ownerPending={...pending,response_pin:responsePin593(owner,owner.latest_reconciliation),
  next_action:'REQUEST_SEPARATELY_SIGNED_OWNER_SCOPE_DECISION',
  owner_decision_outcome:'APPROVAL_REQUESTED',external_case_ref:'Owner external case 591',
  owner_decision_ref:'Candidate owner paper decision not independently verified',
  owner_signer_ref:'Candidate signer not authenticated',
  recorded_at:'2026-11-03T14:03:00Z'};
export const fixture593={source,args,pending,ownerPending,asOf};
test('exact source authenticity matrix cannot authenticate provider or authorize trial',()=>{
  const r=authenticityMatrix593(source,args,[pending],asOf);
  assert.equal(r.format,FORMAT_593);assert.equal(r.open_authenticity_cases,2);
  assert.equal(r.missing_authenticity_reviews,1);
  assert.ok(r.cases.find(c=>c.followup_type==='INDEPENDENT_RECEIPT_WITNESS')
    .latest_review.authenticity_exceptions.includes('EXACT_ACCOUNT_CONFLICT'));
  assert.equal(r.independently_verified_provider_responses,0);
  assert.equal(r.verified_owner_scope_decisions,0);assert.equal(r.approved_trials,0);
  assert.equal(r.closed_exceptions,0);assert.equal(r.provider_writes,0);assert.equal(r.d1_operations,0);
});
test('provider identity, reviewer independence and owner scope contradictions stay open',()=>{
  const changed={...pending,external_case_ref:'unrelated case',
    primary_receipt_ref:'wrong receipt',provider_response_ref:'wrong response',
    independent_reviewer_ref:'same reviewer',independent_witness_ref:'same reviewer',
    provider_origin_ref:'same reviewer',provider_account_id:'wrong account',
    product_ref:'wrong product',action_scope:'PUBLISH'};
  const r=authenticityMatrix593(source,args,[changed],asOf);
  const conflicts=r.cases.find(c=>c.followup_type==='INDEPENDENT_RECEIPT_WITNESS')
    .latest_review.source_conflicts;
  for(const key of ['EXTERNAL_CASE_SOURCE_CONFLICT','ORIGINAL_PROVIDER_RECEIPT_CONFLICT',
    'EXTERNAL_RESPONSE_ID_CONFLICT','INDEPENDENT_REVIEWER_SOURCE_CONFLICT',
    'INDEPENDENT_WITNESS_EQUALS_REVIEWER','PROVIDER_ORIGIN_REVIEWER_NOT_INDEPENDENT',
    'OWNER_ACCOUNT_SCOPE_CONFLICT','OWNER_PRODUCT_SCOPE_CONFLICT','OWNER_EXACT_ACTION_SCOPE_CONFLICT'])
    assert.ok(conflicts.includes(key),key);
});
test('owner approval requests, duplicate responses and stale/forged evidence never close trials',()=>{
  const ownerRow={...pending,response_pin:responsePin593(owner,owner.latest_reconciliation),
    next_action:'REQUEST_SEPARATELY_SIGNED_OWNER_SCOPE_DECISION',
    owner_decision_outcome:'APPROVAL_REQUESTED',external_case_ref:'Owner external case 591',
    provider_account_id:'shop1',owner_signer_ref:'Candidate signer unverified',
    owner_decision_ref:'Decision candidate not independently authenticated',
    recorded_at:'2026-11-03T14:03:00Z'};
  const r=authenticityMatrix593(source,args,[pending,ownerRow],'2026-11-05T14:00:00Z');
  assert.equal(r.overdue_authenticity_rechecks,2);assert.equal(r.pending_owner_scope_decisions,1);
  assert.deepEqual(r.duplicate_candidate_provider_responses,['Candidate external provider response 592']);
  assert.equal(r.verified_owner_scope_decisions,0);assert.equal(r.approved_trials,0);
  assert.throws(()=>authenticityMatrix593({...source,source_pin:'forged'},args,[],asOf));
  assert.throws(()=>authenticityMatrix593(source,args,[{...pending,
    next_action:'REQUEST_SEPARATELY_SIGNED_OWNER_SCOPE_DECISION'}],asOf));
  assert.throws(()=>authenticityCandidate593({...pending,owner_trial_authorized:true}));
  assert.throws(()=>authenticityCandidate593({...pending,provider_origin_ref:'Bearer secret-value'}));
  assert.throws(()=>authenticityCandidate593({...pending,next_action:'AUTHORIZE_META_POST'}));
  assert.throws(()=>authenticityMatrix593(source,args,Array(101).fill(pending),asOf));
});
test('Build 593 Admin, CI and production marker preserve no-provider-write gate',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd593Review','dd593Case','dd593Action','dd593Decision',
    'dd593Receipt','dd593Origin','dd593Owner','dd593Signer','dd593Account',
    'dd593Product','dd593Scope','dd593Due','dd593Ack','dd593Save','dd593Copy','dd593Output'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build (?:593|594|595|596|597)/);
  const js=read('public/js/admin-channel-authenticity-matrix-593.mjs');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build593_authenticity_matrix\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:593|594|595|596|597)/);
});
