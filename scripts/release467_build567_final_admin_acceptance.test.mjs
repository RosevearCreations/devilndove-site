import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {destinationProjection559} from '../public/js/product-destinations-559.mjs';
import {manualCaption557} from '../public/js/product-entry-557.mjs';

const source = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Product entry remains the same one-Product, four-area owner flow with accessible linked panels', () => {
  const page=source('admin/product-editor/index.html');
  assert.match(page, /Devil n Dove • Build 567/);
  assert.match(page, /class="dd540-finished-product dd557-entry dd556-admin-root" data-dd-acceptance-v567="product-entry"/);
  const tabs=[
    ['Details','details','dd557DetailsArea','basics'],
    ['Recipe','ingredients','dd557RecipeArea','ingredients'],
    ['Photos','media','dd557PhotosArea','media'],
    ['Destinations','publishing','dd557DestinationArea','publishing'],
  ];
  for(const [name,key,panel,section] of tabs){
    const tabId=`dd567Tab${name}`;
    const button=page.match(new RegExp(`<button[^>]+id="${tabId}"[^>]*>`))?.[0];
    assert.ok(button, `${name} tab`);
    assert.ok(button.includes('role="tab"')&&button.includes(`aria-controls="${panel}"`)&&button.includes(`data-editor-tab="${key}"`));
    const panelTag=page.match(new RegExp(`<section[^>]+id="${panel}"[^>]*>`))?.[0];
    assert.ok(panelTag?.includes(`data-editor-panel="${section}"`)&&panelTag.includes('role="tabpanel"'),`${name} panel`);
    assert.ok(panelTag.includes(`aria-labelledby="${tabId}`),`${name} label`);
  }
  assert.equal((page.match(/<button[^>]*role="tab"/g)||[]).length,4,'four primary tabs');
  assert.equal((page.match(/role="tabpanel"/g)||[]).length,4,'four matching panels');
  assert.equal((page.match(/id="dd540SaveProduct"/g)||[]).length,1,'one normal owner save');
  assert.equal((page.match(/id="productEditorSave"/g)||[]).length,1,'existing actual submit retained');
  assert.match(source('css/admin-product-editor-540.css'),/\.dd540-finished-product \.dd471-creation-flow/,'legacy alternate form stays out of everyday view');
  assert.match(page,/admin-product-ingredients-539\.mjs\?v=539/);
  assert.match(page,/product-editor-etsy-544\.mjs\?v=559/);
  assert.match(page,/product-entry-557\.mjs\?v=563/);
});

