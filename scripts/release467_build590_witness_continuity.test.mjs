import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {custody589,dispositionPin589} from '../public/js/admin-channel-custody-589.mjs';
import {witnessContinuity590,witnessRequest590,custodyPin590,FORMAT_590} from '../public/js/admin-channel-witness-continuity-590.mjs';
import {fixture589} from './release467_build589_custody_recheck.test.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {args,providerCase,ownerCase,pending,asOf}=fixture589;
const ownerCustody={...pending,disposition_pin:dispositionPin589(ownerCase,ownerCase.disposition_reviews[0]),
  triage_pin:ownerCase.triage_pin,next_action:'REQUEST_SEPARATELY_SIGNED_EXACT_OWNER_DECISION',
  custodian_from:'Custodian A',custodian_to:'Custodian B',
  handoff_reference:'Owner custody handoff 590',independent_witness_ref:'Independent owner witness',
  owner_decision_reference:'Unsigned candidate owner receipt',owner_account_id:'shop1',
  recorded_at:'2026-11-03T13:10:00Z'};
const custodyRows=[pending,ownerCustody],exactCustody=custody589(...args,custodyRows,asOf);
const sourceArgs=[...args,custodyRows],p=exactCustody.cases.find(x=>x.followup_type==='INDEPENDENT_RECEIPT_WITNESS');
const o=exactCustody.cases.find(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION');
const candidate={custody_pin:custodyPin590(p,p.custody_reviews[0]),disposition_pin:p.disposition_pin,
  next_action:'REQUEST_INDEPENDENT_WITNESS_CONTINUITY_ATTESTATION',previous_witness_ref:'',
  current_witness_ref:'Witness first attempt',independent_reviewer_ref:'Same reviewer',
  provider_custody_locator:'Unverified provider custody document',owner_decision_locator:'',
  owner_account_id:'shop1',owner_product_ref:'54',owner_action_scope:'UPLOAD_IMAGE',
  reason:'Independent witness continuity and source custody have not been verified.',
  recorded_at:'2026-11-03T13:20:00Z',next_review_at:'2026-11-04T10:00:00Z'};
test('independent witness discrepancy and missing source custody remain open, never verified',()=>{
  const r=witnessContinuity590(exactCustody,sourceArgs,[candidate],asOf);
  assert.equal(r.format,FORMAT_590);assert.equal(r.open_closure_review_cases,2);
  assert.equal(r.pending_witness_reviews,1);
  const item=r.cases.find(x=>x.followup_type==='INDEPENDENT_RECEIPT_WITNESS');
  assert.ok(item.unresolved_continuity_gaps.includes('WITNESS_REFERENCE_DIFFERS_FROM_CUSTODY_SOURCE'));
  assert.ok(item.unresolved_continuity_gaps.includes('INDEPENDENT_CUSTODY_WITNESS_MISSING'));
  assert.equal(item.closure_ready,false);assert.equal(r.closed_exceptions,0);
  assert.equal(r.independently_authenticated_custody_witnesses,0);
  assert.equal(r.provider_writes,0);assert.equal(r.d1_operations,0);
});
test('changed predecessor references and repeated local witness IDs cannot close chain',()=>{
  const second={...candidate,recorded_at:'2026-11-03T13:30:00Z',
    previous_witness_ref:'not the prior witness',next_review_at:'2026-11-04T11:00:00Z'};
  const r=witnessContinuity590(exactCustody,sourceArgs,[candidate,second],'2026-11-05T12:00:00Z');
  assert.ok(r.cases.find(x=>x.followup_type==='INDEPENDENT_RECEIPT_WITNESS')
    .unresolved_continuity_gaps.includes('PREVIOUS_WITNESS_CONTINUITY_BREAK'));
  assert.equal(r.overdue_witness_rechecks,2);
  assert.deepEqual(r.repeated_candidate_witness_refs,['Witness first attempt']);
  assert.equal(r.verified_closure_ready_cases,0);
});
test('owner case scope mismatch, missing signed decision, forged approval and stale records fail closed',()=>{
  const ownerRow={...candidate,custody_pin:custodyPin590(o,o.custody_reviews[0]),
    disposition_pin:o.disposition_pin,next_action:'REQUEST_EXPLICIT_OWNER_CLOSURE_DECISION',
    current_witness_ref:'Independent owner witness',independent_reviewer_ref:'Custodian A',
    owner_decision_locator:'',owner_account_id:'wrong-shop',owner_product_ref:'54',
    owner_action_scope:'PUBLISH',recorded_at:'2026-11-03T13:40:00Z'};
  const r=witnessContinuity590(exactCustody,sourceArgs,[ownerRow],asOf);
  const owner=r.cases.find(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION');
  assert.ok(owner.unresolved_continuity_gaps.includes('EXACT_OWNER_DECISION_REFERENCE_MISSING'));
  assert.ok(owner.unresolved_continuity_gaps.includes('OWNER_ACCOUNT_CHANGED'));
  assert.ok(owner.unresolved_continuity_gaps.includes('OWNER_ACTION_CHANGED'));
  assert.equal(r.verified_owner_trial_decisions,0);
  assert.equal(witnessContinuity590(exactCustody,sourceArgs,[{...candidate,custody_pin:'["stale", "source", "pin", "old receipt", "wrong witness", "no longer current"]'}],asOf).stale_witness_requests.length,1);
  assert.throws(()=>witnessContinuity590({...exactCustody,source_pin:'forged'},sourceArgs,[],asOf));
  assert.throws(()=>witnessContinuity590(exactCustody,sourceArgs,[{...candidate,next_action:'MAINTAIN_OWNER_CLOSURE_HOLD'}],asOf));
  assert.throws(()=>witnessRequest590({...candidate,next_action:'APPROVE_PROVIDER_WRITE'}));
  assert.throws(()=>witnessRequest590({...candidate,owner_decision_locator:'Bearer token'}));
  assert.throws(()=>witnessContinuity590(exactCustody,sourceArgs,Array(101).fill(candidate),asOf));
});
test('Build 590 Admin controls, CI and production marker are wired without provider requests',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-witness-continuity-590.mjs');
  for(const id of ['dd590Review','dd590Case','dd590Action','dd590Previous','dd590Current',
    'dd590Reviewer','dd590Custody','dd590Owner','dd590Account','dd590Product','dd590Scope',
    'dd590Due','dd590Reason','dd590Ack','dd590Save','dd590Copy','dd590State','dd590Output'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build 590/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build590_witness_continuity\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":590/);
});
