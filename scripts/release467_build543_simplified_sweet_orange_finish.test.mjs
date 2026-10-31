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

test('Build 543 shows two steps to reuse the existing unpublished draft and its original Product photos',()=>{
  const page=file('admin/product-editor/index.html'),ui=file('public/js/admin-product-simple-540.mjs'),css=file('css/admin-product-editor-543.css');
  assert.match(page,/Finish our Etsy draft/);
  assert.match(page,/id="dd543ExistingDraftMount"/);
  assert.match(page,/id="dd541PhotosMount"/);
  assert.match(page,/id="dd543OrangeSuggestion"/);
  assert.match(ui,/linkMount\.append\(linkPanel\)/);
  assert.match(ui,/photoMount\.append\(photoPanel\)/);
  assert.match(ui,/dd:etsy-existing-draft-linked/);
  assert.match(css,/\.dd543-simple-step/);
  assert.match(file('.github/workflows/production-pages-deploy-current.yml'),/"build":543/);
  assert.doesNotMatch(ui,/action:'transfer_one'/);
});
