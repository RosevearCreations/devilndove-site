import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scentNameConflict541} from '../public/js/soap-formula-540.mjs';

const file=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Build 541 flags a conflicting saved Sweet Orange scent without guessing a replacement',()=>{
  assert.equal(scentNameConflict541('Bar Soap Sweet Orange','EUQEE Sea Breeze Fragrance Oil'),true);
  assert.equal(scentNameConflict541('Bar Soap Sweet Orange','Sweet Orange Fragrance Oil'),false);
  assert.equal(scentNameConflict541('Unscented Goat Milk Soap','Sea Breeze'),false);
  const ui=file('public/js/admin-product-simple-540.mjs');
  assert.match(ui,/dataset\.scentConflict==='1'/);
  assert.match(ui,/if\(conflict&&verified\)verified\.checked=false/);
});
test('Build 541 reuses existing guarded, owner-authorized photo transfer on the simple Etsy tab',()=>{
  const page=file('admin/product-editor/index.html');
  const ui=file('public/js/admin-product-simple-540.mjs');
  const transfer=file('functions/api/admin/product-etsy-images.js');
  assert.match(page,/id="dd541PhotosMount"/);
  assert.match(ui,/photoMount\.append\(photoPanel\)/);
  assert.match(ui,/dd443EtsyImagesLoad/);
  assert.match(transfer,/confirm_unpublished_only!==true/);
  assert.match(transfer,/confirm_canada_only!==true/);
  assert.match(transfer,/etsy_product_editor_image_443_claimed/);
  assert.match(transfer,/reconcileEtsyPhotoInventory487/);
  assert.doesNotMatch(ui,/transfer_one/);
});
