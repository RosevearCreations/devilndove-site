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
import {triage587,triageRequest587,followupPin587,FORMAT_587} from '../public/js/admin-channel-provenance-triage-587.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const notes=trialPacket578([{channel:'etsy',action:'IMAGE_READBACK',product_ref:'54',provider_ref:'listing-1',
  receipt_locator:'',observation:'Typed provider photo reference only.',outcome:'UNKNOWN',
  recorded_at:'2026-11-03T02:00:00Z'}]);
const source={channel:'etsy',account_id:'shop1',product_ref:'54',listing_id:'listing-1',image_ids:['img1','img2']};
const owner=review580(reconcile579(source,source,notes),notes,[]);
const claim={channel:'etsy',action:'UPLOAD_IMAGE',source_pin:owner.source_pin,account_id:'shop1',product_ref:'54',
  receipt_locator:'Claimed receipt',identity_locator:'Claimed account',scope_locator:'Claimed scope',
  independent_reviewer:'Reviewer reference',owner_authorization_locator:'Requested owner approval',
  review_reason:'Verify provider source and account action ownership.',recorded_at:'2026-11-03T03:00:00Z'};
const trial=gate581(owner,notes,[],[claim]),pin=claimPin582(trial.claims[0]);
const evidence={claim_pin:pin,evidence_type:'PROVIDER_OPERATION_RECEIPT',source_locator:'Safe source 587 case',
  provider_correlation:'req-587',reviewer_reference:'Independent review',account_reference:'shop1',
  permission_scope:'listings_w',owner_scope_request:'One image upload only',
  explanation:'Need authenticated provider readback and owner signoff.',recorded_at:'2026-11-03T04:00:00Z'};
const witness={claim_pin:pin,evidence_locator:evidence.source_locator,reviewer_reference:'Witness request',
  provider_account:'shop1',claimed_scope:'listings_w',review_outcome:'AWAITING_INDEPENDENT_REVIEW',
  review_reason:'Check exact authenticated provider receipt.',recorded_at:'2026-11-03T05:00:00Z'};
const ownerRequest={claim_pin:pin,channel:'etsy',account_id:'shop1',product_ref:'54',action:'UPLOAD_IMAGE',
  owner_request:'REQUEST_SEPARATE_OWNER_SIGNOFF',reason:'Request signed exact trial decision.',
  recorded_at:'2026-11-03T05:05:00Z'};
const receipt={claim_pin:pin,witness_locator:evidence.source_locator,provider_request_id:'req-587',
  account_id:'other-shop',listing_id:'wrong-listing',image_ids:['img1'],permission_scope:'wrong_scope',
  reviewer_reference:'External case follow-up',followup_action:'REQUEST_INDEPENDENT_AUTHENTICATED_PROVIDER_READBACK',
  reason:'Need independent reconciliation before retry.',recorded_at:'2026-11-03T06:00:00Z'};
const base=[trial,owner,notes,[],[claim],[],[evidence]],intake=intake583(...base),
  witnessGate=gate584(intake,...base,[witness],[ownerRequest]),
  receiptGate=reconcile585(witnessGate,intake,...base,[witness],[ownerRequest],[receipt]);
const witnessFollowup={claim_pin:pin,channel:'etsy',account_id:'shop1',product_ref:'54',action:'UPLOAD_IMAGE',
  provider_request_id:'req-587',followup_type:'INDEPENDENT_RECEIPT_WITNESS',
  next_step:'REQUEST_AUTHENTICATED_PROVIDER_READBACK',
  reason:'Authenticate provider evidence before any external action.',
  due_at:'2026-10-24T10:00:00Z',recorded_at:'2026-10-22T10:00:00Z'};
const ownerFollowup={...witnessFollowup,followup_type:'OWNER_EXACT_ACTION_AUTHORIZATION',
  next_step:'REQUEST_OWNER_SCOPED_CONSENT',provider_request_id:'',
  due_at:'2026-11-02T10:00:00Z',recorded_at:'2026-10-23T10:00:00Z'};
const sourceArgs=[receiptGate,witnessGate,intake,...base,[witness],[ownerRequest],[receipt],
  [witnessFollowup,ownerFollowup]],asOf='2026-11-03T12:00:00Z';
const aging=aging586(...sourceArgs,asOf);
const reviewRow={followup_pin:followupPin587(aging.priority_queue[0]),next_action:'REQUEST_PRIMARY_PROVIDER_RECEIPT',
  external_locator:'External witness case 587',reviewer_ref:'Provider witness pending',
  reason:'Verify original provider receipt and unresolved identity.',recorded_at:'2026-11-03T13:00:00Z'};
test('overdue provider identity and scope mismatches are prioritized but never authenticated',()=>{
  const r=triage587(aging,...sourceArgs,[reviewRow],asOf);
  assert.equal(r.format,FORMAT_587);assert.equal(r.open_followup_count,2);
  assert.equal(r.source_conflict_cases,2);assert.equal(r.overdue_cases,2);
  assert.equal(r.cases[0].provenance_gaps.includes('EXACT_ACCOUNT_LISTING_IMAGE_OR_SCOPE_CONFLICT'),true);
  assert.equal(r.cases[0].triage_requests.length,1);
  assert.equal(r.authenticated_provider_receipts,0);assert.equal(r.verified_owner_trial_signoffs,0);
  assert.equal(r.closed_exceptions,0);assert.equal(r.provider_writes,0);assert.equal(r.d1_operations,0);
});
test('owner decision requires an exact owner follow-up and cannot approve writes',()=>{
  const ownerPin=followupPin587(aging.priority_queue.find(x=>x.followup_type==='OWNER_EXACT_ACTION_AUTHORIZATION'));
  const ownerTriage={...reviewRow,followup_pin:ownerPin,next_action:'REQUEST_EXACT_OWNER_TRIAL_SIGNOFF',
    recorded_at:'2026-11-03T14:00:00Z'};
  const r=triage587(aging,...sourceArgs,[ownerTriage],asOf);
  assert.equal(r.owner_decision_followups,1);
  assert.equal(r.cases.find(x=>x.followup_pin===ownerPin).triage_requests.length,1);
  assert.equal(r.trial_eligible_cases,0);
  assert.throws(()=>triage587(aging,...sourceArgs,[{...reviewRow,next_action:'DEFER_OWNER_TRIAL'}],asOf));
});
test('stale source records and forged proof claims fail closed',()=>{
  const stale={...reviewRow,followup_pin:'["outdated","claim","source","that","no longer","exists"]'};
  const r=triage587(aging,...sourceArgs,[stale],asOf);
  assert.equal(r.stale_triage_requests.length,1);
  assert.throws(()=>triage587({...aging,verified_provider_receipts:5},...sourceArgs,[],asOf));
  assert.throws(()=>triage587(aging,{...receiptGate,authenticated_provider_receipts:1},...sourceArgs.slice(1),[],asOf));
  assert.throws(()=>triageRequest587({...reviewRow,next_action:'APPROVE_TRIAL'}));
  assert.throws(()=>triageRequest587({...reviewRow,reason:'Bearer secret123'}));
  assert.throws(()=>triage587(aging,...sourceArgs,Array(101).fill(reviewRow),asOf));
});
test('Admin, CI and marker reflect Build 587 without provider API writes',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-provenance-triage-587.mjs');
  for(const id of ['dd587Review','dd587Case','dd587Action','dd587Locator','dd587Reviewer',
    'dd587Reason','dd587Ack','dd587Save','dd587Copy','dd587State','dd587Output'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build 587/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build587_provenance_triage\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":587/);
});
