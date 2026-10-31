import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewSavedInci539} from '../public/js/product-ingredient-review-539.mjs';

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('Build 539 restores the actual saved INCI/material editor alongside Product tabs, while preserving advanced settings', () => {
  const page = read('admin/product-editor/index.html');
  for (const id of ['dd539OpenIngredients','dd539OpenAdvanced','productResourcesAdminMount','dd539LoadIngredients','dd539PilotMount','dd539UseSavedInci','dd539VerifyLive','dd539LiveStatus'])
    assert.match(page, new RegExp(`id="${id}"`));
  assert.match(page, /data-editor-tab="ingredients"/);
  assert.match(page, /data-editor-panel="ingredients" hidden/);
  assert.doesNotMatch(page, /admin-product-resources\.js/);
  assert.match(page, /admin-product-ingredients-539\.mjs\?v=539/);
  assert.match(page, /admin-product-editor-539\.css\?v=539/);
  assert.match(page, /id="dd527MoreTools"/);
  assert.match(page, /Devil n Dove • Build 54[01234]/);
  for (const id of ['dd538Pilot','dd538Ingredients','dd538NetWeight','dd538FactsConfirm','dd538Fill'])
    assert.equal((page.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`one ${id} only`);
});

test('Build 539 INCI readback cannot guess, import foreign links, duplicate items or accept incomplete names', () => {
  const saved = [
    {product_id:54,is_label_ingredient:1,sort_order:1,inci_name:'Citrus Aurantium Dulcis Peel Oil'},
    {product_id:54,is_label_ingredient:1,sort_order:0,inci_name:'Sodium Olivate'},
    {product_id:54,is_label_ingredient:0,sort_order:2,inci_name:'Do not use this tool'}
  ];
  assert.deepEqual(reviewSavedInci539(saved,54),{count:2,ingredients:'Sodium Olivate, Citrus Aurantium Dulcis Peel Oil'});
  assert.throws(()=>reviewSavedInci539([],54),/No saved label ingredients/);
  assert.throws(()=>reviewSavedInci539([{...saved[0],product_id:53}],54),/different Product/);
  assert.throws(()=>reviewSavedInci539([{...saved[0],inci_name:''}],54),/no valid INCI/);
  assert.throws(()=>reviewSavedInci539([saved[0],{...saved[0]}],54),/Duplicate INCI/);
  assert.throws(()=>reviewSavedInci539(saved,0),/exact saved Product/);
});

test('Build 539 never wakes ingredient D1 reads on editor startup or Product Save, and imports only by owner click', () => {
  const resource = read('public/js/admin-product-resources.js');
  const restore = read('public/js/admin-product-ingredients-539.mjs');
  assert.match(resource,/mountEl\.dataset\.manualLoad !== 'true' \|\| initialLoadStarted/);
  assert.match(resource,/document\.getElementById\('productResourcesLoadButton'\)\?\.addEventListener\('click', startInitialLoad\)/);
  assert.match(restore,/dd539LoadIngredients'\)\?\.addEventListener\('click'/);
  assert.match(restore,/await import\('\/public\/js\/admin-product-resources\.js\?v=539'\)/);
  assert.match(resource,/document\.readyState === 'loading'/);
  assert.match(restore,/dd539UseSavedInci'\)\?\.addEventListener\('click', async/);
  assert.match(restore,/api\/admin\/product-resources\?product_id=54/);
  assert.match(restore,/if \(input\.value\.trim\(\)\)/);
  assert.match(restore,/dd535ReadLive/);
  assert.match(restore,/MutationObserver\(copyLive\)/);
  assert.doesNotMatch(restore,/method:\s*['"]POST['"]|method:\s*['"]DELETE['"]|\.submit\(/);
  assert.match(read('css/admin-product-editor-539.css'),/\.product-production-release\{display:none!important\}/);
});

test('Build 539 restores only owner-saved soap net weight and never substitutes unknown shipping weight', () => {
  const helper = read('public/js/admin-product-etsy-pilot-538.mjs');
  assert.match(helper,/Net weight of soap \\\(without packaging\\\)/);
  assert.match(helper,/if\(!net\.value\.trim\(\)\)/);
  assert.doesNotMatch(helper,/field\('weight_grams'\)|net\.value\s*=\s*180/);
});

test('Build 539 release and CI preserve explicit live Etsy one-draft photo/tag gates', () => {
  const page = read('admin/product-editor/index.html');
  const flow = read('public/js/admin-product-etsy-package-v500.mjs');
  assert.match(page,/dd535ReadLive/);
  assert.match(page,/dd537OwnerRecovery/);
  assert.match(page,/dd538Photos/);
  assert.match(flow,/action:'transfer_one',product_id:id,listing_id:listingId/);
  assert.match(read('.github/workflows/production-pages-deploy-current.yml'),/"build":54[0123456]/);
  assert.match(read('.github/workflows/current-application-quality.yml'),/release467_build539_ingredient_editor_etsy_acceptance\.test\.mjs/);
});
