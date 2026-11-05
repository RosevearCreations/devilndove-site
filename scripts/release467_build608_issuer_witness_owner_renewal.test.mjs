import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FORMAT_606,reviewDecisionAudit607,FORMAT_608,attestationCandidate608,
  reviewAttestation608,reconcileAttestation608,filterAttestation608,
  unsignedAttestationHandoff608}
  from '../public/js/admin-channel-issuer-response-598.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const asOf='2026-11-13T12:00:00Z';
const original=(id,owner=false)=>({
  case_pin:'dd596-case:'+id,channel:'ETSY',account_id:'shop-608',
  product_ref:'SKU-'+id,exact_action:'CREATE_DRAFT',priority:'HIGH',
  owner_trial_decision_pending:owner,
  open_exceptions:[owner?'EXACT_OWNER_AUTHORIZATION_PENDING':'ORIGINAL_ISSUER_IDENTITY_PENDING'],
  expected_issuer_ref:'original-issuer-608',expected_owner_signer_ref:'owner-608',
  source_digest:'b'.repeat(64),remaining_blockers:['ORIGINAL_EXTERNAL_ISSUER_AUTHENTICATION_HOLD'],
  aging:{bucket:'ON_TRACK',due_at:'2026-11-14T12:00:00Z'},
  challenge_witness_consent_notes:[
    {kind:'ISSUER_CALLBACK_CHALLENGE',challenge_ref:'challenge-'+id,
      response_receipt_ref:'response-'+id,challenge_expires_at:'2026-11-09T12:00:00Z'},
    {kind:'WITNESS_REVERIFICATION',witness_identity_ref:'witness-original-608'},
    ...(owner?[{kind:'OWNER_CONSENT_READINESS',owner_signer_ref:'owner-608',
      owner_signed_receipt_ref:'owner-renewal-608',owner_signed_at:'2026-11-03T12:00:00Z',
      owner_expires_at:'2026-11-11T12:00:00Z'}]:[])]
});
const issuer=original('issuer-608'),owner=original('owner-608',true);
const row607=(c,kind='ISSUER_CALLBACK_OUTCOME')=>({
  case_pin:c.case_pin,exception_code:c.open_exceptions[0],kind,
  issuer_state:'REPORTED_MATCH_UNVERIFIED',witness_state:'REPORTED_RECONCILED_UNVERIFIED',
  owner_state:'REPORTED_SIGNED_UNVERIFIED',
  challenge_ref:'challenge-'+c.case_pin.split(':')[1],
  issuer_outcome_ref:'outcome-'+c.product_ref,
  original_response_ref:'response-'+c.case_pin.split(':')[1],
  original_issuer_authority_ref:'external-issuer-directory-608',
  issuer_reviewer_ref:'separate-issuer-reviewer-608',
  issuer_outcome_at:'2026-11-08T12:00:00Z',
  witness_original_identity_ref:'witness-original-608',
  witness_current_identity_ref:'witness-original-608',
  witness_authority_ref:'external-witness-directory-608',
  witness_conflict_receipt_ref:'witness-conflict-'+c.product_ref,
  witness_reviewer_ref:'separate-witness-reviewer-608',
  witness_conflict_reviewed_at:'2026-11-08T12:00:00Z',
  owner_signer_ref:c.owner_trial_decision_pending?'owner-608':'',
  owner_signed_receipt_ref:c.owner_trial_decision_pending?'owner-renewal-608':'',
  owner_independent_witness_ref:c.owner_trial_decision_pending?'owner-independent-witness-608':'',
  owner_account:c.owner_trial_decision_pending?c.account_id:'',
  owner_product:c.owner_trial_decision_pending?c.product_ref:'',
  owner_action:c.owner_trial_decision_pending?c.exact_action:'',
  owner_decision_ref:c.owner_trial_decision_pending?'original-owner-decision-608':'',
  owner_signed_at:c.owner_trial_decision_pending?'2026-11-03T12:00:00Z':'',
  owner_expires_at:c.owner_trial_decision_pending?'2026-11-11T12:00:00Z':'',
  reason:'Original issuer, separate witness and exact signed owner still need verification.',
  recorded_at:'2026-11-11T11:00:00Z',next_review_at:'2026-11-14T12:00:00Z'
});
const prior=reviewDecisionAudit607({format:FORMAT_606,build:606,as_of:asOf,
  cases:[issuer,owner]},[row607(issuer),
  row607(issuer,'WITNESS_IDENTITY_CONFLICT'),
  row607(owner,'EXACT_OWNER_CONSENT_DECISION')],asOf);
