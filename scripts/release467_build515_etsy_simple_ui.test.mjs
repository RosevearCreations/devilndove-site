import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
const html=read('admin/product-editor/index.html');
const js=read('public/js/admin-product-etsy-package-v500.mjs');
const identity=read('public/js/admin-product-channel-advanced-v498.mjs');
const css=read('admin/product-editor/etsy-simple-515.css');

test('Etsy main panel only shows Create/Update, linked ID, manual authorization and draft status',()=>{
  assert.match(html,/Etsy Drafts — Create or Update/);
  assert.match(html,/id="dd500Identity"/);
  assert.match(html,/id="dd500Link"/);
  assert.match(html,/id="dd500Send"/);
  assert.match(html,/id="dd500Status"/);
  assert.ok(html.indexOf('id="dd500Send"')<html.indexOf('id="dd515SupportDetails"'));
  assert.match(html,/<details class="dd515-support" id="dd515SupportDetails">/);
  assert.match(css,/#dd500Legacy \{display:none!important\}/);
  assert.match(css,/\.dd489-readiness,/);
  assert.match(css,/\.dd471-creation-flow/);
  assert.match(html,/<details class="dd500-readiness" id="dd515TechnicalChecks">/);
});

test('Product identity displays actual saved D1 Product name, SKU, slug and exact Etsy ID',()=>{
  assert.match(identity,/data\.product_name \|\| 'Unnamed Product'/);
  assert.match(identity,/data\.product_sku/);
  assert.match(identity,/data\.product_slug/);
  assert.match(identity,/normal\(data\.linked_listing_id\)/);
  assert.match(identity,/Etsy draft ID #\$\{listing\}/);
  assert.match(read('functions/api/admin/product-etsy-existing-draft.js'),/saved_link_readback_confirmed:effective\?\.confirmed===true/);
});

test('Saved local Product does not auto-dispatch Etsy, while manual send keeps photo and draft guards',()=>{
  assert.match(html,/Save Product saves our store only/);
  assert.match(js,/document\.addEventListener\('dd:save-succeeded'/);
  const localBlock=js.slice(js.indexOf("document.addEventListener('dd:save-succeeded'"),
    js.indexOf("document.addEventListener('dd:product-channel-tags-changed'"));
  assert.doesNotMatch(localBlock,/syncAfterSave\(/);
  assert.match(js,/\$\('dd500Send'\)\.addEventListener\('click'/);
  assert.match(js,/await sendImages\(listingId\)/);
  assert.match(js,/await acceptance\(listingId\)/);
  assert.match(js,/state\.holdAfterWrite=true/);
});

test('A missing photo receipt cannot hide or replace the independently saved numeric listing ID',()=>{
  assert.match(js,/const savedId=numericEtsyListing511\(link\.linked_listing_id\)/);
  assert.match(js,/assessment\.media_identity_hold=true/);
  assert.match(js,/assessment\.issues\.push\(another\?/);
  assert.match(js,/assessment\.ready=assessment\.issues\.length===0/);
  assert.match(js,/state\.linked=numericEtsyListing511\(snapshot\.link\.linked_listing_id\)/);
  assert.match(js,/\$\('dd515PhotoRepairMount'\)\?\.append\(\$\('dd505PhotoReview'\)\)/);
  assert.match(html,/Photos are already on Etsy\? Match them without uploading duplicates/);
});
