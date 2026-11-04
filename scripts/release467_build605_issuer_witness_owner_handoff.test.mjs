import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FORMAT_604,FORMAT_605,authenticationFollowupCandidate605,
  reconcileAuthenticationHandoff605,reviewAuthenticationHandoff605,
  filterAuthenticationHandoff605,unsignedAuthenticationHandoff605}
  from '../public/js/admin-channel-issuer-response-598.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const asOf='2026-11-07T12:00:00Z';
const case605=(kind,exception)=>({case_pin:'dd596-case:605-'+kind,
  channel:'ETSY',account_id:'shop-605',product_ref:'SKU-605',exact_action:'CREATE_DRAFT',
  priority:'HIGH',owner_trial_decision_pending:kind==='owner',
  open_exceptions:[exception],expected_issuer_ref:'issuer-605',
  expected_owner_signer_ref:'owner-signer-605',source_digest:'a'.repeat(64),
  issuer_witness_renewal_notes:[{kind:'ISSUER_CONFIRMATION',
    original_issuer_confirmation_ref:'issuer-original-605',issuer_state:'DISPUTED_ORIGINAL'},
    {kind:'WITNESS_EXCEPTION_DISPOSITION',witness_identity_ref:'witness-605',
      witness_disposition_ref:'witness-prior-605',witness_state:'DISPUTED'},
    ...(kind==='owner'?[{kind:'EXACT_OWNER_RENEWAL',
      owner_original_receipt_ref:'owner-original-605',
      owner_renewal_receipt_ref:'owner-renewed-605',
      owner_renewed_signed_at:'2026-11-04T16:00:00Z',
      owner_renewed_expires_at:'2026-11-06T10:00:00Z'}]:[])],
  remaining_blockers:['ORIGINAL_ISSUER_AUTHENTICATION_UNVERIFIED'],
  aging:{bucket:'ON_TRACK',due_at:'2026-11-09T10:00:00Z'}});
const issuer=case605('issuer','ORIGINAL_ISSUER_AUTHENTICATION_PENDING');
const owner=case605('owner','EXACT_OWNER_SIGNED_RENEWAL_PENDING');
const e604={format:FORMAT_604,build:604,as_of:asOf,cases:[issuer,owner]};
const row=(c,kind='ISSUER_AUTH_FOLLOWUP')=>({case_pin:c.case_pin,
  exception_code:c.open_exceptions[0],kind,
  issuer_state:'AUTHORITY_CONTACT_REQUESTED',witness_state:'EXTERNAL_RECHECK_REQUESTED',
  issuer_response_ref:'issuer-original-605',issuer_authority_ref:'outside-trusted-provider-605',
  issuer_original_receipt_ref:'issuer-original-605',issuer_digest:c.source_digest,
  issuer_verifier_ref:'independent-verifier-605',issuer_external_callback_ref:'callback-605',
  issuer_callback_at:'2026-11-05T16:00:00Z',
  witness_disposition_ref:'witness-prior-605',witness_identity_ref:'witness-605',
  witness_reviewer_ref:'separate-reviewer-605',
  witness_independent_source_ref:'outside-witness-authority-605',
  witness_counterevidence_ref:'separate-counterevidence-605',
  witness_rechecked_at:'2026-11-05T16:00:00Z',
  owner_original_receipt_ref:c.owner_trial_decision_pending?'owner-original-605':'',
  owner_renewed_receipt_ref:c.owner_trial_decision_pending?'owner-renewed-605':'',
  owner_signer_ref:c.owner_trial_decision_pending?'owner-signer-605':'',
  owner_independent_witness_ref:c.owner_trial_decision_pending?'owner-witness-605':'',
  owner_account:c.owner_trial_decision_pending?c.account_id:'',
  owner_product:c.owner_trial_decision_pending?c.product_ref:'',
  owner_action:c.owner_trial_decision_pending?c.exact_action:'',
  owner_handoff_ref:c.owner_trial_decision_pending?'unsigned-handoff-605':'',
  owner_renewed_signed_at:c.owner_trial_decision_pending?'2026-11-04T16:00:00Z':'',
  owner_renewed_expires_at:c.owner_trial_decision_pending?'2026-11-06T10:00:00Z':'',
  owner_handoff_due_at:c.owner_trial_decision_pending?'2026-11-09T12:00:00Z':'',
  reason:'Outside authority and independent witness have not authenticated the original source.',
  recorded_at:'2026-11-07T11:00:00Z',next_review_at:'2026-11-08T12:00:00Z'});

