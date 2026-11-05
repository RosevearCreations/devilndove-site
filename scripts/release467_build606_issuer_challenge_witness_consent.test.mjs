import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FORMAT_605,FORMAT_606,challengeReviewCandidate606,
  reviewChallengeReadiness606,reconcileChallengeReadiness606,
  filterChallengeReadiness606,unsignedChallengeHandoff606}
  from '../public/js/admin-channel-issuer-response-598.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const asOf='2026-11-09T12:00:00Z';
const original=(id,owner=false)=>({
  case_pin:'dd596-case:'+id,channel:'ETSY',account_id:'shop-606',
  product_ref:'SKU-'+id,exact_action:'CREATE_DRAFT',priority:'HIGH',
  owner_trial_decision_pending:owner,
  open_exceptions:[owner?'EXACT_OWNER_RENEWAL_PENDING':'ORIGINAL_ISSUER_CHALLENGE_PENDING'],
  expected_issuer_ref:'original-issuer-606',expected_owner_signer_ref:'owner-606',
  source_digest:'a'.repeat(64),
  issuer_auth_witness_owner_handoffs:[
    {kind:'ISSUER_AUTH_FOLLOWUP',issuer_original_receipt_ref:'issuer-receipt-606'},
    {kind:'WITNESS_DISPOSITION_RECHECK',witness_identity_ref:'witness-original-606'},
    ...(owner?[{kind:'EXACT_OWNER_RENEWAL_HANDOFF',
      owner_original_receipt_ref:'owner-original-606',
      owner_renewed_receipt_ref:'owner-renewed-606',
      owner_renewed_signed_at:'2026-11-01T12:00:00Z',
      owner_renewed_expires_at:'2026-11-08T12:00:00Z'}]:[])],
  remaining_blockers:['ORIGINAL_EXTERNAL_AUTHENTICATION_HOLD'],
  aging:{bucket:'ON_TRACK',due_at:'2026-11-12T12:00:00Z'}
});
const issuer=original('issuer-606'),owner=original('owner-606',true);
const source={format:FORMAT_605,build:605,as_of:asOf,cases:[issuer,owner]};
const row=(c,kind='ISSUER_CALLBACK_CHALLENGE')=>({
  case_pin:c.case_pin,exception_code:c.open_exceptions[0],kind,
  challenge_ref:'challenge-'+c.product_ref,challenge_digest:'b'.repeat(64),
  issuer_authority_ref:'trusted-issuer-directory-606',
  callback_channel_ref:'verified-number-606',
  response_receipt_ref:'response-'+c.product_ref,issuer_verifier_ref:'issuer-reviewer-606',
  challenge_state:'REPORTED_MATCH_UNVERIFIED',
  challenge_sent_at:'2026-11-06T10:00:00Z',
  response_received_at:'2026-11-06T12:00:00Z',
  challenge_expires_at:'2026-11-07T12:00:00Z',
  witness_identity_ref:'witness-original-606',
  witness_authority_ref:'independent-witness-authority-606',
  witness_reverification_ref:'witness-receipt-'+c.product_ref,
  witness_reviewer_ref:'separate-witness-reviewer-606',
  witness_state:'REPORTED_REVERIFIED_UNTRUSTED',
  witness_reverified_at:'2026-11-07T12:00:00Z',
  owner_signer_ref:c.owner_trial_decision_pending?'owner-606':'',
  owner_signed_receipt_ref:c.owner_trial_decision_pending?'owner-renewed-606':'',
  owner_witness_ref:c.owner_trial_decision_pending?'owner-witness-606':'',
  owner_account:c.owner_trial_decision_pending?c.account_id:'',
  owner_product:c.owner_trial_decision_pending?c.product_ref:'',
  owner_action:c.owner_trial_decision_pending?c.exact_action:'',
  owner_state:'REPORTED_SIGNED_UNVERIFIED',
  owner_signed_at:c.owner_trial_decision_pending?'2026-11-01T12:00:00Z':'',
  owner_expires_at:c.owner_trial_decision_pending?'2026-11-08T12:00:00Z':'',
  owner_consent_review_due_at:c.owner_trial_decision_pending?'2026-11-10T12:00:00Z':'',
  reason:'An outside original issuer, separate witness and owner must still authenticate.',
  recorded_at:'2026-11-09T11:00:00Z',next_review_at:'2026-11-10T12:00:00Z'
});

test('Build 606 tracks expired issuer challenges and exact signed owner consent as HOLD',()=>{
  const p=reviewChallengeReadiness606(source,[row(issuer),
    row(issuer,'WITNESS_REVERIFICATION'),row(owner,'OWNER_CONSENT_READINESS')],asOf);
  assert.equal(p.format,FORMAT_606);assert.equal(p.open_cases,2);
  assert.equal(p.expired_challenges,2);assert.equal(p.consent_expired,1);
  assert.equal(filterChallengeReadiness606(p,'OWNER').length,1);
  assert.equal(filterChallengeReadiness606(p,'OWNER_EXPIRED').length,1);
  assert.equal(filterChallengeReadiness606(p,'CHALLENGE_EXPIRED').length,2);
  assert.ok(p.cases[0].remaining_blockers.includes('ISSUER_CALLBACK_CHALLENGE_EXPIRED'));
  assert.ok(p.cases[1].remaining_blockers.includes('OWNER_RENEWAL_CONSENT_EXPIRED'));
  for(const k of ['issuer_authenticated','independent_witness_verified',
    'owner_consent_authenticated','authorized_trials','provider_reads','provider_writes',
    'd1_operations'])assert.equal(p[k],0,k);
  const handoff=unsignedChallengeHandoff606(p,owner.case_pin);
  assert.equal(handoff.exact_shop_account,owner.account_id);
  assert.equal(handoff.exact_product_sku,owner.product_ref);
  assert.equal(handoff.exact_action,owner.exact_action);
  assert.equal(handoff.exact_owner_consent_readiness.length,1);
  assert.equal(handoff.trial_authorized,false);
});

