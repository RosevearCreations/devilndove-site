import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixture595} from './release467_build595_source_verification.test.mjs';
import {sourceVerification595} from '../public/js/admin-channel-source-verification-595.mjs';
import {evidenceWorkboard596} from '../public/js/admin-channel-review-workboard-596.mjs';
import {FORMAT_597,dispositionCandidate597,reconcileSource597,filterSourceCases597,
  unsignedWitnessPacket597} from '../public/js/admin-channel-source-disposition-597.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const {exact594,upstream594,providerRow,ownerRow,asOf}=fixture595;
const source595=[exact594,upstream594,[providerRow,ownerRow]];
const exact595=sourceVerification595(...source595,asOf);
const source597=[exact595,source595];
const exact596=evidenceWorkboard596(...source597,[],asOf);
const provider=exact596.cases.find(c=>!c.owner_trial_decision_pending);
const owner=exact596.cases.find(c=>c.owner_trial_decision_pending);
const request=c=>({case_pin:c.case_pin,exception_code:c.open_evidence_exceptions[0],
  next_action:c.owner_trial_decision_pending?'RECONCILE_OWNER_SIGNER_AND_WITNESS':
    'REQUEST_ORIGINAL_ISSUER_ATTESTATION',
  disposition:c.owner_trial_decision_pending?'OWNER_SIGNED_RECEIPT_PENDING':'ORIGINAL_ISSUER_REPLY_PENDING',
  issuer_authority_ref:c.original_verification?.provider_issuer_ref||'',
  original_issuer_attestation_ref:'independent-original-issuer-contact-pending',
  issuer_attested_sha256:'',custody_receipt_ref:c.original_verification?.custody_receipt_ref||'',
  custody_document_sha256:'',reviewer_ref:'reviewer-597',witness_ref:'witness-597',
  owner_signer_ref:c.owner_trial_decision_pending?(c.original_verification?.owner_signer_ref||'signer-597'):'',
  owner_signed_receipt_ref:'',owner_signed_sha256:'',
  owner_account:c.owner_trial_decision_pending?c.account_id:'',
  owner_product:c.owner_trial_decision_pending?c.product_ref:'',
  owner_action:c.owner_trial_decision_pending?c.action:'',
  reason:'Original issuer and owner-signed exact trial scope remain independently unverified.',
  recorded_at:'2026-11-03T17:15:00Z',next_review_at:'2026-11-04T17:30:00Z'});
const providerRequest=request(provider),ownerRequest=request(owner);

