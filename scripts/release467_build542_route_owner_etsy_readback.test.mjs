import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessOwnerRecipePhotos542} from '../public/js/soap-formula-540.mjs';
const file=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');

const recipe={product_id:54,product_name:'Bar Soap Sweet Orange',official_project:{packaging_project_id:1},
  saved_ingredients:[{inci_name:'Glycerin'}],saved_materials:[{material_role:'base',packaging_source_material_template_id:1},
    {material_role:'fragrance',packaging_source_material_template_id:2}],saved_weight_g:180,
  source_materials:[{packaging_source_material_template_id:2,material_name:'Sweet Orange Oil'}]};
const photos={listing_id:'4601705477',provider_contacted:true,gallery_photo_count:3,
  remote_reconciliation:{ready:true,remote_count:3},photo_pair_readback_529:{ready:true}};

test('Build 542 owner readback reports full saved/remote evidence but never approves a physical batch',()=>{
  assert.equal(assessOwnerRecipePhotos542(recipe,photos).ready,true);
  assert.equal(assessOwnerRecipePhotos542(recipe,{...photos,remote_reconciliation:{ready:false,remote_count:0}}).ready,false);
  assert.match(assessOwnerRecipePhotos542(recipe,{...photos,listing_id:'999'}).issues.join(' '),/existing draft/);
  assert.match(assessOwnerRecipePhotos542({...recipe,source_materials:[{packaging_source_material_template_id:2,material_name:'Sea Breeze'}]},photos).issues.join(' '),/Saved scent conflicts/);
  assert.equal(assessOwnerRecipePhotos542({...recipe,saved_ingredients:[]},photos).ready,false);
});
test('Build 542 keeps owner readback GET-only and requires confirmed media pairing',()=>{
  const ui=file('public/js/admin-product-simple-540.mjs'),workflow=file('.github/workflows/production-pages-deploy-current.yml');
  assert.match(ui,/dd542OwnerVerify/);
  assert.match(ui,/product-etsy-images\?product_id=.*&reconcile=1/);
  assert.match(ui,/No Etsy upload, publication or ingredient write occurred/);
  assert.match(workflow,/"build":(?:54[23456789]|550|551|552|553|554|555|556|557|558|559)/);
  assert.match(workflow,/PRODUCTION ROUTE RETRY/);
  assert.match(file('admin/product-editor/index.html'),/Devil n Dove • Build (?:54[234]|557|558|559)/);
});
