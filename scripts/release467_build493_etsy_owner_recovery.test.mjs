import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {FULL_SCHEMA_REQUIREMENTS} from '../functions/api/_lib/fullSchemaRequirements.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Build 493 authoritative load projects only editor fields with one first-row lookup',()=>{
 const source=read('functions/api/admin/product-editor-detail.js');
 assert.doesNotMatch(source,/SELECT p\.\*/);
 assert.match(source,/p\.short_description,p\.description/);
 assert.match(source,/WHERE p\.product_id=\?/);
 assert.match(source,/\.bind\(productId\)\.first\(\)/);
 assert.match(source,/single-product-editor-v162/);
 const sql=source.slice(source.indexOf('SELECT p.product_id'),source.indexOf('FROM products p'));
 const columns=[...sql.matchAll(/p\.([a-z_]+)/g)].map(match=>match[1]);
 const actual=new Set(FULL_SCHEMA_REQUIREMENTS.tables.products.map(row=>row[0]));
 assert.ok(columns.length>25);
 for(const column of columns)assert.ok(actual.has(column),`Projected Product column ${column} must exist in canonical schema`);
});
test('Build 493 actionable Etsy gates explain the real disabled causes without sending',()=>{
 const source=read('public/js/admin-product-etsy-repair-v493.js');
 for(const token of ['dd438EtsyCategory','dd439EtsyShipping','dd439EtsyReadiness',
  'dd442EtsyWeight','dd438EtsyConfirm','dd486EtsyListingId','dd486EtsyUpdateConfirm','dd490Authorize',
  'dd:product-load-failed','dd:product-loaded','dd:save-succeeded'])assert.match(source,new RegExp(token));
 assert.doesNotMatch(source,/apiFetch|fetch\(|method:'POST'|\.click\(\)/);
 const html=read('admin/product-editor/index.html');assert.match(html,/dd493EtsyBlockers/);
 assert.match(html,/admin-product-etsy-repair-v493.js/);
});
test('Build 493 respects a saved short description for the same Etsy completeness requirement as preflight',()=>{
 const source=read('public/js/admin-product-entry-readiness-v489.js');
 assert.match(source,/name==='description'\?Boolean\(value\('description'\)\|\|value\('short_description'\)\)/);
 const server=read('functions/api/_lib/etsyProductDraft438.mjs');
 assert.match(server,/product\?\.description\|\|product\?\.short_description/);
});
test('Build 493 read-only existing-draft linkage refreshes after Product saves',()=>{
 const source=read('public/js/admin-product-existing-etsy-draft-v486.js');
 assert.match(source,/dd:save-succeeded/);assert.match(source,/if\(id\)void load\(\)/);
 assert.match(source,/read only/);assert.match(source,/state\.uncertain/);
});
test('Build 493 Product save verifies stored descriptions, category and quantity, not only CAD price',()=>{
 const endpoint=read('functions/api/admin/product-editor-save.js');
 assert.match(endpoint,/SELECT name,short_description,description,product_category,inventory_quantity,price_cents/);
 assert.match(endpoint,/product_fields_readback_unconfirmed/);
 assert.match(endpoint,/product_fields_confirmed:true/);
 const editor=read('public/js/admin-product-editor-v163.js');
 assert.match(editor,/!data\.product_fields_confirmed/);
 assert.match(editor,/product_fields_readback_unconfirmed/);
});
