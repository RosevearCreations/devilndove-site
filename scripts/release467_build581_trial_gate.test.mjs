import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trialPacket578} from '../public/js/admin-channel-trials-578.mjs';
import {reconcile579} from '../public/js/admin-channel-reconciliation-579.mjs';
import {review580} from '../public/js/admin-channel-owner-review-580.mjs';
import {gate581,claim581,FORMAT_581} from '../public/js/admin-channel-trial-gate-581.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const row={channel:'etsy',action:'IMAGE_READBACK',product_ref:'54',provider_ref:'draft123',
  receipt_locator:'',observation:'A manually observed three-image count without authentication.',
  outcome:'UNKNOWN',recorded_at:'2026-11-03T02:00:00Z'};
const notes=trialPacket578([row]);
const expected={channel:'etsy',account_id:'shop-one',product_ref:'54',listing_id:'draft123',image_ids:['i1','i2','i3']};
const source=review580(reconcile579(expected,expected,notes),notes,[]);
const entry={channel:'etsy',action:'UPLOAD_IMAGE',source_pin:source.source_pin,account_id:'shop-one',
  product_ref:'54',receipt_locator:'Provider receipt claimed at ticket 581',
  identity_locator:'Etsy shop identity screenshot',scope_locator:'OAuth scopes document',
  independent_reviewer:'Reviewer claimed in local form',owner_authorization_locator:'Typed owner approval reference',
  review_reason:'External reviewer must independently verify actual source and receipt.',
  recorded_at:'2026-11-03T03:00:00Z'};
test('Even complete typed evidence and owner locator never authenticate a provider or permit a write',()=>{
  const gate=gate581(source,notes,[],[entry]);
  assert.equal(gate.format,FORMAT_581);assert.equal(gate.claims.length,1);
  assert.equal(gate.claims[0].state,'DOCUMENTARY_REFERENCES_REQUIRE_EXTERNAL_AUTHENTICATION');
  assert.equal(gate.claims[0].independently_authenticated,false);
  assert.equal(gate.claims[0].owner_write_authorized,false);
  assert.equal(gate.independently_authenticated_receipts,0);
  assert.equal(gate.verified_owner_authorizations,0);assert.equal(gate.provider_writes,0);
  assert.equal(gate.owner_decision,'NOT_RECORDED');assert.equal(gate.verified_exception_closures,0);
});
test('Missing identity/scope/receipt/reviewer/owner evidence produces explicit gaps',()=>{
  const gate=gate581(source,notes,[],[{...entry,receipt_locator:'',identity_locator:'',scope_locator:'',
    independent_reviewer:'',owner_authorization_locator:''}]);
  for(const x of ['PROVIDER_RECEIPT_MISSING','AUTHENTICATED_ACCOUNT_IDENTITY_MISSING',
    'PERMISSION_SCOPE_EVIDENCE_MISSING','INDEPENDENT_REVIEWER_PROOF_MISSING',
    'EXACT_OWNER_WRITE_AUTHORIZATION_MISSING'])assert.ok(gate.claims[0].gaps.includes(x));
  assert.match(gate.trial_gate,/HOLD/);
});
test('Wrong source identity, invalid action/channel and changed source cannot produce approval',()=>{
  const wrong=gate581(source,notes,[],[{...entry,account_id:'wrong-shop',source_pin:'old-source-pin'}]);
  assert.ok(wrong.claims[0].gaps.includes('STALE_OR_MISMATCHED_SOURCE'));
  assert.throws(()=>claim581({...entry,channel:'facebook_marketplace'}));
  assert.throws(()=>claim581({...entry,channel:'instagram',action:'CREATE_DRAFT'}));
  assert.throws(()=>gate581(source,trialPacket578([]),[],[entry]));
  assert.throws(()=>gate581({...source,owner_signoff:'APPROVED'},notes,[],[entry]));
});
test('Live Admin provides source-linked owner gate without provider POST or D1 mutations',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-trial-gate-581.mjs');
  for(const id of ['dd581Review','dd581Action','dd581Receipt','dd581Identity','dd581Scope',
    'dd581Reviewer','dd581Owner','dd581Reason','dd581Ack','dd581Save','dd581Copy',
    'dd581State','dd581Output'])assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:581|582)/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build581_trial_gate\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:581|582)/);
});
