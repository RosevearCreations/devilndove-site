import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Build 491 outcome API is read-only, bounded, verified-admin and product-scoped',()=>{
 const s=read('functions/api/admin/product-etsy-outcome-reconciliation.js');
 assert.match(s,/verifiedAdminFromModule/);assert.match(s,/onRequestGet/);assert.doesNotMatch(s,/onRequestPost/);
 assert.match(s,/LIMIT 60/);assert.match(s,/target_key=\? OR target_key LIKE \?/);
 assert.match(s,/etsy_existing_draft_486_update_claimed/);assert.match(s,/etsy_product_editor_image_443_accepted/);
 assert.match(s,/uncertain_hold/);assert.match(s,/publication_performed:false/);
 assert.doesNotMatch(s,/fetch\s*\(/);assert.doesNotMatch(s,/\.run\s*\(/);
});
test('Build 491 owner package retest never writes or retries provider operations',()=>{
 const js=read('public/js/admin-product-etsy-outcomes-v491.js'),html=read('admin/product-editor/index.html');
 assert.match(html,/dd491LocalRetest/);assert.match(html,/dd491RemoteRetest/);assert.match(html,/admin-product-etsy-outcomes-v491.js/);
 assert.match(js,/product-etsy-outcome-reconciliation/);assert.match(js,/product-etsy-images\?product_id/);
 assert.match(js,/reconcile=1/);assert.match(js,/dataset\.productDirty/);
 assert.match(js,/addEventListener\('click'/);assert.doesNotMatch(js,/method:'POST'|setInterval/);
});
test('Build 491 keeps Product QA, media scoring and mobile-safe controls discoverable',()=>{
 const html=read('admin/product-editor/index.html'),css=read('admin/product-editor/entry-readiness-489.css');
 assert.match(html,/Open Product QA score/);assert.match(html,/Review image scoring/);
 assert.match(css,/\.dd491-outcomes/);assert.match(css,/@media\(max-width:520px\)/);
 assert.match(css,/white-space:normal/);
});