test('Original callback response, authority, and challenge identity contradictions remain open',()=>{
  const p=reviewChallengeReadiness606(source,[
    {...row(issuer),issuer_authority_ref:'challenge-SKU-issuer-606',
      issuer_verifier_ref:'original-issuer-606',
      response_receipt_ref:'issuer-receipt-606'},
    {...row(owner,'ISSUER_CALLBACK_CHALLENGE'),challenge_ref:'challenge-SKU-issuer-606',
      response_receipt_ref:'issuer-receipt-606'}],asOf);
  const first=p.cases[0].remaining_blockers;
  for(const code of ['ISSUER_CHALLENGE_AUTHORITY_SELF_REFERENTIAL',
    'ISSUER_CHALLENGE_VERIFIER_NOT_INDEPENDENT',
    'ISSUER_CALLBACK_REUSES_ORIGINAL_RECEIPT','CHALLENGE_IDENTIFIER_REUSED_ACROSS_CASES',
    'ISSUER_RESPONSE_REUSED_ACROSS_CASES','REPORTED_CALLBACK_MATCH_NOT_AUTHENTICATED'])
    assert.ok(first.includes(code),code);
});

test('Changed witness identity and owner signer or signed receipt substitution are flagged',()=>{
  const p=reviewChallengeReadiness606(source,[
    {...row(issuer,'WITNESS_REVERIFICATION'),witness_identity_ref:'other-witness-606',
      witness_reviewer_ref:'other-witness-606'},
    {...row(owner,'OWNER_CONSENT_READINESS'),owner_signer_ref:'new-owner-606',
      owner_signed_receipt_ref:'owner-original-606',owner_witness_ref:'new-owner-606'}],asOf);
  for(const code of ['WITNESS_IDENTITY_CHANGED_SINCE_ORIGINAL',
    'WITNESS_REVERIFIER_NOT_SEPARATE'])
    assert.ok(p.cases[0].remaining_blockers.includes(code),code);
  for(const code of ['EXACT_OWNER_SIGNER_SUBSTITUTED',
    'OWNER_RENEWED_RECEIPT_CHANGED_SINCE_HANDOFF',
    'OWNER_RENEWAL_WITNESS_NOT_INDEPENDENT','OWNER_ORIGINAL_SIGNOFF_REUSED'])
    assert.ok(p.cases[1].remaining_blockers.includes(code),code);
});

test('Source-tampering, forged authority, unsafe secrets and chronology reject',()=>{
  assert.throws(()=>reconcileChallengeReadiness606({...source,build:606},
    [{},{},{}],[],asOf));
  assert.throws(()=>reconcileChallengeReadiness606(source,[{},{}],[],asOf));
  assert.throws(()=>reviewChallengeReadiness606(source,[
    {...row(owner,'OWNER_CONSENT_READINESS'),owner_action:'UPDATE_LIVE'}],asOf));
  assert.throws(()=>reviewChallengeReadiness606(source,[
    {...row(issuer),kind:'OWNER_CONSENT_READINESS'}],asOf));
  for(const bad of [{...row(issuer),trial_authorized:true},
    {...row(issuer),challenge_digest:'not-sha256'},
    {...row(issuer),callback_channel_ref:'Bearer private-token'},
    {...row(issuer),response_received_at:'2026-11-06T09:00:00Z'},
    {...row(owner),owner_expires_at:'2026-11-01T11:00:00Z'}])
    assert.throws(()=>challengeReviewCandidate606(bad));
});

test('Build 606 UI, zero transport, required gate and exact live release marker',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd606Title','dd606Refresh','dd606Metrics','dd606Filter','dd606Search',
    'dd606Rows','dd606Case','dd606Exception','dd606Kind','dd606Challenge',
    'dd606ChallengeHash','dd606Authority','dd606CallbackChannel','dd606Response',
    'dd606Verifier','dd606ChallengeState','dd606Sent','dd606Responded','dd606Expires',
    'dd606Witness','dd606WitnessAuthority','dd606WitnessReceipt','dd606WitnessReviewer',
    'dd606WitnessState','dd606WitnessAt','dd606Signer','dd606OwnerReceipt',
    'dd606OwnerWitness','dd606Account','dd606Product','dd606Action','dd606OwnerState',
    'dd606OwnerSigned','dd606OwnerExpires','dd606OwnerDue','dd606Due','dd606Reason',
    'dd606Ack','dd606Save','dd606Copy','dd606Status','dd606Output','dd606Prepare',
    'dd606CopyHandoff','dd606Handoff'])assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build 6\d{2}/);
  assert.match(html,/admin-channel-issuer-response-598\.mjs\?v=6\d{2}/);
  const js=read('public/js/admin-channel-issuer-response-598.mjs');
  assert.match(js,/export const FORMAT_606=/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build606_issuer_challenge_witness_consent\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":6\d{2}/);
});
