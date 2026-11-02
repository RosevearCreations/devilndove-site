import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {destinationProjection559} from '../public/js/product-destinations-559.mjs';

const source=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Build 568 removes only redundant Product Editor artwork, not real form or identity',()=>{
  const css=source('css/admin-brand-v3-set17.css');
  assert.match(css,/body\[data-dd-acceptance-v567="product-entry"\] \.dd-brand-v3-set17-banner\s*\{\s*display:none/);
  assert.match(css,/body \.dd-brand-v3-set17-banner\{/,'other Admin artwork is still enabled');
  assert.match(css,/max-width:740px/);
  assert.match(css,/min-width:0;width:100%;height:auto;max-height:none/);
  assert.doesNotMatch(css,/min-width:820px/,'phone-width artwork is not clipped behind an 820px minimum');
  const page=source('admin/product-editor/index.html');
  assert.match(page,/Devil n Dove • Build (?:568|569)/);
  assert.match(page,/data-dd-acceptance-v567="product-entry"/);
  assert.match(page,/id="productEditorIdentity"/);
  assert.match(page,/id="productEditorForm"/);
  for(const id of ['dd567TabDetails','dd567TabRecipe','dd567TabPhotos','dd567TabDestinations',
    'dd557DetailsArea','dd557RecipeArea','dd557PhotosArea','dd557DestinationArea',
    'dd540SaveProduct','productEditorSave','dd559EtsyTools','dd544Listing','dd544Link']){
    assert.ok(page.includes(`id="${id}"`),id);
  }
  assert.match(page,/Final owner walkthrough — Product, photos and channel handoff/);
  assert.match(page,/not an owner sign-off or proof of an external upload/);
});

test('All ten previously approved image-banner workspaces request the corrected asset revision',()=>{
  for(const route of [
    'business-pipeline','trust-blocks','help','members','custom-request',
    'marketplace-readiness','analytics','creative-automation','product-editor','release-control',
  ]){
    const html=source(`admin/${route}/index.html`);
    assert.match(html,/admin-brand-v3-set17\.css\?v=568/,route);
    assert.ok(html.includes('admin-brand-v3-set17.js'),`${route}: original banner loader remains`);
  }
  const banner=source('public/js/admin-brand-v3-set17.js');
  assert.match(banner,/banner\.setAttribute\('aria-hidden','true'\)/);
  assert.match(banner,/image\.onerror=/);
});

test('Seller-only mobile Search and Resume offsets clear the adaptive dock without moving buyer controls',()=>{
  const css=source('css/adaptive-shell.css');
  assert.match(css, /@media \(max-width:760px\)/);
  assert.match(css,/body\.dd-shell-active:has\(#ddAdaptiveShell\.dd-seller-shell\)\s*\{/);
  assert.match(css,/\.dd-v161-launcher\s*\{\s*right:10px;\s*bottom:calc\(var\(--dd-shell-size\) \+ env\(safe-area-inset-bottom,0px\) \+ 14px\)/);
  assert.match(css,/\.dd-b235-launch\s*\{\s*right:10px;\s*bottom:calc\(var\(--dd-shell-size\) \+ env\(safe-area-inset-bottom,0px\) \+ 64px\)/);
  assert.match(css,/padding-bottom:calc\(var\(--dd-shell-size\) \+ env\(safe-area-inset-bottom,0px\) \+ 140px\)/);
  assert.match(css,/\.dd-shell-nav\{width:100%;display:grid;grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(css,/prefers-reduced-motion/);
  assert.doesNotMatch(css,/body\.dd-shell-active\s*\{\s*padding-bottom:calc\(var\(--dd-shell-size\) \+ env\(safe-area-inset-bottom,0px\) \+ 140px\)/,
    'extra clearance is not global to buyer shell');
});

test('Cache-busted adaptive shell is injected consistently in all Admin render paths',()=>{
  const middleware=source('functions/_middleware.js');
  assert.equal((middleware.match(/adaptive-shell\.css\?v=\$\{CURRENT_RELEASE\}b568/g)||[]).length,3);
  assert.doesNotMatch(middleware,/adaptive-shell\.css\?v=\$\{CURRENT_RELEASE\}b143/);
  assert.match(middleware,/adminQolMarkup\(\)/);
  assert.match(middleware,/withScriptNonceCsp/);
  assert.match(middleware,/moduleAccessForRequest/);
});

test('No external provider publication, duplicate draft, or owner decision is inferred from presentation',()=>{
  const product={product_id:54,name:'Sweet Orange',status:'draft'};
  const exact={listing_id:'4601705477',receipt_id:25,saved_link_readback_confirmed:true,conflict:false};
  const projected=destinationProjection559({product,etsy:exact,connections:[]});
  assert.equal(projected.publication_performed,false);
  assert.equal(projected.provider_contacted,false);
  assert.equal(projected.destinations.find(x=>x.key==='etsy').publication_available,false);
  assert.equal(destinationProjection559({product,etsy:{...exact,conflict:true}}).destinations[0].draft_update_allowed,false);
  for(const destination of projected.destinations.filter(x=>x.key!=='etsy')){
    assert.equal(destination.publication_available,false,destination.key);
    assert.equal(destination.remote_id,null,destination.key);
  }
  const doc=source('docs/operations/RELEASE_467_BUILD_568_OWNER_DEVICE_ACCEPTANCE.md');
  assert.match(doc,/PENDING owner sign-off/);
  assert.match(doc,/No authenticated owner device interaction/);
});

test('Build 568 is quality-gated and emits the exact Production marker',()=>{
  assert.match(source('.github/workflows/current-application-quality.yml'),/release467_build568_owner_device_review\.test\.mjs/);
  assert.match(source('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:568|569)/);
});