test('Roving tab keyboard support handles arrow/Home/End without duplicate form handlers', () => {
  const code=source('public/js/product-entry-557.mjs');
  assert.match(code,/event\.key==='ArrowRight'/);
  assert.match(code,/event\.key==='ArrowLeft'/);
  assert.match(code,/event\.key==='Home'/);
  assert.match(code,/event\.key==='End'/);
  assert.match(code,/tab\.tabIndex=tab\.getAttribute\('aria-selected'\)==='true'\?0:-1/);
  assert.match(code,/button\.tabIndex=selected\?0:-1/);
  assert.doesNotMatch(code,/fetch\([^\n]*method:\s*['"]POST['"]/);
});

test('Owner walk-through is explicit, collapsed, and never claims signed approval', () => {
  const page=source('admin/product-editor/index.html');
  assert.match(page,/<details class="dd567-owner-walkthrough" id="dd567OwnerWalkthrough">/);
  assert.match(page,/Final owner walkthrough — Product, photos and channel handoff/);
  assert.match(page,/readback before any retry/);
  assert.match(page,/not an owner sign-off or proof of an external upload/);
  assert.doesNotMatch(page, /id="dd567OwnerWalkthrough"[^>]*open/);
  const css=source('css/admin-owner-acceptance-567.css');
  assert.match(page,/admin-owner-acceptance-567\.css\?v=567/);
  assert.match(css,/body\[data-dd-acceptance-v567\]/);
  assert.match(css,/:focus-visible/);
  assert.match(css, /max-width: 520px/);
  assert.match(css, /prefers-reduced-motion/);
  assert.doesNotMatch(css,/^\s*(?:body|html|:root|\.card|\.btn)\s*\{/m);
});

test('Channel instruction tiles are retired from the default view but safe handoff behavior remains', () => {
  const code=source('public/js/product-destinations-559.mjs');
  assert.match(code,/<details class="dd567-handoff-guide"><summary>How destination handoffs work/);
  assert.match(code,/<div class="dd559-steps" aria-label="Four separate actions">/);
  assert.match(code,/<\/div><\/details>/);
  for(const id of ['dd559Dashboard','dd559Refresh','dd559Grid','dd559Summary','dd559Handoff','dd560Meta','dd561TikTok','dd562Social','dd563Recovery','dd559EtsyTools']){
    assert.ok(code.includes(id)||source('admin/product-editor/index.html').includes(id), `preserve ${id}`);
  }
  assert.match(code,/method:'GET',cache:'no-store'/,'saved source readback remains GET only');
  assert.match(code,/No channel has been contacted/);
});

test('Etsy claims fail closed and manual channels never assert external publication', () => {
  const product={product_id:54,name:'Sweet Orange',status:'draft'};
  const exact={listing_id:'4601705477',receipt_id:25,saved_link_readback_confirmed:true,conflict:false};
  const linked=destinationProjection559({product,etsy:exact,connections:[]});
  assert.equal(linked.saved,true);
  assert.equal(linked.provider_contacted,false);
  assert.equal(linked.publication_performed,false);
  const etsy=linked.destinations.find(row=>row.key==='etsy');
  assert.equal(etsy.remote_id,'4601705477');
  assert.equal(etsy.draft_update_allowed,true);
  assert.equal(etsy.publication_available,false);
  assert.equal(etsy.remote_state,'Live Etsy status not checked on this dashboard');
  for(const row of linked.destinations.filter(row=>row.key!=='etsy')){
    assert.equal(row.publication_available,false,row.key);
    assert.equal(row.draft_update_allowed,false,row.key);
    assert.equal(row.remote_id,null,row.key);
  }
  const ambiguous=destinationProjection559({product,etsy:{...exact,conflict:true}});
  assert.equal(ambiguous.destinations[0].draft_update_allowed,false);
  assert.equal(ambiguous.destinations[0].state,'hold');
  const unconfirmed=destinationProjection559({product,etsy:{...exact,saved_link_readback_confirmed:false}});
  assert.equal(unconfirmed.destinations[0].draft_update_allowed,false);
  assert.throws(()=>manualCaption557({name:'',price:'12',description:'Test'}));
  assert.match(manualCaption557({name:'Soap',price:'12',description:'Handmade',keywords:'orange,soap'}),/CAD \$12\.00/);
});

test('Commerce, Workshop and Management responsive authority remains independent', () => {
  for(const [name,cssPath,optIn] of [
    ['Commerce','css/admin-commerce-564.css','data-dd-commerce-v564'],
    ['Workshop','css/admin-workshop-565.css','data-dd-workshop-v565'],
    ['Management','css/admin-management-566.css','data-dd-management-v566'],
  ]){
    const css=source(cssPath);
    assert.match(css,/:focus-visible/,name);
    assert.match(css,/prefers-reduced-motion/,name);
    assert.match(css,/@media/,name);
    assert.ok(css.includes(optIn)||css.includes(optIn.replace('data-','')),name);
  }
  for(const path of ['admin/system-operations/index.html','admin/accounting/index.html','admin/it-integrations/index.html']){
    assert.doesNotMatch(source(path),/data-dd-acceptance-v567|admin-owner-acceptance-567\.css/);
  }
});

test('Build 567 is required in quality CI and has the exact live Production marker', () => {
  assert.match(source('.github/workflows/current-application-quality.yml'), /release467_build567_final_admin_acceptance\.test\.mjs/);
  assert.match(source('.github/workflows/production-pages-deploy-current.yml'), /"build":567/);
});
