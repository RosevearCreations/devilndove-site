import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {manualCaption557} from '../public/js/product-entry-557.mjs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Build 557 replaces the seven-tab everyday editor with four explicit work areas',()=>{
  const page=source('admin/product-editor/index.html');
  const nav=page.match(/<div class="dd-editor-tabs dd557-steps"[\s\S]*?<\/div>/)?.[0]||'';
  assert.deepEqual([...nav.matchAll(/data-editor-tab="([^"]+)"/g)].map(x=>x[1]),['details','ingredients','media','publishing']);
  assert.match(page,/Four areas\. One saved Product/);
  assert.match(page,/id="dd540SaveProduct"/);
  assert.match(page,/id="dd540SoapComposer"/);
  assert.match(page,/id="productDistribution406"/);
  assert.match(page,/id="dd544EtsyFlow"/);
  assert.match(page,/id="dd544Listing"/);
  assert.match(page,/id="dd544PhotosList"/);
  assert.match(page,/id="dd527MoreTools"/);
  assert.match(page,/admin-product-editor-557\.css\?v=557/);
  assert.match(page,/product-entry-557\.mjs\?v=561/);
  assert.equal((page.match(/id="dd540SaveProduct"/g)||[]).length,1);
  assert.equal((page.match(/id="productEditorSave"/g)||[]).length,1);
  assert.doesNotMatch(page,/<script[^>]+src="https?:\/\//);
});

test('Build 557 groups Details fields without deleting legacy saved fields or changing local Save API',()=>{
  const shell=source('public/js/product-entry-557.mjs');
  const core=source('public/js/admin-product-editor-v163.js');
  const flow=source('public/js/admin-product-destination-flow-523.mjs');
  for(const name of ['name','sku','product_category','price','inventory_quantity','short_description','description','keywords'])assert.match(shell,new RegExp(`'${name}'`));
  assert.match(shell,/document\.createElement\('details'\)/);
  assert.match(core,/detailArea557=new Set\(\['details','basics','pricing','description','seo'\]\)/);
  assert.match(core,/target==='details'/);
  assert.match(core,/api\/admin\/product-editor-save/);
  assert.match(core,/dd:save-succeeded/);
  assert.match(flow,/Destinations are preferences only/);
  assert.doesNotMatch(flow,/void reviewAfterVerifiedSave527\(\)/);
  assert.match(source('public/js/admin-product-simple-540.mjs'),/confirm_actual_formula:true/);
  assert.match(source('public/js/admin-product-simple-540.mjs'),/dd540SaveProduct/);
});

test('Build 557 protects the existing Etsy draft and presents honest external destinations',()=>{
  const shell=source('public/js/product-entry-557.mjs');
  const unified=source('public/js/product-destinations-559.mjs');
  const existing=source('public/js/product-editor-etsy-544.mjs');
  assert.match(shell,/renderUnifiedDestinations559/);
  assert.match(unified,/Review draft update/);
  assert.match(unified,/No verified draft link/);
  assert.match(unified,/dd559EtsyTools/);
  assert.match(unified,/dd540UpdateDraft/);
  assert.match(unified,/Facebook Marketplace/);
  for(const provider of ['Instagram','TikTok','X','Pinterest'])assert.match(unified,new RegExp(provider));
  assert.match(unified,/Marketplace API posting is not authorized/);
  assert.match(unified,/Save Product first/);
  assert.match(existing,/confirm_unpublished_only:true/);
  assert.match(existing,/confirm_canada_only:true/);
  assert.match(existing,/saved_link_readback_confirmed/);
  assert.match(existing,/verified_remote_readback!==true/);
  assert.match(existing,/ownerEtsyTools\?\.addEventListener\('toggle'/);
  assert.doesNotMatch(existing,/controls\(\);if\(productId\)void load\(\)/);
  assert.match(source('public/js/admin-product-etsy-package-v500.mjs'),/etsyAreaVisible557/);
  assert.doesNotMatch(shell,/\bapiFetch\b|fetch\(|\/api\/admin\/product-etsy/);
});

test('Manual handoff produces a truthful, copyable CAD caption and rejects incomplete Products',()=>{
  assert.equal(manualCaption557({name:'Orange soap',price:'8',description:'Handmade in Ontario',keywords:'orange, bath'}),
    'Orange soap\n\nCAD $8.00\n\nHandmade in Ontario\n\nSearch terms: orange, bath');
  assert.equal(manualCaption557({name:'Pendant',price:'12.5',description:'Handcast silver'}),'Pendant\n\nCAD $12.50\n\nHandcast silver');
  assert.throws(()=>manualCaption557({name:'',price:'8',description:'Here'}),/Product name/);
  assert.throws(()=>manualCaption557({name:'Soap',price:'8.999',description:'Here'}),/CAD price/);
  assert.throws(()=>manualCaption557({name:'Soap',price:'8',description:''}),/description/);
});

test('Build 557 modern design is scoped to the rebuilt Admin screen and release marker is current',()=>{
  const page=source('admin/product-editor/index.html'),css=source('css/admin-product-editor-557.css');
  assert.match(page,/class="dd540-finished-product dd557-entry dd556-admin-root"/);
  assert.match(page,/class="dd556-skip" href="#productEditorForm"/);
  assert.match(css,/body\.dd557-entry/);
  assert.match(css,/@media\(max-width:580px\)/);
  assert.match(css,/:focus-visible/);
  assert.doesNotMatch(css,/(^|\n)(?:body|:root|\.container)\s*\{/);
  for(const path of ['admin/index.html','admin/products/index.html','admin/system-operations/index.html','css/styles.css'])assert.doesNotMatch(source(path),/admin-product-editor-557/);
  assert.match(source('.github/workflows/production-pages-deploy-current.yml'),/"build":561/);
  assert.match(source('.github/workflows/current-application-quality.yml'),/release467_build557_product_entry_rewrite\.test\.mjs/);
});
