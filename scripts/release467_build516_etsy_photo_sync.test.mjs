import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessEtsyPackage500,assessEtsyPhotos516} from '../public/js/etsy-package-500.mjs';
import {onRequestGet as readImages} from '../functions/api/admin/product-etsy-images.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const gallery=[344,345,346].map(product_image_id=>({product_image_id,approved_for_distribution:true,image_url:`https://assets.devilndove.com/products/53/${product_image_id}.jpg`}));
const images=gallery.map(x=>({product_image_id:x.product_image_id,transferred:false,transferable:true,alt_text:'Original product photograph'}));

test('photo-only approval keeps all three originals while independent text/tag HOLD cannot mask them',()=>{
  const distribution={gallery},media={images,hold_unconfirmed_claims:0};
  assert.equal(assessEtsyPackage500(distribution,media,{ready:false,blockers:['description missing']}).ready,false);
  const photos=assessEtsyPhotos516(distribution,media);
  assert.equal(photos.ready,true);
  assert.deepEqual(photos.pending,[344,345,346]);
  assert.equal(assessEtsyPhotos516({gallery:[...gallery.slice(0,2),{...gallery[2],approved_for_distribution:false,hold_reasons:['unapproved']}]},media).ready,false);
  assert.equal(assessEtsyPhotos516(distribution,{...media,hold_unconfirmed_claims:1}).ready,false);
  assert.equal(assessEtsyPhotos516(distribution,{...media,images:images.slice(0,2)}).ready,false);
});

test('media read preserves exact primary-confirmed Etsy ID even when an old shipping receipt lacks its flag',async()=>{
  const recorded=[];
  const draft={id:'claim-53',product_id:53,external_reference:'4603838854',
    payload_json:JSON.stringify({publication_performed:false,canada_only_shipping_verified:false}),status:'needs_review'};
  const database={withSession(mode){assert.equal(mode,'first-primary');return this;},prepare(sql){let values=[];
    return {bind(...args){values=args;return this;},async first(){
      recorded.push({sql,values});
      if(sql.includes('FROM products WHERE product_id'))return {product_id:53,name:'Adventurine Argon',status:'draft'};
      if(sql.includes('FROM marketplace_syndication_drafts')&&sql.includes('external_reference IS NOT NULL'))return draft;
      throw Error('Unexpected first query: '+sql);
    },async all(){
      recorded.push({sql,values});
      if(sql.includes('FROM product_images pi'))return {results:gallery.map((x,i)=>({...x,product_id:53,sort_order:i,
        public_use_status:'all_public_ok',alt_text:'Approved original product photo',width_px:1200,height_px:900}))};
      if(sql.includes('FROM admin_action_audit'))return {results:[]};
      if(sql.includes('FROM marketplace_syndication_drafts')&&sql.includes('external_reference=?'))
        return {results:[{id:'claim-53',product_id:53,external_reference:'4603838854'}]};
      throw Error('Unexpected all query: '+sql);
    }};
  }};
  const request=new Request('https://devilndove.com/api/admin/product-etsy-images?product_id=53');
  const response=await readImages({request,env:{DB:database,PRODUCT_MEDIA_PUBLIC_BASE_URL:'https://assets.devilndove.com/'},
    data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:8,email:'owner@example.invalid'}}}});
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.listing_id,'4603838854');
  assert.equal(body.local_canada_only_receipt,false);
  assert.equal(body.images.length,3);
  assert.equal(body.pending,3);
  assert.equal(body.provider_contacted,false);
  assert.ok(recorded.some(row=>row.sql.includes('external_reference=?')));
});

test('one explicit Etsy photo-sync action uses live inventory and per-image provider readback; duplicates remain held',()=>{
  const ui=read('public/js/admin-product-etsy-package-v500.mjs');
  const html=read('admin/product-editor/index.html');
  const endpoint=read('functions/api/admin/product-etsy-images.js');
  const match=read('functions/api/admin/product-etsy-owner-reconcile-505.js');
  for(const field of ['dd516PhotoAction','dd516SyncPhotos','dd516PhotoStatus'])assert.match(html,new RegExp(`id="${field}"`));
  assert.match(ui,/async function syncPhotos516\(/);
  assert.match(ui,/photoAssessment\.ready/);
  assert.match(ui,/await sendImages\(listingId,snapshot\.photoAssessment\)/);
  assert.match(ui,/remote_reconciliation\?\.ready!==true/);
  assert.match(ui,/inspectExistingPhotos505\(\)/);
  assert.match(endpoint,/verifyExistingDraft486\(c\.env,\{shop:a\.shop\},listingId,a\.headers\)/);
  assert.match(endpoint,/linkedReceipt506\(g\.db,id,String\(s\.draft\.external_reference\)\)/);
  assert.match(endpoint,/if\(!comparison\.ready\)return respond/);
  assert.match(endpoint,/etsy_product_editor_image_443_claimed/);
  assert.match(endpoint,/confirmedEtsyImageReadback497/);
  assert.match(match,/currentDb\(g\.db\)/);
  assert.match(match,/reconciled_prior_upload_claim/);
  assert.doesNotMatch(ui,/auto.?publish|publishListing\(/i);
});
