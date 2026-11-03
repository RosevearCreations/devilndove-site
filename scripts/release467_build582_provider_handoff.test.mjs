import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trialPacket578} from '../public/js/admin-channel-trials-578.mjs';
import {reconcile579} from '../public/js/admin-channel-reconciliation-579.mjs';
import {review580} from '../public/js/admin-channel-owner-review-580.mjs';
import {gate581} from '../public/js/admin-channel-trial-gate-581.mjs';
import {handoff582,claimPin582,followup582,FORMAT_582} from '../public/js/admin-channel-handoff-582.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const note={channel:'etsy',action:'IMAGE_READBACK',product_ref:'54',provider_ref:'listing-1',receipt_locator:'',
  observation:'Manual note with no independently authenticated receipt.',outcome:'UNKNOWN',recorded_at:'2026-11-03T02:00:00Z'};
const notes=trialPacket578([note]),ids=['img1','img2','img3'];
const expected={channel:'etsy',account_id:'shop1',product_ref:'54',listing_id:'listing-1',image_ids:ids};
const owner=review580(reconcile579(expected,expected,notes),notes,[]);
const claim={channel:'etsy',action:'UPLOAD_IMAGE',source_pin:owner.source_pin,account_id:'shop1',product_ref:'54',
  receipt_locator:'External receipt claim',identity_locator:'Account record reference',scope_locator:'OAuth scope reference',
  independent_reviewer:'Reviewer reference',owner_authorization_locator:'Owner request reference',
  review_reason:'Please verify authentic provider account and exact authorized image action.',recorded_at:'2026-11-03T03:00:00Z'};
const gate=gate581(owner,notes,[],[claim]);
const request={claim_pin:claimPin582(gate.claims[0]),disposition:'REQUEST_SIGNED_RECEIPT_INSPECTION',
  reason:'Independently verify the original Etsy API receipt and actual account.',
  external_case_locator:'External case 582',recorded_at:'2026-11-03T04:00:00Z'};
test('complete typed provider references create an unresolved owner-safe handoff only',()=>{
  const r=handoff582(gate,owner,notes,[],[claim],[request]);
  assert.equal(r.format,FORMAT_582);assert.equal(r.open_provider_exceptions,1);
  assert.equal(r.exceptions[0].followup_requests.length,1);
  assert.equal(r.exceptions[0].verified_identity,false);
  assert.equal(r.exceptions[0].verified_permission,false);
  assert.equal(r.exceptions[0].exception_closed,false);
  assert.equal(r.authenticated_provider_identities,0);assert.equal(r.authenticated_receipts,0);
  assert.equal(r.verified_permissions,0);assert.equal(r.verified_owner_authorizations,0);
  assert.equal(r.closed_exceptions,0);assert.equal(r.owner_decision,'NOT_RECORDED');
  assert.equal(r.provider_writes,0);assert.equal(r.d1_operations,0);
});
test('changed provider receipt source pin makes an old follow-up stale, never closed',()=>{
  const changed={...claim,receipt_locator:'A different receipt locator'};
  const next=gate581(owner,notes,[],[changed]);
  const r=handoff582(next,owner,notes,[],[changed],[request]);
  assert.equal(r.stale_followups.length,1);
  assert.equal(r.exceptions[0].followup_requests.length,0);
  assert.equal(r.closed_exceptions,0);
});
test('forged approval, altered gate, unsafe disposition and incomplete request fail closed',()=>{
  assert.throws(()=>handoff582({...gate,verified_permissions:1},owner,notes,[],[claim],[]));
  assert.throws(()=>handoff582(gate,{...owner,owner_signoff:'APPROVED'},notes,[],[claim],[]));
  assert.throws(()=>followup582({...request,disposition:'CLOSE'}));
  assert.throws(()=>followup582({...request,reason:'short'}));
  assert.throws(()=>handoff582(gate,owner,trialPacket578([]),[],[claim],[]));
});
test('Admin handoff and production marker have strict no-write boundaries',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-handoff-582.mjs');
  for(const id of ['dd582Review','dd582Case','dd582Disposition','dd582Reason','dd582Locator',
    'dd582Ack','dd582Save','dd582Copy','dd582State','dd582Output'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:582|583|584|585|586)/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build582_provider_handoff\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:582|583|584|585|586)/);
});
