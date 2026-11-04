import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture595} from './release467_build595_source_verification.test.mjs';
import {sourceVerification595} from '../public/js/admin-channel-source-verification-595.mjs';
import {evidenceWorkboard596} from '../public/js/admin-channel-review-workboard-596.mjs';
import {reconcileSource597} from '../public/js/admin-channel-source-disposition-597.mjs';
import {issuerResponseReview598,receiptIntake599,decisionRegister600,
  FORMAT_601,escalationCandidate601,reconcileEscalations601,
  filterEscalations601,unsignedHandoff601} from '../public/js/admin-channel-issuer-response-598.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {exact594,upstream594,providerRow,ownerRow,asOf}=fixture595;
const s595=[exact594,upstream594,[providerRow,ownerRow]],e595=sourceVerification595(...s595,asOf);
const s596=[e595,s595],e596=evidenceWorkboard596(...s596,[],asOf);
const s597=[e596,s596,[]],e597=reconcileSource597(...s597,[],asOf);
const s598=[e597,s597,[]],e598=issuerResponseReview598(...s598,[],asOf);
const s599=[e598,s598,[]],e599=receiptIntake599(...s599,[],asOf);
const s600=[e599,s599,[]],e600=decisionRegister600(...s600,[],asOf);
const provider=e600.cases.find(c=>!c.owner_trial_decision_pending);
const owner=e600.cases.find(c=>c.owner_trial_decision_pending);
const candidate=c=>({case_pin:c.case_pin,exception_code:c.open_exceptions[0],
  state:c.owner_trial_decision_pending?'OWNER_SIGNED_SCOPE_AWAITED':'ISSUER_DECISION_EVIDENCE_AWAITED',
  next_action:c.owner_trial_decision_pending?'REQUEST_EXACT_OWNER_SIGNED_SCOPE':
    'REQUEST_AUTHENTIC_ORIGINAL_ISSUER_DECISION',
  issuer_decision_ref:'original-decision-still-unverified',issuer_identity_ref:c.expected_issuer_ref||'',
  external_authority_ref:'official-issuer-authority-claim',original_digest:c.source_digest||'',
  custody_receipt_ref:c.expected_custody_ref||'',closure_evidence_ref:'',
  reviewer_ref:'reviewer-601',witness_ref:'witness-601',
  owner_signer_ref:c.owner_trial_decision_pending?c.expected_owner_signer_ref||'owner-601':'',
  owner_signed_receipt_ref:'',owner_account:c.owner_trial_decision_pending?c.account_id:'',
  owner_product:c.owner_trial_decision_pending?c.product_ref:'',
  owner_action:c.owner_trial_decision_pending?c.exact_action:'',
  reason:'Authentic original issuer proof and independent closure are not available.',
  recorded_at:'2026-11-03T20:00:00Z',next_review_at:'2026-11-04T21:00:00Z'});
const pRow=candidate(provider),oRow=candidate(owner);