test('source-pinned issuer and exact owner witness queues remain unverified and trial HOLD',()=>{
  const p=reconcileSource597(exact596,source597,[],[providerRequest,ownerRequest],
    '2026-11-13T18:00:00Z');
  assert.equal(p.format,FORMAT_597);assert.equal(p.open_cases,2);
  assert.equal(p.issuer_followup_cases,1);assert.equal(p.owner_witness_cases,1);
  assert.equal(p.overdue_owner_signoffs,1);
  assert.ok(p.cases.every(c=>c.reviews.length===1&&c.unresolved_exceptions.length>0));
  assert.equal(p.issuer_attestations_authenticated,0);assert.equal(p.owner_signatures_authenticated,0);
  assert.equal(p.trials_authorized,0);assert.equal(p.exceptions_closed,0);
  assert.equal(p.provider_reads,0);assert.equal(p.provider_writes,0);assert.equal(p.d1_operations,0);
});
test('original issuer and custody digests are compared to original records without authenticating either',()=>{
  const forged={...providerRequest,
    issuer_attested_sha256:'e'.repeat(64),custody_document_sha256:'f'.repeat(64),
    custody_receipt_ref:'receipt-other-597',issuer_authority_ref:'issuer-other-597'};
  const p=reconcileSource597(exact596,source597,[],[forged],asOf);
  const r=p.cases.find(c=>!c.owner_trial_decision_pending).latest_review;
  assert.ok(r.contradictions.includes('ORIGINAL_ISSUER_DIGEST_CONFLICT'));
  assert.ok(r.contradictions.includes('CUSTODY_DIGEST_CONFLICT'));
  assert.ok(r.contradictions.includes('CUSTODY_RECEIPT_REFERENCE_CONFLICT'));
  assert.ok(r.contradictions.includes('ORIGINAL_ISSUER_AUTHORITY_CONFLICT'));
  assert.equal(r.independent_issuer_attestation_verified,false);assert.equal(r.exception_closed,false);
});
test('owner sign-off receipt, exact action and independent witness remain separate unresolved claims',()=>{
  const signer='same-person-597';
  const claim={...ownerRequest,owner_signer_ref:signer,witness_ref:signer,
    reviewer_ref:signer,owner_signed_receipt_ref:'owner-claim-local',
    owner_signed_sha256:'a'.repeat(64)};
  const p=reconcileSource597(exact596,source597,[],[claim],asOf);
  const c=p.cases.find(x=>x.owner_trial_decision_pending),r=c.latest_review;
  assert.ok(r.contradictions.includes('OWNER_SIGNER_EQUALS_WITNESS'));
  assert.ok(r.contradictions.includes('OWNER_SIGNER_EQUALS_REVIEWER'));
  assert.equal(r.owner_witness_authenticated,false);
  const packet=unsignedWitnessPacket597(p,c.case_pin);
  assert.equal(packet.exact_account,c.account_id);assert.equal(packet.exact_product,c.product_ref);
  assert.equal(packet.exact_action,c.exact_action);assert.equal(packet.local_signature_digest,'a'.repeat(64));
  assert.equal(packet.owner_trial_authorized,false);assert.equal(packet.signature_verified,false);
  assert.equal(packet.independent_witness_authenticated,false);
  assert.throws(()=>unsignedWitnessPacket597(p,provider.case_pin));
});
test('forged source, wrong exception and provider/owner record swapping fail closed',()=>{
  assert.throws(()=>reconcileSource597({...exact596,source_build:0},source597,[],[],asOf));
  assert.throws(()=>reconcileSource597(exact596,source597,[],[{...providerRequest,
    exception_code:'NONEXISTENT_CLOSED_CONFLICT'}],asOf));
  assert.throws(()=>reconcileSource597(exact596,source597,[],[{...providerRequest,
    next_action:'REQUEST_EXACT_OWNER_SIGNED_RECEIPT'}],asOf));
  assert.throws(()=>reconcileSource597(exact596,source597,[],[{...ownerRequest,
    owner_action:'PUBLISH_UNAUTHORIZED_CHANNEL'}],asOf));
  assert.throws(()=>reconcileSource597(exact596,source597,[],[{...providerRequest,
    owner_signed_receipt_ref:'incorrect-provider-owner-receipt'}],asOf));
});
test('stale reviews, unsafe claims, secret-bearing receipts and invalid filters never approve trials',()=>{
  const p=reconcileSource597(exact596,source597,[],[{...providerRequest,
    case_pin:providerRequest.case_pin+'-stale'}],asOf);
  assert.equal(p.unmatched_stale_dispositions.length,1);
  for(const x of [{...providerRequest,issuer_authenticated:true},
    {...providerRequest,trial_authorized:true},{...providerRequest,exception_closed:true},
    {...providerRequest,reason:'Bearer concealed'},
    {...providerRequest,issuer_attested_sha256:'not-a-digest'},
    {...providerRequest,next_action:'POST_TO_META'}])assert.throws(()=>dispositionCandidate597(x));
  assert.equal(filterSourceCases597(p,'OWNER').length,1);
  assert.equal(filterSourceCases597(p,'ISSUER').length,1);
  assert.equal(filterSourceCases597(p,'OWNER',owner.product_ref).length,1);
  assert.throws(()=>filterSourceCases597(p,'AUTHORIZED'));
  assert.throws(()=>filterSourceCases597(p,'ALL','x'.repeat(121)));
});
test('Build 597 Admin section, CI and production marker are review-only',()=>{
  const html=read('admin/channel-trials/index.html');
  for(const id of ['dd597Refresh','dd597Filter','dd597Search','dd597Rows','dd597Case',
    'dd597Exception','dd597Action','dd597Disposition','dd597Issuer','dd597Attestation',
    'dd597IssuerDigest','dd597Custody','dd597CustodyDigest','dd597Reviewer','dd597Witness',
    'dd597Signer','dd597OwnerReceipt','dd597OwnerDigest','dd597Account','dd597Product',
    'dd597Scope','dd597Due','dd597Reason','dd597Ack','dd597Save','dd597Copy',
    'dd597State','dd597Output','dd597Prepare','dd597CopyPacket','dd597Packet'])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(html,/Devil n Dove • Build (?:600|(?:597|598|599))/);
  assert.match(html,/admin-channel-source-disposition-597\.mjs\?v=597/);
  const js=read('public/js/admin-channel-source-disposition-597.mjs');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(js,/admin-channel-review-workboard-596\.mjs\?v=596/);
  assert.match(read('.github/workflows/current-application-quality.yml'),
    /release467_build597_source_disposition_witness\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:600|(?:597|598|599))/);
});
