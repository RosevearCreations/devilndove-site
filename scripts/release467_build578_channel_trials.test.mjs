import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trialPacket578,readback578,validateTrial578,FORMAT_578} from '../public/js/admin-channel-trials-578.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const row={channel:'etsy',action:'IMAGE_READBACK',product_ref:'54',provider_ref:'draft 123',
  receipt_locator:'Etsy Shop Manager local observation',observation:'Three images appeared, but actual IDs require independent review.',
  outcome:'OBSERVED_UNVERIFIED',recorded_at:'2026-11-02T19:00:00Z'};
test('typed Etsy images and draft identifiers cannot establish remote identity or authorize writes',()=>{
  const result=readback578(trialPacket578([row,{...row,action:'DRAFT_READBACK'}]));
  assert.equal(result.total,2);assert.equal(result.authenticated_provider_receipts,0);
  assert.equal(result.verified_etsy_drafts,0);assert.equal(result.verified_remote_images,0);
  assert.equal(result.authorized_provider_writes,0);assert.equal(result.owner_decision,'PENDING');
});
test('Marketplace remains manual and unsupported actions are rejected',()=>{
  assert.throws(()=>validateTrial578({...row,channel:'facebook_marketplace'}));
  assert.equal(validateTrial578({...row,channel:'facebook_marketplace',action:'OWNER_FOLLOWUP'}).channel,'facebook_marketplace');
  for(const changed of [{...row,action:'PUBLISH'},{...row,outcome:'VERIFIED'},
    {...row,observation:''},{...row,channel:'unsupported'}])assert.throws(()=>validateTrial578(changed));
  assert.throws(()=>trialPacket578(Array(101).fill(row)));
});
test('tampered version is rejected and no local note is independently authenticated',()=>{
  assert.equal(trialPacket578([]).format,FORMAT_578);
  assert.throws(()=>readback578({...trialPacket578([row]),build:577}));
  assert.equal(readback578(trialPacket578([])).channels[3].state,'MANUAL_ONLY');
});
test('screen is integrated, explicit gates and no provider API or database requests',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-trials-578.mjs');
  for(const id of ['dd578Form','dd578Channel','dd578Action','dd578Product','dd578Provider',
    'dd578Locator','dd578Observation','dd578Outcome','dd578Ack','dd578Status','dd578Output','dd578Copy'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.match(read('admin/index.html'),/\/admin\/channel-trials\//);
  assert.match(html,/provider POST/);assert.match(html,/Marketplace/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|indexedDB|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build578_channel_trials\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:579|580|581|582)/);
});
