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
import {reconcile585} from '../public/js/admin-channel-receipt-followup-585.mjs';
import {aging586} from '../public/js/admin-channel-aging-586.mjs';
import {triage587,followupPin587} from '../public/js/admin-channel-provenance-triage-587.mjs';
import {disposition588,triagePin588} from '../public/js/admin-channel-disposition-588.mjs';
import {custody589,custodyRequest589,dispositionPin589,FORMAT_589} from '../public/js/admin-channel-custody-589.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const notes=trialPacket578([{channel:'etsy',action:'IMAGE_READBACK',product_ref:'54',provider_ref:'listing-1',
  receipt_locator:'',observation:'Unverified image reference',outcome:'UNKNOWN',recorded_at:'2026-11-03T02:00:00Z'}]);
const original={channel:'etsy',account_id:'shop1',product_ref:'54',listing_id:'listing-1',image_ids:['img1','img2']};
const owner=review580(reconcile579(original,original,notes),notes,[]);
const claim={channel:'etsy',action:'UPLOAD_IMAGE',source_pin:owner.source_pin,account_id:'shop1',product_ref:'54',
  receipt_locator:'Candidate receipt',identity_locator:'Candidate account',scope_locator:'Candidate scope',
  independent_reviewer:'Pending witness',owner_authorization_locator:'Owner decision requested',
  review_reason:'Original provider evidence and owner signoff remain missing.',recorded_at:'2026-11-03T03:00:00Z'};
const trial=gate581(owner,notes,[],[claim]),claimPin=claimPin582(trial.claims[0]);
const evidence={claim_pin:claimPin,evidence_type:'PROVIDER_OPERATION_RECEIPT',source_locator:'Candidate source 589',
  provider_correlation:'req-589',reviewer_reference:'Witness pending',account_reference:'shop1',
  permission_scope:'listings_w',owner_scope_request:'One image only',
  explanation:'Authenticate exact source outside local worksheet.',recorded_at:'2026-11-03T04:00:00Z'};
const witness={claim_pin:claimPin,evidence_locator:evidence.source_locator,reviewer_reference:'Pending witness',
  provider_account:'shop1',claimed_scope:'listings_w',review_outcome:'AWAITING_INDEPENDENT_REVIEW',
  review_reason:'Check exact source and provider permission.',recorded_at:'2026-11-03T05:00:00Z'};
const request={claim_pin:claimPin,channel:'etsy',account_id:'shop1',product_ref:'54',action:'UPLOAD_IMAGE',
  owner_request:'REQUEST_SEPARATE_OWNER_SIGNOFF',reason:'Need exact owner-signed trial authorization.',
  recorded_at:'2026-11-03T05:05:00Z'};
const receipt={claim_pin:claimPin,witness_locator:evidence.source_locator,provider_request_id:'req-589',
  account_id:'other-shop',listing_id:'listing-other',image_ids:['img1'],permission_scope:'wrong_scope',
  reviewer_reference:'External follow-up',followup_action:'REQUEST_INDEPENDENT_AUTHENTICATED_PROVIDER_READBACK',
  reason:'Original remote receipt and exact image IDs must be checked.',recorded_at:'2026-11-03T06:00:00Z'};
const base=[trial,owner,notes,[],[claim],[],[evidence]],intake=intake583(...base),
  witnessGate=gate584(intake,...base,[witness],[request]),
  receiptGate=reconcile585(witnessGate,intake,...base,[witness],[request],[receipt]);
const providerFollowup={claim_pin:claimPin,channel:'etsy',account_id:'shop1',product_ref:'54',
  action:'UPLOAD_IMAGE',provider_request_id:'req-589',followup_type:'INDEPENDENT_RECEIPT_WITNESS',
  next_step:'REQUEST_AUTHENTICATED_PROVIDER_READBACK',
  reason:'Original signed provider evidence still required.',due_at:'2026-10-24T10:00:00Z',
  recorded_at:'2026-10-22T10:00:00Z'};
