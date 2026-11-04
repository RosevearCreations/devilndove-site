import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FORMAT_603,FORMAT_604,confirmationCandidate604,renewalClock604,
  reconcileOriginalConfirmations604,reviewOriginalConfirmations604,
  filterOriginalConfirmations604,unsignedOriginalConfirmation604}
  from '../public/js/admin-channel-issuer-response-598.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const asOf='2026-11-06T12:00:00Z';
const case604=(kind,exception)=>({case_pin:'dd596-case:604-'+kind,
  channel:'ETSY',account_id:'shop-604',product_ref:'SKU-604',exact_action:'CREATE_DRAFT',
  priority:'HIGH',owner_trial_decision_pending:kind==='owner',
  open_exceptions:[exception],expected_issuer_ref:'original-issuer-604',
  expected_owner_signer_ref:'signer-604',source_digest:'a'.repeat(64),
  custody_witness_owner_followups:[{kind:'WITNESS_IDENTITY_FOLLOWUP',
    witness_identity_ref:'witness-604'},
    ...(kind==='owner'?[{kind:'OWNER_SIGNOFF_EXPIRY',
      owner_signed_receipt_ref:'original-owner-604',
      owner_expires_at:'2026-11-04T10:00:00Z'}]:[])],
  remaining_blockers:['EXTERNAL_ISSUER_UNVERIFIED'],
  aging:{bucket:'ON_TRACK',due_at:'2026-11-07T10:00:00Z'}});
const issuer=case604('issuer','ORIGINAL_RECEIPT_PENDING');
const owner=case604('owner','EXACT_OWNER_RENEWAL_PENDING');
const e603={format:FORMAT_603,build:603,as_of:asOf,cases:[issuer,owner]};
const row=(c,kind='ISSUER_CONFIRMATION')=>({case_pin:c.case_pin,
  exception_code:c.open_exceptions[0],kind,issuer_state:'REPORTED_CONFIRMATION',
  witness_state:'REPORTED_RESOLUTION',
  original_issuer_confirmation_ref:'original-issuer-reply-604',
  issuer_identity_ref:c.expected_issuer_ref,
  issuer_authority_locator_ref:'independent-provider-authority-unverified',
  original_digest:c.source_digest,issuer_contacted_at:'2026-11-03T17:00:00Z',
  issuer_responded_at:'2026-11-04T16:00:00Z',reviewer_ref:'reviewer-604',
  witness_identity_ref:'witness-604',witness_disposition_ref:'witness-disposition-604',
  witness_independent_source_ref:'separate-witness-source-604',
  witness_contacted_at:'2026-11-03T17:00:00Z',
  witness_disposed_at:'2026-11-04T16:00:00Z',
  owner_signer_ref:c.owner_trial_decision_pending?'signer-604':'',
  owner_original_receipt_ref:c.owner_trial_decision_pending?'original-owner-604':'',
  owner_renewal_receipt_ref:c.owner_trial_decision_pending?'new-owner-renewal-604':'',
  owner_account:c.owner_trial_decision_pending?c.account_id:'',
  owner_product:c.owner_trial_decision_pending?c.product_ref:'',
  owner_action:c.owner_trial_decision_pending?c.exact_action:'',
  owner_original_expires_at:c.owner_trial_decision_pending?'2026-11-04T10:00:00Z':'',
  owner_renewal_requested_at:c.owner_trial_decision_pending?'2026-11-03T18:00:00Z':'',
  owner_renewed_signed_at:c.owner_trial_decision_pending?'2026-11-04T16:00:00Z':'',
  owner_renewed_expires_at:c.owner_trial_decision_pending?'2026-11-05T10:00:00Z':'',
  reason:'Original external issuer, witness and exact owner renewal still need separate authentication.',
  recorded_at:'2026-11-06T11:00:00Z',next_review_at:'2026-11-07T12:00:00Z'});

test('Build 604 original issuer, witness and owner renewal queue stays documentary HOLD',()=>{
  const p=reviewOriginalConfirmations604(e603,[row(issuer),
    row(issuer,'WITNESS_EXCEPTION_DISPOSITION'),row(owner,'EXACT_OWNER_RENEWAL')],asOf);
  assert.equal(p.format,FORMAT_604);assert.equal(p.open_cases,2);
  assert.equal(p.renewal_expired,1);
  assert.equal(filterOriginalConfirmations604(p,'OWNER').length,1);
  assert.equal(filterOriginalConfirmations604(p,'RENEWAL_EXPIRED').length,1);
  const c=p.cases.find(x=>x.owner_trial_decision_pending);
  assert.equal(c.renewal_clock.state,'RENEWAL_EXPIRED');
  assert.ok(c.remaining_blockers.includes('OWNER_RENEWAL_EXPIRED'));
  for(const k of ['original_issuers_confirmed','witness_exceptions_closed',
    'exact_owner_renewals_authenticated','authorized_trials','provider_reads',
    'provider_writes','d1_operations'])assert.equal(p[k],0,k);
  const h=unsignedOriginalConfirmation604(p,owner.case_pin);
  assert.equal(h.exact_shop_account,owner.account_id);
  assert.equal(h.exact_product_sku,owner.product_ref);
  assert.equal(h.exact_action,owner.exact_action);
  assert.equal(h.owner_renewal_claims.length,1);
  assert.equal(h.trial_authorized,false);
});

