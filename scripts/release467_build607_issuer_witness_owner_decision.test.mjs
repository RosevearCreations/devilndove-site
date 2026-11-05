import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FORMAT_606,FORMAT_607,decisionAuditCandidate607,reconcileDecisionAudit607,
  reviewDecisionAudit607,filterDecisionAudit607,unsignedDecisionHandoff607}
  from '../public/js/admin-channel-issuer-response-598.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const asOf='2026-11-11T12:00:00Z';
const original=(id,owner=false)=>({
  case_pin:'dd596-case:'+id,channel:'ETSY',account_id:'shop-607',
  product_ref:'SKU-'+id,exact_action:'CREATE_DRAFT',priority:'HIGH',
  owner_trial_decision_pending:owner,
  open_exceptions:[owner?'EXACT_OWNER_AUTHORIZATION_PENDING':'ORIGINAL_ISSUER_IDENTITY_PENDING'],
  expected_issuer_ref:'issuer-original-607',expected_owner_signer_ref:'owner-607',
  source_digest:'a'.repeat(64),
  challenge_witness_consent_notes:[
    {kind:'ISSUER_CALLBACK_CHALLENGE',challenge_ref:'challenge-'+id,
      response_receipt_ref:'original-response-'+id,
      challenge_expires_at:'2026-11-09T12:00:00Z'},
    {kind:'WITNESS_REVERIFICATION',witness_identity_ref:'witness-original-607'},
    ...(owner?[{kind:'OWNER_CONSENT_READINESS',owner_signer_ref:'owner-607',
      owner_signed_receipt_ref:'owner-renewal-607',
      owner_signed_at:'2026-11-03T12:00:00Z',
      owner_expires_at:'2026-11-10T12:00:00Z'}]:[])],
  remaining_blockers:['ORIGINAL_EXTERNAL_ISSUER_AUTHENTICATION_HOLD'],
  aging:{bucket:'ON_TRACK',due_at:'2026-11-12T12:00:00Z'}
});
const issuer=original('issuer-607'),owner=original('owner-607',true);
const e606={format:FORMAT_606,build:606,as_of:asOf,cases:[issuer,owner]};
const row=(c,kind='ISSUER_CALLBACK_OUTCOME')=>({
  case_pin:c.case_pin,exception_code:c.open_exceptions[0],kind,
  issuer_state:'REPORTED_MATCH_UNVERIFIED',
  witness_state:'REPORTED_RECONCILED_UNVERIFIED',
  owner_state:'REPORTED_SIGNED_UNVERIFIED',
  challenge_ref:'challenge-'+c.case_pin.split(':')[1],
  issuer_outcome_ref:'outcome-'+c.product_ref,
  original_response_ref:'original-response-'+c.case_pin.split(':')[1],
  original_issuer_authority_ref:'trusted-issuer-directory-607',
  issuer_reviewer_ref:'separate-issuer-reviewer-607',
  issuer_outcome_at:'2026-11-08T12:00:00Z',
  witness_original_identity_ref:'witness-original-607',
  witness_current_identity_ref:'witness-original-607',
  witness_authority_ref:'trusted-witness-directory-607',
  witness_conflict_receipt_ref:'witness-review-'+c.product_ref,
  witness_reviewer_ref:'separate-witness-reviewer-607',
  witness_conflict_reviewed_at:'2026-11-08T12:00:00Z',
  owner_signer_ref:c.owner_trial_decision_pending?'owner-607':'',
  owner_signed_receipt_ref:c.owner_trial_decision_pending?'owner-renewal-607':'',
  owner_independent_witness_ref:c.owner_trial_decision_pending?'independent-owner-witness-607':'',
  owner_account:c.owner_trial_decision_pending?c.account_id:'',
  owner_product:c.owner_trial_decision_pending?c.product_ref:'',
  owner_action:c.owner_trial_decision_pending?c.exact_action:'',
  owner_decision_ref:c.owner_trial_decision_pending?'owner-audit-607':'',
  owner_signed_at:c.owner_trial_decision_pending?'2026-11-03T12:00:00Z':'',
  owner_expires_at:c.owner_trial_decision_pending?'2026-11-10T12:00:00Z':'',
  reason:'Trusted original issuer, independent witness and exact owner must verify this.',
  recorded_at:'2026-11-11T11:00:00Z',next_review_at:'2026-11-12T12:00:00Z'
});

test('Build 607 tracks source-pinned issuer, witness and owner decision as strict HOLD',()=>{
  const p=reviewDecisionAudit607(e606,[row(issuer),
    row(issuer,'WITNESS_IDENTITY_CONFLICT'),row(owner,'EXACT_OWNER_CONSENT_DECISION')],asOf);
  assert.equal(p.format,FORMAT_607);assert.equal(p.open_cases,2);
  assert.equal(p.owner_consent_expired,1);
  assert.equal(filterDecisionAudit607(p,'OWNER').length,1);
  assert.equal(filterDecisionAudit607(p,'CONSENT_EXPIRED').length,1);
  assert.ok(p.cases[1].remaining_blockers.includes('EXACT_OWNER_CONSENT_EXPIRED'));
  for(const k of ['issuer_authenticated','witness_conflict_closed',
    'owner_consent_authenticated','authorized_trials','provider_reads',
    'provider_writes','d1_operations'])assert.equal(p[k],0,k);
  const packet=unsignedDecisionHandoff607(p,owner.case_pin);
  assert.equal(packet.exact_shop_account,owner.account_id);
  assert.equal(packet.exact_product_sku,owner.product_ref);
  assert.equal(packet.exact_action,owner.exact_action);
  assert.equal(packet.owner_consent_decisions.length,1);
  assert.equal(packet.trial_authorized,false);
});

