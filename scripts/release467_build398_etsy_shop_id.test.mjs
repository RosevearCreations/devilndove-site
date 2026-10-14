import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/etsy-shop-identity.js';
const source=(file)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('Shop ID endpoint is centrally guarded and admin-only',async()=>{
 assert.equal(moduleKeyForPath('/api/admin/etsy-shop-identity'),MODULE_KEYS.STOREFRONT);
 const bad={request:new Request('https://devilndove.com/api/admin/etsy-shop-identity',{method:'GET'}),
  env:{},data:{ddModuleAccess:{allowed:true,user:{user_id:12,role:'member',is_active:1}}}};
 const resp=await onRequestGet(bad);
 assert.equal(resp.status,401);
 const json=await resp.json();assert.equal(json.ok,false);
});
test('Shop ID lookup never runs on GET and explicit action is required for POST',()=>{
 const api=source('functions/api/admin/etsy-shop-identity.js');
 const get=api.split('export async function onRequestGet')[1].split('export async function onRequestPost')[0];
 assert.doesNotMatch(get,/decryptOAuthSecret|discoverEtsyShop|\.run\(|INSERT INTO|UPDATE/);
 assert.match(api,/body\?\.action!=='discover_my_shop_id'/);
 assert.match(api,/conn\.connection_status!=='connected'/);
 assert.match(api,/scopes\.includes\('shops_r'\)/);
 assert.match(api,/expiration<=Date\.now\(\)\+10000/);
 assert.match(api,/decryptOAuthSecret/);
 assert.match(api,/discoverEtsyShop/);
 assert.match(api,/conn\.remote_subject_id/);
 assert.match(api,/oauth_intended_shop_mismatch/);
 assert.match(api,/etsy_shop_identity_readback_unconfirmed/);
 assert.match(api,/provider_listing_writes:false/);
 assert.doesNotMatch(api,/createDraftListing|publishListing|POST.*api\.etsy\.com|UPDATE\s+products/i);
});
test('Legacy ETSY_SHOP_ID is not required and the UI exposes a copyable verified numeric ID',()=>{
 const ui=source('public/js/admin-etsy-oauth-acceptance.js'),html=source('admin/it-integrations/index.html');
 assert.match(html,/id="etsyShopLookupButton"/);
 assert.match(html,/id="etsyShopCopyButton"/);
 assert.match(html,/ETSY_SHOP_ID/);
 assert.match(ui,/discover_my_shop_id/);
 assert.match(ui,/navigator\.clipboard\.writeText\(knownShopId\)/);
 assert.match(ui,/etsyShopIdentityResult/);
 assert.match(ui,/shop_id/);
 assert.doesNotMatch(ui,/setInterval|publishListing|createDraftListing/);
 const acceptance=source('functions/api/admin/etsy-oauth-acceptance.js');
 assert.match(acceptance,/verifiedAdminFromModule\(context\)/);
 assert.doesNotMatch(acceptance,/getAdminUserFromRequest/);
});
test('Shop metadata persistence requires verified ownership and does not add schema at request time',()=>{
 const src=source('functions/api/admin/etsy-shop-identity.js');
 assert.match(src,/String\(found\.user_id\)!==String\(conn\.remote_subject_id\)/);
 assert.match(src,/INSERT INTO etsy_oauth_shop_connections/);
 assert.match(src,/confirmed\.shop_id!==String\(found\.shop_id\)/);
 assert.doesNotMatch(src,/CREATE TABLE|ALTER TABLE|DROP TABLE/);
});