const row=(c,kind='ISSUER_OUTCOME_ATTESTATION')=>({
  case_pin:c.case_pin,exception_code:c.open_exceptions[0],kind,
  issuer_attestation_ref:'issuer-attestation-'+c.product_ref,
  issuer_original_outcome_ref:'outcome-'+c.product_ref,
  issuer_original_response_ref:'response-'+c.case_pin.split(':')[1],
  issuer_authority_ref:'independent-original-issuer-608',
  issuer_reviewer_ref:'separate-attestation-reviewer-608',
  issuer_attested_at:'2026-11-10T12:00:00Z',
  issuer_state:'REPORTED_ATTESTED_UNVERIFIED',
  witness_conflict_receipt_ref:'witness-conflict-'+c.product_ref,
  witness_escalation_ref:'escalation-'+c.product_ref,
  witness_authority_ref:'independent-external-witness-608',
  witness_reviewer_ref:'separate-escalation-reviewer-608',
  witness_escalated_at:'2026-11-10T12:00:00Z',
  witness_response_due_at:'2026-11-11T12:00:00Z',
  witness_state:'EXTERNALLY_ESCALATED',
  owner_original_decision_ref:c.owner_trial_decision_pending?'original-owner-decision-608':'',
  owner_renewal_receipt_ref:c.owner_trial_decision_pending?'owner-renewal-608':'',
  owner_signer_ref:c.owner_trial_decision_pending?'owner-608':'',
  owner_witness_ref:c.owner_trial_decision_pending?'independent-renewal-witness-608':'',
  owner_account:c.owner_trial_decision_pending?c.account_id:'',
  owner_product:c.owner_trial_decision_pending?c.product_ref:'',
  owner_action:c.owner_trial_decision_pending?c.exact_action:'',
  owner_handoff_ref:c.owner_trial_decision_pending?'unsigned-owner-handoff-608':'',
  owner_renewed_signed_at:c.owner_trial_decision_pending?'2026-11-03T12:00:00Z':'',
  owner_renewal_expires_at:c.owner_trial_decision_pending?'2026-11-11T12:00:00Z':'',
  owner_state:'REPORTED_SIGNED_UNVERIFIED',
  reason:'External independent original attestation and witness proof remain pending.',
  recorded_at:'2026-11-13T11:00:00Z',next_review_at:'2026-11-14T12:00:00Z'
});

test('Build 608 creates exact original attestation and witness escalation with strict HOLD',()=>{
  const p=reviewAttestation608(prior,[row(issuer),
    row(issuer,'WITNESS_CONFLICT_ESCALATION'),
    row(owner,'EXACT_OWNER_RENEWAL_DECISION_HANDOFF')],asOf);
  assert.equal(p.format,FORMAT_608);assert.equal(p.open_cases,2);
  assert.equal(p.witness_escalations_overdue,1);
  assert.equal(p.owner_renewal_expired,1);
  assert.equal(filterAttestation608(p,'ESCALATION_OVERDUE').length,1);
  assert.equal(filterAttestation608(p,'CONSENT_EXPIRED').length,1);
  assert.ok(p.cases[1].remaining_blockers.includes('EXACT_OWNER_RENEWAL_EXPIRED'));
  for(const k of ['issuer_authenticated','witness_conflict_closed',
    'owner_consent_authenticated','authorized_trials','provider_reads',
    'provider_writes','d1_operations'])assert.equal(p[k],0,k);
  const packet=unsignedAttestationHandoff608(p,owner.case_pin);
  assert.equal(packet.exact_shop_account,owner.account_id);
  assert.equal(packet.exact_product_sku,owner.product_ref);
  assert.equal(packet.exact_action,owner.exact_action);
  assert.equal(packet.exact_owner_renewal_handoffs.length,1);
  assert.equal(packet.trial_authorized,false);
});

