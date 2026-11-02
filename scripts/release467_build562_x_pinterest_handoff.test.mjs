import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectSocialHandoff562,LIMITS_562} from '../functions/api/_lib/productSocialHandoff562.mjs';
import {onRequestGet} from '../functions/api/admin/product-social-handoff-562.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const product={product_id:54,name:'Sweet Orange Soap',status:'draft',short_description:'A handcrafted soap bar.',price_cents:1200,currency:'CAD'};
const photos=[{product_image_id:342,image_url:'https://devilndove.com/a.jpg',alt_text:'Orange soap',width_px:1200,height_px:900,public_use_status:'all_public_ok'},
  {product_image_id:343,image_url:'javascript:alert(1)',alt_text:'Bad',width_px:1200,height_px:900,public_use_status:'all_public_ok'}];
test('Build 562 projects separate X and Pinterest content with only approved originals and never provider action',()=>{
  const p=projectSocialHandoff562({product,images:photos,connections:[{provider_key:'x',connection_status:'connected'}]});
  assert.equal(p.manual_handoff_ready,true);
  assert.equal(p.photos.length,1);assert.equal(p.photos[0].product_image_id,342);
  assert.match(p.destinations.x.text,/Sweet Orange Soap/);
  assert.equal(p.destinations.x.limit,280);
  assert.equal(p.destinations.pinterest.title_limit,100);
  assert.equal(p.destinations.pinterest.description_limit,500);
  assert.equal(p.destinations.x.within_limit,true);
  for(const k of ['provider_contacted','publication_performed','automatic_provider_action','api_publish_allowed'])assert.equal(p[k],false);
  assert.equal(p.remote_pin_id,null);assert.equal(p.remote_post_id,null);
  assert.match(p.destinations.pinterest.account_checks.join(' '),/No saved Pinterest connection/);
  assert.equal(JSON.stringify(p).includes('javascript:'),false);
});
test('Build 562 does not mislabel long copy or unapproved media as ready',()=>{
  const p=projectSocialHandoff562({product:{...product,short_description:'A'.repeat(600)},images:photos.map(x=>({...x,public_use_status:'internal_review'})),annotationUnavailable:true});
  assert.equal(p.manual_handoff_ready,false);assert.equal(p.destinations.x.within_limit,false);
  assert.equal(p.destinations.pinterest.within_limit,false);
  assert.equal(p.photos.length,0);assert.equal(LIMITS_562.x,280);
});
test('Build 562 route denies unauthenticated access and only executes SELECTs',async()=>{
  const url='https://devilndove.com/api/admin/product-social-handoff-562?product_id=54';
  const denied=await onRequestGet({request:new Request(url),env:{}});assert.equal(denied.status,401);
  const sqls=[];const db={withSession:()=>db,prepare(sql){sqls.push(sql);return{bind(){return this;},async first(){return product;},async all(){
    if(sql.includes('FROM product_images pi'))return {results:photos};return {results:[]};}};}};
  const ok=await onRequestGet({request:new Request(url),env:{DB:db},data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7}}}});
  const body=await ok.json();assert.equal(ok.status,200,JSON.stringify(body));assert.equal(body.build,562);
  assert.equal(body.provider_contacted,false);assert.equal(body.publication_performed,false);
  assert.ok(sqls.every(sql=>/^\s*SELECT\b/i.test(sql)));
  assert.equal(typeof (await import('../functions/api/admin/product-social-handoff-562.js')).onRequestPost,'undefined');
});
test('Build 562 editor has lazy manual handoff, invalidation and production marker',()=>{
  const ui=read('public/js/product-destinations-559.mjs'),api=read('functions/api/admin/product-social-handoff-562.js');
  assert.match(ui,/id="dd562Social"/);assert.match(ui,/product-social-handoff-562\?product_id=/);
  assert.match(ui,/if\(!socialLoaded\)void refreshSocial\(\)/);
  assert.match(ui,/invalidateSocial\('Product saved/);
  assert.match(read('admin/product-editor/index.html'),/Devil n Dove • Build 56[23456789]/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:56[23456789]|570)/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build562_x_pinterest_handoff\.test\.mjs/);
  assert.doesNotMatch(api,/\bfetch\(|method:\s*['"]POST|decryptOAuthSecret|\.run\(/);
});
