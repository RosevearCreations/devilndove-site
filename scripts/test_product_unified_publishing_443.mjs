import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {approvedR2Key,checkedEtsyBytes,completedImageIds} from '../functions/api/_lib/productEtsyImages443.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/product-etsy-images.js';

const context=(url,body,db)=>({request:new Request(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}),
  env:{DB:db},data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:2,email:'test@example.invalid'}}}});
const mockDb=()=>({prepare(sql){return {bind(){return this;},
  async first(){if(sql.includes('FROM products'))return {product_id:54,name:'Bar Soap',status:'draft'};return null;},
  async all(){return {results:[]};},async run(){throw Error('NO PROVIDER WRITES EXPECTED');}};}});

test('only Product-owned R2 assets under our approved HTTPS asset origin qualify',()=>{
  assert.equal(approvedR2Key('https://assets.devilndove.com/products/54/editor/photo.jpg',54), 'products/54/editor/photo.jpg');
  assert.equal(approvedR2Key('https://assets.devilndove.com/products/55/editor/photo.jpg',54),null);
  assert.equal(approvedR2Key('https://evil.invalid/products/54/editor/photo.jpg',54),null);
  assert.equal(approvedR2Key('http://assets.devilndove.com/products/54/editor/photo.jpg',54),null);
  assert.equal(approvedR2Key('https://assets.devilndove.com/products/54/../55/photo.jpg',54),null);
  assert.equal(approvedR2Key('https://assets.devilndove.com/products/54/editor/photo.jpg?redirect=evil',54),null);
});
test('image bytes must actually be JPEG or PNG, not renamed SVG or WebP',()=>{
  const jpg=new Uint8Array(120);jpg.set([0xff,0xd8,0xff]);
  assert.deepEqual(checkedEtsyBytes('image/jpeg',jpg),{type:'image/jpeg',extension:'jpg'});
  assert.equal(checkedEtsyBytes('image/png',jpg),null);
  const png=new Uint8Array(120);png.set([137,80,78,71,13,10,26,10]);
  assert.deepEqual(checkedEtsyBytes('image/png',png),{type:'image/png',extension:'png'});
  assert.equal(checkedEtsyBytes('image/webp',png),null);
});
test('only accepted, auditable Etsy image IDs count as transferred',()=>{
  const result=completedImageIds([{details_json:JSON.stringify({product_image_id:12,etsy_image_id:'4000123'})},
    {details_json:JSON.stringify({product_image_id:13,etsy_image_id:''})},
    {details_json:'not-json'}]);
  assert.deepEqual([...result],[12]);
});
test('unknown Product Editor Etsy draft blocks an image write without remote calls',async()=>{
  const r=await onRequestPost(context('https://devilndove.com/api/admin/product-etsy-images',{
    action:'transfer_one',product_id:54,product_image_id:3,request_key:'12345678-1234-1234-1234-123456789abc',
    confirm_approved_media:true,confirm_unpublished_only:true,confirm_canada_only:true},mockDb()));
  assert.equal(r.status,409);
  assert.match((await r.json()).error,/unpublished Canada-only/);
});
test('GET remains local-only and unauthorized callers cannot inspect images',async()=>{
  const db=mockDb(),url='https://devilndove.com/api/admin/product-etsy-images?product_id=54';
  const r=await onRequestGet(context(url,null,db));
  assert.equal(r.status,200);
  assert.equal((await r.json()).provider_contacted,false);
  const blocked=await onRequestGet({...context(url,null,db),data:{}});
  assert.equal(blocked.status,401);
});
test('UI has distinct Etsy approval, manual Meta route and no background provider writes',()=>{
  const html=readFileSync(new URL('../admin/product-editor/index.html',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../public/js/admin-product-unified-publishing-v443.js',import.meta.url),'utf8');
  for(const id of ['dd443EtsyImagesConsent','dd443EtsyImagesSend','dd443MetaPrepare','dd443RecoveryRestore'])
    assert.match(html,new RegExp(`id="${id}"`));
  assert.match(ui,/confirm_unpublished_only:true/);
  assert.match(ui,/state\.uncertain=true/);
  assert.match(ui,/data-dd443-copy/);
  assert.doesNotMatch(ui,/addEventListener\('load',[^;]+transfer_one/);
});