test('Issuer receipt substitution and independent witness escalation disputes remain blocked',()=>{
  const p=reviewAttestation608(prior,[{...row(issuer),
    issuer_original_outcome_ref:'other-issuer-outcome',
    issuer_original_response_ref:'other-issuer-response',
    issuer_authority_ref:'other-issuer-response',
    issuer_reviewer_ref:'original-issuer-608'},
    {...row(issuer,'WITNESS_CONFLICT_ESCALATION'),
      witness_conflict_receipt_ref:'different-witness-receipt',
      witness_authority_ref:'escalation-SKU-issuer-608',
      witness_reviewer_ref:'original-issuer-608'}],asOf);
  const b=p.cases[0].remaining_blockers;
  for(const code of ['ORIGINAL_ISSUER_OUTCOME_RECEIPT_SUBSTITUTED',
    'ORIGINAL_ISSUER_RESPONSE_RECEIPT_SUBSTITUTED',
    'ISSUER_ATTESTATION_AUTHORITY_SELF_REFERENTIAL',
    'ISSUER_ATTESTATION_REVIEWER_NOT_INDEPENDENT',
    'ORIGINAL_WITNESS_CONFLICT_RECEIPT_CHANGED',
    'WITNESS_ESCALATION_AUTHORITY_SELF_REFERENTIAL',
    'WITNESS_ESCALATION_REVIEWER_NOT_INDEPENDENT',
    'WITNESS_EXTERNAL_ESCALATION_OVERDUE'])assert.ok(b.includes(code),code);
});

test('Original owner scope, signature, renewal and witness reuse cannot close consent',()=>{
  const p=reviewAttestation608(prior,[{...row(owner,'EXACT_OWNER_RENEWAL_DECISION_HANDOFF'),
    owner_signer_ref:'substitute-owner',owner_renewal_receipt_ref:'substitute-consent',
    owner_witness_ref:'substitute-owner',owner_handoff_ref:'original-owner-decision-608',
    owner_state:'DECLINED'}],asOf);
  const b=p.cases[1].remaining_blockers;
  for(const code of ['EXACT_OWNER_SIGNER_SUBSTITUTED',
    'EXACT_OWNER_RENEWAL_RECEIPT_SUBSTITUTED',
    'OWNER_RENEWAL_WITNESS_NOT_INDEPENDENT',
    'OWNER_RENEWAL_HANDOFF_REUSES_DECISION_OR_RECEIPT',
    'OWNER_RENEWAL_NOT_GRANTED'])assert.ok(b.includes(code),code);
  assert.equal(p.authorized_trials,0);
});

test('Altered source, forged approval, secret, date and mismatched account reject',()=>{
  assert.throws(()=>reconcileAttestation608({...prior,build:0},[{}, {}, {}],[],asOf));
  assert.throws(()=>reconcileAttestation608(prior,[{}, {}],[],asOf));
  assert.throws(()=>reviewAttestation608(prior,[{
    ...row(owner,'EXACT_OWNER_RENEWAL_DECISION_HANDOFF'),owner_account:'other-shop'}],asOf));
  assert.throws(()=>reviewAttestation608(prior,[{
    ...row(issuer),kind:'EXACT_OWNER_RENEWAL_DECISION_HANDOFF'}],asOf));
  for(const bad of [{...row(issuer),trial_authorized:true},
    {...row(issuer),issuer_authority_ref:'Bearer unsafe-token'},
    {...row(issuer),issuer_attested_at:'2030-01-01T00:00:00Z'},
    {...row(owner),owner_renewal_expires_at:'2026-11-01T12:00:00Z'},
    {...row(issuer),witness_response_due_at:'2026-11-09T12:00:00Z'}])
    assert.throws(()=>attestationCandidate608(bad));
});

test('Actual admin controls, read-only runtime, protected quality gate and release identity',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd608Title','dd608Refresh','dd608Metrics','dd608Filter',
    'dd608Search','dd608Rows','dd608Case','dd608Exception','dd608Kind',
    'dd608IssuerAttestation','dd608IssuerOutcome','dd608IssuerResponse',
    'dd608IssuerAuthority','dd608IssuerReviewer','dd608IssuerAt','dd608IssuerState',
    'dd608WitnessConflict','dd608WitnessEscalation','dd608WitnessAuthority',
    'dd608WitnessReviewer','dd608WitnessAt','dd608WitnessDue','dd608WitnessState',
    'dd608OwnerDecision','dd608OwnerReceipt','dd608OwnerSigner','dd608OwnerWitness',
    'dd608Account','dd608Product','dd608Action','dd608OwnerHandoff',
    'dd608OwnerSigned','dd608OwnerExpires','dd608OwnerState','dd608Due',
    'dd608Reason','dd608Ack','dd608Save','dd608Copy','dd608Status','dd608Output',
    'dd608Prepare','dd608CopyHandoff','dd608Handoff'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build 608/);
  assert.match(html,/admin-channel-issuer-response-598\.mjs\?v=608/);
  const js=read('public/js/admin-channel-issuer-response-598.mjs');
  assert.match(js,/export const FORMAT_608=/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build608_issuer_witness_owner_renewal\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":608/);
});
