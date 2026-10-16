import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {evidenceFingerprint,localDraftPayload,reconciliation} from '../functions/api/_lib/listingSyncOperator408.mjs';
import {reviewedSourceSignature} from '../functions/api/_lib/productDistribution406.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const f=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const product={product_id:54,name:'Soap',description:'Orange soap',price_cents:900,currency:'CAD',inventory_quantity:2,status:'draft'};
const image={product_image_id:101,image_url:'https://assets.devilndove.com/54.webp',alt_text:'Real soap product image',image_role:'hero_front',public_use_status:'all_public_ok',width_px:1200,height_px:1200};
const source={channel:'etsy',product,images:[image],selectedIds:[101],preference:{admin_action_audit_id:1},policyReceipt:{admin_action_audit_id:2}};
const fingerprint=evidenceFingerprint(source);
test('fingerprint covers canonical Product, gallery facts, source owner receipts and destination',()=>{
 assert.equal(fingerprint,evidenceFingerprint(source));
 for(const alteration of [{product:{...product,price_cents:1000}},
 {images:[{...image,image_url:'https://assets.devilndove.com/changed.webp'}]},
 {images:[{...image,public_use_status:'consent_needed'}]},
 {preference:{admin_action_audit_id:3}},{policyReceipt:{admin_action_audit_id:4}},{channel:'facebook'}]){
 assert.notEqual(fingerprint,evidenceFingerprint({...source,...alteration}));
 }
});
test('local draft payload reuses Product identity and canonical approved images, but cannot publish',()=>{
 const p=localDraftPayload(source);
 assert.equal(p.source_product_id,54);assert.equal(p.canonical_images[0].product_image_id,101);
 assert.equal(p.currency,'CAD');assert.equal(p.shipping_policy,'US_SHIPPING_DISABLED');
 assert.equal(p.provider_updated,false);assert.equal(p.publication_performed,false);assert.equal(p.provider_listing_id,null);
 assert.throws(()=>localDraftPayload({...source,selectedIds:[999]}),/canonical_image_missing/);
});
test('reconciliation is fail closed and never pretends remote provider acceptance',()=>{
 const acceptance={admin_action_audit_id:11,details_json:JSON.stringify({fingerprint})};
 const preparation={admin_action_audit_id:12,details_json:JSON.stringify({fingerprint,owner_acceptance_receipt:11,review_receipt:2})};
 const good=reconciliation({currentFingerprint:fingerprint,acceptance,preparation,latestReviewReceipt:2});
 assert.equal(good.status,'LOCAL_PREPARATION_MATCHED');assert.equal(good.provider_reconciled,false);
 assert.equal(reconciliation({currentFingerprint:'different',acceptance,preparation,latestReviewReceipt:2}).status,'HOLD_REPREPARE');
 assert.equal(reconciliation({currentFingerprint:fingerprint,acceptance,preparation:null,latestReviewReceipt:2}).status,'HOLD_REPREPARE');
 assert.equal(reconciliation({currentFingerprint:fingerprint,acceptance,preparation,latestReviewReceipt:3}).status,'HOLD_REPREPARE');
});
test('restricted Storefront admin route and zero provider writes or arbitrary external image sources',()=>{
 assert.equal(moduleKeyForPath('/api/admin/listing-sync-408'),MODULE_KEYS.STOREFRONT);
 const s=f('functions/api/admin/listing-sync-408.js');
 assert.match(s,/verifiedAdminFromModule/);assert.match(s,/admin_action_audit/);
 assert.match(s,/listingSyncReadiness/);assert.match(s,/connectionBlockers/);
 assert.match(s,/expected_fingerprint/);assert.match(s,/expected_acceptance_receipt/);
 assert.doesNotMatch(s,/\bfetch\s*\(|api\.etsy\.com|graph\.facebook\.com|marketplace_syndication_drafts|UPDATE products|INSERT INTO products/);
 const js=f('public/js/admin-listing-sync-v408.js');
 assert.match(js,/addEventListener\('click'/);assert.doesNotMatch(js,/setInterval|setTimeout/);
 const html=f('admin/product-editor/index.html');
 assert.match(html,/id="listingSync408"/);
 assert.match(html,/admin-listing-sync-v408\.js/);
});
test('Build 407 source signature remains compatible with the 408 owner acceptance gate',()=>{
 assert.match(f('functions/api/admin/listing-sync-408.js'),/reviewedSourceSignature\(s\.product,s\.selectedIds\.map\(Number\)\)/);
 assert.equal(typeof reviewedSourceSignature(product,[101]),'string');
});
