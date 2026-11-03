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
import {disposition588,dispositionRequest588,triagePin588,FORMAT_588} from '../public/js/admin-channel-disposition-588.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const notes=trialPacket578([{channel:'etsy',action:'IMAGE_READBACK',product_ref:'54',provider_ref:'listing-1',
  receipt_locator:'',observation:'Candidate reference only',outcome:'UNKNOWN',recorded_at:'2026-11-03T02:00:00Z'}]);
const source={channel:'etsy',account_id:'shop1',product_ref:'54',listing_id:'listing-1',image_ids:['img1','img2']};
const owner=review580(reconcile579(source,source,notes),notes,[]);
const claim={channel:'etsy',action:'UPLOAD_IMAGE',source_pin:owner.source_pin,account_id:'shop1',product_ref:'54',
  receipt_locator:'Candidate receipt',identity_locator:'Candidate account',scope_locator:'Candidate scope',
  independent_reviewer:'Witness reference',owner_authorization_locator:'Owner decision request',
  review_reason:'Independent proof and owner-specific authorization needed.',recorded_at:'2026-11-03T03:00:00Z'};
const gate=gate581(owner,notes,[],[claim]),claimPin=claimPin582(gate.claims[0]);
const evidence={claim_pin:claimPin,evidence_type:'PROVIDER_OPERATION_RECEIPT',source_locator:'Receipt candidate 588',
  provider_correlation:'req-588',reviewer_reference:'Witness',account_reference:'shop1',
  permission_scope:'listings_w',owner_scope_request:'One image only',
  explanation:'Authenticated proof and exact owner permission not yet obtained.',recorded_at:'2026-11-03T04:00:00Z'};
const witness={claim_pin:claimPin,evidence_locator:evidence.source_locator,reviewer_reference:'Witness pending',
  provider_account:'shop1',claimed_scope:'listings_w',review_outcome:'AWAITING_INDEPENDENT_REVIEW',
  review_reason:'Check provider source and exact image IDs.',recorded_at:'2026-11-03T05:00:00Z'};
const ownerRequest={claim_pin:claimPin,channel:'etsy',account_id:'shop1',product_ref:'54',action:'UPLOAD_IMAGE',
  owner_request:'REQUEST_SEPARATE_OWNER_SIGNOFF',reason:'Exact product and action must be signed independently.',
  recorded_at:'2026-11-03T05:05:00Z'};
const receipt={claim_pin:claimPin,witness_locator:evidence.source_locator,provider_request_id:'req-588',
  account_id:'other-shop',listing_id:'listing-other',image_ids:['img1'],permission_scope:'wrong_scope',
  reviewer_reference:'External followup',followup_action:'REQUEST_INDEPENDENT_AUTHENTICATED_PROVIDER_READBACK',
  reason:'Independent authentication and exact source match remain missing.',recorded_at:'2026-11-03T06:00:00Z'};
const base=[gate,owner,notes,[],[claim],[],[evidence]],intake=intake583(...base),
  witnessGate=gate584(intake,...base,[witness],[ownerRequest]),
  receiptGate=reconcile585(witnessGate,intake,...base,[witness],[ownerRequest],[receipt]);
const openWitness={claim_pin:claimPin,channel:'etsy',account_id:'shop1',product_ref:'54',action:'UPLOAD_IMAGE',
  provider_request_id:'req-588',followup_type:'INDEPENDENT_RECEIPT_WITNESS',
  next_step:'REQUEST_AUTHENTICATED_PROVIDER_READBACK',
  reason:'Authenticate source before any retry or image write.',
  due_at:'2026-10-24T10:00:00Z',recorded_at:'2026-10-22T10:00:00Z'};
const openOwner={...openWitness,followup_type:'OWNER_EXACT_ACTION_AUTHORIZATION',
  provider_request_id:'',next_step:'REQUEST_OWNER_SCOPED_CONSENT',
  due_at:'2026-11-02T10:00:00Z',recorded_at:'2026-10-23T10:00:00Z'};
const original=[receiptGate,witnessGate,intake,...base,[witness],[ownerRequest],[receipt],
  [openWitness,openOwner]],asOf='2026-11-03T12:00:00Z';
