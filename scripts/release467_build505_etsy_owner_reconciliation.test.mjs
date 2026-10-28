import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reassignmentReview505,ownerPhotoMatches505,validEtsyId505,validOwnerKey505} from '../functions/api/_lib/etsyOwnerReconciliation505.mjs';
import {onRequestPost,onRequestGet} from '../functions/api/admin/product-etsy-owner-reconcile-505.js';
import {assessOwnerApproval504} from '../functions/api/_lib/etsyOwnerApproval504.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const listing={listing_id:'4603838854',state:'draft',title:'Adventurine Argon',taxonomy_id:123,
  description:'An original hand-finished piece made in our workshop.',price:{amount:1000,divisor:100,currency_code:'CAD'},quantity:10};
const product={name:'Adventurine Argon',description:listing.description,price_cents:1000,currency:'CAD',inventory_quantity:10};

test('local claim resolution only offered with matching target, unambiguous other Product and no prior writes',()=>{
  const input={target:product,claimant:{name:'Other product'},listing,priorClaims:0,otherClaims:0};
  assert.equal(reassignmentReview505(input).safe_to_offer,true);
  assert.match(reassignmentReview505({...input,claimant:{name:'Adventurine Argon'}}).issues.join(' '),/ambiguous/);
  assert.match(reassignmentReview505({...input,listing:{...listing,title:'Different item'}}).issues.join(' '),/does not match/);
  assert.match(reassignmentReview505({...input,priorClaims:1}).issues.join(' '),/attempted Etsy writes/);
  assert.match(reassignmentReview505({...input,otherClaims:1}).issues.join(' '),/More than one/);
  assert.equal(validEtsyId505('4603838854'),true);
  assert.equal(validEtsyId505('0'),false);
  assert.equal(validOwnerKey505('b2693a11-2222-4333-8444-aabbccddeeff'),true);
});

test('existing-photo owner match requires a live Etsy photo, canonical Product original and unique identity on both sides',()=>{
  const input={gallery:[344,345,346].map(product_image_id=>({product_image_id})),remoteImages:[901,902,903].map(listing_image_id=>({listing_image_id})),
    receipts:[],listingId:'4603838854',productImageId:344,etsyImageId:901};
  assert.equal(ownerPhotoMatches505(input).ready,true);
  assert.match(ownerPhotoMatches505({...input,productImageId:999}).issues.join(' '),/approved canonical gallery/);
  assert.match(ownerPhotoMatches505({...input,etsyImageId:999}).issues.join(' '),/not on the verified/);
  assert.match(ownerPhotoMatches505({...input,receipts:[{...input,product_image_id:344,etsy_image_id:'901',listing_id:input.listingId}]}).issues.join(' '),/already has a saved/);
  assert.match(ownerPhotoMatches505({...input,receipts:[{product_image_id:345,etsy_image_id:'901',listing_id:input.listingId}]}).issues.join(' '),/Etsy photo #901 already/);
});

test('owner-matched existing photos count toward final content approval only when still present on live Etsy readback',()=>{
  const gallery=[344,345,346].map(product_image_id=>({product_image_id}));
  const receipts=gallery.map((row,i)=>({product_image_id:row.product_image_id,listing_id:'4603838854',etsy_image_id:String(901+i),verified_remote_readback:true,owner_witnessed_existing_photo:true}));
  const base={product,listing,gallery,accepted:receipts,remoteImages:[901,902,903].map(listing_image_id=>({listing_image_id})),tagsReady:true};
  assert.equal(assessOwnerApproval504(base).ready,true);
  assert.equal(assessOwnerApproval504({...base,remoteImages:base.remoteImages.slice(0,2)}).ready,false);
});

test('reconciliation endpoint rejects unverified, cross-origin or incomplete owner requests before touching D1/Etsy',async()=>{
  const guest=await onRequestGet({request:new Request('https://devilndove.com/api/admin/product-etsy-owner-reconcile-505?mode=photos&product_id=53&listing_id=4603838854'),env:{}});
  assert.equal(guest.status,401);
  const actor={role:'admin',is_active:1,user_id:1,email:'owner@example.test'};
  const ctx={request:new Request('https://devilndove.com/api/admin/product-etsy-owner-reconcile-505',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:JSON.stringify({action:'resolve_local_claim'})}),env:{DB:{prepare(){throw Error('unauthorized DB read');}}},data:{ddModuleAccess:{allowed:true,user:actor}}};
  const blocked=await onRequestPost(ctx);assert.equal(blocked.status,403);
  const incomplete=await onRequestPost({...ctx,request:new Request(ctx.request.url,{method:'POST',headers:{Origin:'https://devilndove.com','Content-Type':'application/json'},body:JSON.stringify({action:'match_existing_photo',product_id:53,listing_id:'4603838854'})})});
  assert.equal(incomplete.status,400);
});

test('server links and owner photo receipts are locally guarded, read-only to Etsy and fail closed',()=>{
  const api=read('functions/api/admin/product-etsy-owner-reconcile-505.js');
  const links=read('functions/api/admin/product-etsy-existing-draft.js');
  const signoff=read('functions/api/admin/product-etsy-owner-signoff-504.js');
  const image=read('functions/api/admin/product-etsy-images.js');
  assert.match(api,/confirm_claimant_reviewed!==true/);
  assert.match(api,/confirm_correct_product!==true/);
  assert.match(api,/NOT EXISTS \(SELECT 1 FROM marketplace_syndication_drafts/);
  assert.match(api,/etsy_505_owner_local_claim_reassigned/);
  assert.match(api,/etsy_505_owner_existing_image_matched/);
  assert.match(api,/confirm_exact_photo_match!==true/);
  assert.match(api,/verifyExistingDraft486/);
  assert.match(api,/ownerPhotoMatches505/);
  assert.doesNotMatch(api,/method:\s*['"](?:PATCH|POST|DELETE)['"].*etsy\.com|DELETE FROM marketplace_syndication_drafts/);
  assert.match(links,/export async function claimedListing505/);
  for(const s of [signoff,image])assert.match(s,/etsy_505_owner_existing_image_matched/);
});

test('editor offers owner-witnessed correction and side-by-side original-photo comparisons with clear holds',()=>{
  const ui=read('public/js/admin-product-etsy-package-v500.mjs'),html=read('admin/product-editor/index.html'),css=read('admin/product-editor/etsy-package-500.css');
  for(const id of ['dd505InspectClaim','dd505ResolveClaim','dd505ReviewedOther','dd505CorrectTarget','dd505Original','dd505Remote','dd505WitnessPhoto','dd505MatchPhoto'])
    assert.match(html,new RegExp('id="'+id+'"'),id);
  assert.match(ui,/inspectLocalClaim505/);
  assert.match(ui,/resolveLocalClaim505/);
  assert.match(ui,/matchExistingPhoto505/);
  assert.match(ui,/unresolved_upload_attempts/);
  assert.match(css,/dd505-photo-pair/);
  assert.match(html,/etsy-package-500\.css\?v=5\d\d/);
  assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=5\d\d/);
});
