import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FORMAT_602,FORMAT_603,custodyFollowupCandidate603,signoffExpiry603,
  reconcileCustodyWitnessExpiry603,reviewCustodyWitnessExpiry603,filterCustodyWitnessExpiry603,
  unsignedCustodyWitnessExpiry603} from '../public/js/admin-channel-issuer-response-598.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const asOf='2026-11-03T20:00:00Z';
const case603=(kind,code)=>({case_pin:'dd596-case:'+kind,channel:'ETSY',
  account_id:'shop-603',product_ref:'SKU-603',exact_action:'CREATE_DRAFT',priority:'HIGH',
  owner_trial_decision_pending:kind==='owner',open_exceptions:[code],
  expected_issuer_ref:'original-provider',expected_custody_ref:'custody-original',
  expected_owner_signer_ref:'owner-603',expected_owner_receipt_ref:'',
  source_digest:'a'.repeat(64),latest_external_evidence:{original_document_sha256:'a'.repeat(64)},
  remaining_blockers:['ORIGINAL_ISSUER_UNVERIFIED'],aging:{bucket:'ON_TRACK',due_at:'2026-11-06T00:00:00Z'}});
const issuer=case603('issuer','UNVERIFIED_ISSUER_CUSTODY');
const owner=case603('owner','EXACT_OWNER_SIGNATURE_PENDING');
const e602={format:FORMAT_602,build:602,as_of:asOf,cases:[issuer,owner]};
const row=(c,kind='CUSTODY_HANDOFF')=>({case_pin:c.case_pin,
  exception_code:c.open_exceptions[0],kind,artifact_ref:'unverified-original-artifact',
  issuer_authority_ref:'issuer-independent-check-needed',original_sha256:c.source_digest||'',
  custody_origin_receipt_ref:c.expected_custody_ref||'custody-original',
  custody_transfer_receipt_ref:'transfer-603-001',custodian_from_ref:'custodian-alpha',
  custodian_to_ref:'custodian-beta',custody_observed_at:'2026-11-03T17:00:00Z',
  custody_transferred_at:'2026-11-03T18:00:00Z',reviewer_ref:'reviewer-603',
  witness_identity_ref:'independent-witness-603',
  witness_independent_authority_ref:'outside-verified-source-pending',
  witness_followup_receipt_ref:'external-witness-followup',
  witness_contacted_at:'2026-11-03T17:00:00Z',
  witness_responded_at:'2026-11-03T18:00:00Z',
  owner_signer_ref:c.owner_trial_decision_pending?c.expected_owner_signer_ref||'owner-603':'',
  owner_signed_receipt_ref:c.owner_trial_decision_pending?'claimed-owner-receipt':'',
  owner_account:c.owner_trial_decision_pending?c.account_id:'',
  owner_product:c.owner_trial_decision_pending?c.product_ref:'',
  owner_action:c.owner_trial_decision_pending?c.exact_action:'',
  owner_signed_at:c.owner_trial_decision_pending?'2026-11-03T17:00:00Z':'',
  owner_expires_at:c.owner_trial_decision_pending?'2026-11-04T11:00:00Z':'',
  reason:'Independent original custody and witness authenticity have not been established.',
  recorded_at:'2026-11-04T20:00:00Z',next_review_at:'2026-11-05T20:00:00Z'});

test('Build 603 source-pinned custody, identity and expired owner signoff all remain HOLD',()=>{
  const result=reviewCustodyWitnessExpiry603(e602,[
    row(issuer),row(issuer,'WITNESS_IDENTITY_FOLLOWUP'),row(owner,'OWNER_SIGNOFF_EXPIRY')],
    '2026-11-04T21:00:00Z');
  assert.equal(result.format,FORMAT_603);assert.equal(result.open_cases,2);
  assert.equal(result.expired_signoffs,1);
  assert.equal(filterCustodyWitnessExpiry603(result,'EXPIRED').length,1);
  const exact=result.cases.find(c=>c.owner_trial_decision_pending);
  assert.equal(exact.signoff_expiry.state,'SIGNOFF_EXPIRED');
  assert.ok(exact.remaining_blockers.includes('EXACT_OWNER_SIGNOFF_EXPIRED'));
  for(const key of ['authenticated_issuers','verified_custody_chains',
    'authenticated_witnesses','verified_owner_signoffs','authorized_trials',
    'provider_reads','provider_writes','d1_operations'])assert.equal(result[key],0,key);
  const handoff=unsignedCustodyWitnessExpiry603(result,owner.case_pin);
  assert.equal(handoff.exact_shop_account,owner.account_id);
  assert.equal(handoff.exact_product_sku,owner.product_ref);
  assert.equal(handoff.exact_action,owner.exact_action);
  assert.equal(handoff.owner_signoff_claims.length,1);
  assert.equal(handoff.trial_authorized,false);
  assert.equal(handoff.status,'UNSIGNED_SOURCE_PINNED_FOLLOWUP_HOLD');
});