test('Build 605 independent issuer/witness and exact owner handoff remain HOLD',()=>{
  const p=reviewAuthenticationHandoff605(e604,[row(issuer),
    row(issuer,'WITNESS_DISPOSITION_RECHECK'),
    row(owner,'EXACT_OWNER_RENEWAL_HANDOFF')],asOf);
  assert.equal(p.format,FORMAT_605);assert.equal(p.open_cases,2);
  assert.equal(p.owner_renewal_expired,1);
  assert.equal(filterAuthenticationHandoff605(p,'OWNER').length,1);
  assert.equal(filterAuthenticationHandoff605(p,'EXPIRED').length,1);
  assert.ok(p.cases.find(c=>c.owner_trial_decision_pending).remaining_blockers
    .includes('OWNER_RENEWED_SIGNOFF_EXPIRED'));
  for(const k of ['independently_authenticated_issuers','independent_witness_closures',
    'verified_owner_renewals','authorized_trials','provider_reads','provider_writes',
    'd1_operations'])assert.equal(p[k],0,k);
  const handoff=unsignedAuthenticationHandoff605(p,owner.case_pin);
  assert.equal(handoff.exact_shop_account,owner.account_id);
  assert.equal(handoff.exact_product_sku,owner.product_ref);
  assert.equal(handoff.exact_action,owner.exact_action);
  assert.equal(handoff.owner_renewal_handoffs.length,1);
  assert.equal(handoff.trial_authorized,false);
});

test('Contradictory original issuer claims and same-receipt witness closure stay open',()=>{
  const p=reviewAuthenticationHandoff605(e604,[
    {...row(issuer),issuer_state:'CLAIMED_VERIFIED_UNTRUSTED',
      issuer_external_callback_ref:'issuer-original-605',
      issuer_verifier_ref:'issuer-605',issuer_digest:'f'.repeat(64)},
    {...row(issuer,'WITNESS_DISPOSITION_RECHECK'),
      witness_state:'CLAIMED_CLOSED_UNTRUSTED',
      witness_identity_ref:'separate-reviewer-605'}],asOf);
  const c=p.cases.find(x=>!x.owner_trial_decision_pending);
  for(const code of ['CLAIMED_ISSUER_AUTHENTICATION_NOT_INDEPENDENTLY_PROVEN',
    'ISSUER_VERIFICATION_CONFLICTS_WITH_DISPUTED_ORIGINAL',
    'ORIGINAL_ISSUER_DIGEST_CONFLICT','ISSUER_VERIFIER_NOT_INDEPENDENT',
    'ISSUER_CALLBACK_REUSES_UNVERIFIED_RECEIPT',
    'CONTRADICTORY_WITNESS_STATES_FOR_SAME_RECEIPT',
    'WITNESS_CLOSURE_CONTRADICTS_PRIOR_DISPUTE'])
    assert.ok(c.remaining_blockers.includes(code),code);
  assert.equal(c.independent_witness_closed,false);
});

