import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trialPacket578} from '../public/js/admin-channel-trials-578.mjs';
import {reconcile579} from '../public/js/admin-channel-reconciliation-579.mjs';
import {review580} from '../public/js/admin-channel-owner-review-580.mjs';
import {gate581} from '../public/js/admin-channel-trial-gate-581.mjs';
import {claimPin582} from '../public/js/admin-channel-handoff-582.mjs';
import {intake583} from '../public/js/admin-channel-intake-583.mjs';
import {gate584} from '../public/js/admin-channel-witness-584.mjs';
import {reconcile585,receiptFollowup585,FORMAT_585} from '../public/js/admin-channel-receipt-followup-585.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const notes=trialPacket578([{channel:'etsy',action:'IMAGE_READBACK',product_ref:'54',provider_ref:'listing-1',
  receipt_locator:'',observation:'An unauthenticated Etsy photo readback claim.',outcome:'UNKNOWN',
  recorded_at:'2026-11-03T02:00:00Z'}]);
const source={channel:'etsy',account_id:'shop1',product_ref:'54',listing_id:'listing-1',image_ids:['img1','img2','img3']};
const owner=review580(reconcile579(source,source,notes),notes,[]);
const claim={channel:'etsy',action:'UPLOAD_IMAGE',source_pin:owner.source_pin,account_id:'shop1',product_ref:'54',
  receipt_locator:'Unverified receipt',identity_locator:'Unverified account',scope_locator:'Unverified scope',
  independent_reviewer:'Unverified reviewer',owner_authorization_locator:'Pending decision',
  review_reason:'Need authenticated provider and scoped owner proof.',recorded_at:'2026-11-03T03:00:00Z'};
const trial=gate581(owner,notes,[],[claim]),pin=claimPin582(trial.claims[0]);
const evidence={claim_pin:pin,evidence_type:'PROVIDER_OPERATION_RECEIPT',source_locator:'External evidence case 585',
  provider_correlation:'request-585',reviewer_reference:'External reviewer',account_reference:'shop1',
  permission_scope:'listings_w',owner_scope_request:'Image upload for Product 54',
  explanation:'Require source authenticated external receipt.',recorded_at:'2026-11-03T04:00:00Z'};
const witness={claim_pin:pin,evidence_locator:evidence.source_locator,reviewer_reference:'Independent check pending',
  provider_account:'shop1',claimed_scope:'listings_w',review_outcome:'AWAITING_INDEPENDENT_REVIEW',
  review_reason:'Check actual signed-in Etsy receipt and identities.',recorded_at:'2026-11-03T05:00:00Z'};
const ownerRequest={claim_pin:pin,channel:'etsy',account_id:'shop1',product_ref:'54',action:'UPLOAD_IMAGE',
  owner_request:'REQUEST_SEPARATE_OWNER_SIGNOFF',reason:'Request exact one-image provider trial decision.',
  recorded_at:'2026-11-03T05:05:00Z'};
const sourceArgs=[trial,owner,notes,[],[claim],[],[evidence]],intake=intake583(...sourceArgs);
const gate=gate584(intake,...sourceArgs,[witness],[ownerRequest]);
const args=[gate,intake,...sourceArgs,[witness],[ownerRequest]];
const row={claim_pin:pin,witness_locator:evidence.source_locator,provider_request_id:'req-585',
  account_id:'shop1',listing_id:'listing-1',image_ids:['img1','img2','img3'],permission_scope:'listings_w',
  reviewer_reference:'External witness follow-up',followup_action:'REQUEST_INDEPENDENT_AUTHENTICATED_PROVIDER_READBACK',
  reason:'Independent authenticated provider receipt still needs proof.',recorded_at:'2026-11-03T06:00:00Z'};
test('exact manual receipt claim matches identifiers but cannot authenticate or approve trial',()=>{
  const result=reconcile585(...args,[row]);
  assert.equal(result.format,FORMAT_585);assert.equal(result.matching_followups,1);
  assert.equal(result.cases[0].open_conflicts,0);assert.equal(result.authenticated_provider_receipts,0);
  assert.equal(result.verified_remote_images,0);assert.equal(result.verified_owner_trial_authorizations,0);
  assert.equal(result.trial_eligible_cases,0);assert.equal(result.closed_exceptions,0);
  assert.equal(result.provider_writes,0);assert.equal(result.d1_operations,0);
});
test('incorrect account, listing, image set and scope are counted as unresolved mismatches',()=>{
  const bad={...row,account_id:'other-shop',listing_id:'wrong-draft',image_ids:['img1','img1'],permission_scope:'posts_publish'};
  const result=reconcile585(...args,[bad]);
  assert.equal(result.source_mismatch_count,4);
  assert.equal(result.cases[0].receipt_comparisons[0].missing_or_mismatched_images,true);
  assert.equal(result.cases[0].exception_closed,false);
});
test('duplicate provider correlation IDs remain flagged for external investigation',()=>{
  const result=reconcile585(...args,[row,{...row,recorded_at:'2026-11-03T07:00:00Z'}]);
  assert.deepEqual(result.duplicate_provider_request_ids,['req-585']);
  assert.equal(result.closed_exceptions,0);
});
test('replaced witness locator and changed provider source stale out prior follow-up',()=>{
  const result=reconcile585(...args,[{...row,witness_locator:'old case identifier'}]);
  assert.equal(result.stale_followups.length,1);assert.equal(result.matching_followups,0);
  const changed={...claim,identity_locator:'different provider identity source'},nextTrial=gate581(owner,notes,[],[changed]);
  const nextArgs=[nextTrial,owner,notes,[],[changed],[],[evidence]],nextIntake=intake583(...nextArgs),
    nextGate=gate584(nextIntake,...nextArgs,[witness],[ownerRequest]);
  const another=reconcile585(nextGate,nextIntake,...nextArgs,[witness],[ownerRequest],[row]);
  assert.equal(another.stale_followups.length,1);assert.equal(another.trial_eligible_cases,0);
});
test('source forgery, fake approval, secrets and malformed image lists fail closed',()=>{
  assert.throws(()=>reconcile585({...gate,owner_signoff:'APPROVED'},intake,...sourceArgs,[witness],[ownerRequest],[row]));
  assert.throws(()=>reconcile585(gate,{...intake,authenticated_provider_receipts:1},...sourceArgs,[witness],[ownerRequest],[row]));
  assert.throws(()=>receiptFollowup585({...row,followup_action:'APPROVE_TRIAL'}));
  assert.throws(()=>receiptFollowup585({...row,reason:'Bearer secret123'}));
  assert.throws(()=>receiptFollowup585({...row,image_ids:Array(21).fill('x')}));
  assert.throws(()=>reconcile585(...args,Array(101).fill(row)));
});
test('admin UI, CI and source marker preserve no-provider-write boundary',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-receipt-followup-585.mjs');
  for(const id of ['dd585Review','dd585Case','dd585Witness','dd585Correlation','dd585Account',
    'dd585Listing','dd585Images','dd585Scope','dd585Reviewer','dd585Action','dd585Reason',
    'dd585Ack','dd585Save','dd585Copy','dd585State','dd585Output'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:585|586|587|588|589)/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build585_receipt_followup\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:585|586|587|588|589)/);
});
