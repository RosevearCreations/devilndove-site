import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Build 494 replays Product authority to late Etsy listeners and keeps load failure explicit',()=>{
 const editor=read('public/js/admin-product-editor-v163.js');
 const repair=read('public/js/admin-product-etsy-repair-v493.js');
 for(const phase of ['loading','ready','failed'])assert.match(editor,new RegExp(`productAuthority='${phase}'`));
 assert.match(repair,/loaded=form\.dataset\.productAuthority==='ready'/);
 assert.match(repair,/failed=form\.dataset\.productAuthority==='failed'/);
 assert.match(repair,/dd488ChooseNew.*aria-pressed/);
});
test('Build 494 restores only draft mode intent, never remote approval, shipping consent or provider writes',()=>{
 const guide=read('public/js/admin-product-etsy-guide-v488.js');
 const dispatch=read('public/js/admin-product-etsy-dispatch-v490.js');
 assert.match(guide,/sessionStorage\.setItem\(intentKey,mode\)/);
 assert.match(guide,/sessionStorage\.getItem\(intentKey\)/);
 assert.match(dispatch,/mode=\$\('dd488ChooseNew'\)/);
 assert.doesNotMatch(guide,/dd490Authorize.*checked=true|dd438EtsyConfirm.*checked=true/);
 assert.match(dispatch,/authorize\.checked=false/);
});
test('Build 494 triggers a single live Etsy check after Product authority, including late tab initialization',()=>{
 const marketplace=read('public/js/admin-product-marketplace-drafts-v438.js');
 assert.match(marketplace,/function autoTestOnEtsyTab\(\)/);
 assert.match(marketplace,/dd:product-loaded',autoTestOnEtsyTab/);
 assert.match(marketplace,/autoTestOnEtsyTab\(\);/);
 assert.match(marketplace,/if\(openedEtsyOnce\|\|!productId/);
 assert.match(marketplace,/productAuthority!=='ready'/);
 assert.match(marketplace,/action:'test_connection'/);
 assert.match(marketplace,/confirm_unpublished_draft_only:true/);
});
test('Build 494 authorization controls use compact real labels with existing stable IDs',()=>{
 const html=read('admin/product-editor/index.html'),css=read('admin/product-editor/entry-readiness-489.css');
 for(const id of ['dd490Authorize','dd439EtsyCanadaConfirm','dd438EtsyConfirm']){
  assert.match(html,new RegExp(`<input type="checkbox" id="${id}"><label for="${id}">`));
 }
 assert.match(css,/\.dd494-authorization>input\[type="checkbox"\]/);
 assert.match(css,/\.dd494-authorization>label/);
});