test('Owner scope, receipt, witness and expiry substitution are highlighted without authorization',()=>{
  const p=reviewAuthenticationHandoff605(e604,[
    {...row(owner,'EXACT_OWNER_RENEWAL_HANDOFF'),owner_renewed_receipt_ref:'other-renewal',
      owner_renewed_expires_at:'2026-11-09T10:00:00Z',
      owner_independent_witness_ref:'owner-signer-605',
      owner_handoff_ref:'owner-original-605'}],asOf);
  const c=p.cases.find(x=>x.owner_trial_decision_pending);
  for(const code of ['OWNER_RENEWED_RECEIPT_SUBSTITUTED','OWNER_RENEWAL_EXPIRY_REWRITTEN',
    'OWNER_SIGNOFF_WITNESS_NOT_INDEPENDENT','OWNER_HANDOFF_NOT_SEPARATE_RECORD'])
    assert.ok(c.remaining_blockers.includes(code),code);
  assert.equal(c.renewal_clock.state,'RENEWAL_EXPIRES_WITHIN_72H');
  assert.equal(p.owner_renewal_due,1);
  assert.equal(p.authorized_trials,0);
});

test('Original callback or witness receipt reused across distinct cases remains a conflict',()=>{
  const p=reviewAuthenticationHandoff605(e604,[row(issuer),
    row(owner,'EXACT_OWNER_RENEWAL_HANDOFF')],asOf);
  for(const c of p.cases){
    assert.ok(c.remaining_blockers.includes('ISSUER_CALLBACK_REUSED_ACROSS_CASES'));
    assert.ok(c.remaining_blockers.includes('WITNESS_RECEIPT_REUSED_ACROSS_CASES'));
    assert.equal(c.trial_authorized,false);
  }
});

test('Stale original-source inputs, wrong owner action, untrusted secrets and dates reject',()=>{
  assert.throws(()=>reconcileAuthenticationHandoff605({...e604,build:0},
    [{},{},{}],[],asOf));
  assert.throws(()=>reconcileAuthenticationHandoff605(e604,[{},{},{}],[],asOf));
  assert.throws(()=>reviewAuthenticationHandoff605(e604,[
    {...row(owner,'EXACT_OWNER_RENEWAL_HANDOFF'),owner_product:'another-sku'}],asOf));
  assert.throws(()=>reviewAuthenticationHandoff605(e604,[
    {...row(issuer),kind:'EXACT_OWNER_RENEWAL_HANDOFF'}],asOf));
  for(const bad of [{...row(issuer),trial_authorized:true},
    {...row(issuer),issuer_digest:'not-a-digest'},
    {...row(issuer),issuer_authority_ref:'Bearer private-token'},
    {...row(issuer),issuer_callback_at:'2031-01-01T00:00:00Z'},
    {...row(owner),owner_renewed_expires_at:'2026-11-03T00:00:00Z'}])
    assert.throws(()=>authenticationFollowupCandidate605(bad));
});

test('Build 605 Admin, quality gate, no provider requests and exact deployment marker',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd605Title','dd605Refresh','dd605Metrics','dd605Filter','dd605Search',
    'dd605Rows','dd605Case','dd605Exception','dd605Kind','dd605IssuerResponse',
    'dd605IssuerAuthority','dd605IssuerOriginal','dd605IssuerDigest','dd605IssuerVerifier',
    'dd605IssuerCallback','dd605IssuerAt','dd605IssuerState','dd605WitnessDisposition',
    'dd605WitnessIdentity','dd605WitnessReviewer','dd605WitnessSource','dd605WitnessCounter',
    'dd605WitnessAt','dd605WitnessState','dd605OwnerOriginal','dd605OwnerRenewed',
    'dd605OwnerSigner','dd605OwnerWitness','dd605Account','dd605Product','dd605Scope',
    'dd605OwnerSigned','dd605OwnerExpires','dd605OwnerHandoff','dd605OwnerDue','dd605Due',
    'dd605Reason','dd605Ack','dd605Save','dd605Copy','dd605Status','dd605Output',
    'dd605Prepare','dd605CopyHandoff','dd605Handoff'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build 605/);
  assert.match(html,/admin-channel-issuer-response-598\.mjs\?v=605/);
  const js=read('public/js/admin-channel-issuer-response-598.mjs');
  assert.match(js,/export const FORMAT_605=/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build605_issuer_witness_owner_handoff\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":605/);
});
