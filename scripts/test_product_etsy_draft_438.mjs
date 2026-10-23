import test from 'node:test';
import assert from 'node:assert/strict';
import {
  productDraftDetails,productDraftFingerprint,flattenEtsyTaxonomy,safeEtsyDraftInput,etsyDraftForm,
  safeEtsyShopOptions,canadaOnlyShippingProfile
} from '../functions/api/_lib/etsyProductDraft438.mjs';

const product={product_id:54,name:'Bar Soap Sweet Orange',description:'Handmade sweet orange bar soap.',
  short_description:'soap',product_type:'physical',price_cents:1200,currency:'CAD',inventory_quantity:4};
const input={action:'create_draft',product_id:54,taxonomy_id:123,who_made:'i_did',when_made:'2020_2026',
  shipping_profile_id:17,readiness_state_id:27,confirm_canada_only_shipping_profile:true,
  is_supply:false,request_key:'550e8400-e29b-41d4-a716-446655440000',fingerprint:'long_safeguard_receipt',
  confirm_unpublished_draft_only:true,confirm_no_automatic_retry:true};

test('only saved CAD inventory + title + description can be drafted',()=>{
  assert.deepEqual(productDraftDetails(product).blockers,[]);
  assert.ok(productDraftDetails({...product,price_cents:0}).blockers.includes('positive_saved_cad_price_required'));
  assert.ok(productDraftDetails({...product,inventory_quantity:0}).blockers.includes('positive_inventory_required'));
  assert.ok(productDraftDetails({...product,description:'',short_description:''}).blockers.includes('product_description_required_max_15000'));
});
test('owner must explicitly authorize a single unpublished Etsy attempt',()=>{
  assert.ok(safeEtsyDraftInput(input));
  assert.equal(safeEtsyDraftInput({...input,confirm_unpublished_draft_only:false}),null);
  assert.equal(safeEtsyDraftInput({...input,confirm_no_automatic_retry:false}),null);
  assert.equal(safeEtsyDraftInput({...input,confirm_canada_only_shipping_profile:false}),null);
  assert.equal(safeEtsyDraftInput({...input,shipping_profile_id:0}),null);
  assert.equal(safeEtsyDraftInput({...input,readiness_state_id:0}),null);
  assert.equal(safeEtsyDraftInput({...input,taxonomy_id:0}),null);
  assert.equal(safeEtsyDraftInput({...input,who_made:'unknown'}),null);
});
test('physical Etsy draft includes mandatory shipping/processing; excludes activation',()=>{
  const form=etsyDraftForm(input,productDraftDetails(product));
  assert.equal(form.get('price'),'12.00');
  assert.equal(form.get('quantity'),'4');
  assert.equal(form.get('taxonomy_id'),'123');
  assert.equal(form.get('type'),'physical');
  assert.equal(form.get('shipping_profile_id'),'17');
  assert.equal(form.get('readiness_state_id'),'27');
  for(const excluded of ['state','image_ids','is_active','published'])
    assert.equal(form.has(excluded),false,`unexpected provider field ${excluded}`);
});
test('live shop options come only from positive Etsy profile IDs',()=>{
  const result=safeEtsyShopOptions({results:[{shipping_profile_id:17,title:'Canada only'},
    {shipping_profile_id:18,is_deleted:true}]},{results:[{readiness_state_id:27,readiness_state:'ready_to_ship'}]});
  assert.deepEqual(result.shipping,[{id:17,name:'Canada only'}]);
  assert.equal(result.readiness[0].id,27);
});
test('Canada-only shipping refuses US, worldwide, missing and incomplete destinations',()=>{
  const p={shipping_profile_id:17,origin_country_iso:'CA'};
  const only={count:1,results:[{shipping_profile_id:17,destination_country_iso:'CA',destination_region:null}]};
  assert.equal(canadaOnlyShippingProfile(p,only,17).allowed,true);
  assert.equal(canadaOnlyShippingProfile({...p,origin_country_iso:'US'},only,17).allowed,false);
  assert.equal(canadaOnlyShippingProfile(p,{count:2,results:only.results},17).allowed,false);
  assert.equal(canadaOnlyShippingProfile(p,{count:1,results:[{...only.results[0],destination_country_iso:'US'}]},17).allowed,false);
  assert.equal(canadaOnlyShippingProfile(p,{count:1,results:[{...only.results[0],destination_country_iso:null}]},17).allowed,false);
  assert.equal(canadaOnlyShippingProfile(p,{count:1,results:[{...only.results[0],destination_region:'north_america'}]},17).allowed,false);
});
test('taxonomy choices include nested names without trusting arbitrary IDs',()=>{
  const entries=flattenEtsyTaxonomy([{id:10,name:'Bath',children:[{id:11,name:'Soap'}]}]);
  assert.deepEqual(entries,[{id:11,name:'Bath › Soap'}]);
});
test('source Product or shop change invalidates previous Etsy fingerprint',()=>{
  const shop={shop_id:'7'},connection={access_expires_at:'2026-10-22T23:00:00Z'};
  const first=productDraftFingerprint(product,shop,connection);
  assert.notEqual(first,productDraftFingerprint({...product,price_cents:1400},shop,connection));
  assert.notEqual(first,productDraftFingerprint(product,{shop_id:'8'},connection));
});
