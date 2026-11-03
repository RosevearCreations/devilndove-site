import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trialPacket578} from '../public/js/admin-channel-trials-578.mjs';
import {reconcile579} from '../public/js/admin-channel-reconciliation-579.mjs';
import {review580,pin580,ACTIONS_580} from '../public/js/admin-channel-owner-review-580.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const record={channel:'etsy',action:'IMAGE_READBACK',product_ref:'54',provider_ref:'listing1',
  receipt_locator:'',observation:'Manual review, not an authenticated receipt.',
  outcome:'UNKNOWN',recorded_at:'2026-11-03T01:00:00Z'};
const notes=trialPacket578([record]);
const expected={channel:'etsy',account_id:'shop1',product_ref:'54',listing_id:'listing1',image_ids:['a','b','c']};
const observed={...expected,image_ids:['a','b','other']};
const source=reconcile579(expected,observed,notes);
const followup={source_pin:pin580(source),action:ACTIONS_580[0],reason:'Request exact authenticated image readback for listing1.',
  proof_locator:'Owner verification ticket 580',recorded_at:'2026-11-03T02:00:00Z'};
test('Manual matching or mismatched evidence cannot become a verified closure, owner decision or provider write',()=>{
  for(const comparison of [source,reconcile579(expected,expected,trialPacket578([{...record,outcome:'OBSERVED_UNVERIFIED'}]))]){
    const srcNotes=comparison===source?notes:trialPacket578([{...record,outcome:'OBSERVED_UNVERIFIED'}]);
    const result=review580(comparison,srcNotes,[]);
    assert.equal(result.authenticated_provider_receipts,0);
    assert.equal(result.verified_exception_closures,0);
    assert.equal(result.authorized_provider_writes,0);
    assert.equal(result.owner_decision,'NOT_RECORDED');assert.equal(result.owner_signoff,'PENDING');
  }
});
test('A source-pinned follow-up stays OPEN and becomes STALE after exact source changes',()=>{
  const current=review580(source,notes,[followup]);
  assert.equal(current.matching_followups.length,1);assert.equal(current.stale_followups.length,0);
  const changed=reconcile579(expected,{...observed,image_ids:['a','b','c']},notes);
  const stale=review580(changed,notes,[followup]);
  assert.equal(stale.matching_followups.length,0);assert.equal(stale.stale_followups.length,1);
  assert.equal(stale.verified_exception_closures,0);
});
test('Changed notes, false source review and unsafe actions are rejected',()=>{
  assert.throws(()=>review580(source,trialPacket578([]),[]));
  assert.throws(()=>review580({...source,owner_decision:'ACCEPTED'},notes,[]));
  for(const change of [{...followup,action:'CLOSE_EXCEPTION'},
    {...followup,reason:''},{...followup,recorded_at:'invalid'}])
    assert.throws(()=>review580(source,notes,[change]));
});
test('Build 580 UI, CI and live marker are wired without provider requests or D1 writes',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-owner-review-580.mjs');
  for(const id of ['dd580Review','dd580Action','dd580Reason','dd580Locator','dd580Ack',
    'dd580Save','dd580Copy','dd580State','dd580Output'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:580|581|582|583|584|585|586|587)/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build580_owner_review\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:580|581|582|583|584|585|586|587)/);
});
