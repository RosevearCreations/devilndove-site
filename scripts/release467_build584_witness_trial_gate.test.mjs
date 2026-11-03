import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trialPacket578} from '../public/js/admin-channel-trials-578.mjs';
import {reconcile579} from '../public/js/admin-channel-reconciliation-579.mjs';
import {review580} from '../public/js/admin-channel-owner-review-580.mjs';
import {gate581} from '../public/js/admin-channel-trial-gate-581.mjs';
import {claimPin582} from '../public/js/admin-channel-handoff-582.mjs';
import {intake583} from '../public/js/admin-channel-intake-583.mjs';
import {gate584,witnessRequest584,ownerDecisionRequest584,FORMAT_584} from '../public/js/admin-channel-witness-584.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const notes=trialPacket578([{channel:'etsy',action:'IMAGE_READBACK',product_ref:'54',provider_ref:'listing-1',
  receipt_locator:'',observation:'Unverified manually entered receipt observation.',outcome:'UNKNOWN',
  recorded_at:'2026-11-03T02:00:00Z'}]);
const expected={channel:'etsy',account_id:'shop1',product_ref:'54',listing_id:'listing-1',image_ids:['img1','img2']};
const owner=review580(reconcile579(expected,expected,notes),notes,[]);
const claim={channel:'etsy',action:'UPLOAD_IMAGE',source_pin:owner.source_pin,account_id:'shop1',product_ref:'54',
  receipt_locator:'Receipt reference',identity_locator:'Shop identity reference',scope_locator:'Scope reference',
  independent_reviewer:'Reviewer reference',owner_authorization_locator:'Authorization request',
  review_reason:'Need independent provider and owner signoff.',recorded_at:'2026-11-03T03:00:00Z'};
const trial=gate581(owner,notes,[],[claim]),pin=claimPin582(trial.claims[0]);
const evidence={claim_pin:pin,evidence_type:'PROVIDER_OPERATION_RECEIPT',source_locator:'Safe external receipt case 584',
  provider_correlation:'req-584',reviewer_reference:'External reviewer',account_reference:'shop1',
  permission_scope:'listings_w',owner_scope_request:'One image upload for Product 54',
  explanation:'Independent verification remains outstanding.',recorded_at:'2026-11-03T04:00:00Z'};
const args=[trial,owner,notes,[],[claim],[],[evidence]],intake=intake583(...args);
const review={claim_pin:pin,evidence_locator:evidence.source_locator,reviewer_reference:'External verifier case 584',
  provider_account:'shop1',claimed_scope:'listings_w',review_outcome:'AWAITING_INDEPENDENT_REVIEW',
  review_reason:'Request authenticated provider readback on exact action.',recorded_at:'2026-11-03T05:00:00Z'};
const ownerRequest={claim_pin:pin,channel:'etsy',account_id:'shop1',product_ref:'54',action:'UPLOAD_IMAGE',
  owner_request:'REQUEST_SEPARATE_OWNER_SIGNOFF',reason:'Require explicit one-time owner authorization for a verified image.',
  recorded_at:'2026-11-03T05:05:00Z'};
test('complete witness and owner references are REVIEW REQUESTS only, never authorization',()=>{
  const result=gate584(intake,...args,[review],[ownerRequest]);
  assert.equal(result.format,FORMAT_584);assert.equal(result.current_witness_review_requests,1);
  assert.equal(result.current_owner_decision_requests,1);assert.equal(result.cases[0].trial_eligible,false);
  assert.equal(result.authenticated_provider_receipts,0);assert.equal(result.verified_identity_and_scopes,0);
  assert.equal(result.verified_owner_action_authorizations,0);assert.equal(result.owner_signoff,'PENDING');
  assert.equal(result.closed_exceptions,0);assert.equal(result.provider_writes,0);assert.equal(result.d1_operations,0);
});
test('witness account and permission conflicts are explicit blockers',()=>{
  const result=gate584(intake,...args,[{...review,provider_account:'other-shop',claimed_scope:'posts_publish'}],[]);
  assert.equal(result.cases[0].account_disagreements,1);assert.equal(result.cases[0].scope_disagreements,1);
  assert.equal(result.cases[0].next_required_step,'RESOLVE_PROVENANCE_OR_SCOPE_CONFLICT_WITH_PROVIDER');
  assert.equal(result.trial_eligible_cases,0);
});
test('unknown, replaced or changed-source evidence causes stale witness and owner requests',()=>{
  const changed={...claim,receipt_locator:'a different receipt reference'},nextTrial=gate581(owner,notes,[],[changed]);
  const nextArgs=[nextTrial,owner,notes,[],[changed],[],[evidence]],next=intake583(...nextArgs);
  const result=gate584(next,...nextArgs,[review],[ownerRequest]);
  assert.equal(result.stale_witness_requests.length,1);assert.equal(result.stale_owner_requests.length,1);
  assert.equal(result.current_witness_review_requests,0);assert.equal(result.current_owner_decision_requests,0);
  assert.equal(result.trial_eligible_cases,0);
});
test('mismatched external locator and owner action are not matched to an active case',()=>{
  const result=gate584(intake,...args,[{...review,evidence_locator:'Unlinked case 123'}],
    [{...ownerRequest,action:'CREATE_DRAFT'}]);
  assert.equal(result.current_witness_review_requests,0);assert.equal(result.current_owner_decision_requests,0);
  assert.equal(result.stale_witness_requests.length,1);assert.equal(result.stale_owner_requests.length,1);
});
test('forged approval, source tampering and secrets fail closed',()=>{
  assert.throws(()=>gate584({...intake,authenticated_provider_receipts:1},...args,[review],[ownerRequest]));
  assert.throws(()=>gate584(intake,trial,{...owner,owner_signoff:'APPROVED'},notes,[],[claim],[],[evidence],[],[]));
  assert.throws(()=>witnessRequest584({...review,review_outcome:'AUTHENTICATED'}));
  assert.throws(()=>witnessRequest584({...review,review_reason:'Bearer token123'}));
  assert.throws(()=>ownerDecisionRequest584({...ownerRequest,owner_request:'APPROVE_TRIAL'}));
  assert.throws(()=>ownerDecisionRequest584({...ownerRequest,reason:'short'}));
  assert.throws(()=>gate584(intake,...args,Array(101).fill(review),[]));
});
test('admin integration and build marker are no-provider-write and no-approval by construction',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-witness-584.mjs');
  for(const id of ['dd584Review','dd584Case','dd584Evidence','dd584Reviewer','dd584Account',
    'dd584Scope','dd584Outcome','dd584Reason','dd584Ack','dd584SaveWitness',
    'dd584OwnerRequest','dd584OwnerReason','dd584OwnerAck','dd584SaveOwner','dd584Copy',
    'dd584State','dd584Output'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:584|585|586|587|588|589)/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build584_witness_trial_gate\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:584|585|586|587|588|589)/);
});
