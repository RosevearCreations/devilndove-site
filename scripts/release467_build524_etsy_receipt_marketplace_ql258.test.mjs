import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {verifySavedEtsyReceipt524,prepareMarketplaceHandoff524} from '../public/js/product-destination-receipts-524.mjs';
import {evaluateQl258CustodyDecision524} from './ql258_independent_custody_decision_524.mjs';
import {QL256_SOURCE_522} from './ql256_original_signer_preflight_522.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const saved={product_id:65,product_name:'Silver earrings',product_sku:'DND-01070',product_slug:'silver-earrings-1070',
 linked_listing_id:'4609937766',receipt_id:'primary-claim-001',saved_link_readback_confirmed:true};
const photo=n=>({product_image_id:n,image_url:`https://devilndove.com/media/original-${n}.webp`,
 alt_text:`Handmade silver earrings photograph ${n}`,width_px:1600,height_px:1200,
 public_use_status:'all_public_ok',approved_for_distribution:true});
test('actual saved Etsy ID requires Product identity, unique primary D1 receipt and same returned listing',()=>{
 const match=verifySavedEtsyReceipt524({productId:65,expectedListingId:'4609937766',readback:saved});
 assert.equal(match.verified,true);assert.equal(match.receipt_id,'primary-claim-001');
 for(const row of [{...saved,product_id:66},{...saved,linked_listing_id:'true'},
  {...saved,receipt_id:''},{...saved,saved_link_readback_confirmed:false}])
  assert.equal(verifySavedEtsyReceipt524({productId:65,expectedListingId:'4609937766',readback:row}).verified,false);
 assert.equal(verifySavedEtsyReceipt524({productId:65,expectedListingId:'1111111',readback:saved}).verified,false);
 assert.equal(verifySavedEtsyReceipt524({productId:65,readback:{...saved,linked_listing_id:null,receipt_id:null}}).unlinked,true);
});
test('Marketplace handoff uses all approved canonical originals without posting to Meta',()=>{
 const args={productId:65,product:{name:'Silver earrings',description:'Handmade silver earrings with genuine stones',
  price:'42.00',quantity:'2',weight_grams:'48'},images:[photo(401),photo(402),photo(403)],authorityReady:true,dirty:false,channelSelected:true};
 const ready=prepareMarketplaceHandoff524(args);assert.equal(ready.ready,true);
 assert.deepEqual(ready.photos.map(x=>x.id),[401,402,403]);
 assert.equal(prepareMarketplaceHandoff524({...args,images:[photo(401),{...photo(402),alt_text:''}]}).ready,false);
 const page=read('admin/product-editor/index.html'),flow=read('public/js/admin-product-destination-flow-523.mjs');
 for(const token of ['dd524ReadReceipt','dd524ReceiptStatus','dd524MarketplacePhotos'])assert.ok(page.includes(token),token);
 assert.ok(/admin-product-destination-flow-523\.mjs\?v=(524|526|527)/.test(page));
 assert.match(flow,/verifySavedEtsyReceipt524/);assert.match(flow,/await readReceipt524\(\{expectedListingId:String\(response\.linked_listing_id\)\}\)/);
 assert.match(flow,/prepareMarketplaceHandoff524/);assert.match(flow,/LEGACY_OWNER_TRIAL_IDS_523\.includes\(id\)/);
 assert.doesNotMatch(flow,/fetch\([^\n]*facebook\.com\/graph/);
});
test('QL-258 status-only source reports cannot fake independent human custody or owner TEST authorization',()=>{
 const ownerStatus={custodian:'ASSIGNED_AND_INDEPENDENTLY_AUTHENTICATED',witness:'ASSIGNED_AND_INDEPENDENTLY_AUTHENTICATED',
  reviewer:'ASSIGNED_AND_INDEPENDENTLY_AUTHENTICATED',private_store:'APPROVED',public_pin:'VERIFIED_OUT_OF_BAND',tenant_isolation:'VERIFIED'};
 const ql257Result={source_sha_A:QL256_SOURCE_522.sourceShaA,genuine_possession_challenge_valid:true,private_receipt_structure_matches:true};
 const candidate=evaluateQl258CustodyDecision524({ownerStatus,ql257Result});
 assert.equal(candidate.candidate_private_evidence_complete,true);assert.equal(candidate.independent_custody_accepted,false);
 assert.equal(candidate.owner_test_decision,'NOT_GIVEN');assert.equal(candidate.integration,'DISCONNECTED / HOLD');
 const absent=evaluateQl258CustodyDecision524();assert.equal(absent.candidate_private_evidence_complete,false);
 assert.match(absent.next_specific_blocker,/source A/);
});
