import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Build 490 demands saved Product, known mode, confirmed owner and existing guarded Etsy action',()=>{
 const js=read('public/js/admin-product-etsy-dispatch-v490.js');
 assert.match(js,/form\.dataset\.productDirty/);
 assert.match(js,/target\(\)\?\.disabled===false/);
 assert.match(js,/dd:etsy-draft-mode-changed/);
 assert.match(js,/dd438EtsyCreate/);assert.match(js,/dd486EtsyUpdate/);
 assert.match(js,/action\.click\(\)/);
 assert.match(js,/dispatch_authorized/);
 assert.doesNotMatch(js,/setInterval|\.reload\(/);
});
test('Build 490 owner receipt is local-only, verifies linked draft and prevents replay key',()=>{
 const server=read('functions/api/admin/product-etsy-unified-approval.js');
 assert.match(server,/verifiedAdminFromModule/);assert.match(server,/Same-origin required/);
 assert.match(server,/etsy_unified_490_owner_authorized/);
 assert.match(server,/json_extract\(details_json/);
 assert.match(server,/Select UPDATE to prevent duplicates/);
 assert.match(server,/No verified existing Etsy draft is linked/);
 assert.match(server,/dispatch_authorized:true/);
 assert.doesNotMatch(server,/fetch\s*\(/);assert.doesNotMatch(server,/method:'PATCH'/);
});
test('Build 490 mobile shop cards and owner dispatch controls fit narrow screens',()=>{
 const html=read('admin/product-editor/index.html');
 const css=read('css/shop-uniform-cards-489.css');
 const style=read('admin/product-editor/entry-readiness-489.css');
 assert.match(html,/dd490Dispatch/);assert.match(html,/dd490Authorize/);
 assert.match(html,/admin-product-etsy-dispatch-v490.js/);
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css,/object-fit:cover!important/);
 assert.match(css,/overflow-wrap:anywhere/);
 assert.match(style,/\.dd490-dispatch/);assert.match(style,/white-space:normal/);
});
