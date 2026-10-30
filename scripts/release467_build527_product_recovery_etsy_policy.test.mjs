import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {PRODUCT_SAVE_FIELDS_521,compareUncertainProductSave521} from '../public/js/product-save-outcome-521.mjs';
import {preparedEtsyTags497} from '../functions/api/_lib/etsyNativeTags497.mjs';
import {assessCanonicalGallery523} from '../public/js/product-destination-gates-523.mjs';
import {assessEtsyPackage500} from '../public/js/etsy-package-500.mjs';
import {evaluateFreshOwnerTrial525} from '../functions/api/_lib/etsyFreshOwnerTrial525.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const image=id=>({product_image_id:id,image_url:`https://assets.devilndove.com/products/87/image-${id}.jpg`,
 alt_text:`Original soap photo ${id}`,public_use_status:'all_public_ok',width_px:1600,height_px:1200,
 approved_for_distribution:true});

test('Build 527 read-only review distinguishes three different saved-Product outcomes without pretending to know owner IDs',()=>{
 const submitted=Object.fromEntries(PRODUCT_SAVE_FIELDS_521.map(k=>[k,k==='price_cents'?1200:k==='inventory_quantity'?3:'example']));
 for(const id of [71,72,73]){
  const saved={...submitted,product_id:id};
  const confirmed=compareUncertainProductSave521({productId:id,submitted,saved});
  assert.equal(confirmed.reviewed,true);assert.equal(confirmed.savedMatch,true);
  const changed=compareUncertainProductSave521({productId:id,submitted,saved:{...saved,description:'Server already has another value'}});
  assert.equal(changed.savedMatch,false);assert.deepEqual(changed.different,['description']);
  const unknown=compareUncertainProductSave521({productId:id,submitted,saved:{...saved,product_id:id+1}});
  assert.equal(unknown.reviewed,false);assert.equal(unknown.savedMatch,false);
 }
});

test('Current Etsy rules: 13 tags, 20 characters and allowed punctuation, with no invented Marketplace tags',()=>{
 assert.equal(preparedEtsyTags497('handmade soap, orange peel, gift for mum').ready,true);
 assert.equal(preparedEtsyTags497(Array.from({length:14},(_,i)=>`soap ${i}`).join(',')).ready,false);
 for(const invalid of ['x'.repeat(21),'® soap','™ soap','-soap',"'soap",'soap & milk','soap,SOAP'])
  assert.equal(preparedEtsyTags497(invalid).ready,false,invalid);
 assert.equal(preparedEtsyTags497("mother's soap, natural soap").ready,true);
 assert.match(read('public/js/admin-product-tags-v495.js'),/opening punctuation Etsy does not allow/);
});

test('Etsy 20-photo maximum retains the entire approved gallery, never silently crops to ten',()=>{
 const gallery=Array.from({length:20},(_,i)=>image(i+1));
 const assessed=assessCanonicalGallery523(gallery);
 assert.equal(assessed.ready,true);assert.equal(assessed.count,20);
 const media={images:gallery.map(row=>({...row,transferable:true,transferred:false,hold:false})),hold_unconfirmed_claims:0};
 const packageResult=assessEtsyPackage500({gallery},media,{ready:true,unresolved_attempt:false});
 assert.equal(packageResult.ready,true);assert.equal(packageResult.image_ids.length,20);
 assert.equal(assessCanonicalGallery523([...gallery,image(21)]).ready,false);
 assert.equal(assessEtsyPackage500({gallery:[...gallery,image(21)]},media,{ready:true}).ready,false);
 assert.equal(assessCanonicalGallery523([...gallery.slice(0,19),{...image(20),approved_for_distribution:false}]).ready,false);
 const listingId='4609937766';
 const evidence=evaluateFreshOwnerTrial525({productId:87,listingId,claim:{confirmed:true,listing_id:listingId,receipt_id:'real-readback-fixture'},
  product:{product_id:87},gallery,remoteListing:{listing_id:listingId,state:'draft'},
  remoteImages:gallery.map(row=>({listing_id:listingId,listing_image_id:String(900000+row.product_image_id),url_fullxfull:row.image_url})),
  receipts:gallery.map(row=>({listing_id:listingId,product_image_id:row.product_image_id,etsy_image_id:String(900000+row.product_image_id),verified_remote_readback:true}))});
 assert.equal(evidence.ready_for_owner_visual_review,true);
 assert.equal(evidence.photos.length,20);assert.equal(evidence.pixel_identity_independently_proven,false);
 for(const path of ['functions/api/admin/product-etsy-images.js','functions/api/admin/product-etsy-owner-signoff-504.js',
  'functions/api/admin/product-etsy-owner-reconcile-505.js','functions/api/admin/product-etsy-owner-trial-507.js'])
  assert.doesNotMatch(read(path),/\.slice\(0,10\)/,path);
});

test('Product Editor keeps five normal tabs, optional tools collapsed and one-save owner-confirmed Etsy handoff',()=>{
 const html=read('admin/product-editor/index.html'),flow=read('public/js/admin-product-destination-flow-523.mjs');
 const mainNav=html.match(/<div class="dd-editor-tabs" role="tablist" aria-label="Product Editor sections">([\s\S]*?)<\/div>/)?.[1]||'';
 assert.deepEqual([...mainNav.matchAll(/data-editor-tab="([^"]+)"/g)].map(m=>m[1]),['basics','pricing','description','media','seo']);
 assert.match(html,/id="dd527MoreTools"/);assert.match(html,/Build (?:52[789]|53[0123])/);
 assert.match(html,/admin-product-editor-527\.css\?v=527/);
 assert.match(flow,/dd:save-succeeded/);assert.match(flow,/reviewAfterVerifiedSave527/);
 assert.match(flow,/await postEtsy\(\)/);assert.match(flow,/window\.confirm\(`/);
 assert.match(flow,/consumedRedirectPrompt527=true/);assert.match(flow,/sessionStorage\.removeItem\(key\)/);
 assert.match(read('public/js/admin-product-editor-v163.js'),/review_only:true/);
 assert.match(read('public/js/admin-product-channel-intent-v405.js'),/dd:product-channel-loaded/);
 assert.match(read('public/js/admin-product-editor-v163.js'),/dd521ReviewServer/);
 assert.ok(html.indexOf('admin-product-editor-526.css?v=526')<html.indexOf('</head>'));
 assert.ok(html.indexOf('admin-product-editor-527.css?v=527')<html.indexOf('</head>'));
});
