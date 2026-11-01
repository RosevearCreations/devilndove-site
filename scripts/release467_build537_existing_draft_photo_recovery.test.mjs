import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {recoveryNextAction537} from '../public/js/admin-product-etsy-recovery-537.mjs';
import {assessOwnerFinalReadback536} from '../public/js/etsy-owner-final-readback-536.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const listingId='4601705477';
const identity={product_id:54,linked_listing_id:listingId,saved_link_readback_confirmed:true,receipt_id:'primary-claimed-54'};
const photos={product_id:54,listing_id:listingId,provider_contacted:true,gallery_photo_count:3,
 remote_reconciliation:{ready:true,remote_count:3,tracked_count:3,reason:'matched'},
 photo_pair_readback_529:{ready:true,confirmed_pairs:3},hold_unconfirmed_claims:0,
 verified_photo_pairs_529:[{product_image_id:341,etsy_image_id:'901'},
  {product_image_id:342,etsy_image_id:'902'},{product_image_id:343,etsy_image_id:'903'}]};
const tags={product_id:54,listing_id:listingId,provider_contacted:true,verified_draft:true,verified_canada_only:true,ready:true,
 unresolved_attempt:false,matching_tags:true,local_tags:['soap','orange'],remote_tags:['soap','orange']};
const content={product_id:54,listing_id:listingId,ready:true,verified_unpublished:true,verified_canada_only:true,
 tag_readback_530:{match:true,local_policy_ready:true,remote_policy_ready:true},evidence_fingerprint_508:'a'.repeat(64),
 owner_receipt_530:{recorded_current:false}};
const assess=changes=>assessOwnerFinalReadback536({productId:54,candidateListingId:listingId,
 identity:changes?.identity??identity,photos:changes?.photos??photos,
 tags:changes?.tags??tags,content:changes?.content??content});

test('Build 537 never regards owner-reported ID or an unconfirmed primary claim as an existing link',()=>{
 const existing=read('public/js/admin-product-existing-etsy-draft-v486.js');
 const guide=read('public/js/admin-product-etsy-guide-v488.js');
 const backend=read('functions/api/admin/product-etsy-existing-draft.js');
 assert.match(existing,/ownerLead=id===54\?'4601705477'/);
 assert.match(existing,/saved_link_readback_confirmed===true/);
 assert.match(existing,/x\.receipt_id/);
 assert.match(existing,/candidate_listing_id=/);
 assert.doesNotMatch(existing,/state\.linked=x\.linked_listing_id\|\|null/);
 assert.match(existing,/!state\.linked/); // unlinked states may only inspect/link, never update
 assert.match(guide,/link\.saved_link_readback_confirmed===true/);
 assert.match(guide,/do not create a duplicate/);
 assert.match(backend,/linkedReceipt506/);
 assert.equal(recoveryNextAction537(assess({identity:{...identity,saved_link_readback_confirmed:false}}),photos),'link');
 assert.equal(recoveryNextAction537(assess({identity:{...identity,linked_listing_id:'4601705478'}}),photos),'link');
});

test('Build 537 selects different recovery actions for zero live photos, untracked Etsy images and uncertain transfer receipts',()=>{
 const empty={...photos,remote_reconciliation:{ready:true,remote_count:0,tracked_count:0,reason:'matched'},
  photo_pair_readback_529:{ready:false,confirmed_pairs:0},verified_photo_pairs_529:[]};
 const zero=assess({photos:empty});
 assert.equal(zero.ready,false);assert.equal(zero.remotePhotoCount,0);
 assert.equal(recoveryNextAction537(zero,empty),'transfer');
 const untracked={...empty,remote_reconciliation:{ready:false,remote_count:2,tracked_count:0,reason:'existing_etsy_photos_need_manual_reconciliation'}};
 assert.equal(recoveryNextAction537(assess({photos:untracked}),untracked),'compare');
 const uncertain={...empty,hold_unconfirmed_claims:1};
 assert.equal(recoveryNextAction537(assess({photos:uncertain}),uncertain),'compare');
 const mismatched={...photos,photo_pair_readback_529:{ready:false,confirmed_pairs:2},verified_photo_pairs_529:photos.verified_photo_pairs_529.slice(0,2)};
 assert.equal(recoveryNextAction537(assess({photos:mismatched}),mismatched),'compare');
 assert.equal(recoveryNextAction537(assess({tags:{...tags,matching_tags:false}}),photos),'tags');
 assert.equal(recoveryNextAction537(assess(),photos),'final');
 assert.equal(assess().ownerRecordedCurrent,false); // Owner consent remains separate
});

test('Build 537 owner buttons reveal exact real verification, photo comparison, tag update, and final consent controls, never POST automatically',()=>{
 const html=read('admin/product-editor/index.html');
 const path=read('public/js/admin-product-destination-flow-523.mjs');
 const recovery=read('public/js/admin-product-etsy-recovery-537.mjs');
 for(const id of ['dd537OwnerRecovery','dd537Read','dd537Status','dd537Stages','dd537Link','dd537Photos','dd537Tags','dd537Final'])
  assert.match(html,new RegExp(`id="${id}"`));
 assert.match(html,/Devil n Dove • Build (?:537|538|539|540|541|542|543|544|545|546|547|548|549|550|551|552|553|554|555|557|558|559|560|561|562|563)/);
 assert.match(html,/admin-product-editor-537\.css\?v=537/);
 assert.match(html,/admin-product-etsy-recovery-537\.mjs\?v=(?:537|538)/);
 assert.match(path,/function revealExistingDraft537/);
 assert.match(path,/\$\('dd488ChooseExisting'\)\?\.click\(\)/);
 assert.match(path,/\$\('dd486EtsyListingId'\)/);
 assert.doesNotMatch(path,/const field=\$\('dd500ListingId'\);if\(!field\)return;/);
 assert.match(recovery,/product-etsy-images\?product_id=\$\{productId\}/);
 assert.match(recovery,/&reconcile=1/);
 assert.match(recovery,/product-etsy-tags\?product_id=\$\{productId\}/);
 assert.match(recovery,/product-etsy-owner-signoff-504\?product_id=\$\{productId\}/);
 assert.match(recovery,/\$\('dd505LoadPhotos'\)\?\.click\(\)/);
 assert.match(recovery,/\$\('dd535GoPhotoSync'\)\?\.click\(\)/);
 assert.match(recovery,/\$\('dd535GoTagSync'\)\?\.click\(\)/);
 assert.match(recovery,/\$\('dd529Check'\)\?\.click\(\)/);
 assert.doesNotMatch(recovery,/method:\s*['"]POST|graph\.facebook\.com|action:'approve_verified_draft_530'/);
 assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build537_existing_draft_photo_recovery\.test\.mjs/);
 assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:537|538|539|540|541|542|543|544|545|546|547|548|549|550|551|552|553|554|555|556|557|558|559|560|561|562|563|564|565|566)/);
});