test('Owner renewal clock warns before expiry and never treats future dates as verification',()=>{
  assert.equal(renewalClock604('','','2026-11-06T00:00:00Z').state,
    'RENEWAL_DATE_OR_EXPIRY_MISSING');
  assert.equal(renewalClock604('2026-11-04T00:00:00Z','2026-11-08T00:00:00Z',
    '2026-11-06T00:00:00Z').state,'RENEWAL_EXPIRES_WITHIN_72H');
  assert.equal(renewalClock604('2026-11-04T00:00:00Z','2026-12-01T00:00:00Z',
    '2026-11-06T00:00:00Z').independently_authenticated,false);
  const p=reviewOriginalConfirmations604(e603,[{...row(owner,'EXACT_OWNER_RENEWAL'),
    owner_renewed_expires_at:'2026-11-08T00:00:00Z'}],asOf);
  assert.equal(p.renewal_due_within_72h,1);
  assert.equal(filterOriginalConfirmations604(p,'RENEWAL_DUE').length,1);
  assert.equal(p.authorized_trials,0);
});

test('Reused original receipts, non-independent witness and old owner signoff cannot close disputes',()=>{
  const p=reviewOriginalConfirmations604(e603,[
    {...row(issuer),issuer_identity_ref:'another-issuer',original_digest:'f'.repeat(64),
      witness_identity_ref:'reviewer-604',witness_disposition_ref:'original-issuer-reply-604'},
    {...row(owner,'EXACT_OWNER_RENEWAL'),owner_renewal_receipt_ref:'original-owner-604',
      owner_original_expires_at:'2026-11-02T00:00:00Z'}],asOf);
  const source=p.cases.find(c=>!c.owner_trial_decision_pending).latest_confirmation;
  for(const x of ['ISSUER_IDENTITY_SUBSTITUTED','ORIGINAL_ISSUER_DIGEST_CONFLICT',
    'WITNESS_NOT_INDEPENDENT','WITNESS_DISPOSITION_SELF_REFERENTIAL',
    'ISSUER_RECEIPT_REUSED_ACROSS_CASES'])assert.ok(source.conflicts.includes(x),x);
  const renew=p.cases.find(c=>c.owner_trial_decision_pending).latest_confirmation;
  for(const x of ['OWNER_OLD_SIGNOFF_REUSED_AS_RENEWAL','OWNER_ORIGINAL_EXPIRY_REWRITTEN'])
    assert.ok(renew.conflicts.includes(x),x);
  assert.equal(renew.owner_renewal_authenticated,false);
});

test('Forged original chain, wrong shop, non-owner signoff, unsafe references and chronology fail closed',()=>{
  assert.throws(()=>reconcileOriginalConfirmations604({...e603,build:0},
    [{},{},{},{}],[],asOf));
  assert.throws(()=>reconcileOriginalConfirmations604(e603,[{},{},{},{}],[],asOf));
  assert.throws(()=>reviewOriginalConfirmations604(e603,[
    {...row(owner,'EXACT_OWNER_RENEWAL'),owner_account:'another-shop'}],asOf));
  assert.throws(()=>reviewOriginalConfirmations604(e603,[
    {...row(issuer),kind:'EXACT_OWNER_RENEWAL'}],asOf));
  for(const bad of [{...row(issuer),trial_authorized:true},
    {...row(issuer),issuer_responded_at:'2026-11-03T16:00:00Z'},
    {...row(issuer),witness_disposed_at:'2026-11-03T16:00:00Z'},
    {...row(issuer),original_digest:'invalid'},
    {...row(issuer),issuer_authority_locator_ref:'Bearer private-value'},
    {...row(owner),owner_renewed_expires_at:'2026-11-03T10:00:00Z'}])
    assert.throws(()=>confirmationCandidate604(bad));
});

test('Build 604 actual Admin controls, isolated runtime and exact production marker are gated',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd604Title','dd604Refresh','dd604Metrics','dd604Filter','dd604Search',
    'dd604Rows','dd604Case','dd604Exception','dd604Kind','dd604Receipt','dd604Issuer',
    'dd604Authority','dd604Digest','dd604IssuerState','dd604IssuerContact','dd604IssuerReply',
    'dd604Reviewer','dd604Witness','dd604Disposition','dd604WitnessSource',
    'dd604WitnessState','dd604WitnessContact','dd604WitnessAt','dd604Signer',
    'dd604OwnerOriginal','dd604RenewalReceipt','dd604Account','dd604Product','dd604Scope',
    'dd604OriginalExpiry','dd604RenewalRequested','dd604RenewedSigned','dd604RenewalExpiry',
    'dd604Due','dd604Reason','dd604Ack','dd604Save','dd604Copy','dd604Status',
    'dd604Output','dd604Prepare','dd604CopyHandoff','dd604Handoff'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build (?:604|605)/);
  assert.match(html,/admin-channel-issuer-response-598\.mjs\?v=(?:604|605)/);
  const js=read('public/js/admin-channel-issuer-response-598.mjs');
  assert.match(js,/export const FORMAT_604=/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build604_issuer_witness_owner_renewal\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":60[45]/);
});
