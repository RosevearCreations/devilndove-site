import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {photoSizeAdvice533,squareSelection533} from '../public/js/product-photo-framing-policy-533.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Build 533 correctly classifies actual Sweet Orange gallery sizes: 800 is minimum, not crop requirement',()=>{
 for(const [width,height] of [[1209,907],[1209,907],[1853,1391]]){
  const result=photoSizeAdvice533(width,height);assert.equal(result.meetsLocalMinimum,true);
  assert.equal(result.etsyRecommended,false);assert.match(result.message,/No crop is required/);
  assert.match(result.message,/Etsy recommends 2000 px/);
 }
 assert.equal(photoSizeAdvice533(2100,2000).etsyRecommended,true);
 assert.equal(photoSizeAdvice533(700,1900).meetsLocalMinimum,false);
 assert.equal(photoSizeAdvice533(0,0).meetsLocalMinimum,false);
});
test('Build 533 square selection respects entire source, edges and portrait/landscape geometry',()=>{
 assert.deepEqual(squareSelection533(1209,907,.5,.5),{sx:151,sy:0,side:907,outputSize:907,left:151/1209*100,top:0,width:907/1209*100,height:100});
 const left=squareSelection533(1209,907,0,0);assert.equal(left.sx,0);assert.equal(left.sy,0);
 const right=squareSelection533(1209,907,1,1);assert.equal(right.sx,302);
 const portrait=squareSelection533(900,1400,1,1);assert.equal(portrait.sy,500);assert.equal(portrait.sx,0);
 assert.equal(squareSelection533(2000,2000,.8,.8).outputSize,2000);
 assert.throws(()=>squareSelection533(0,2000),/dimensions/);
});
test('Build 533 retains one canonical gallery, displays visual editor and explicit replacement authority',()=>{
 const html=read('admin/product-editor/index.html'),gallery=read('public/js/admin-product-distribution-v406.js');
 const editor=read('public/js/admin-product-photo-framing-533.mjs');
 assert.match(html,/Devil n Dove • Build (?:53[3456789]|540|541|542|543|544|545|546|547)/);
 assert.match(html,/admin-product-photo-framing-533\.mjs\?v=533/);
 assert.match(html,/admin-product-editor-533\.css\?v=533/);
 assert.match(html,/id="dd533ExistingDraft"/);
 assert.match(gallery,/dataset\.dd533Frame/);
 assert.match(gallery,/dataset\.dd533FrameMount/);
 assert.match(editor,/squareSelection533/);
 assert.match(editor,/stage\.addEventListener\('pointerdown'/);
 assert.match(editor,/data\.append\('file',new File/);
 assert.match(editor,/action:'replace'/);
 assert.match(editor,/window\.confirm\(`/);
 assert.match(editor,/save_confirmed!==true/);
 assert.match(editor,/product-image-editor\?product_image_id/);
 assert.match(editor,/dd:media-inline-updated/);
 assert.doesNotMatch(editor,/product-etsy-draft|graph\.facebook\.com|auto.?publish/i);
});
test('Build 533 requires completed Etsy provider module initialization and existing draft check',()=>{
 const html=read('admin/product-editor/index.html'),flow=read('public/js/admin-product-destination-flow-523.mjs');
 assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=(?:528|538)/);
 assert.match(flow,/import '\.\/admin-product-etsy-package-v500\.mjs\?v=(?:528|538)';/);
 assert.match(flow,/Already have an Etsy draft/);
 assert.match(flow,/state\.lastListingId&&?\!?window\.confirm|!state\.lastListingId&&!window\.confirm/);
 assert.match(flow,/dd533ExistingDraft/);
 assert.match(flow,/dd486EtsyListingId/); // Build 537 uses the actual inspect/link workflow.
 assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":5(?:3[3456789]|40|41|42|43|44|45|46|47)/);
});
