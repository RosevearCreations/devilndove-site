import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {escalation591,witnessPin591} from '../public/js/admin-channel-escalation-591.mjs';
import {receiptReconciliation592,receiptCandidate592,escalationPin592,FORMAT_592} from
  '../public/js/admin-channel-receipt-reconciliation-592.mjs';
import {fixture591} from './release467_build591_witness_escalation.test.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {sourceArgs,exactWitness,pendingEscalation,ownerCase590,asOf}=fixture591;
const ownerEscalation={...pendingEscalation,
  witness_pin:witnessPin591(ownerCase590,ownerCase590.witness_continuity_reviews[0]),
  custody_pin:ownerCase590.custody_pin,next_action:'REQUEST_EXACT_OWNER_GATE_DECISION',
  provider_account_id:'shop1',owner_handoff_ref:'Owner exact scope decision locator is unsigned',
  independent_case_ref:'Owner external case 591',recorded_at:'2026-11-03T13:41:00Z'};
const escalationRows=[pendingEscalation,ownerEscalation];
const exactEscalation=escalation591(exactWitness,sourceArgs,escalationRows,asOf);
const escalationArgs=[exactWitness,sourceArgs,escalationRows];
const p=exactEscalation.cases.find(x=>x.followup_type==='INDEPENDENT_RECEIPT_WITNESS');
const o=exactEscalation.cases.find(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION');
const candidate={escalation_pin:escalationPin592(p,p.latest_followup),
  next_action:'REQUEST_ORIGINAL_PROVIDER_RECEIPT_READBACK',
  external_case_ref:'External witness case 591',
  original_provider_receipt_ref:'Original provider document locator unverified',
  external_response_ref:'Candidate external provider response 592',
  independent_reviewer_ref:'Independent reviewer pending',
  independent_witness_ref:'Other candidate witness',owner_decision_ref:'',owner_signer_ref:'',
  provider_account_id:'different-shop',product_ref:'54',action_scope:'UPLOAD_IMAGE',
  reason:'Original provider response is not independently attested and remains on hold.',
  recorded_at:'2026-11-03T13:50:00Z',next_review_at:'2026-11-04T12:00:00Z'};
export const fixture592={exactEscalation,escalationArgs,candidate,asOf};
test('original provider receipt is compared to exact escalation and remains unauthenticated',()=>{
  const result=receiptReconciliation592(exactEscalation,escalationArgs,[candidate],asOf);
  assert.equal(result.format,FORMAT_592);assert.equal(result.open_reconciliation_cases,2);
  assert.equal(result.missing_receipt_reconciliations,1);
  assert.equal(result.source_conflicts,1);
  assert.deepEqual(result.cases.find(c=>c.followup_type==='INDEPENDENT_RECEIPT_WITNESS')
    .latest_reconciliation.source_conflicts,['EXACT_ACCOUNT_CONFLICT']);
  assert.equal(result.authenticated_external_receipts,0);assert.equal(result.verified_owner_decisions,0);
  assert.equal(result.closed_exceptions,0);assert.equal(result.trial_eligible_cases,0);
  assert.equal(result.provider_writes,0);assert.equal(result.d1_operations,0);
});
test('contradictory receipt, external case and reviewer references cannot become authenticated',()=>{
  const changed={...candidate,external_case_ref:'unrelated external case',
    original_provider_receipt_ref:'different provider receipt',
    independent_reviewer_ref:'unrelated reviewer',independent_witness_ref:'unrelated reviewer',
    provider_account_id:'shop1',product_ref:'wrong-product',action_scope:'PUBLISH'};
  const result=receiptReconciliation592(exactEscalation,escalationArgs,[changed],asOf);
  const conflicts=result.cases.find(c=>c.followup_type==='INDEPENDENT_RECEIPT_WITNESS')
    .latest_reconciliation.source_conflicts;
  for(const code of ['EXTERNAL_CASE_REFERENCE_DIFFERS_FROM_ESCALATION',
    'PRIMARY_PROVIDER_RECEIPT_DIFFERS_FROM_ESCALATION',
    'ASSIGNED_INDEPENDENT_REVIEWER_DIFFERS_FROM_ESCALATION',
    'EXACT_PRODUCT_CONFLICT','EXACT_ACTION_CONFLICT','WITNESS_REVIEWER_INDEPENDENCE_CONFLICT'])
    assert.ok(conflicts.includes(code),code);
  assert.equal(result.authenticated_external_receipts,0);
});
test('exact owner decision remains separate, overdue, and duplicate candidate responses are flagged',()=>{
  const owner={...candidate,escalation_pin:escalationPin592(o,o.latest_followup),
    next_action:'RECONCILE_EXACT_OWNER_DECISION_LOCATOR',
    external_case_ref:'Owner external case 591',provider_account_id:'shop1',
    owner_decision_ref:'Unsigned owner decision evidence candidate',
    owner_signer_ref:'Owner identity still pending external authentication',
    recorded_at:'2026-11-03T13:51:00Z'};
  const result=receiptReconciliation592(exactEscalation,escalationArgs,[candidate,owner],
    '2026-11-05T12:00:00Z');
  assert.equal(result.overdue_rechecks,2);assert.equal(result.owner_decision_followups,1);
  assert.deepEqual(result.repeated_external_response_refs,['Candidate external provider response 592']);
  assert.equal(result.verified_owner_decisions,0);assert.equal(result.closed_exceptions,0);
  assert.throws(()=>receiptReconciliation592(exactEscalation,escalationArgs,
    [{...candidate,next_action:'REQUEST_SEPARATE_OWNER_APPROVAL_OR_DECLINE'}],asOf));
});
test('stale, forged and unsafe candidate records fail closed',()=>{
  const stale={...candidate,escalation_pin:'["stale", "external", "unrelated", "reference", "not current", "source moved"]'};
  assert.equal(receiptReconciliation592(exactEscalation,escalationArgs,[stale],asOf)
    .stale_external_receipt_followups.length,1);
  assert.throws(()=>receiptReconciliation592({...exactEscalation,source_pin:'tampered'},
    escalationArgs,[],asOf));
  assert.throws(()=>receiptCandidate592({...candidate,next_action:'AUTHORIZE_FACEBOOK_POST'}));
  assert.throws(()=>receiptCandidate592({...candidate,owner_decision_ref:'Bearer secret-value'}));
  assert.throws(()=>receiptCandidate592({...candidate,owner_trial_authorized:true}));
  assert.throws(()=>receiptCandidate592({...candidate,next_review_at:'2026-11-01T00:00:00Z'}));
  assert.throws(()=>receiptReconciliation592(exactEscalation,escalationArgs,
    Array(101).fill(candidate),asOf));
});
test('new admin section, CI and immutable production marker use Build 592 without provider requests',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-receipt-reconciliation-592.mjs');
  for(const id of ['dd592Review','dd592Case','dd592Action','dd592External','dd592Receipt',
    'dd592Response','dd592Reviewer','dd592Witness','dd592Owner','dd592Signer',
    'dd592Account','dd592Product','dd592Scope','dd592Due','dd592Reason','dd592Ack',
    'dd592Save','dd592Copy','dd592State','dd592Output'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:592|593|594|595|596|597|598)/);
  assert.match(html,/admin-channel-receipt-reconciliation-592\.mjs\?v=(?:592|593|594|595|596|597)/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build592_receipt_reconciliation\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:592|593|594|595|596|597|598)/);
});