test('Build 601 preserves exact Build 600 chain and all provider/owner authorization HOLD gates',()=>{
  const p=reconcileEscalations601(e600,s600,[],[pRow,oRow],'2026-11-13T20:00:00Z');
  assert.equal(p.format,FORMAT_601);assert.equal(p.open_cases,2);
  assert.equal(p.issuer_escalations,1);assert.equal(p.owner_handoffs,1);
  assert.equal(p.overdue_cases,2);
  for(const field of ['issuer_decisions_authenticated','independent_conflicts_closed',
    'owner_signatures_verified','authorized_trials','provider_reads','provider_writes','d1_operations'])
    assert.equal(p[field],0,field);
  assert.ok(p.cases.every(c=>c.readiness_blockers.length&&!c.trial_authorized));
});
test('Changed original issuer/digest/custody and same-party attestations escalate; matching digest is not proof',()=>{
  const p=reconcileEscalations601(e600,s600,[],[{...pRow,
    issuer_identity_ref:'substituted-issuer',original_digest:'f'.repeat(64),
    custody_receipt_ref:'substituted-custody',
    external_authority_ref:'same-authority',issuer_decision_ref:'same-authority',
    closure_evidence_ref:'same-authority',reviewer_ref:'same-actor',witness_ref:'same-actor'}],asOf);
  const r=p.cases.find(c=>!c.owner_trial_decision_pending).latest_escalation;
  for(const code of ['ORIGINAL_ISSUER_IDENTITY_MISMATCH','ORIGINAL_DIGEST_MISMATCH',
    'ORIGINAL_CUSTODY_MISMATCH','SELF_ATTESTED_ISSUER_AUTHORITY',
    'CLOSURE_REUSES_DISPUTED_ISSUER_DECISION','REVIEWER_EQUALS_WITNESS'])
    assert.ok(r.conflicts.includes(code),code);
  assert.equal(r.digest_comparison,'DIGEST_CONFLICT_OPEN');
  assert.equal(reconcileEscalations601(e600,s600,[],[pRow],asOf)
    .cases.find(c=>!c.owner_trial_decision_pending).latest_escalation.digest_comparison,
    'LOCAL_DIGEST_MATCH_NOT_AUTHENTICATED');
  assert.equal(r.issuer_authenticated,false);assert.equal(r.independent_conflict_closed,false);
});
test('Handoff preserves exact owner shop, product and action; remains unsigned and unapproved',()=>{
  const p=reconcileEscalations601(e600,s600,[],[oRow],asOf);
  const h=unsignedHandoff601(p,owner.case_pin);
  assert.equal(h.kind,'EXACT_OWNER_AUTHORIZATION_HANDOFF');
  assert.equal(h.exact_shop_account,owner.account_id);
  assert.equal(h.exact_product_sku,owner.product_ref);
  assert.equal(h.exact_action,owner.exact_action);
  assert.equal(h.owner_authorization_granted,false);
  assert.equal(h.trial_authorized,false);
  assert.ok(h.readiness_blockers.includes('EXACT_SIGNED_OWNER_AUTHORIZATION_AWAITED'));
  const i=unsignedHandoff601(p,provider.case_pin);
  assert.equal(i.kind,'INDEPENDENT_ISSUER_CONFLICT_ESCALATION');
  assert.equal(i.provider_read_or_write_authorized,false);
});
test('Forged/stale prior evidence and mismatched exact owner scope fail closed',()=>{
  assert.throws(()=>reconcileEscalations601({...e600,build:0},s600,[],[],asOf));
  assert.throws(()=>reconcileEscalations601(e600,[{...e599,build:0},s599,[]],[],[],asOf));
  assert.throws(()=>reconcileEscalations601(e600,s600,[],[
    {...oRow,owner_account:'different-shop'}],asOf));
  assert.throws(()=>reconcileEscalations601(e600,s600,[],[
    {...pRow,next_action:'REQUEST_EXACT_OWNER_SIGNED_SCOPE'}],asOf));
  assert.throws(()=>reconcileEscalations601(e600,s600,[],[
    {...oRow,owner_action:'PUBLISH_NOW'}],asOf));
  for(const row of [{...pRow,trial_authorized:true},
    {...pRow,issuer_decision_ref:'Bearer token'},
    {...pRow,state:'AUTHENTICATED'},
    {...pRow,original_digest:'not-a-hash'}])
    assert.throws(()=>escalationCandidate601(row));
  const p=reconcileEscalations601(e600,s600,[],[
    {...pRow,case_pin:pRow.case_pin+'-old'}],asOf);
  assert.equal(p.stale_unmatched_escalations.length,1);
});
test('Review filters retain source grounded issuer/owner, overdue and pending escalations',()=>{
  const p=reconcileEscalations601(e600,s600,[],[pRow,oRow],'2026-11-13T20:00:00Z');
  assert.equal(filterEscalations601(p,'ISSUER').length,1);
  assert.equal(filterEscalations601(p,'OWNER',owner.product_ref).length,1);
  assert.equal(filterEscalations601(p,'OVERDUE').length,2);
  assert.equal(filterEscalations601(p,'STALE').length,0);
  assert.throws(()=>filterEscalations601(p,'AUTHORIZED'));
});
test('Admin section 26, workflow, marker, consolidated zero-network runtime',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd601Refresh','dd601Metrics','dd601Filter','dd601Search','dd601Rows',
    'dd601Case','dd601Exception','dd601State','dd601Action','dd601Decision',
    'dd601Issuer','dd601Authority','dd601Digest','dd601Custody','dd601Closure',
    'dd601Reviewer','dd601Witness','dd601Signer','dd601OwnerReceipt','dd601Account',
    'dd601Product','dd601Scope','dd601Due','dd601Reason','dd601Ack',
    'dd601Save','dd601Copy','dd601Status','dd601Output','dd601Prepare',
    'dd601CopyHandoff','dd601Handoff'])assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build 6\d{2}/);
  assert.match(html,/admin-channel-issuer-response-598\.mjs\?v=6\d{2}/);
  const js=read('public/js/admin-channel-issuer-response-598.mjs');
  assert.match(js,/export const FORMAT_601=/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build601_issuer_escalation_handoff\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":6\d{2}/);
});
