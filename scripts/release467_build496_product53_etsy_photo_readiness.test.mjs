import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {allowedImage} from '../functions/api/_lib/productDistribution406.mjs';
import {readCanonicalDistributionGallery,CANONICAL_DISTRIBUTION_GALLERY_SQL} from '../functions/api/_lib/canonicalDistributionGallery436.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Build 496 requires channel-wide public-use grant for Etsy and Marketplace; original and URL unchanged',()=>{
 const image={product_image_id:344,product_id:53,image_url:'https://assets.devilndove.com/products/53/original.jpg',
  alt_text:'Original Adventurine Argon Product photograph',width_px:1209,height_px:907};
 assert.equal(allowedImage({...image,public_use_status:'internal_review'}),false);
 assert.equal(allowedImage({...image,public_use_status:'product_page_ok'}),false);
 assert.equal(allowedImage({...image,public_use_status:'social_ok'}),false);
 assert.equal(allowedImage({...image,public_use_status:'all_public_ok'}),true);
 assert.equal(allowedImage({...image,public_use_status:'all_public_ok',width_px:500}),false);
 assert.equal(allowedImage({...image,public_use_status:'all_public_ok',alt_text:''}),false);
});

test('Build 496 reuses verified in-editor browser scoring for channel photo dimensions',async()=>{
 assert.match(CANONICAL_DISTRIBUTION_GALLERY_SQL,/qr\.quality_score/);
 assert.match(CANONICAL_DISTRIBUTION_GALLERY_SQL,/CASE WHEN qr\.load_status='loaded' THEN NULLIF\(qr\.width_px,0\)/);
 assert.match(CANONICAL_DISTRIBUTION_GALLERY_SQL,/CASE WHEN qr\.load_status='loaded' THEN NULLIF\(qr\.height_px,0\)/);
 const db={prepare(sql){assert.equal(sql,CANONICAL_DISTRIBUTION_GALLERY_SQL);return {bind(id){assert.equal(id,53);return {async all(){return {results:[{product_image_id:344,width_px:1209,height_px:907,public_use_status:'all_public_ok'}]};}};}};}};
 const result=await readCanonicalDistributionGallery(db,53);
 assert.equal(result.images[0].product_image_id,344);
 assert.equal(result.images[0].width_px,1209);
});

test('Build 496 matches per-image hold descriptions to the stricter server permission contract',()=>{
 const source=read('functions/api/admin/product-distribution-406.js');
 assert.match(source,/all_public_ok/);
 assert.match(source,/store \+ Etsy \+ Marketplace original-photo public-use approval missing/);
 assert.match(source,/hold_reasons:imageHolds\(im\)/);
});

test('Build 496 provides a simple Etsy Product & photo state without remote writes or duplicate drafts',()=>{
 const page=read('admin/product-editor/index.html');
 assert.match(page,/Basic field fill — not Etsy readiness/);
 assert.match(page,/id="dd496ReadinessList"/);
 assert.match(page,/admin-product-unified-readiness-v496\.js\?v=496/);
 const source=read('public/js/admin-product-unified-readiness-v496.js');
 for(const name of ['product-distribution-406','product-etsy-existing-draft','product-etsy-images',
  'linked_listing_id','transferred','hold_unconfirmed_claims','dd496FixImages','dd:media-inline-updated'])
  assert.ok(source.includes(name),`Build 496 must contain ${name}`);
 assert.match(source,/Select UPDATE, never Create Original/);
 assert.match(source,/No Etsy write was performed/);
 assert.doesNotMatch(source,/method:'POST'|create_draft|transfer_one|\.click\(\).*dd490Dispatch/);
});

test('Build 496 does not lose saved image authorization if the separate score read fails',()=>{
 const editor=read('public/js/admin-product-image-inline-v495.js');
 assert.match(editor,/metadataVerified=true/);
 assert.match(editor,/Image metadata SAVED and verified/);
 assert.match(editor,/scoring needs a later explicit image load/);
 assert.match(editor,/dd:media-inline-updated/);
});
