import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {photoReadback520,evidenceReadRows520} from '../public/js/etsy-photo-readback-520.mjs';
import {inspectOwnerAcceptance520} from '../functions/api/admin/product-etsy-owner-acceptance-520.js';
import {reconcileQl254Exception520} from './ql254_proof_exception_520.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const draft='4603838854',ids=[344,345,346];
const receipts=()=>({product_id:53,listing_id:draft,
  originals:ids.map(product_image_id=>({product_image_id})),
  etsy_photos:ids.map((_,i)=>({etsy_image_id:String(1000+i)})),
  matched:ids.map((product_image_id,i)=>({product_image_id,etsy_image_id:String(1000+i)})),
  unresolved_upload_attempts:0});
const live=()=>({ready:true,listing_id:draft,verified_unpublished:true,verified_canada_only:true,
  confirmed_photo_ids:ids,photo_freshness_509:{ready:true},evidence_fingerprint_508:'real-computed-evidence-fingerprint',
  verified_media_pairs_508:ids.map((product_image_id,i)=>({product_image_id,etsy_image_id:String(1000+i)}))});
const owner=()=>({product_id:53,listing_id:draft,confirmed_photo_ids:ids,
  evidence_fingerprint_508:'real-computed-evidence-fingerprint',publication_performed:false});

test('Build 520 shows remote count and each original-to-existing-image receipt separately',()=>{
 const v=photoReadback520({receipt:receipts(),verdict:{readyForFinalRead:true}});
 assert.equal(v.remoteCount,3);assert.equal(v.recordedPairs,3);assert.equal(v.localMatchingComplete,true);
 assert.equal(v.ownerAccepted,false);
 assert.deepEqual(v.rows.map(x=>x.etsyImageId),['1000','1001','1002']);
});
test('two mapped photos, an extra remote photo or a stale remote receipt never closes the three-photo trial',()=>{
 for(const mutate of [
  r=>r.matched.pop(),
  r=>r.etsy_photos.push({etsy_image_id:'1003'}),
  r=>r.etsy_photos.pop(),
  r=>r.matched[0].etsy_image_id='7777'
 ]){const r=receipts();mutate(r);const v=photoReadback520({receipt:r,verdict:{readyForFinalRead:true}});
  assert.equal(v.localMatchingComplete,false);assert.equal(v.ownerAccepted,false);}
});
test('all three source GETs must return success; HTTP 503 remains an explicit HOLD',()=>{
 const e=Error('Cloudflare HTTP 503');e.httpStatus=503;
 const r=evidenceReadRows520({entries:[{name:'A',ok:true},{name:'B',ok:false,status:503,error:e.message},{name:'C',ok:true}]});
 assert.equal(r.length,3);assert.match(r[1].message,/HTTP 503/);
 assert.equal(r[1].ok,false);
});
test('owner acceptance GET is a persisted-receipt/fresh-live-fingerprint check, never synthetic consent',()=>{
 assert.equal(inspectOwnerAcceptance520({review:live()}).current_acceptance_verified,false);
 const verdict=inspectOwnerAcceptance520({record:owner(),review:live()});
 assert.equal(verdict.receipt_recorded,true);assert.equal(verdict.current_acceptance_verified,true);
 assert.equal(verdict.owner_confirmed_in_this_request,false);
 for(const alter of [
  r=>r.evidence_fingerprint_508='stale',r=>r.ready=false,
  r=>r.verified_unpublished=false,r=>r.photo_freshness_509.ready=false,
  r=>r.verified_media_pairs_508[2].etsy_image_id='1001'
 ]){const next=live();alter(next);
   assert.equal(inspectOwnerAcceptance520({record:owner(),review:next}).current_acceptance_verified,false);}
 const invalid=owner();invalid.publication_performed=true;
 assert.equal(inspectOwnerAcceptance520({record:invalid,review:live()}).current_acceptance_verified,false);
});
test('owner-facing Build 520 signoff has a separate read-only primary audit GET, no automatic repeat',()=>{
 const ui=read('public/js/admin-product-etsy-package-v500.mjs');
 const html=read('admin/product-editor/index.html');
 const endpoint=read('functions/api/admin/product-etsy-owner-acceptance-520.js');
 for(const field of ['dd520PhotoSummary','dd520PhotoRows','dd520ReadSources','dd520ReadAcceptance','dd520AcceptanceStatus'])
   assert.match(html,new RegExp(`id="${field}"`));
 assert.match(ui,/checkOwnerAcceptance520\(\{requestKey:ownerApprovalKey\}\)/);
 assert.match(ui,/photoReadback520/);
 assert.match(ui,/evidenceReadRows520/);
 assert.match(ui,/dd520ReadAcceptance'\)\.addEventListener\('click'/);
  assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=(?:52[0-8]|538)/);
 assert.match(html,/etsy-simple-515\.css\?v=52[0-2]/);
 assert.match(endpoint,/withSession\('first-primary'\)/);
 assert.match(endpoint,/action_type='etsy_504_owner_final_content_approved'/);
 assert.doesNotMatch(endpoint,/onRequestPost|INSERT INTO|UPDATE |publishListing|transfer_one/);
});
test('QL-254 public 404 ages honestly, and even a synthetic 200 origin remains disconnected',()=>{
 const base={source_sha_A:'a'.repeat(40),source_ci_run_url:'https://github.com/RosevearCreations/devilndove-site/actions/runs/40794862120',
  main_sha:'b'.repeat(40),proof_commit_sha_B:'NOT_AVAILABLE',exact_proof_bytes_sha256:'NOT_AVAILABLE',
  immutable_public_proof_http_status:404};
 const result=reconcileQl254Exception520({probe:base,observedAt:'2026-10-29T03:43:00Z'});
 assert.equal(result.ql253_to_ql254_elapsed_minutes,60);
 assert.equal(result.immutable_public_proof_http_status,404);
 assert.equal(result.owner_test_decision,'NOT_GIVEN');
 assert.equal(result.connection_state,'DISCONNECTED');
 assert.equal(result.private_24_7_relay_deployed,false);
 assert.equal(existsSync(new URL('../docs/integration/ql246-source-proof.json',import.meta.url)),false);
 const better={...base,proof_commit_sha_B:'c'.repeat(40),immutable_public_proof_http_status:200,
  proof_ancestry_verified:true,proof_source_sha_matches_A:true,source_ci_exact_head_green:true};
 const published=reconcileQl254Exception520({probe:better,observedAt:'2026-10-29T04:43:00Z'});
 assert.equal(published.public_proof_origin_candidate,true);
 assert.equal(published.exception_state,'HELD');
 assert.equal(published.owner_test_decision,'NOT_GIVEN');
});
