import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FORMAT_608,FORMAT_613,candidate613,review613,reconcile613,
 unsignedHandoff613,KEY_613} from '../public/js/admin-channel-issuer-response-598.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const asOf='2026-11-05T18:00:00Z';
const source={
 format:FORMAT_608,build:608,as_of:asOf,
 release_gate:'HOLD_ORIGINAL_ISSUER_WITNESS_ESCALATION_EXACT_OWNER_RENEWAL',
 cases:[
 {case_pin:'dd596-case:issuer-613',channel:'ETSY',account_id:'shop-613',
 product_ref:'SKU-A613',exact_action:'CREATE_DRAFT',
 owner_trial_decision_pending:false,source_digest:'a'.repeat(64),
 expected_issuer_ref:'issuer-613',remaining_blockers:['ORIGINAL_ISSUER_UNVERIFIED']},
 {case_pin:'dd596-case:owner-613',channel:'ETSY',account_id:'shop-613',
 product_ref:'SKU-B613',exact_action:'CREATE_DRAFT',
 owner_trial_decision_pending:true,source_digest:'b'.repeat(64),
 expected_issuer_ref:'issuer-613',expected_owner_signer_ref:'owner-613',
 remaining_blockers:['ORIGINAL_OWNER_SIGNATURE_REQUIRED']}
 ]};
const row=(c,kind)=>({
 case_pin:c.case_pin,kind,original_ref:'official-provider-reference-'+c.product_ref,
 authority_ref:'independently-sourced-official-reference',
 reviewer_ref:'external-reviewer-613',witness_ref:'independent-witness-613',
 source_sha256:c.source_digest,signed_receipt_ref:kind==='EXACT_OWNER_CONSENT'?
  'owner-signature-'+c.product_ref:'',
 owner_signer_ref:kind==='EXACT_OWNER_CONSENT'?'owner-613':'',
 owner_account:c.account_id,owner_product:c.product_ref,owner_action:c.exact_action,
 reason:'Independent original source and signature confirmation are pending.',
 decision:kind==='EXACT_OWNER_CONSENT'?'APPROVE_CLAIM_UNVERIFIED':'PENDING',
 signed_at:kind==='EXACT_OWNER_CONSENT'?'2026-11-05T16:00:00Z':'',
 expires_at:kind==='EXACT_OWNER_CONSENT'?'2026-11-10T16:00:00Z':'',
 recorded_at:asOf
});
const issuer=row(source.cases[0],'ORIGINAL_ISSUER');
const owner=row(source.cases[1],'EXACT_OWNER_CONSENT');

