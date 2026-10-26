import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessExistingDraftPhotoGap492 as assess} from '../functions/api/_lib/etsyPhotoGap492.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const img=(id,alt='Handmade ring')=>({product_image_id:id,transferable:true,alt_text:alt});
const receipt=(id,remote)=>({product_image_id:id,etsy_image_id:String(remote)});
const remote=id=>({listing_image_id:String(id)});
test('Build 492 classifies clean inventory and untransferred originals without authorizing a write',()=>{
 const outcome=assess([remote(20)],[receipt(1,20)],[img(1),img(2)],new Set(),7);
 assert.equal(outcome.state,'ready_for_separate_owner_approval');
 assert.deepEqual(outcome.pending_local_images.map(i=>i.product_image_id),[2]);
 assert.equal(outcome.provider_write_allowed,false);
});
test('Build 492 holds untracked Etsy photos rather than treating them as uploaded originals',()=>{
 const outcome=assess([remote(20),remote(99)],[receipt(1,20)],[img(1),img(2)],new Set(),7);
 assert.equal(outcome.state,'hold');assert.deepEqual(outcome.unexpected_etsy_image_ids,['99']);
});
test('Build 492 holds missing formerly confirmed Etsy photos',()=>{
 const outcome=assess([],[receipt(1,20)],[img(1)],new Set(),7);
 assert.equal(outcome.reason,'confirmed_photos_absent_from_etsy');assert.deepEqual(outcome.missing_etsy_image_ids,['20']);
});
test('Build 492 does not unlock uncertain claimed upload even if an untracked Etsy photo exists',()=>{
 const outcome=assess([remote(99)],[],[img(2)],new Set(['7:2']),7);
 assert.equal(outcome.state,'hold');assert.deepEqual(outcome.uncertain_product_image_ids,[2]);
 assert.equal(outcome.provider_write_allowed,false);
});
test('Build 492 fails closed for malformed provider photo inventories',()=>{
 const outcome=assess([{listing_image_id:'not-an-id'}],[],[img(2)],new Set(),7);
 assert.equal(outcome.state,'hold');assert.equal(outcome.provider_write_allowed,false);
});
test('Build 492 owner control only initiates live read; original provider writes remain separately guarded',()=>{
 const js=read('public/js/admin-product-etsy-outcomes-v491.js');
 const api=read('functions/api/admin/product-etsy-images.js');
 const html=read('admin/product-editor/index.html');
 assert.match(js,/photo_gap_492/);assert.match(js,/dd492PhotoGaps/);assert.doesNotMatch(js,/method:'POST'/);
 assert.match(api,/assessExistingDraftPhotoGap492/);assert.match(api,/confirm_approved_media/);
 assert.match(api,/reconcileEtsyPhotoInventory487\(remote,receipts\)/);
 assert.match(html,/Existing draft: verified photo gaps/);
});