test('Missing, expiring, expired and future owner permission clocks cannot authenticate consent',()=>{
  assert.equal(signoffExpiry603('','','2026-11-05T00:00:00Z').state,
    'SIGNOFF_DATE_OR_EXPIRY_MISSING');
  assert.equal(signoffExpiry603('2026-11-03T00:00:00Z','2026-11-07T00:00:00Z',
    '2026-11-05T00:00:00Z').state,'SIGNOFF_EXPIRES_WITHIN_72H');
  assert.equal(signoffExpiry603('2026-11-03T00:00:00Z','2026-11-04T00:00:00Z',
    '2026-11-05T00:00:00Z').state,'SIGNOFF_EXPIRED');
  assert.equal(signoffExpiry603('2026-11-06T00:00:00Z','2026-11-12T00:00:00Z',
    '2026-11-05T00:00:00Z').state,'SIGNOFF_NOT_YET_EFFECTIVE');
  assert.equal(signoffExpiry603('2026-11-03T00:00:00Z','2026-12-01T00:00:00Z',
    '2026-11-05T00:00:00Z').state,'SIGNOFF_UNVERIFIED_WITH_FUTURE_EXPIRY');
  assert.throws(()=>signoffExpiry603('2026-11-05T00:00:00Z','2026-11-04T00:00:00Z',
    '2026-11-05T00:00:00Z'));
  const p=reviewCustodyWitnessExpiry603(e602,[
    {...row(owner,'OWNER_SIGNOFF_EXPIRY'),owner_expires_at:'2026-11-07T00:00:00Z'}],
    '2026-11-05T00:00:00Z');
  assert.equal(p.expiring_signoffs,1);
  assert.equal(filterCustodyWitnessExpiry603(p,'EXPIRING').length,1);
  assert.equal(p.authorized_trials,0);
});

test('Non-independent witness, broken custody continuity and source digest substitution are flagged',()=>{
  const r=row(issuer),p=reviewCustodyWitnessExpiry603(e602,[
    r,{...r,custody_origin_receipt_ref:'unrelated-second-origin',
      custodian_from_ref:'unknown-third-person',original_sha256:'f'.repeat(64),
      witness_identity_ref:'reviewer-603',witness_independent_authority_ref:'reviewer-603',
      witness_followup_receipt_ref:'transfer-603-001'}],
    '2026-11-05T00:00:00Z');
  const latest=p.cases.find(c=>!c.owner_trial_decision_pending).latest_followup;
  for(const code of ['ORIGINAL_DOCUMENT_DIGEST_CHANGED','CUSTODY_HANDOFF_CHAIN_GAP',
    'CUSTODIAN_IDENTITY_CHAIN_GAP','WITNESS_NOT_INDEPENDENT_OF_REVIEW_CUSTODY_ISSUER_OWNER',
    'WITNESS_FOLLOWUP_REUSES_DISPUTED_RECEIPT'])assert.ok(latest.conflicts.includes(code),code);
  assert.equal(latest.custody_verified,false);
  assert.equal(latest.witness_authenticated,false);
});

test('Stale upstream source, substituted owner scope, forged authorization and chronology fail closed',()=>{
  assert.throws(()=>reconcileCustodyWitnessExpiry603({...e602,build:0},[{}, {}, {}],[],[],asOf));
  assert.throws(()=>reconcileCustodyWitnessExpiry603(e602,[{}, {}, {}],[],[],asOf));
  assert.throws(()=>reviewCustodyWitnessExpiry603(e602,[
    {...row(owner,'OWNER_SIGNOFF_EXPIRY'),owner_account:'another-shop'}],asOf));
  assert.throws(()=>reviewCustodyWitnessExpiry603(e602,[
    {...row(issuer),kind:'OWNER_SIGNOFF_EXPIRY'}],asOf));
  for(const bad of [{...row(issuer),trial_authorized:true},
    {...row(issuer),owner_signed_at:'2030-01-01T00:00:00Z'},
    {...row(issuer),custody_transferred_at:'2026-11-03T16:00:00Z'},
    {...row(issuer),witness_responded_at:'2026-11-03T16:00:00Z'},
    {...row(issuer),issuer_authority_ref:'Bearer secret'},
    {...row(issuer),original_sha256:'bad-sha'}])
    assert.throws(()=>custodyFollowupCandidate603(bad));
});

test('Build 603 actual Admin controls, CI gate, script cache key and deployed main marker',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd603Refresh','dd603Metrics','dd603Filter','dd603Search','dd603Rows',
    'dd603Case','dd603Exception','dd603Kind','dd603Artifact','dd603IssuerAuthority',
    'dd603Digest','dd603Origin','dd603Transfer','dd603From','dd603To','dd603Observed',
    'dd603Transferred','dd603Reviewer','dd603Witness','dd603WitnessAuthority',
    'dd603WitnessReceipt','dd603Contacted','dd603Responded','dd603Signer',
    'dd603OwnerReceipt','dd603Account','dd603Product','dd603Scope','dd603Signed',
    'dd603Expires','dd603Due','dd603Reason','dd603Ack','dd603Save','dd603Copy',
    'dd603Status','dd603Output','dd603Prepare','dd603CopyHandoff','dd603Handoff'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build 6\d{2}/);
  assert.match(html,/admin-channel-issuer-response-598\.mjs\?v=6\d{2}/);
  const runtime=read('public/js/admin-channel-issuer-response-598.mjs');
  assert.match(runtime,/export const FORMAT_603=/);
  assert.doesNotMatch(runtime,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build603_custody_witness_owner_expiry\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":6\d{2}/);
});