test('Build 613 issuer, independent witness and exact owner workbench never authenticates typed proof',()=>{
 const witness={...issuer,kind:'INDEPENDENT_WITNESS',
  original_ref:'separate-trusted-witness-claim'};
 const p=review613(source,[issuer,witness,owner],asOf);
 assert.equal(p.format,FORMAT_613);assert.equal(p.cases.length,2);
 assert.equal(p.cases[0].reviews.length,2);
 assert.equal(p.cases[1].reviews.length,1);
 for(const k of ['issuer_authenticated','independent_witness_authenticated',
  'owner_consents_authenticated','authorized_trials','provider_reads',
  'provider_writes','d1_operations'])assert.equal(p[k],0,k);
 assert.equal(p.cases[1].reviews[0].status,'UNVERIFIED_DOCUMENTARY_INTAKE');
 assert.ok(p.cases[1].reviews[0].conflicts.includes(
  'CLAIMED_APPROVAL_REQUIRES_TRUSTED_SIGNATURE_VERIFICATION'));
 const handoff=unsignedHandoff613(p,owner.case_pin);
 assert.equal(handoff.shop_account,'shop-613');
 assert.equal(handoff.product_sku,'SKU-B613');
 assert.equal(handoff.permitted_action_requested,'CREATE_DRAFT');
 assert.equal(handoff.provider_action_authorized,false);
 assert.equal(handoff.owner_signature_authenticated,false);
});
test('Build 613 rejects source substitution, incorrect exact scope and recycled receipts',()=>{
 for(const bad of [
  {...owner,owner_account:'wrong-shop'},
  {...owner,owner_product:'wrong-sku'},
  {...owner,owner_action:'PUBLISH'},
  {...owner,case_pin:source.cases[0].case_pin},
 ])assert.throws(()=>review613(source,[bad],asOf));
 const p=review613(source,[issuer,{...owner,original_ref:issuer.original_ref,
  signed_receipt_ref:'owner-signature-SKU-B613'}],asOf);
 assert.ok(p.cases.every(c=>c.reviews[0].conflicts.includes(
  'EVIDENCE_REUSED_ACROSS_CASES')));
 assert.throws(()=>review613({...source,build:0},[owner],asOf));
 assert.throws(()=>review613({...source,release_gate:'GREEN'},[owner],asOf));
 assert.throws(()=>reconcile613(source,[],[],[owner],asOf));
});
test('Build 613 rejects forged permissions, bearer keys, bad digest, invalid dates and secrets',()=>{
 for(const bad of [
  {...owner,trial_authorized:true},
  {...owner,provider_write_authorized:true},
  {...owner,issuer_authenticated:true},
  {...owner,authority_ref:'Bearer dangerous-token'},
  {...owner,reason:'password=abc'},
  {...owner,source_sha256:'not-a-sha'},
  {...owner,signed_at:'tomorrow'},
  {...owner,signed_at:'2026-11-05T19:00:00Z'},
  {...owner,expires_at:'2026-11-04T16:00:00Z'},
  {...owner,decision:'AUTHORIZED'},
 ])assert.throws(()=>candidate613(bad));
 const p=review613(source,[{...owner,expires_at:'2026-11-06T17:00:00Z'}],
  '2026-11-07T12:00:00Z');
 assert.ok(p.cases[1].reviews[0].conflicts.includes('SIGNED_OWNER_SCOPE_EXPIRED'));
 const n=review613(source,[{...owner,witness_ref:'owner-613'}],asOf);
 assert.ok(n.cases[1].reviews[0].conflicts.includes('WITNESS_NOT_INDEPENDENT'));
 const d=review613(source,[{...owner,decision:'DECLINE'}],asOf);
 assert.ok(d.cases[1].reviews[0].conflicts.includes('OWNER_CONSENT_NOT_GRANTED'));
});
test('Build 613 UI, fail-closed boundaries, protected CI and production release marker',()=>{
 const html=read('admin/channel-trials/index.html');
 for(const id of ['dd613Title','dd613Refresh','dd613Metrics','dd613Case',
 'dd613Kind','dd613Original','dd613Authority','dd613Reviewer','dd613Witness',
 'dd613Digest','dd613SignedReceipt','dd613Signer','dd613Decision','dd613Signed',
 'dd613Expires','dd613Reason','dd613Ack','dd613Save','dd613Prepare',
 'dd613Status','dd613Output','dd613Handoff'])
 assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(html,/Devil n Dove • Build 613/);
 assert.match(html,/admin-channel-issuer-response-598\.mjs\?v=613/);
 const js=read('public/js/admin-channel-issuer-response-598.mjs');
 assert.match(js,/export const FORMAT_613=/);
 assert.match(js,/if\(typeof document!=='undefined'\)init613\(\)/);
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
 assert.equal(KEY_613,'dd:issuer-witness-owner-trust-review:613:v1');
 const quality=read('.github/workflows/current-application-quality.yml');
 assert.match(quality,/release467_build613_trust_workbench\.test\.mjs/);
 for(const ref of ['Build 609 consolidated','Build 610 exact','Build 611 evidence',
 'Build 612 verified'])assert.ok(quality.includes(ref));
 const prod=read('.github/workflows/production-pages-deploy-current.yml');
 assert.match(prod,/"build":(?:613|614|615|616|617|618|619|620|621|622|623|624|625|626|627)/);
 assert.match(read('.github/workflows/production-live-resource-integrity-proof.yml'),
 /zero-D1/i);
});
