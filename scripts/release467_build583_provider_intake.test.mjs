import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trialPacket578} from '../public/js/admin-channel-trials-578.mjs';
import {reconcile579} from '../public/js/admin-channel-reconciliation-579.mjs';
import {review580} from '../public/js/admin-channel-owner-review-580.mjs';
import {gate581} from '../public/js/admin-channel-trial-gate-581.mjs';
import {claimPin582} from '../public/js/admin-channel-handoff-582.mjs';
import {intake583,evidence583,FORMAT_583} from '../public/js/admin-channel-intake-583.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const note={channel:'etsy',action:'IMAGE_READBACK',product_ref:'54',provider_ref:'listing-1',receipt_locator:'',
  observation:'Unverified manually entered note for review.',outcome:'UNKNOWN',recorded_at:'2026-11-03T02:00:00Z'};
const notes=trialPacket578([note]);
const expected={channel:'etsy',account_id:'shop1',product_ref:'54',listing_id:'listing-1',image_ids:['img1','img2','img3']};
const owner=review580(reconcile579(expected,expected,notes),notes,[]);
const claim={channel:'etsy',action:'UPLOAD_IMAGE',source_pin:owner.source_pin,account_id:'shop1',product_ref:'54',
  receipt_locator:'Claimed receipt',identity_locator:'Claimed identity',scope_locator:'Claimed scope',
  independent_reviewer:'Reviewer claim',owner_authorization_locator:'Owner decision request',
  review_reason:'Verify exact source and permission independently.',recorded_at:'2026-11-03T03:00:00Z'};
const gate=gate581(owner,notes,[],[claim]);
const args=[gate,owner,notes,[],[claim],[]];
const row={claim_pin:claimPin582(gate.claims[0]),evidence_type:'PROVIDER_OPERATION_RECEIPT',
  source_locator:'Safe external case 583 reference',provider_correlation:'request-1',
  reviewer_reference:'Independent reviewer pending',account_reference:'shop1',permission_scope:'listings_w',
  owner_scope_request:'Etsy shop1 product54 single image upload',explanation:'Await signed-in provider readback and owner consent.',
  recorded_at:'2026-11-03T04:00:00Z'};
test('documentary evidence intake cannot manufacture authenticated provider receipts or trial authorization',()=>{
  const result=intake583(...args,[row]);
  assert.equal(result.format,FORMAT_583);assert.equal(result.documentary_submissions,1);
  assert.equal(result.cases[0].submitted_evidence[0].verification,'SUBMITTED_UNVERIFIED');
  assert.equal(result.authenticated_provider_receipts,0);assert.equal(result.independently_verified_accounts,0);
  assert.equal(result.verified_permissions,0);assert.equal(result.closed_exceptions,0);
  assert.equal(result.owner_trial_decision_ready,false);assert.equal(result.owner_trial_signoff,'PENDING');
  assert.equal(result.provider_writes,0);assert.equal(result.d1_operations,0);
});
test('conflicting account reference and duplicate evidence locator stay unresolved',()=>{
  const conflict={...row,account_reference:'wrong-account',recorded_at:'2026-11-03T04:01:00Z'};
  const result=intake583(...args,[row,conflict]);
  assert.equal(result.account_conflicts,1);assert.equal(result.duplicate_references,1);
  assert.equal(result.cases[0].evidence_status,'CONFLICT_REQUIRES_EXTERNAL_REVIEW');
  assert.equal(result.closed_exceptions,0);
});
test('source-changed provider claims mark previous evidence stale, never accepted',()=>{
  const changed={...claim,receipt_locator:'different claimed receipt'};
  const nextGate=gate581(owner,notes,[],[changed]);
  const result=intake583(nextGate,owner,notes,[],[changed],[],[row]);
  assert.equal(result.stale_submissions.length,1);assert.equal(result.documentary_submissions,0);
  assert.equal(result.owner_trial_decision_ready,false);
});
test('tampered gate, invented approval, secret-bearing text and unsupported evidence types fail closed',()=>{
  assert.throws(()=>intake583({...gate,verified_permissions:4},owner,notes,[],[claim],[],[row]));
  assert.throws(()=>intake583(gate,{...owner,owner_signoff:'APPROVED'},notes,[],[claim],[],[row]));
  assert.throws(()=>evidence583({...row,evidence_type:'PROVIDER_APPROVED'}));
  assert.throws(()=>evidence583({...row,source_locator:'Bearer secret123'}));
  assert.throws(()=>evidence583({...row,explanation:'short'}));
  assert.throws(()=>intake583(...args,Array(101).fill(row)));
});
test('admin UI and deployment marker expose source-pinned no-write handoff',()=>{
  const html=read('admin/channel-trials/index.html'),js=read('public/js/admin-channel-intake-583.mjs');
  for(const id of ['dd583Review','dd583Case','dd583Type','dd583Locator','dd583Correlation',
    'dd583Account','dd583Scope','dd583Reviewer','dd583OwnerScope','dd583Reason',
    'dd583Ack','dd583Save','dd583Copy','dd583State','dd583Output'])
    assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html,/Devil n Dove • Build (?:583|584|585|586|587)/);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|\.innerHTML\s*=|\/api\//);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build583_provider_intake\.test\.mjs/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:583|584|585|586|587)/);
});
