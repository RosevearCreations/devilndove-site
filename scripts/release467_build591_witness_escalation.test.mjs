import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {custody589,dispositionPin589} from '../public/js/admin-channel-custody-589.mjs';
import {witnessContinuity590,custodyPin590} from '../public/js/admin-channel-witness-continuity-590.mjs';
import {escalation591,escalationRequest591,witnessPin591,FORMAT_591} from '../public/js/admin-channel-escalation-591.mjs';
import {fixture589} from './release467_build589_custody_recheck.test.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {args,ownerCase,pending,asOf}=fixture589;
const ownerCustody={...pending,disposition_pin:dispositionPin589(ownerCase,ownerCase.disposition_reviews[0]),
  triage_pin:ownerCase.triage_pin,next_action:'REQUEST_SEPARATELY_SIGNED_EXACT_OWNER_DECISION',
  custodian_from:'Custodian A',custodian_to:'Custodian B',
  handoff_reference:'Owner external custody handoff',independent_witness_ref:'Owner witness candidate',
  owner_decision_reference:'Signed owner decision still missing',owner_account_id:'shop1',
  recorded_at:'2026-11-03T13:10:00Z'};
const custodyRows=[pending,ownerCustody],exactCustody=custody589(...args,custodyRows,asOf);
const custodyArgs=[...args,custodyRows],providerCustody=exactCustody.cases.find(x=>x.followup_type==='INDEPENDENT_RECEIPT_WITNESS');
const ownerCustodyCase=exactCustody.cases.find(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION');
const witnessRow=(c,action,stamp)=>({custody_pin:custodyPin590(c,c.custody_reviews[0]),
  disposition_pin:c.disposition_pin,next_action:action,previous_witness_ref:'',
  current_witness_ref:'Candidate witness source',independent_reviewer_ref:'Independent reviewer candidate',
  provider_custody_locator:'Primary provider receipt not authenticated',owner_decision_locator:'',
  owner_account_id:'shop1',owner_product_ref:'54',owner_action_scope:'UPLOAD_IMAGE',
  reason:'Independent source attestation and owner action decision still missing.',
  recorded_at:stamp,next_review_at:'2026-11-04T12:00:00Z'});
const witnessRows=[witnessRow(providerCustody,'REQUEST_INDEPENDENT_WITNESS_CONTINUITY_ATTESTATION',
  '2026-11-03T13:20:00Z'),witnessRow(ownerCustodyCase,'REQUEST_EXPLICIT_OWNER_CLOSURE_DECISION',
  '2026-11-03T13:21:00Z')];
const sourceArgs=[exactCustody,custodyArgs,witnessRows],exactWitness=witnessContinuity590(...sourceArgs,asOf);
const providerCase=exactWitness.cases.find(x=>x.followup_type==='INDEPENDENT_RECEIPT_WITNESS'),
  ownerCase590=exactWitness.cases.find(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION');
const pendingEscalation={witness_pin:witnessPin591(providerCase,providerCase.witness_continuity_reviews[0]),
  custody_pin:providerCase.custody_pin,next_action:'ESCALATE_INDEPENDENT_WITNESS_CHAIN_BREAK',
  independent_case_ref:'External witness case 591',escalation_owner_ref:'Independent reviewer pending',
  primary_receipt_ref:'Original provider document locator unverified',owner_handoff_ref:'',
  provider_account_id:'different-shop',product_ref:'54',action_scope:'UPLOAD_IMAGE',
  reason:'Provider custody identity and independent chain confirmation needed.',
  recorded_at:'2026-11-03T13:40:00Z',next_review_at:'2026-11-04T12:00:00Z'};
export const fixture591={sourceArgs,exactWitness,pendingEscalation,providerCase,ownerCase590,asOf};
test('source-pinned witness escalation prioritizes open evidence and mismatched provider account',()=>{
  const r=escalation591(exactWitness,sourceArgs,[pendingEscalation],asOf);
  assert.equal(r.format,FORMAT_591);assert.equal(r.open_escalation_cases,2);
  assert.equal(r.owner_scope_conflicts,1);assert.equal(r.missing_handoffs,1);
  const c=r.cases.find(x=>x.followup_type==='INDEPENDENT_RECEIPT_WITNESS');
  assert.ok(c.original_witness_gaps.length>0);
  assert.deepEqual(c.latest_followup.scope_conflicts,['EXACT_OWNER_ACCOUNT_MISMATCH']);
  assert.equal(c.witnessed_source_authenticated,false);
  assert.equal(r.authenticated_provider_witnesses,0);assert.equal(r.verified_owner_trial_signoffs,0);
  assert.equal(r.verified_exception_closures,0);assert.equal(r.provider_writes,0);
  assert.equal(r.d1_operations,0);
});
test('owner exact-action handoff is documentary, due dates and duplicate references remain open',()=>{
  const owner={...pendingEscalation,witness_pin:witnessPin591(ownerCase590,ownerCase590.witness_continuity_reviews[0]),
    custody_pin:ownerCase590.custody_pin,next_action:'REQUEST_EXACT_OWNER_GATE_DECISION',
    provider_account_id:'shop1',owner_handoff_ref:'Owner separately signed decision pending',
    recorded_at:'2026-11-03T13:41:00Z'};
  const r=escalation591(exactWitness,sourceArgs,[pendingEscalation,owner],'2026-11-05T12:00:00Z');
  assert.equal(r.owner_decision_handoffs,1);
  assert.equal(r.overdue_escalations,2);
  assert.deepEqual(r.duplicate_external_case_refs,['External witness case 591']);
  assert.equal(r.verified_owner_trial_signoffs,0);assert.equal(r.trial_eligible_cases,0);
  assert.throws(()=>escalation591(exactWitness,sourceArgs,[{...pendingEscalation,next_action:'REQUEST_EXACT_OWNER_GATE_DECISION'}],asOf));
});
test('stale source, forbidden approval and secrets are rejected without closing any case',()=>{
  const stale={...pendingEscalation,witness_pin:'["stale", "old", "unrelated witness", "source moved", "no current source", "not valid"]'};
  assert.equal(escalation591(exactWitness,sourceArgs,[stale],asOf).stale_escalation_requests.length,1);
  assert.throws(()=>escalation591({...exactWitness,source_pin:'forged'},sourceArgs,[],asOf));
  assert.throws(()=>escalationRequest591({...pendingEscalation,next_action:'AUTHORIZE_META_POST'}));
  assert.throws(()=>escalationRequest591({...pendingEscalation,owner_handoff_ref:'Bearer unsafe-token'}));
  assert.throws(()=>escalationRequest591({...pendingEscalation,next_review_at:'2026-11-02T00:00:00Z'}));
  assert.throws(()=>escalation591(exactWitness,sourceArgs,Array(101).fill(pendingEscalation),asOf));
});
test('Admin, CI and immutable deployment marker include Build 591 with no provider transport',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-escalation-591.mjs');
  for(const id of ['dd591Review','dd591Case','dd591Action','dd591External','dd591Reviewer',
    'dd591Receipt','dd591Owner','dd591Account','dd591Product','dd591Scope','dd591Due',
    'dd591Reason','dd591Ack','dd591Save','dd591Copy','dd591State','dd591Output'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:591|592|593|594|595)/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build591_witness_escalation\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:591|592|593|594|595)/);
});
