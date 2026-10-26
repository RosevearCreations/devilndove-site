import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Build 489 Etsy tab loads connection, restores and persists category without provider write',()=>{
 const editor=read('public/js/admin-product-editor-v163.js');
 const draft=read('public/js/admin-product-marketplace-drafts-v438.js');
 const pref=read('functions/api/admin/product-etsy-category-preference.js');
 assert.match(editor,/dd:editor-tab-opened/);
 assert.match(draft,/dd:editor-tab-opened/);
 assert.match(draft,/openedEtsyOnce/);
 assert.match(draft,/product-etsy-category-preference/);
 assert.match(draft,/retained\.category/);
 assert.match(pref,/ON CONFLICT\(channel_key,product_id\) DO UPDATE SET taxonomy_id/);
 assert.match(pref,/confirm_local_only/);
 assert.doesNotMatch(pref,/fetch\s*\(/);
});

test('Build 489 badges, local entry completeness, continuing QA/media scores',()=>{
 const html=read('admin/product-editor/index.html');
 const media=read('admin/catalog-media/index.html');
 const css=read('admin/product-editor/entry-readiness-489.css');
 const script=read('public/js/admin-product-entry-readiness-v489.js');
 assert.match(html,/dd489EntryMeter/);assert.match(html,/admin-product-entry-readiness-v489/);
 assert.match(css,/\.dd489-both/);assert.match(css,/text-decoration-color:#f5a34f/);
 assert.match(media,/dd489-both/);assert.match(media,/alt_text/);
 assert.match(script,/Product QA/);assert.match(script,/image quality/);
 assert.match(html,/data-dd489-open="qa"/);assert.match(html,/data-dd489-open="media"/);
});

test('Build 489 shop cards use uniform responsive, full-area image covers',()=>{
 const html=read('shop/index.html'),css=read('css/shop-uniform-cards-489.css');
 assert.match(html,/shop-uniform-cards-489.css/);
 assert.match(css,/object-fit:cover!important/);
 assert.match(css,/aspect-ratio:4\/5/);
 assert.match(css,/grid-template-columns:repeat\(4/);
 assert.match(css,/@media\(max-width:520px\)/);
});
