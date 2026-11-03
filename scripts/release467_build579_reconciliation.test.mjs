import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reconcile579} from '../public/js/admin-channel-reconciliation-579.mjs';
import {trialPacket578} from '../public/js/admin-channel-trials-578.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const expected={channel:'etsy',account_id:'shop-12',product_ref:'54',listing_id:'123456',image_ids:['img1','img2','img3']};
const note={channel:'etsy',action:'IMAGE_READBACK',product_ref:'54',provider_ref:'123456',receipt_locator:'',
  observation:'Owner recorded distinct image IDs without a provider signature.',outcome:'OBSERVED_UNVERIFIED',recorded_at:'2026-11-02T19:00:00Z'};
test('even matching documentary IDs never become authenticated evidence or owner acceptance',()=>{
  const r=reconcile579(expected,structuredClone(expected),trialPacket578([note]));
  assert.equal(r.evidence_state,'STRUCTURAL_MATCH_EXTERNAL_VERIFICATION_REQUIRED');
  assert.equal(r.closure_ready,false);assert.equal(r.authenticated_provider_receipts,0);
  assert.equal(r.verified_remote_images,0);assert.equal(r.verified_exception_closures,0);
  assert.equal(r.owner_decision,'PENDING');assert.equal(r.provider_writes,0);
});
test('account, Product, listing and individual image mismatches are all explicit open exceptions',()=>{
  const r=reconcile579(expected,{...expected,account_id:'wrong',product_ref:'55',listing_id:'other',image_ids:['img1','img3','wrong']},trialPacket578([]));
  for(const k of ['MISMATCH_ACCOUNT','MISMATCH_PRODUCT','MISMATCH_LISTING','MISMATCH_IMAGES'])
    assert.ok(r.exceptions.includes(k),k);
  assert.equal(r.closure_ready,false);
});
test('duplicate or missing image IDs and unresolved outcome keep exception HOLD',()=>{
  const r=reconcile579(expected,{...expected,image_ids:['img1','img1','img3']},
    trialPacket578([{...note,outcome:'UNKNOWN'}]));
  assert.ok(r.exceptions.includes('MISMATCH_IMAGES'));
  assert.ok(r.exceptions.includes('UNRESOLVED_UNKNOWN_IMAGE_READBACK'));
  assert.throws(()=>reconcile579(expected,{...expected,account_id:''},trialPacket578([])));
  assert.throws(()=>reconcile579({...expected,channel:'facebook_marketplace'},expected,trialPacket578([])));
});
test('Admin integration and release checks expose no unapproved provider or D1 write',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-reconciliation-579.mjs');
  for(const id of ['dd579Compare','dd579Copy','dd579ExpectedAccount','dd579ObservedAccount',
    'dd579ExpectedListing','dd579ObservedListing','dd579ExpectedImages','dd579ObservedImages',
    'dd579Output','dd579State'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Build 579/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build579_reconciliation\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":579/);
});
