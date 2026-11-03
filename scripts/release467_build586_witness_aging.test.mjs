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
import {aging586,agingBucket586,followup586,FORMAT_586} from '../public/js/admin-channel-aging-586.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const notes=trialPacket578([{channel:'etsy',action:'IMAGE_READBACK',product_ref:'54',provider_ref:'listing-1',
  receipt_locator:'',observation:'Manual unauthenticated photo readback claim.',outcome:'UNKNOWN',
  recorded_at:'2026-11-03T02:00:00Z'}]);
const source={channel:'etsy',account_id:'shop1',product_ref:'54',listing_id:'listing-1',image_ids:['img1','img2']};
const owner=review580(reconcile579(source,source,notes),notes,[]);
const claim={channel:'etsy',action:'UPLOAD_IMAGE',source_pin:owner.source_pin,account_id:'shop1',product_ref:'54',
  receipt_locator:'Receipt claim',identity_locator:'Identity claim',scope_locator:'Scope claim',
  independent_reviewer:'Reviewer claim',owner_authorization_locator:'Authorization request',
  review_reason:'Confirm exact provider and owner credentials outside browser.',recorded_at:'2026-11-03T03:00:00Z'};
const trial=gate581(owner,notes,[],[claim]),pin=claimPin582(trial.claims[0]);
const evidence={claim_pin:pin,evidence_type:'PROVIDER_OPERATION_RECEIPT',source_locator:'External source case 586',
  provider_correlation:'req-586',reviewer_reference:'Independent review case',account_reference:'shop1',
  permission_scope:'listings_w',owner_scope_request:'One image for Product 54',
  explanation:'Source authenticity is still unverified.',recorded_at:'2026-11-03T04:00:00Z'};
const witness={claim_pin:pin,evidence_locator:evidence.source_locator,reviewer_reference:'Witness request 586',
  provider_account:'shop1',claimed_scope:'listings_w',review_outcome:'AWAITING_INDEPENDENT_REVIEW',
  review_reason:'Need real authenticated Etsy provider receipt.',recorded_at:'2026-11-03T05:00:00Z'};
const ownerRequest={claim_pin:pin,channel:'etsy',account_id:'shop1',product_ref:'54',action:'UPLOAD_IMAGE',
  owner_request:'REQUEST_SEPARATE_OWNER_SIGNOFF',reason:'Seek exact owner consent for the one image.',
  recorded_at:'2026-11-03T05:05:00Z'};
const receipt={claim_pin:pin,witness_locator:evidence.source_locator,provider_request_id:'req-586',
  account_id:'shop1',listing_id:'listing-1',image_ids:['img1','img2'],permission_scope:'listings_w',
  reviewer_reference:'External request only',followup_action:'REQUEST_INDEPENDENT_AUTHENTICATED_PROVIDER_READBACK',
  reason:'Independent provider readback remains outstanding.',recorded_at:'2026-11-03T06:00:00Z'};
const args0=[trial,owner,notes,[],[claim],[],[evidence]],intake=intake583(...args0),
  witnessGate=gate584(intake,...args0,[witness],[ownerRequest]),
  receiptGate=reconcile585(witnessGate,intake,...args0,[witness],[ownerRequest],[receipt]);
const args=[receiptGate,witnessGate,intake,...args0,[witness],[ownerRequest],[receipt]];
const row={claim_pin:pin,channel:'etsy',account_id:'shop1',product_ref:'54',action:'UPLOAD_IMAGE',
  provider_request_id:'req-586',followup_type:'INDEPENDENT_RECEIPT_WITNESS',
  next_step:'REQUEST_AUTHENTICATED_PROVIDER_READBACK',
  reason:'Obtain true signed-in Etsy receipt and verify image identity.',
  due_at:'2026-11-01T10:00:00Z',recorded_at:'2026-10-30T10:00:00Z'};