const aging=aging586(...original,asOf),providerPin=followupPin587(aging.priority_queue[0]);
const ownerPin=followupPin587(aging.priority_queue.find(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'));
const triageRequests=[{followup_pin:providerPin,next_action:'ESCALATE_PROVENANCE_OR_SCOPE_CONFLICT',
  external_locator:'Independent witness case',reviewer_ref:'Pending witness',
  reason:'Verify mismatched source account and list images.',recorded_at:'2026-11-03T12:10:00Z'},
  {followup_pin:ownerPin,next_action:'REQUEST_EXACT_OWNER_TRIAL_SIGNOFF',
    external_locator:'Owner exact-action receipt request',reviewer_ref:'Owner pending',
    reason:'Obtain separate exact shop product and image trial decision.',recorded_at:'2026-11-03T12:11:00Z'}];
const triage=triage587(aging,...original,triageRequests,asOf);
const args=[triage,aging,...original,triageRequests],provider=triage.cases.find(x=>
  x.followup_pin===providerPin),ownerCase=triage.cases.find(x=>x.followup_pin===ownerPin);
const candidate={triage_pin:triagePin588(provider,provider.triage_requests[0]),
  followup_pin:providerPin,next_disposition:'ESCALATE_SOURCE_ID_MISMATCH',
  observed_account_id:'wrong-shop',observed_product_ref:'54',observed_action:'UPLOAD_IMAGE',
  observed_request_id:'req-wrong',evidence_locator:'Unverified provider receipt',
  independent_witness_ref:'Witness still pending',owner_decision_locator:'',
  reason:'Resolve independently mismatched provider identity and request ID.',
  next_review_at:'2026-11-04T12:00:00Z',recorded_at:'2026-11-03T13:00:00Z'};
test('candidate provenance disposition flags mismatched exact account and correlation, never authenticates',()=>{
  const r=disposition588(...args,[candidate],asOf);
  assert.equal(r.format,FORMAT_588);assert.equal(r.open_disposition_cases,2);
  assert.equal(r.identity_conflicts,2);assert.equal(r.missing_review_count,1);
  const item=r.cases.find(x=>x.followup_pin===providerPin);
  assert.deepEqual(item.latest_review.source_conflicts,['ACCOUNT_ID_CONFLICT','PROVIDER_REQUEST_ID_CONFLICT']);
  assert.equal(item.latest_review.provider_receipt_authenticated,false);
  assert.equal(r.provider_receipts_authenticated,0);assert.equal(r.verified_owner_trial_decisions,0);
  assert.equal(r.closed_exceptions,0);assert.equal(r.provider_writes,0);assert.equal(r.d1_operations,0);
});
test('exact owner request stays unsigned with missing decision evidence and overdue review',()=>{
  const item={...candidate,triage_pin:triagePin588(ownerCase,ownerCase.triage_requests[0]),
    followup_pin:ownerPin,next_disposition:'REQUEST_EXPLICIT_OWNER_SCOPE_DECISION',
    observed_account_id:'shop1',observed_request_id:'',evidence_locator:'',independent_witness_ref:'',
    next_review_at:'2026-11-03T13:30:00Z',recorded_at:'2026-11-03T13:00:00Z'};
  const r=disposition588(...args,[item],'2026-11-04T14:00:00Z');
  assert.equal(r.owner_decision_cases,1);assert.equal(r.overdue_rechecks,1);
  assert.equal(r.cases.find(x=>x.followup_pin===ownerPin).latest_review.evidence_gap,
    'EXACT_OWNER_DECISION_EVIDENCE_MISSING');
  assert.equal(r.trial_eligible_cases,0);
  assert.throws(()=>disposition588(...args,[{...candidate,next_disposition:'MAINTAIN_OWNER_TRIAL_HOLD'}],asOf));
});
test('stale exact triage, stale request pin, forged approval and credentials fail closed',()=>{
  const r=disposition588(...args,[{...candidate,triage_pin:'["stale","provenance", "source","pin"]'}],asOf);
  assert.equal(r.stale_disposition_requests.length,1);
  assert.throws(()=>disposition588({...triage,source_pin:'fake'},...args.slice(1),[],asOf));
  assert.throws(()=>dispositionRequest588({...candidate,next_disposition:'AUTHORIZE_PROVIDER_WRITE'}));
  assert.throws(()=>dispositionRequest588({...candidate,evidence_locator:'Bearer xyz'}));
  assert.throws(()=>dispositionRequest588({...candidate,next_review_at:'2026-11-02T13:00:00Z'}));
  assert.throws(()=>disposition588(...args,Array(101).fill(candidate),asOf));
});
test('Admin, CI and deploy marker contain Build 588 with no provider transport',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-disposition-588.mjs');
  for(const id of ['dd588Review','dd588Case','dd588Action','dd588Account','dd588Product',
    'dd588Scope','dd588Correlation','dd588Evidence','dd588Witness','dd588Owner',
    'dd588Due','dd588Reason','dd588Ack','dd588Save','dd588Copy','dd588State','dd588Output'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build 588/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build588_disposition_recheck\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":588/);
});
