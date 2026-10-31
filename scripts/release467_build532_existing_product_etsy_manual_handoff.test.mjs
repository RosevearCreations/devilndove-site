import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {selectedMarketplacePhotos532} from '../public/js/marketplace-photo-handoff-532.mjs';
import {existingEtsyJourney532} from '../public/js/product-editor-journey-532.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const photo=id=>({product_image_id:id,image_url:`https://devilndove.com/images/${id}.jpg`,
 alt_text:`Handmade soap original ${id}`,width_px:1600,height_px:1067,
 public_use_status:'all_public_ok',approved_for_distribution:true,hold_reasons:[]});
const record={ok:true,product_id:54,channel:'facebook',gallery:[photo(344),photo(345),photo(346)],
 selected_image_ids:[346,344],current_evidence:{ready_for_local_export:true,blockers:[]}};
test('Build 532 prepares ONLY explicitly selected approved original photos, in review order',()=>{
 const checked=selectedMarketplacePhotos532(record,54);
 assert.equal(checked.ready,true);
 assert.deepEqual(checked.source_image_ids,[346,344]);
 assert.equal(checked.photos.length,2);
 assert.equal(checked.provider_api_authorized,false);
 assert.equal(checked.provider_post_performed,false);
});
test('Build 532 fails closed on bad source identity, stale review, missing dimensions or URL',()=>{
 for(const changed of [
  {...record,product_id:55},{...record,selected_image_ids:[344,347]},
  {...record,selected_image_ids:[344,344]},
  {...record,current_evidence:{ready_for_local_export:false,blockers:['source_or_media_changed_reapprove']}},
  {...record,gallery:[{...photo(344),width_px:0},photo(345),photo(346)]},
  {...record,gallery:[{...photo(344),image_url:'http://example.org/not-secure.jpg'},photo(345),photo(346)]},
  {...record,gallery:[{...photo(344),approved_for_distribution:false},photo(345),photo(346)]},
 ]){const result=selectedMarketplacePhotos532(changed,54);
  assert.equal(result.ready,false);assert.deepEqual(result.photos,[]);
 }
});
test('Build 532 existing Product guidance is truthful about save, a linked draft and no duplicate',()=>{
 const base={productId:54,loaded:true,dirty:false,channelLoaded:true,etsyChecked:true,
  name:'Bar Soap Sweet Orange',description:'A handmade bar soap.',price:'9.00',quantity:'3',weightGrams:'120'};
 assert.equal(existingEtsyJourney532({productId:0}).step,'OPEN_PRODUCT');
 assert.equal(existingEtsyJourney532({...base,loaded:false}).step,'LOAD_PRODUCT');
 assert.equal(existingEtsyJourney532({...base,name:''}).step,'NAME');
 assert.equal(existingEtsyJourney532({...base,price:'0'}).step,'PRICE_STOCK');
 assert.equal(existingEtsyJourney532({...base,quantity:'0'}).step,'PRICE_STOCK');
 assert.equal(existingEtsyJourney532({...base,description:''}).step,'DESCRIPTION');
 assert.equal(existingEtsyJourney532({...base,weightGrams:''}).step,'WEIGHT');
 assert.equal(existingEtsyJourney532({...base,etsyChecked:false}).step,'SELECT_ETSY');
 assert.equal(existingEtsyJourney532({...base,dirty:true}).step,'SAVE_PRODUCT');
 assert.equal(existingEtsyJourney532({...base,channelLoaded:false}).step,'SAVE_PRODUCT');
 const existing=existingEtsyJourney532({...base,listingId:'4601705477'});
 assert.equal(existing.step,'REVIEW_DRAFT');assert.match(existing.message,/UPDATE of this draft/);
 const newDraft=existingEtsyJourney532(base);
 assert.match(newDraft.message,/Check Etsy Drafts for an older copy first/);
});
test('Build 532 offers a six-step same-page guide and unambiguous manual Facebook authorization boundary',()=>{
 const html=read('admin/product-editor/index.html');
 const flow=read('public/js/admin-product-destination-flow-523.mjs');
 const copy=read('public/js/marketplace-copy-handoff-532.mjs');
 const journey=read('public/js/product-editor-journey-532.mjs');
 const editor=read('public/js/admin-product-editor-v163.js');
 for(const id of ['dd532Journey','dd532Next','dd532NextButton','dd532CopyMarketplace','dd532CopyMarketplaceStatus'])
  assert.match(html,new RegExp(`id="${id}"`));
 assert.match(html,/Devil n Dove • Build (?:53[23456789]|540|541)/);
 assert.match(html,/admin-product-editor-532\.css\?v=532/);
 assert.match(html,/product-editor-journey-532\.mjs\?v=532/);
 assert.match(html,/marketplace-copy-handoff-532\.mjs\?v=532/);
 assert.match(html,/Authorization decision:<\/strong> No Facebook listing API is connected or authorized/);
 assert.match(flow,/selectedMarketplacePhotos532\(facebookSource,id\)/);
 assert.match(flow,/facebookOriginals:facebookReview\?\.photos/);
 assert.match(flow,/images:state\.read\?\.facebookOriginals/);
 assert.match(flow,/choice\.etsy\?get\(`/);
 assert.match(flow,/choice\.facebook\?get\(`/);
 assert.match(copy,/navigator\.clipboard\.writeText/);
 assert.doesNotMatch(copy+journey,/method:'POST'|fetch\(|graph\.facebook\.com|createListing\(/);
 assert.match(editor,/const noWriteStarted=error\?\.payload\?\.no_product_write_started===true/);
 assert.match(editor,/if\(!noWriteStarted&&\(failure\.uncertainWrite/);
 assert.match(read('functions/api/admin/product-editor-save.js'),/no_product_write_started:true/);
 assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":5(?:3[23456789]|40|41)/);
});
