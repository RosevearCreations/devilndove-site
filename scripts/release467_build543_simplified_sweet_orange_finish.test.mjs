import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('Build 543 saves Product edits even when the legacy scent is mismatched, without changing an official formula',()=>{
  const ui=file('public/js/admin-product-simple-540.mjs');
  assert.match(ui,/validRecipe&&!scentConflict&&confirmed/);
  assert.match(ui,/The conflicting soap formula is preserved/);
  assert.doesNotMatch(ui,/if\(isSoap&&recipeRoot\?\.dataset\.scentConflict==='1'\)throw/);
  assert.match(ui,/orange\.length===1/);
  assert.match(ui,/renderRecipe\(\{changed:true\}\)/);
});

test('Build 544 displays independent connection and photograph steps unaffected by legacy hidden controls',()=>{
  const page=file('admin/product-editor/index.html'),ui=file('public/js/admin-product-simple-540.mjs'),flow=file('public/js/product-editor-etsy-544.mjs');
  assert.match(page,/External destinations/);
  assert.match(page,/id="dd559EtsyTools"/);
  assert.match(page,/id="dd544ConnectHeading"/);
  assert.match(page,/id="dd544PhotosHeading"/);
  assert.match(page,/id="dd543OrangeSuggestion"/);
  assert.doesNotMatch(ui,/linkMount\.append\(linkPanel\)/);
  assert.doesNotMatch(ui,/photoMount\.append\(photoPanel\)/);
  assert.match(flow,/action:'inspect_listing'/);
  assert.match(flow,/action:'link_existing'/);
  assert.match(flow,/verified_remote_readback!==true/);
  assert.match(flow,/state\.hold=true/);
  assert.match(file('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:54[456789]|550|551|552|553|554|555|556|557|558|559|560|561)/);
  assert.doesNotMatch(ui,/action:'transfer_one'/);
});
