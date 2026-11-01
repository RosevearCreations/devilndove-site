import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composeSoapFormula540} from '../public/js/soap-formula-540.mjs';
const file=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const base={packaging_source_material_template_id:1,material_name:'Saved Goat Milk Soap Base',material_type:'soap_base',verification_status:'supplier_verified',master_inci:[{inci_name:'Aqua',required_on_label:1},{inci_name:'Glycerin',required_on_label:1}]};
const scent={packaging_source_material_template_id:2,material_name:'Saved Orange Fragrance',material_type:'fragrance_oil',verification_status:'owner_verified',master_inci:[{inci_name:'Parfum'},{inci_name:'Limonene'}]};
const oil={packaging_source_material_template_id:3,material_name:'Saved Extra Oil',material_type:'additive',material_subtype:'carrier_oil_butter',verification_status:'needs_review',master_inci:[{inci_name:'Glycerin'},{inci_name:'Cocos Nucifera Oil'}]};

test('Build 540 composes actual saved sources in order without guessing or duplicating names',()=>{
  const reviewed=composeSoapFormula540([base,scent,oil],{base:1,scent:2,oil:3});
  assert.equal(reviewed.ready,true);
  assert.deepEqual(reviewed.ingredients.map(x=>x.inci_name),['Aqua','Glycerin','Parfum','Limonene','Cocos Nucifera Oil']);
  assert.match(reviewed.warnings.join(' '),/source ingredients still need/);
  assert.equal(reviewed.selected.length,3);
  const unscented=composeSoapFormula540([base],{base:1});
  assert.equal(unscented.ready,true);
  assert.equal(unscented.inci_text,'Aqua, Glycerin');
});
test('Build 540 blocks missing, duplicated, invalid and guessed supplier formulas',()=>{
  assert.equal(composeSoapFormula540([base],{}).ready,false);
  assert.equal(composeSoapFormula540([base],{base:1,scent:1}).ready,false);
  assert.equal(composeSoapFormula540([{...base,master_inci:[]}],{base:1}).ready,false);
  assert.equal(composeSoapFormula540([{...base,master_inci:[{inci_name:'Required for cosmetic ingredient labels'}]}],{base:1}).ready,false);
  assert.equal(composeSoapFormula540([{...base,material_subtype:'fragrance_oil'}],{base:1}).ready,false);
});
test('Build 540 shows one finished-product toolbar, real soap selectors and a clean Etsy Draft tab',()=>{
  const page=file('admin/product-editor/index.html'),css=file('css/admin-product-editor-540.css');
  for(const id of ['dd540SaveProduct','dd540Base','dd540Scent','dd540Oil','dd540InciPreview','dd540NetWeight','dd540Verified','dd540CheckDraft','dd540UpdateDraft'])assert.equal((page.match(new RegExp(`id="${id}"`,'g'))||[]).length,1);
  assert.match(page,/data-editor-tab="publishing"/);
  assert.match(page,/Devil n Dove • Build (?:54[01234]|557|558|559|560|561|562|563|567)/);
  assert.match(css,/\.dd540-finished-product \.dd532-journey/);
  assert.match(css,/\.dd540-finished-product \.dd471-creation-flow/);
  assert.match(css,/\.dd540-finished-product #productResourcesAdminMount/);
  assert.doesNotMatch(page,/admin-product-resources\.js/);
});
test('Build 540 only writes reviewed local Product/soap records and keeps Etsy updates explicit',()=>{
  const api=file('functions/api/admin/product-soap-formula-540.js');
  const ui=file('public/js/admin-product-simple-540.mjs');
  assert.match(api,/getAdminUserFromRequest/);
  assert.match(api,/confirm_actual_formula!==true/);
  assert.match(api,/expected_inci_text/);
  assert.match(api,/ambiguous|Several active soap packaging records/);
  assert.match(api,/SELECT DISTINCT p\.packaging_project_id/);
  assert.match(api,/db\.batch\(statements\)/);
  assert.doesNotMatch(api,/(etsy\.com|etsy_listing|publishListing|listing_id)/i);
  assert.match(ui,/if\(form\.dataset\.productDirty==='1'\)/);
  assert.match(ui,/dd:save-succeeded/);
  assert.match(ui,/dd540UpdateDraft/);
  assert.match(file('.github/workflows/production-pages-deploy-current.yml'),/"build":(?:54[0123456789]|550|551|552|553|554|555|556|557|558|559|560|561|562|563|564|565|566|567)/);
});
