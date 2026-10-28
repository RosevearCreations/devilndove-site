import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ownerClaim504,onRequestGet as getEtsyClaim} from '../functions/api/admin/product-etsy-existing-draft.js';
import {assessOwnerApproval504,priceCents504} from '../functions/api/_lib/etsyOwnerApproval504.mjs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const base={
 product:{product_id:53,name:'Adventurine Argon',description:'A hand-poured candle with botanical notes and careful finishing.',price_cents:1000,currency:'CAD',inventory_quantity:10},
 listing:{listing_id:'4603838854',shop_id:12345,state:'draft',title:'Adventurine Argon',description:'A hand-poured candle with botanical notes and careful finishing.',price:{amount:1000,divisor:100,currency_code:'CAD'},quantity:10,taxonomy_id:123},
 gallery:[344,345,346].map(product_image_id=>({product_image_id})),
 accepted:[344,345,346].map((product_image_id,i)=>({product_image_id,listing_id:'4603838854',etsy_image_id:String(9000+i),verified_remote_readback:true})),
 remoteImages:[9000,9001,9002].map(listing_image_id=>({listing_image_id:String(listing_image_id)})),tagsReady:true
};

test('same-Product receipt is not falsely treated as ownership by a different Product',()=>{
 const claim={id:'receipt',product_id:'53',product_name:'Adventurine Argon',product_sku:'DND-01130',product_slug:'adventurine-argon'};
 assert.equal(ownerClaim504(claim,53).state,'same_product');
 assert.equal(ownerClaim504({...claim,product_id:'42'},53).state,'another_product');
 assert.equal(ownerClaim504(null,53).state,'unclaimed');
 const api=source('functions/api/admin/product-etsy-existing-draft.js');
 assert.match(api,/if\(claim\.state==='same_product'\)/);
 assert.match(api,/if\(claim\.state==='another_product'\)/);
 assert.match(api,/code:'etsy_listing_claimed_by_another_product'/);
 assert.match(api,/candidate_listing_id/);
 assert.match(api,/UPDATE marketplace_syndication_drafts SET payload_json=/);
 assert.match(api,/verified_remote_existing_draft:true/);
 assert.doesNotMatch(api,/DELETE FROM marketplace_syndication_drafts/);
});

test('a verified admin can read the exact conflicting local Product without a D1 write or Etsy call',async()=>{
 const operations=[];
 const db={prepare(sql){return {bind(...args){return {async first(){operations.push({sql,args});
   if(sql.includes('FROM products WHERE product_id=?'))return {product_id:53,name:'Adventurine Argon',sku:'DND-01130',slug:'adventurine-argon'};
   if(sql.includes('SELECT id,external_reference'))return null;
   if(sql.includes('FROM marketplace_syndication_drafts d LEFT JOIN products p'))return {id:'oldreceipt',product_id:'71',product_name:'Other Product',product_sku:'DND-OTHER',product_slug:'other-product'};
   return null;},async all(){operations.push({sql,args});return {results:[{id:'oldreceipt',product_id:'71',external_reference:'4603838854'}]};}};}};}};
 const request=new Request('https://devilndove.com/api/admin/product-etsy-existing-draft?product_id=53&candidate_listing_id=4603838854');
 const response=await getEtsyClaim({request,env:{DB:db},data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:1,email:'owner@example.test'}}}});
 const data=await response.json();
 assert.equal(response.status,200);
 assert.equal(data.linked_listing_id,null);
 assert.equal(data.candidate_claim.state,'another_product');
 assert.equal(data.candidate_claim.product.product_id,71);
 assert.equal(operations.length,4);
 assert.ok(operations.every(x=>/^SELECT /.test(x.sql.trim())));
});

test('three-photo + exact content acceptance requires independent photo receipts and actual Etsy readback',()=>{
 assert.equal(priceCents504({amount:1000,divisor:100}),1000);
 assert.equal(assessOwnerApproval504(base).ready,true);
 const missing=assessOwnerApproval504({...base,accepted:base.accepted.slice(0,2),remoteImages:base.remoteImages.slice(0,2)});
 assert.equal(missing.ready,false);
 assert.equal(missing.confirmed_photo_ids.length,2);
 assert.match(missing.issues.join(' '),/photo #346/);
 const badContent=assessOwnerApproval504({...base,listing:{...base.listing,title:'Different product',price:{amount:1250,divisor:100,currency_code:'CAD'}}});
 assert.match(badContent.issues.join(' '),/title differs/);
 assert.match(badContent.issues.join(' '),/CAD price differs/);
 const extra=assessOwnerApproval504({...base,remoteImages:[...base.remoteImages,{listing_image_id:'9999'}]});
 assert.equal(extra.ready,false);
 assert.match(extra.issues.join(' '),/no matching saved Product receipt/);
});

test('owner sign-off endpoint is readback first, local-only and never publishes to Etsy',()=>{
 const api=source('functions/api/admin/product-etsy-owner-signoff-504.js');
 assert.match(api,/assessOwnerApproval504/);
 assert.match(api,/readEtsy486\('listings\/'.*'\/images'/s);
 assert.match(api,/action_type='etsy_504_owner_final_content_approved'|,'etsy_504_owner_final_content_approved'/);
 assert.match(api,/if\(!result\.ready\|\|\(Number\(b\.product_id\)===53&&!result\.photo_freshness_509\?\.ready\)\|\|result\.listing_id!==String\(b\.listing_id\)\)/);
 assert.match(api,/publication_performed:false,provider_modified:false,automatic_retry:false/);
 assert.doesNotMatch(api,/method:\s*'PATCH'|method:\s*'POST'.*etsy\.com/);
});

test('editor explains ownership conflicts, repairs Etsy draft link and requires witnessed final consent',()=>{
 const ui=source('public/js/admin-product-etsy-package-v500.mjs');
 const html=source('admin/product-editor/index.html');
 assert.match(ui,/state\.claim\?\.state==='another_product'/);
 assert.match(ui,/Review the other Product/);
 assert.match(ui,/listing-editor\/edit\/\$\{encodeURIComponent/);
 assert.match(ui,/ownerPhotoReadback/);
 assert.match(ui,/ownerSignoff/);
 assert.match(ui,/if\(!result\.owner_approval_recorded\)/);
 assert.match(html,/id="dd504Readback"/);
 assert.match(html,/id="dd504ApproveContent"/);
 assert.match(html,/id="dd504Signoff"[^>]+disabled/);
});

test('Home, Shop, Creations and Recently Viewed share the same responsive photo-card frame',()=>{
 const css=source('css/product-card-unified-504.css');
 for(const selector of ['#homeFeaturedProductsMount .featured-creation','.recently-viewed-grid .recently-viewed-item','.creations-page .catalog-grid .creation-card'])
  assert.ok(css.includes(selector),selector);
 assert.match(css,/--dd504-card-ratio:4\/5/);
 assert.match(css,/object-fit:contain!important/);
 assert.match(css,/@media\(max-width:580px\)/);
 for(const page of ['index.html','shop/index.html','creations/index.html'])
  assert.match(source(page),/product-card-unified-504\.css\?v=504/,page);
});
