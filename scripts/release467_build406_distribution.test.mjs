import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewEvidence,allowedImage,channelOn,reviewedSourceSignature,imageSelectionValid} from '../functions/api/_lib/productDistribution406.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const f=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const product={product_id:54,name:'Bar Soap Sweet Orange',description:'Real hand crafted soap',price_cents:900,currency:'CAD',inventory_quantity:3,status:'draft'};
const image={product_image_id:101,image_url:'https://assets.devilndove.com/products/soap-54.webp',alt_text:'Sweet orange hand soap on wooden table',public_use_status:'all_public_ok',width_px:1600,height_px:1600,image_role:'hero_front'};
const intent={details_json:'{"etsy":true,"facebook":false}'};
const att={channel:'etsy',product_id:54,image_ids:[101],owner_verified_destinations:true,us_shipping_disabled:true,source_signature:reviewedSourceSignature(product,[101])};
const get=(args={})=>reviewEvidence({channel:'etsy',product,images:[image],selectedIds:[101],preference:intent,policyReceipt:{details_json:JSON.stringify(att)},...args});
test('One Product and approved canonical image, matching consent gives only local review readiness',()=>{
 const r=get();assert.deepEqual(r.blockers,[]);assert.equal(r.ready_for_local_export,true);
 assert.equal(r.publication_allowed,false);assert.equal(r.external_execution_allowed,false);
 assert.equal(r.source_product_id,54);assert.equal(r.source_images[0].product_image_id,101);
});
test('OFF by default for unconfigured destination, and independent Etsy/Facebook switches',()=>{
 assert.equal(channelOn(null,'etsy'),false);assert.equal(channelOn(intent,'etsy'),true);
 assert.equal(channelOn(intent,'facebook'),false);
 assert.ok(get({channel:'facebook'}).blockers.includes('channel_switch_off'));
});
test('No placeholder, unknown-image, poor-quality, alt/consent, stale Product or US shipping exposure',()=>{
 assert.equal(allowedImage({...image,image_url:'https://assets.devilndove.com/placeholder.svg'}),false);
 assert.equal(allowedImage({...image,width_px:700}),false);
 assert.equal(allowedImage({...image,public_use_status:'consent_needed'}),false);
 assert.equal(allowedImage({...image,alt_text:''}),false);
 assert.ok(get({selectedIds:[102]}).blockers.includes('image_not_owned_by_product'));
 assert.ok(get({policyReceipt:null}).blockers.includes('owner_us_shipping_review_required'));
 assert.ok(get({product:{...product,price_cents:1000}}).blockers.includes('source_or_media_changed_reapprove'));
 assert.ok(get({selectedIds:[101,101]}).blockers.includes('invalid_canonical_image_selection'));
 assert.ok(get({preference:null}).blockers.includes('channel_switch_off'));
 assert.equal(imageSelectionValid([101]),true);assert.equal(imageSelectionValid([101,101]),false);
});
test('Protected canonical mapping route, transactional source-gallery audit and no provider writes',()=>{
 const api=f('functions/api/admin/product-distribution-406.js');
 assert.equal(moduleKeyForPath('/api/admin/product-distribution-406'),MODULE_KEYS.STOREFRONT);
 assert.match(api,/verifiedAdminFromModule/);assert.match(api,/db\.batch/);
 assert.match(api,/product_images WHERE product_id=\?/);
 assert.match(api,/product_distribution_policy_406/);
 assert.match(api,/selected_product_image_ids_json/);
 assert.doesNotMatch(api,/api\.etsy\.com|graph\.facebook|method:'PUT'|method:'PATCH'|fetch\(/);
 const ui=f('public/js/admin-product-distribution-v406.js');
 assert.match(ui,/addEventListener\('click'/);assert.doesNotMatch(ui,/setInterval|setTimeout/);
});