test('source-matched witness and exact owner follow-ups remain OPEN and prioritized by aging',()=>{
  const ownerDue={...row,provider_request_id:'',followup_type:'OWNER_EXACT_ACTION_AUTHORIZATION',
    next_step:'REQUEST_OWNER_SCOPED_CONSENT',due_at:'2026-10-24T10:00:00Z',recorded_at:'2026-10-22T10:00:00Z'};
  const result=aging586(...args,[row,ownerDue],'2026-11-03T12:00:00Z');
  assert.equal(result.format,FORMAT_586);assert.equal(result.overdue_count,2);
  assert.equal(result.overdue_8_plus,1);assert.equal(result.priority_queue[0].next_step,'REQUEST_OWNER_SCOPED_CONSENT');
  assert.equal(result.cases[0].followups.length,2);assert.equal(result.closed_exceptions,0);
  assert.equal(result.verified_provider_receipts,0);assert.equal(result.verified_owner_action_authorizations,0);
  assert.equal(result.provider_writes,0);assert.equal(result.d1_operations,0);
});
test('calendar-day due buckets are deterministic across time-of-day differences',()=>{
  assert.equal(agingBucket586('2026-11-04T00:00:00Z','2026-11-03T23:00:00Z').bucket,'NOT_DUE');
  assert.equal(agingBucket586('2026-11-03T00:01:00Z','2026-11-03T23:00:00Z').bucket,'DUE_TODAY');
  assert.deepEqual(agingBucket586('2026-10-27T11:00:00Z','2026-11-03T12:00:00Z'),
    {overdue_days:7,bucket:'OVERDUE_1_TO_7_DAYS'});
  assert.deepEqual(agingBucket586('2026-10-26T11:00:00Z','2026-11-03T12:00:00Z'),
    {overdue_days:8,bucket:'OVERDUE_8_PLUS_DAYS'});
});
test('stale provider correlation, wrong exact owner action or changed source cannot join current queue',()=>{
  const stale={...row,provider_request_id:'unknown-correlation'};
  const wrongAction={...row,action:'CREATE_DRAFT'};
  const result=aging586(...args,[stale,wrongAction],'2026-11-03T12:00:00Z');
  assert.equal(result.stale_followups.length,2);assert.equal(result.priority_queue.length,0);
  const changed={...claim,receipt_locator:'different source'},nextTrial=gate581(owner,notes,[],[changed]);
  const nextArgs=[nextTrial,owner,notes,[],[changed],[],[evidence]],nextIntake=intake583(...nextArgs),
    nextWitness=gate584(nextIntake,...nextArgs,[witness],[ownerRequest]),
    nextReceipt=reconcile585(nextWitness,nextIntake,...nextArgs,[witness],[ownerRequest],[receipt]);
  const another=aging586(nextReceipt,nextWitness,nextIntake,...nextArgs,[witness],[ownerRequest],
    [receipt],[row],'2026-11-03T12:00:00Z');
  assert.equal(another.stale_followups.length,1);assert.equal(another.trial_eligible_cases,0);
});
test('unsupported owner approval action, unsafe secret, fabricated source and bad due dates fail closed',()=>{
  assert.throws(()=>followup586({...row,followup_type:'OWNER_EXACT_ACTION_AUTHORIZATION'}));
  assert.throws(()=>followup586({...row,next_step:'APPROVE_PROVIDER_WRITE'}));
  assert.throws(()=>followup586({...row,reason:'Bearer token123'}));
  assert.throws(()=>followup586({...row,due_at:'tomorrow someday'}));
  assert.throws(()=>aging586({...receiptGate,verified_provider_receipts:1},...args.slice(1),[row]));
  assert.throws(()=>aging586(...args,Array(101).fill(row),'2026-11-03T12:00:00Z'));
});
test('admin, CI and marker wire no provider writes into the owner follow-up queue',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-aging-586.mjs');
  for(const id of ['dd586Review','dd586Case','dd586Correlation','dd586Type','dd586Step','dd586Due',
    'dd586Reason','dd586Ack','dd586Save','dd586Copy','dd586State','dd586Output'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:586|587|588|589|590)/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build586_witness_aging\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:586|587|588|589|590)/);
});
