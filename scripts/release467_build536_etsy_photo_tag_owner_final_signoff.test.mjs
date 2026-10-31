import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessOwnerFinalReadback536} from '../public/js/etsy-owner-final-readback-536.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const listingId='4601705477';
const identity={product_id:54,linked_listing_id:listingId,saved_link_readback_confirmed:true,receipt_id:'primary-d1-uuid'};
const photos={product_id:54,listing_id:listingId,provider_contacted:true,gallery_photo_count:3,
 remote_reconciliation:{ready:true,remote_count:3,tracked_count:3,reason:'matched'},
 photo_pair_readback_529:{ready:true,confirmed_pairs:3},hold_unconfirmed_claims:0,
 verified_photo_pairs_529:[{product_image_id:341,etsy_image_id:'9871'},{product_image_id:342,etsy_image_id:'9872'},{product_image_id:343,etsy_image_id:'9873'}]};
const tags={product_id:54,listing_id:listingId,provider_contacted:true,verified_draft:true,verified_canada_only:true,ready:true,
 unresolved_attempt:false,matching_tags:true,local_tags:['orange soap','handmade'],remote_tags:['orange soap','handmade']};
const content={product_id:54,listing_id:listingId,ready:true,verified_unpublished:true,verified_canada_only:true,
 tag_readback_530:{match:true,local_policy_ready:true,remote_policy_ready:true},
 evidence_fingerprint_508:'a'.repeat(64),owner_receipt_530:{recorded_current:false}};
const check=patch=>assessOwnerFinalReadback536({productId:54,candidateListingId:listingId,
 identity:patch?.identity??identity,photos:patch?.photos??photos,tags:patch?.tags??tags,content:patch?.content??content});

test('Build 536 requires a primary Product claim, real three-image matching receipts, verified live native tags and immutable content fingerprint',()=>{
 const result=check();assert.equal(result.ready,true);assert.equal(result.ownerRecordedCurrent,false);
 assert.deepEqual(result.stages.map(s=>s.ready),[true,true,true,true]);
 const approved=check({content:{...content,owner_receipt_530:{recorded_current:true}}});
 assert.equal(approved.ownerRecordedCurrent,true);
});
test('Owner screenshot: candidate number without a unique D1 claim cannot unlock photo/tag acceptance',()=>{
 const hold=check({identity:{...identity,linked_listing_id:null,receipt_id:null,saved_link_readback_confirmed:false}});
 assert.equal(hold.ready,false);assert.equal(hold.listingId,null);
 assert.match(hold.stages[0].message,/4601705477/);
 assert.match(hold.stages[0].next,/Do not create another listing/);
 assert.deepEqual(hold.stages.map(s=>s.ready),[false,false,false,false]);
 assert.equal(check({identity:{...identity,linked_listing_id:'4601705478'}}).ready,false);
});
test('Owner screenshot empty Etsy photo upload cannot equal accepted originals or a photo transfer receipt',()=>{
 const zero=check({photos:{...photos,remote_reconciliation:{ready:true,remote_count:0},
   photo_pair_readback_529:{ready:false,confirmed_pairs:0},verified_photo_pairs_529:[]}});
 assert.equal(zero.ready,false);assert.equal(zero.photosReady,false);assert.equal(zero.remotePhotoCount,0);
 assert.equal(zero.expectedPhotoCount,3);assert.match(zero.stages[1].message,/0 \/ 3 saved originals/);
 const claim=check({photos:{...photos,hold_unconfirmed_claims:1}});
 assert.equal(claim.photosReady,false);assert.match(claim.stages[1].next,/Never resend blindly/);
 const pairDuplicate=check({photos:{...photos,verified_photo_pairs_529:[photos.verified_photo_pairs_529[0],photos.verified_photo_pairs_529[0],photos.verified_photo_pairs_529[2]]}});
 assert.equal(pairDuplicate.photosReady,false);
});
test('Native tags update never passes merely on a local saved list, mismatched remote ID or unsettled prior PATCH',()=>{
 assert.equal(check({tags:{...tags,provider_contacted:false}}).tagsReady,false);
 assert.equal(check({tags:{...tags,matching_tags:false}}).tagsReady,false);
 assert.equal(check({tags:{...tags,listing_id:'4601705478'}}).tagsReady,false);
 const uncertain=check({tags:{...tags,unresolved_attempt:true}});
 assert.equal(uncertain.tagsReady,false);assert.match(uncertain.stages[2].next,/reconcile its outcome/);
});
test('Final owner sign-off requires independent provider content and proper evidence hash, not a claimed old approval',()=>{
 assert.equal(check({content:{...content,ready:false,owner_receipt_530:{recorded_current:true}}}).ownerRecordedCurrent,false);
 assert.equal(check({content:{...content,verified_canada_only:false}}).contentReady,false);
 assert.equal(check({content:{...content,evidence_fingerprint_508:'stale'}}).ready,false);
 assert.equal(check({content:{...content,listing_id:'4601705478'}}).ready,false);
});
test('Build 536 owner trial uses the same candidate as the editor and actual image/tag/final-content GET receipts, with explicit consent only',()=>{
 const html=read('admin/product-editor/index.html'),closure=read('public/js/admin-product-etsy-closure-530.mjs');
 assert.match(html,/Devil n Dove • Build (?:53[6789]|540|541|542)/);
 assert.match(html,/admin-product-editor-536\.css\?v=536/);
 assert.match(html,/admin-product-etsy-closure-530\.mjs\?v=536/);
 assert.match(closure,/ownerDraftHistory534\(id\)\?\.listingId/);
 assert.match(closure,/candidate_listing_id=/);
 assert.match(closure,/product-etsy-images\?product_id=\$\{id\}/);
 assert.match(closure,/product-etsy-tags\?product_id=\$\{id\}&reconcile=1/);
 assert.match(closure,/product-etsy-owner-signoff-504\?product_id=\$\{id\}/);
 assert.match(closure,/assessOwnerFinalReadback536/);
 assert.match(closure,/closure\.state!=='READY_FOR_EXPLICIT_OWNER_ACCEPTANCE'\|\|!progress\.ready/);
 assert.match(closure,/action:'approve_verified_draft_530'/);
 const signoff=read('functions/api/admin/product-etsy-owner-signoff-504.js');
 assert.match(signoff,/db=db\.withSession\('first-primary'\)/);
 assert.match(read('functions/api/admin/product-etsy-tags.js'),/const currentDb=db=>/);
 assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":5(?:3[6789]|40|41|42)/);
 assert.doesNotMatch(read('public/js/etsy-owner-final-readback-536.mjs'),/fetch\(|method:'POST'|graph\.facebook\.com/);
});
