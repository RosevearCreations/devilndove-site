import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Build 495 uses one original gallery with inline image metadata, not a second upload',()=>{
 const html=read('admin/product-editor/index.html'),view=read('public/js/admin-product-distribution-v406.js');
 assert.match(html,/Shared Product photographs — Store, Etsy &amp; Marketplace/);
 assert.match(html,/id="dd495InlineImageStatus"/);
 assert.match(view,/dd495-image-card/);assert.match(view,/dataset\.dd495Inline/);
 assert.match(view,/dd:media-inline-updated/);
 assert.match(view,/document\.addEventListener\('dd:product-loaded',loadWhenReady\)/);
 assert.match(view,/if\(id&&document\.getElementById\('productEditorForm'\)\?\.dataset\.productAuthority==='ready'/);
 assert.doesNotMatch(view,/FormData\(|type='file'/);
});
test('Build 495 saves each image once in the Product Editor and verifies metadata readback',()=>{
 const file=read('public/js/admin-product-image-inline-v495.js');
 for(const token of ['product-image-editor','save_metadata','save_confirmed','image_title','alt_text','caption',
  'public_use_status','all_public_ok','original.product_id','original.quality_score','action:\'score\''])
  assert.ok(file.includes(token),`Expected ${token} in in-place Product photo editor`);
 assert.match(file,/Number\(image\.product_id\)!==id/);
 assert.match(file,/String\(image\.public_use_status\|\|''\)!==payload\.public_use_status/);
 assert.match(file,/dd:media-inline-updated/);
 assert.doesNotMatch(file,/etsy\.com\/v3|transfer_one|create_draft|publish_listing|window\.location/);
 const server=read('functions/api/admin/product-image-editor.js');
 assert.match(server,/action!=='save_metadata'/);
 assert.match(server,/action==='score'/);
});
test('Build 495 shows scoring and channel holds without querying an unrelated image collection',()=>{
 const gallery=read('functions/api/_lib/canonicalDistributionGallery436.mjs');
 assert.match(gallery,/LEFT JOIN product_image_quality_reviews qr/);
 assert.match(gallery,/qr\.quality_score AS quality_score/);
 const endpoint=read('functions/api/admin/product-distribution-406.js');
 assert.match(endpoint,/quality_score:im\.quality_score/);
 assert.match(endpoint,/hold_reasons:imageHolds\(im\)/);
 const css=read('admin/product-editor/entry-readiness-489.css');
 assert.match(css,/dd495-image-card/);assert.match(css,/dd495-image-field/);
 assert.match(css,/dd489-both/);
});
test('Build 495 preserves honest Etsy existing-draft status and never duplicates an approved draft',()=>{
 const status=read('public/js/admin-product-syndication-state-v495.js');
 assert.match(status,/product-etsy-existing-draft\?product_id=/);
 assert.match(status,/linked&&chosen\(\)!=='existing'/);
 assert.match(status,/dd488ChooseNew'\)\.disabled=!!linked/);
 assert.match(status,/linkError=error\.message/);
 assert.match(status,/This Product is UPDATED/);
 assert.doesNotMatch(status,/method:'POST'|transfer_one|create_draft|\.click\(\).*dd490Dispatch/);
 const media=read('public/js/admin-product-unified-publishing-v443.js');
 assert.match(media,/dd:media-inline-updated/);
 assert.match(media,/loadOnEtsyOpen/);
 assert.match(media,/confirm_canada_only:true/);
});
test('Build 495 stops showing a false 14%-complete Product while saved authority is loading',()=>{
 const score=read('public/js/admin-product-entry-readiness-v489.js');
 assert.match(score,/form\.dataset\.productAuthority!=='ready'/);
 assert.match(score,/Checking saved Product/);
 assert.match(score,/MutationObserver/);
 const editor=read('public/js/admin-product-editor-v163.js');
 assert.match(editor,/Number\(data\.product\?\.product_id\)!==state\.productId/);
 assert.match(editor,/incomplete authority data/);
});
test('Build 495 keeps search keywords in saved Product SEO and accurately previews Etsy tag limits',()=>{
 const html=read('admin/product-editor/index.html');
 assert.match(html,/Product search tags \/ keywords/);
 assert.match(html,/name="keywords"/);
 assert.match(html,/dd495TagsPreview/);
 const js=read('public/js/admin-product-tags-v495.js');
 assert.match(js,/tags\.length>13/);assert.match(js,/x\.length>20/);
 assert.match(js,/optional, explicitly approved action in the Etsy tab/);
 assert.match(html,/id="dd497TagsConsent"/);
 const endpoint=read('functions/api/admin/product-editor-save.js');
 assert.match(endpoint,/meta_title','meta_description','keywords'/);
});