test('Changed callback receipt, challenge, identity and self-referential authority remain open',()=>{
  const p=reviewDecisionAudit607(e606,[{...row(issuer),
    challenge_ref:'substituted-challenge',original_response_ref:'different-response',
    original_issuer_authority_ref:'different-response',
    issuer_reviewer_ref:'issuer-original-607',
    issuer_outcome_at:'2026-11-10T12:00:00Z'},
    {...row(issuer,'WITNESS_IDENTITY_CONFLICT'),
      witness_original_identity_ref:'changed-original',
      witness_current_identity_ref:'new-witness',
      witness_reviewer_ref:'new-witness'}],asOf);
  const b=p.cases[0].remaining_blockers;
  for(const code of ['CALLBACK_CHALLENGE_IDENTIFIER_SUBSTITUTED',
    'CALLBACK_ORIGINAL_RESPONSE_RECEIPT_CHANGED',
    'CALLBACK_OUTCOME_AFTER_CHALLENGE_EXPIRY',
    'ISSUER_OUTCOME_AUTHORITY_SELF_REFERENTIAL',
    'ISSUER_OUTCOME_REVIEWER_NOT_INDEPENDENT',
    'WITNESS_ORIGINAL_IDENTITY_SUBSTITUTED','WITNESS_CURRENT_IDENTITY_CONFLICT',
    'WITNESS_CONFLICT_REVIEWER_NOT_INDEPENDENT'])assert.ok(b.includes(code),code);
});

test('Exact owner signer, receipt and independent witness disputes cannot authorize trial',()=>{
  const p=reviewDecisionAudit607(e606,[{...row(owner,'EXACT_OWNER_CONSENT_DECISION'),
    owner_signer_ref:'other-owner',owner_signed_receipt_ref:'other-consent',
    owner_independent_witness_ref:'other-owner',
    owner_decision_ref:'other-consent',owner_state:'DECLINED'}],asOf);
  const b=p.cases[1].remaining_blockers;
  for(const code of ['EXACT_OWNER_SIGNER_CONFLICT','OWNER_SIGNED_CONSENT_RECEIPT_SUBSTITUTED',
    'OWNER_CONSENT_WITNESS_NOT_INDEPENDENT',
    'OWNER_CONSENT_AUDIT_REUSES_UNVERIFIED_RECEIPT',
    'OWNER_CONSENT_EXPLICITLY_NOT_GRANTED'])assert.ok(b.includes(code),code);
  assert.equal(p.authorized_trials,0);
});

test('Wrong owner scope, altered original source, forbidden approval, secret and dates reject',()=>{
  assert.throws(()=>reconcileDecisionAudit607({...e606,build:0},[{}, {}, {}],[],asOf));
  assert.throws(()=>reconcileDecisionAudit607(e606,[{}, {}],[],asOf));
  assert.throws(()=>reviewDecisionAudit607(e606,[{
    ...row(owner,'EXACT_OWNER_CONSENT_DECISION'),owner_product:'another-sku'}],asOf));
  assert.throws(()=>reviewDecisionAudit607(e606,[{
    ...row(issuer),kind:'EXACT_OWNER_CONSENT_DECISION'}],asOf));
  for(const bad of [{...row(issuer),trial_authorized:true},
    {...row(issuer),original_issuer_authority_ref:'Bearer topsecret'},
    {...row(issuer),issuer_outcome_at:'2030-01-01T00:00:00Z'},
    {...row(owner),owner_expires_at:'2026-11-02T11:00:00Z'}])
    assert.throws(()=>decisionAuditCandidate607(bad));
});

test('Build 607 actual admin UI, safe transport, quality gate and production release marker',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd607Title','dd607Refresh','dd607Metrics','dd607Filter','dd607Search',
    'dd607Rows','dd607Case','dd607Exception','dd607Kind','dd607Challenge',
    'dd607Outcome','dd607Response','dd607Authority','dd607IssuerReviewer',
    'dd607IssuerAt','dd607IssuerState','dd607WitnessOriginal','dd607WitnessCurrent',
    'dd607WitnessAuthority','dd607WitnessReceipt','dd607WitnessReviewer','dd607WitnessAt',
    'dd607WitnessState','dd607Signer','dd607OwnerReceipt','dd607OwnerWitness',
    'dd607Account','dd607Product','dd607Action','dd607OwnerDecision','dd607OwnerSigned',
    'dd607OwnerExpires','dd607OwnerState','dd607Due','dd607Reason','dd607Ack',
    'dd607Save','dd607Copy','dd607Status','dd607Output','dd607Prepare',
    'dd607CopyHandoff','dd607Handoff'])assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build 6\d{2}/);
  assert.match(html,/admin-channel-issuer-response-598\.mjs\?v=6\d{2}/);
  for(const name of [
    'admin-channel-witness-584.mjs?v=594',
    'admin-channel-receipt-followup-585.mjs?v=594'])assert.ok(html.includes(name));
  const js=read('public/js/admin-channel-issuer-response-598.mjs');
  assert.match(js,/export const FORMAT_607=/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build607_issuer_witness_owner_decision\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":6\d{2}/);
});
