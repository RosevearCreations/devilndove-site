import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifiedAdminFromModule} from '../functions/api/_lib/verifiedAdmin398.mjs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const enabled={data:{ddModuleAccess:{allowed:true,user:{role:'admin',user_id:7,is_active:1,email:'operator@invalid.example'}}}};
test('only centrally authenticated active administrators pass',()=>{
 assert.equal(verifiedAdminFromModule(enabled)?.user_id,7);
 assert.equal(verifiedAdminFromModule({data:{ddModuleAccess:{allowed:true,user:{role:'member',user_id:7,is_active:1}}}}),null);
 assert.equal(verifiedAdminFromModule({data:{ddModuleAccess:{allowed:false,user:{role:'admin',user_id:7,is_active:1}}}}),null);
 assert.equal(verifiedAdminFromModule({data:{ddModuleAccess:{allowed:true,user:{role:'admin',user_id:7,is_active:0}}}}),null);
 assert.equal(verifiedAdminFromModule({}),null);
});
test('Etsy operator APIs use the verified route guard, not a second legacy session query',()=>{
 for(const path of ['etsy-monitoring-exceptions.js','etsy-monitoring-alerts.js','etsy-connection-price-outcomes.js',
 'product-price-source-review.js','etsy-product-syndication.js']){
  const src=file('functions/api/admin/'+path);
  assert.match(src,/verifiedAdminFromModule/);
  assert.doesNotMatch(src,/getAdminUserFromRequest/);
 }
});
test('Admin home is static-first and does not run legacy observer/snapshot loaders',()=>{
 const src=file('admin/index.html'),mw=file('functions/_middleware.js'),home=file('public/js/admin-home-on-demand-v398.js');
 assert.match(src,/id="admin398LoadSnapshot"/);
 assert.doesNotMatch(src,/<script[^>]+src="\/public\/js\/admin-seller-command-centre-build148/);
 assert.doesNotMatch(src,/<script[^>]+src="\/public\/js\/admin-route-usage/);
 assert.match(mw,/normalizedPath === '\/admin\/'/);
 assert.match(mw,/X-DND-Admin-Home-Mode/);
 assert.match(home,/AbortController/);
 assert.match(home,/8000/);
 assert.doesNotMatch(home,/setInterval|MutationObserver/);
});
test('Product selector uses only actual bounded Product Browser results, never example products',()=>{
 const src=file('public/js/admin-etsy-product-picker-v398.js');
 assert.match(src,/api\/admin\/product-browser\?limit=50/);
 assert.match(src,/selected=records\.find/);
 assert.match(src,/etsyExceptionProductId/);
 assert.match(src,/etsyAlertProductId/);
 assert.match(src,/etsy397ProductId/);
 assert.match(file('admin/it-integrations/index.html'),/id="etsy398ProductQuery" value="soap"/);
});
test('Etsy draft staging is local-only with exact authoritative Product cents and durable idempotency',()=>{
 const src=file('functions/api/admin/etsy-product-syndication.js');
 assert.match(src,/body\?\.local_draft_only!==true/);
 assert.match(src,/SELECT product_id,name,price_cents,currency,inventory_quantity FROM products/);
 assert.match(src,/stale_product_price/);
 assert.match(src,/request_key/);
 assert.match(src,/WHERE NOT EXISTS/);
 assert.match(src,/remote_etsy_draft_created:false/);
 assert.doesNotMatch(src,/api\.etsy\.com|POST.*\/shops\/|fetch\(/);
});
test('UI never calls remote Etsy or promises upload from local staging',()=>{
 const html=file('admin/it-integrations/index.html'),ui=file('public/js/admin-etsy-product-picker-v398.js');
 assert.match(html,/NOT send anything to Etsy/);
 assert.match(html,/etsy398ProductSelect/);
 assert.match(ui,/local_draft_only:true/);
 assert.match(ui,/No Etsy listing or upload was created/);
 assert.match(ui,/stage\.disabled=true/);
 assert.doesNotMatch(ui,/api\.etsy\.com|publish/);
});
