import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SWEET_ORANGE_558,ownerRecipeSnapshot558,ownerRecipeReadback558,sweetOrangePhotoState558} from '../public/js/sweet-orange-558.mjs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const materials=[{material_role:'fragrance',packaging_source_material_template_id:9},{material_role:'base',packaging_source_material_template_id:4}];
const ingredients=[{inci_name:'Coconut Oil'},{inci_name:'Orange Peel Oil'}];
const recipe={projectId:55,materials,ingredients,netWeightG:180};
const receipt={owner_user_id:7,project_id:55,confirm_actual_formula:true,snapshot:ownerRecipeSnapshot558(recipe)};
const linked={saved_link_readback_confirmed:true,product_id:54,receipt_id:'existing-receipt',linked_listing_id:'4601705477'};
const originalIds=SWEET_ORANGE_558.photoIds;
const gallery=originalIds.map(product_image_id=>({product_image_id,transferable:true,transferred:false,hold:false}));
function photoProof({confirmed=[],linkedReceipt=linked,overrides={}}={}){
  const pairs=confirmed.map((product_image_id,i)=>({product_image_id,etsy_image_id:String(9000+i)}));
  const photos={listing_id:'4601705477',images:gallery,gallery_photo_count:3,hold_unconfirmed_claims:0,
    provider_contacted:true,remote_reconciliation:{ready:true,remote_count:confirmed.length},
    photo_pair_readback_529:{ready:confirmed.length===3},verified_photo_pairs_529:pairs,...overrides};
  return sweetOrangePhotoState558({receipt:linkedReceipt,photos});
}

test('Build 558 owner acceptance is a same-formula, owner-attributed saved receipt',()=>{
  assert.equal(ownerRecipeReadback558(recipe,receipt),true);
  assert.equal(ownerRecipeReadback558({...recipe,netWeightG:181},receipt),false);
  assert.equal(ownerRecipeReadback558({...recipe,ingredients:[...ingredients].reverse()},receipt),false);
  assert.equal(ownerRecipeReadback558(recipe,{...receipt,owner_user_id:0}),false);
  assert.equal(ownerRecipeReadback558(recipe,{...receipt,confirm_actual_formula:false}),false);
  assert.deepEqual(ownerRecipeSnapshot558({...recipe,materials:[...materials].reverse()}),receipt.snapshot);
});

test('Build 558 permits first photo only after Etsy live empty inventory and exact owner Product link',()=>{
  const zero=photoProof();
  assert.equal(zero.ready,false);
  assert.equal(zero.verifiedCount,0);
  assert.equal(zero.canTransfer,true);
  assert.equal(photoProof({linkedReceipt:{...linked,saved_link_readback_confirmed:false}}).canTransfer,false);
  assert.equal(photoProof({overrides:{provider_contacted:false}}).canTransfer,false);
  assert.equal(photoProof({overrides:{remote_reconciliation:{ready:false,remote_count:null}}}).canTransfer,false);
});

test('Build 558 needs three unique live Etsy photo IDs to count all three originals',()=>{
  assert.equal(photoProof({confirmed:originalIds.slice(0,1)}).verifiedCount,1);
  const done=photoProof({confirmed:originalIds});
  assert.equal(done.ready,true);assert.equal(done.verifiedCount,3);assert.equal(done.canTransfer,false);
  assert.equal(done.verifiedIds.get(342),'9000');
  assert.equal(photoProof({confirmed:originalIds,overrides:{gallery_photo_count:4}}).ready,false);
  assert.equal(photoProof({confirmed:originalIds,overrides:{listing_id:'4603838854'}}).ready,false);
  assert.equal(photoProof({confirmed:originalIds,overrides:{verified_photo_pairs_529:[{product_image_id:342,etsy_image_id:'100'},{product_image_id:341,etsy_image_id:'100'},{product_image_id:343,etsy_image_id:'300'}]}}).ready,false);
  assert.equal(photoProof({overrides:{hold_unconfirmed_claims:1}}).canTransfer,false);
  assert.equal(photoProof({overrides:{images:gallery.map(row=>({...row,transferred:row.product_image_id===342}))}}).canTransfer,false);
});

test('Build 558 server guards and owner UI never infer actual acceptance or repeat uncertain Etsy uploads',()=>{
  const formula=source('functions/api/admin/product-soap-formula-540.js');
  const images=source('functions/api/admin/product-etsy-images.js');
  const workflow=source('public/js/product-editor-etsy-544.mjs');
  const page=source('admin/product-editor/index.html');
  assert.match(formula,/soap_formula_558_owner_accepted/);
  assert.match(formula,/ownerRecipeReadback558/);
  assert.match(formula,/scentNameConflict541\(product.name,selectedScent/);
  assert.match(formula,/await a\.db\.batch\(statements\)/);
  assert.match(images,/SWEET_ORANGE_558\.photoIds\.includes\(imageId\)/);
  assert.match(images,/reconcileEtsyPhotoInventory487\(remote,receipts\)/);
  assert.match(workflow,/reconcile=1/);
  assert.match(workflow,/sweetOrangePhotoState558/);
  assert.match(workflow,/listing_id:state.linked/);
  assert.match(page,/dd558OwnerReceipt/);
  assert.match(page,/dd558PhotoCount/);
  assert.match(page,/Build 558/);
  assert.doesNotMatch(page,/Keep our existing Etsy draft #4603838854/);
  assert.match(source('.github/workflows/production-pages-deploy-current.yml'),/"build":558/);
});
