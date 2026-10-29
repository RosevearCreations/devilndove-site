import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {evaluateFreshOwnerTrial525,ownerPhotoDecision525} from '../functions/api/_lib/etsyFreshOwnerTrial525.mjs';
import {evaluateQl259CustodyReview525} from './ql259_independent_signer_custody_review_525.mjs';
import {QL256_SOURCE_522} from './ql256_original_signer_preflight_522.mjs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const listingId='4609937766',id=65;
const original=n=>({product_image_id:n,image_url:`https://assets.devilndove.com/products/65/original-${n}.jpg`,
 alt_text:`Handcrafted jewelry photo ${n}`,width_px:1600,height_px:1200,public_use_status:'all_public_ok',approved_for_distribution:true});
const image=n=>({listing_image_id:String(800000+n),listing_id:listingId,url_fullxfull:`https://i.etsystatic.com/source${n}.jpg`});
const receipt=n=>({product_image_id:n,listing_id:listingId,etsy_image_id:String(800000+n),verified_remote_readback:true});
const fixture={productId:id,listingId,claim:{confirmed:true,listing_id:listingId,receipt_id:'claim-001'},
 product:{product_id:id},gallery:[original(11),original(12),original(13)],remoteListing:{listing_id:listingId,state:'draft'},
 remoteImages:[image(11),image(12),image(13)],receipts:[receipt(11),receipt(12),receipt(13)],metadataIssues:[]};
test('Build 525 requires every live Etsy image to uniquely match an accepted original receipt',()=>{
 const proof=evaluateFreshOwnerTrial525(fixture);
 assert.equal(proof.ready_for_owner_visual_review,true);
 assert.equal(proof.owner_visual_acceptance_recorded,false);
 assert.equal(proof.pixel_identity_independently_proven,false);
 assert.deepEqual(proof.photos.map(x=>x.etsy_image_id),['800011','800012','800013']);
 for(const changed of [
  {...fixture,productId:48,product:{product_id:48}},
  {...fixture,claim:{...fixture.claim,confirmed:false}},
  {...fixture,gallery:[original(11),original(12)]},
  {...fixture,remoteImages:[image(11),image(12),image(12)]},
  {...fixture,remoteListing:{listing_id:listingId,state:'active'}},
  {...fixture,receipts:[receipt(11),receipt(12),receipt(12)]},
  {...fixture,receipts:[receipt(11),receipt(12),receipt(13),receipt(13)]},
  {...fixture,gallery:[original(11),{...original(12),approved_for_distribution:false},original(13)]},
  {...fixture,metadataIssues:['Etsy CAD price does not match saved Product.']}
 ])assert.equal(evaluateFreshOwnerTrial525(changed).ready_for_owner_visual_review,false);
});
test('Owner acceptance needs exact unchanged source fingerprint and a distinct check for each pair',()=>{
 const trial=evaluateFreshOwnerTrial525(fixture),pairs=trial.photos.map(x=>({product_image_id:x.product_image_id,etsy_image_id:x.etsy_image_id}));
 const valid={trial,expectedFingerprint:'a'.repeat(64),actualFingerprint:'a'.repeat(64),confirmedPairs:pairs};
 assert.equal(ownerPhotoDecision525(valid).may_record_owner_statement,true);
 assert.equal(ownerPhotoDecision525({...valid,confirmedPairs:pairs.slice(1)}).may_record_owner_statement,false);
 assert.equal(ownerPhotoDecision525({...valid,expectedFingerprint:'b'.repeat(64)}).may_record_owner_statement,false);
 assert.equal(ownerPhotoDecision525({...valid,confirmedPairs:[pairs[0],pairs[0],pairs[2]]}).may_record_owner_statement,false);
 assert.equal(ownerPhotoDecision525({...valid,trial:{...trial,ready_for_owner_visual_review:false}}).may_record_owner_statement,false);
 assert.equal(ownerPhotoDecision525(valid).independently_proven_pixel_identity,false);
});
test('Build 525 actual Etsy + primary D1 GET; local owner audit POST only, no provider write',()=>{
 const endpoint=read('functions/api/admin/product-etsy-owner-trial-525.js');
 assert.match(endpoint,/linkedReceipt506\(db,id,listingId\)/);
 assert.match(endpoint,/readCanonicalDistributionGallery\(sourceDb,id\)/);
 assert.match(endpoint,/verifyExistingDraft486\(c\.env,s,listingId,headers\)/);
 assert.match(endpoint,/readEtsy486\('listings\/'.+\/images'/);
 assert.match(endpoint,/etsy_fresh_owner_trial_525_accepted/);
 assert.match(endpoint,/ownerPhotoDecision525/);
 assert.doesNotMatch(endpoint,/method:\s*['"](?:PATCH|PUT)['"]/);
 assert.doesNotMatch(endpoint,/fetch\(['"]https:\/\/api\.etsy\.com/);
 const html=read('admin/product-editor/index.html'),ui=read('public/js/admin-product-etsy-owner-trial-525.mjs');
 for(const marker of ['dd525Read','dd525PhotoPairs','dd525OwnerStatement','dd525Accept'])assert.ok(html.includes(marker));
 assert.match(html,/admin-product-etsy-owner-trial-525\.mjs\?v=525/);
 assert.match(ui,/confirmed_pairs/);assert.match(ui,/crypto\.randomUUID\(\)/);
 assert.match(ui,/window\.confirm/);
});
test('QL-259 cannot self-upgrade even complete status-only custodian/witness/reviewer claims',()=>{
 const candidate={source:{source_sha_A:QL256_SOURCE_522.sourceShaA,genuine_possession_challenge_valid:true,private_receipt_structure_matches:true},
  privateReview:{custodian_receipt_id:'custodian_010',witness_receipt_id:'witness_021',reviewer_receipt_id:'reviewer_030',
   original_key_store_approved:true,pin_registry_witnessed_out_of_band:true,isolated_nonproduction_tenant_verified:true},
  publicProof:{immutable_http_status:200,path:'docs/integration/ql246-source-proof.json',commit_sha_B:'c'.repeat(40),independent_signature_and_pin_verified:true}};
 const result=evaluateQl259CustodyReview525(candidate);
 assert.equal(result.private_candidate_supplied,true);
 assert.equal(result.signer_custody_accepted,false);
 assert.equal(result.owner_test_decision,'NOT_GIVEN');assert.equal(result.integration,'DISCONNECTED / HOLD');
 assert.equal(evaluateQl259CustodyReview525().private_candidate_supplied,false);
 assert.equal(evaluateQl259CustodyReview525({...candidate,privateReview:{...candidate.privateReview,witness_receipt_id:'custodian_010'}}).private_candidate_supplied,false);
});
