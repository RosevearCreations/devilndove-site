#!/usr/bin/env node
// Build 436: verified regression for the broken 406/408 Etsy local evidence reader.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CANONICAL_DISTRIBUTION_GALLERY_SQL,CANONICAL_GALLERY_UNANNOTATED_SQL,readCanonicalDistributionGallery} from '../functions/api/_lib/canonicalDistributionGallery436.mjs';
import {allowedImage} from '../functions/api/_lib/productDistribution406.mjs';

const read=p=>fs.readFileSync(p,'utf8');
const approved={product_image_id:13,product_id:1131,image_url:'https://example.org/soap.webp',alt_text:'Orange handmade soap photographed for shop',
image_role:'main',public_use_status:'all_public_ok',width_px:1200,height_px:1200,sort_order:0};
test('406 and 408 must share the annotated canonical Product gallery, not select missing Product image columns',()=>{
  for(const file of ['functions/api/admin/product-distribution-406.js','functions/api/admin/listing-sync-408.js']){
    const code=read(file);
    assert.match(code,/readCanonicalDistributionGallery\(db,/);
    assert.doesNotMatch(code,/FROM product_images WHERE product_id=\?/);
  }
  assert.match(CANONICAL_DISTRIBUTION_GALLERY_SQL,/FROM product_images pi\s+LEFT JOIN product_image_annotations pia/);
  for(const field of ['width_px','height_px','public_use_status','image_role']){
    assert.match(CANONICAL_DISTRIBUTION_GALLERY_SQL,new RegExp('pia\\.'+field));
    assert.doesNotMatch(CANONICAL_DISTRIBUTION_GALLERY_SQL,new RegExp('pi\\.'+field));
  }
});
test('a canonical Product gallery with approval annotations is readable and respects the publication gate',async()=>{
  let queries=0;
  const db={prepare(sql){queries++;assert.equal(sql,CANONICAL_DISTRIBUTION_GALLERY_SQL);return{bind(id){assert.equal(id,1131);return{async all(){return{results:[approved]}}}}}}};
  const result=await readCanonicalDistributionGallery(db,1131);
  assert.equal(queries,1);
  assert.equal(result.images.length,1);
  assert.equal(result.annotation_unavailable,false);
  assert.equal(allowedImage(result.images[0]),true);
});
test('if annotations are missing, the image remains unapproved and never gets fabricated dimensions',async()=>{
  let queries=0;
  const db={prepare(sql){queries++;return{bind(){return{async all(){if(sql===CANONICAL_DISTRIBUTION_GALLERY_SQL)throw Error('D1_ERROR: no such table: product_image_annotations');
  assert.equal(sql,CANONICAL_GALLERY_UNANNOTATED_SQL);return{results:[{...approved,public_use_status:'internal_review',width_px:null,height_px:null,image_role:''}]}}}}}}};
  const result=await readCanonicalDistributionGallery(db,1131);
  assert.equal(queries,2);
  assert.equal(result.annotation_unavailable,true);
  assert.equal(allowedImage(result.images[0]),false);
});
test('actual D1 failures do not silently downgrade approval or bypass the owner review',async()=>{
  const db={prepare(){return{bind(){return{async all(){throw Error('D1 read quota exhausted')}}}}}};
  await assert.rejects(readCanonicalDistributionGallery(db,1131),/D1 read quota exhausted/);
});
test('Product Editor has accessible non-stretched channel checkboxes and cache-busted scripts',()=>{
  const html=read('admin/product-editor/index.html'),css=read('css/admin-product-channel-review-436.css');
  assert.match(html,/admin-product-channel-review-436\.css\?v=436/);
  for(const id of ['productChannel405Etsy','productChannel405Facebook','productDistribution406UsOff','productDistribution406Local','listingSync408Consent']){
    assert.ok(html.includes('id="'+id+'"'));
    assert.match(css,new RegExp('#'+id));
  }
  assert.match(css,/width:20px!important/);
  assert.match(css,/height:20px!important/);
  assert.match(css,/align-items:flex-start/);
  assert.match(html,/admin-product-distribution-v406\.js\?v=\d+/);
  assert.match(html,/admin-listing-sync-v408\.js\?v=436/);
});