const ownerFollowup={...providerFollowup,provider_request_id:'',
  followup_type:'OWNER_EXACT_ACTION_AUTHORIZATION',next_step:'REQUEST_OWNER_SCOPED_CONSENT',
  due_at:'2026-11-02T10:00:00Z',recorded_at:'2026-10-23T10:00:00Z'};
const originalArgs=[receiptGate,witnessGate,intake,...base,[witness],[request],[receipt],
  [providerFollowup,ownerFollowup]],asOf='2026-11-03T12:00:00Z';
const aging=aging586(...originalArgs,asOf),providerPin=followupPin587(aging.priority_queue[0]);
const ownerPin=followupPin587(aging.priority_queue.find(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'));
const triages=[{followup_pin:providerPin,next_action:'REQUEST_PRIMARY_PROVIDER_RECEIPT',
  external_locator:'Provider custody source',reviewer_ref:'Independent reviewer pending',
  reason:'Check provider custody and independent source records.',recorded_at:'2026-11-03T12:10:00Z'},
  {followup_pin:ownerPin,next_action:'REQUEST_EXACT_OWNER_TRIAL_SIGNOFF',
    external_locator:'Owner decision witness',reviewer_ref:'Owner signature pending',
    reason:'Verify separately signed exact account and Product action.',recorded_at:'2026-11-03T12:11:00Z'}];
const triage=triage587(aging,...originalArgs,triages,asOf);
const currentProvider=triage.cases.find(x=>x.followup_pin===providerPin),
  currentOwner=triage.cases.find(x=>x.followup_pin===ownerPin);
const dispositionCandidate=(item,action,stamp)=>({triage_pin:triagePin588(item,item.triage_requests[0]),
  followup_pin:item.followup_pin,next_disposition:action,
  observed_account_id:'shop1',observed_product_ref:'54',observed_action:'UPLOAD_IMAGE',
  observed_request_id:item.provider_request_id,evidence_locator:'Provider candidate evidence',
  independent_witness_ref:'Candidate witness',owner_decision_locator:'',
  reason:'Recheck exact independent provider receipt custody before any write.',
  next_review_at:'2026-11-06T12:00:00Z',recorded_at:stamp});
const dispositions=[dispositionCandidate(currentProvider,'REQUEST_INDEPENDENT_RECEIPT_AUTHENTICATION',
  '2026-11-03T12:30:00Z'),dispositionCandidate(currentOwner,
  'REQUEST_EXPLICIT_OWNER_SCOPE_DECISION','2026-11-03T12:31:00Z')];
const exactDisposition=disposition588(triage,aging,...originalArgs,triages,dispositions,asOf);
const args=[exactDisposition,triage,aging,...originalArgs,triages,dispositions];
const providerCase=exactDisposition.cases.find(x=>x.followup_type==='INDEPENDENT_RECEIPT_WITNESS');
const ownerCase=exactDisposition.cases.find(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION');
const pending={disposition_pin:dispositionPin589(providerCase,providerCase.disposition_reviews[0]),
  triage_pin:providerCase.triage_pin,next_action:'RECHECK_INDEPENDENT_CUSTODIAN_AND_WITNESS',
  receipt_locator:'Unsigned source candidate',custodian_from:'Same reviewer',custodian_to:'Same reviewer',
  handoff_reference:'Handoff candidate 589',handoff_at:'2026-11-03T12:30:00Z',
  independent_witness_ref:'',owner_decision_reference:'',owner_account_id:'shop-other',
  owner_product_ref:'54',owner_action_scope:'UPLOAD_IMAGE',owner_scope_expires_at:'',
  reason:'Independent witness and original provider chain remain unresolved.',
  recorded_at:'2026-11-03T13:00:00Z',next_review_at:'2026-11-04T12:00:00Z'};
test('same custodian, missing witness and source scope mismatch never become authenticated custody',()=>{
  const r=custody589(...args,[pending],asOf);
  assert.equal(r.format,FORMAT_589);assert.equal(r.open_custody_cases,2);
  assert.equal(r.owner_scope_conflicts,1);assert.equal(r.missing_custody_reviews,1);
  const p=r.cases.find(x=>x.followup_type==='INDEPENDENT_RECEIPT_WITNESS');
  assert.ok(p.pending_custody_checks.includes('INDEPENDENT_CUSTODY_WITNESS_MISSING'));
  assert.ok(p.pending_custody_checks.includes('INDEPENDENT_CUSTODIAN_NOT_ESTABLISHED'));
  assert.ok(p.pending_scope_conflicts.includes('OWNER_ACCOUNT_SCOPE_CONFLICT'));
  assert.equal(r.source_custody_authenticated,0);assert.equal(r.independent_provider_receipts_authenticated,0);
  assert.equal(r.verified_owner_trial_authorizations,0);assert.equal(r.provider_writes,0);
  assert.equal(r.d1_operations,0);assert.equal(r.trial_eligible_cases,0);
});
test('owner action-specific scope and expired candidate decision remain separate HOLD',()=>{
  const row={...pending,disposition_pin:dispositionPin589(ownerCase,ownerCase.disposition_reviews[0]),
    triage_pin:ownerCase.triage_pin,next_action:'REQUEST_SEPARATELY_SIGNED_EXACT_OWNER_DECISION',
    owner_account_id:'shop1',owner_product_ref:'wrong-product',owner_action_scope:'PUBLISH',
    owner_scope_expires_at:'2026-11-02T12:00:00Z',owner_decision_reference:'Unsigned candidate'};
  const r=custody589(...args,[row],'2026-11-05T12:00:00Z');
  assert.equal(r.overdue_custody_rechecks,1);
  assert.equal(r.owner_scope_conflicts,2);
  assert.ok(r.cases.find(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION')
    .pending_custody_checks.includes('CANDIDATE_OWNER_SCOPE_EXPIRED'));
  assert.equal(r.verified_owner_trial_authorizations,0);
  assert.throws(()=>custody589(...args,[{...pending,next_action:'MAINTAIN_OWNER_AUTHORIZATION_HOLD'}],asOf));
});
test('source tampering, missing chain, duplicate handoffs, stale pin, secrets and forged approvals fail closed',()=>{
  const r=custody589(...args,[pending,{...pending,recorded_at:'2026-11-03T13:20:00Z'}],asOf);
  assert.deepEqual(r.duplicate_candidate_handoff_references,['Handoff candidate 589']);
  assert.equal(custody589(...args,[{...pending,disposition_pin:'["stale","old","disposition","source","pin"]'}],asOf)
    .stale_custody_requests.length,1);
  assert.throws(()=>custody589({...exactDisposition,source_pin:'forged'},...args.slice(1),[],asOf));
  assert.throws(()=>custodyRequest589({...pending,next_action:'APPROVE_ETSY_TRIAL'}));
  assert.throws(()=>custodyRequest589({...pending,receipt_locator:'Bearer secret'}));
  assert.throws(()=>custodyRequest589({...pending,handoff_at:'2026-11-10T00:00:00Z'}));
  assert.throws(()=>custody589(...args,Array(101).fill(pending),asOf));
});
test('Admin controls, CI and release marker include Build 589 without provider transport',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-custody-589.mjs');
  for(const id of ['dd589Review','dd589Case','dd589Action','dd589Receipt','dd589From','dd589To',
    'dd589Handoff','dd589HandoffAt','dd589Witness','dd589OwnerDecision','dd589Account',
    'dd589Product','dd589Scope','dd589Expiry','dd589Due','dd589Reason','dd589Ack',
    'dd589Save','dd589Copy','dd589State','dd589Output'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build 589/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build589_custody_recheck\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":589/);
});
