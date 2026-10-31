import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evaluateEtsyLiveOwnerReview535} from '../public/js/etsy-live-owner-review-535.mjs';
import {verifySavedEtsyReceipt524} from '../public/js/product-destination-receipts-524.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const listingId='4601705477',productId=54;
const receipt=verifySavedEtsyReceipt524({productId,expectedListingId:listingId,readback:{product_id:54,linked_listing_id:listingId,
 saved_link_readback_confirmed:true,receipt_id:'primary-abc',product_sku:'DND-01131',product_slug:'bar-soap-sweet-orange'}});
const photos={product_id:54,listing_id:listingId,provider_contacted:true,gallery_photo_count:3,
 remote_reconciliation:{ready:true,remote_count:3},photo_pair_readback_529:{ready:true,confirmed_pairs:3}};
const tags={listing_id:listingId,provider_contacted:true,ready:true,matching_tags:true,verified_draft:true,verified_canada_only:true,local_tags:['sweet orange soap']};

test('Build 535 only accepts a genuinely unique verified Product primary receipt, never a UI number alone',()=>{
 assert.equal(receipt.verified,true);
 assert.equal(evaluateEtsyLiveOwnerReview535({productId,listingId,receipt,photos,tags}).ready,true);
 const forged={...receipt,verified:false};
 assert.equal(evaluateEtsyLiveOwnerReview535({productId,listingId,receipt:forged,photos,tags}).ready,false);
 assert.equal(evaluateEtsyLiveOwnerReview535({productId,listingId:'4601705478',receipt,photos,tags}).ready,false);
 assert.equal(verifySavedEtsyReceipt524({productId,expectedListingId:listingId,readback:{product_id:54,linked_listing_id:null}}).verified,false);
});
test('Build 535 treats the owner screenshot empty Etsy photo gallery as 0/3, not accepted',()=>{
 const empty={...photos,remote_reconciliation:{ready:true,remote_count:0},photo_pair_readback_529:{ready:false,confirmed_pairs:0}};
 const result=evaluateEtsyLiveOwnerReview535({productId,listingId,receipt,photos:empty,tags});
 assert.equal(result.photosReady,false);assert.equal(result.remotePhotoCount,0);assert.equal(result.expectedPhotoCount,3);
 assert.match(result.issues.join(' '),/Etsy has 0 of 3 Product photos/);
 assert.equal(evaluateEtsyLiveOwnerReview535({productId,listingId,receipt,photos:{...photos,gallery_photo_count:0,remote_reconciliation:{ready:true,remote_count:0}},tags}).ready,false);
});
test('Build 535 keeps native tags separate and honest when empty, different, or provider readback unavailable',()=>{
 const missing={...tags,ready:false,blockers:['Save at least one Product search tag.'],matching_tags:false};
 const r=evaluateEtsyLiveOwnerReview535({productId,listingId,receipt,photos,tags:missing});
 assert.equal(r.tagsReady,false);assert.match(r.issues.join(' '),/Save at least one Product search tag/);
 assert.equal(evaluateEtsyLiveOwnerReview535({productId,listingId,receipt,photos,tags:{...tags,matching_tags:false}}).ready,false);
 assert.equal(evaluateEtsyLiveOwnerReview535({productId,listingId,receipt,photos:null,tags:null}).ready,false);
});
test('Build 535 reads primary candidate, live Etsy photo inventory and tags without any invisible POST',()=>{
 const html=read('admin/product-editor/index.html'),flow=read('public/js/admin-product-destination-flow-523.mjs');
 assert.match(html,/Devil n Dove • Build (?:53[56789]|540|541|542|543|544|545|546|547|548|549|550|551|552|553|554|555|557)/);
 for(const id of ['dd535ReadLive','dd535LiveStatus','dd535LiveEvidence','dd535GoPhotoSync','dd535GoTagSync','dd535GoOwnerPhotos'])
  assert.match(html,new RegExp(`id="${id}"`));
 assert.match(html,/admin-product-destination-flow-523\.mjs\?v=53[57]/);
 assert.match(html,/admin-product-editor-535\.css\?v=535/);
 assert.match(flow,/candidate_listing_id=\$\{encodeURIComponent\(candidate\)\}/);
 assert.match(flow,/const verifiedId=confirmedListing\(\)/);
 assert.match(flow,/readReceipt524\(\{expectedListingId:candidate\}\)/);
 assert.match(flow,/product-etsy-images\?product_id=\$\{id\}&reconcile=1/);
 assert.match(flow,/product-etsy-tags\?product_id=\$\{id\}&reconcile=1/);
 assert.match(flow,/evaluateEtsyLiveOwnerReview535/);
 assert.match(flow,/dd516PhotoAction/);
 assert.match(flow,/dd497NativeTags/);
 assert.match(flow,/dd525OwnerTrial/);
 assert.doesNotMatch(read('public/js/etsy-live-owner-review-535.mjs'),/fetch\(|POST|graph\.facebook\.com/);
 assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:5(?:3[56789]|40|41|42|43|44|45|46|47|48|49)|550|551|552|553|554|555|556|557)/);
});
