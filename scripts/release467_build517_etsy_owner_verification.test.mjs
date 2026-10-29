import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessEtsyOwnerVerification517} from '../public/js/etsy-owner-verification-517.mjs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ids=[344,345,346],listingId='4603838854';
const good=()=>({
  productId:53,listingId,
  inventory:{listing_id:listingId,provider_contacted:true,hold_unconfirmed_claims:0,pending:0,transferred:3,
    images:ids.map(product_image_id=>({product_image_id,transferred:true,transferable:true})),
    remote_reconciliation:{ready:true,remote_count:3,tracked_count:3,untracked_count:0,missing_count:0},
    photo_gap_492:{state:'matched'}},
  owner:{listing_id:listingId,verified_unpublished:true,verified_canada_only:true,ready:true,issues:[],
    confirmed_photo_ids:[...ids],photo_freshness_509:{ready:true},
    verified_media_pairs_508:ids.map((product_image_id,i)=>({product_image_id,etsy_image_id:String(900+i)}))},
  trial:{listing_id:listingId,local_link_confirmed:true,local_receipt_id:'primary-claim-53',
    ready_for_owner_signoff:true,remote_readback_confirmed:true,original_image_ids:[...ids],
    photo_receipts_confirmed:3,issues:[]}
});

test('Build 517 accepts only complete three-photo, same-primary, live-Etsy draft evidence',()=>{
  const result=assessEtsyOwnerVerification517(good());
  assert.equal(result.ready,true);
  assert.equal(result.photosReady,true);
  assert.equal(result.contentReady,true);
  assert.equal(result.verifiedOriginals,3);
  assert.equal(result.listingId,listingId);
  assert.match(result.next,/Inspect the actual Etsy draft yourself/);
});

test('missing, duplicate, untracked and unresolved original-photo receipts all HOLD',()=>{
  for(const mutate of [
    v=>{v.inventory.images.pop();},
    v=>{v.owner.verified_media_pairs_508[2].etsy_image_id='901';},
    v=>{v.owner.confirmed_photo_ids.pop();},
    v=>{v.inventory.remote_reconciliation.untracked_count=1;v.inventory.remote_reconciliation.ready=false;},
    v=>{v.inventory.hold_unconfirmed_claims=1;},
    v=>{v.inventory.pending=1;v.inventory.transferred=2;},
    v=>{v.owner.photo_freshness_509.ready=false;},
    v=>{v.trial.photo_receipts_confirmed=2;}
  ]){
    const v=good();mutate(v);
    const verdict=assessEtsyOwnerVerification517(v);
    assert.equal(verdict.ready,false,JSON.stringify(v));
    assert.equal(verdict.photosReady,false,JSON.stringify(v));
  }
});

test('incorrect listing or Product identity never produces owner approval readiness',()=>{
  for(const mutate of [
    v=>{v.listingId='4603838855';},
    v=>{v.productId=54;},
    v=>{v.inventory.listing_id='4603838855';},
    v=>{v.owner.listing_id='4603838855';},
    v=>{v.trial.local_link_confirmed=false;v.trial.local_receipt_id=null;}
  ]){const v=good();mutate(v);assert.equal(assessEtsyOwnerVerification517(v).ready,false);}
});

test('bad description, tags or Canada-only draft status remains a content HOLD even with 3/3 photos',()=>{
  for(const mutate of [
    v=>{v.trial.ready_for_owner_signoff=false;v.trial.issues=['Description is only the item name.'];},
    v=>{v.owner.ready=false;v.owner.issues=['Etsy tags do not match saved Product.'];},
    v=>{v.owner.verified_canada_only=false;},
    v=>{v.owner.verified_unpublished=false;},
    v=>{v.trial.remote_readback_confirmed=false;}
  ]){const v=good();mutate(v);const r=assessEtsyOwnerVerification517(v);
    assert.equal(r.ready,false);assert.equal(r.contentReady,false);}
});

test('owner-facing retest uses three GET-only reads and explicit local owner decision, never publishes',()=>{
  const html=read('admin/product-editor/index.html');
  const ui=read('public/js/admin-product-etsy-package-v500.mjs');
  const css=read('admin/product-editor/etsy-simple-515.css');
  for(const name of ['dd517OwnerCheck','dd517Verify','dd517PhotoResult','dd517ContentResult','dd517Status',
    'dd517OwnerConfirm','dd517Approve','dd517ApprovalStatus'])assert.match(html,new RegExp(`id="${name}"`));
  assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=51[7-9]/);
  assert.match(html,/etsy-simple-515\.css\?v=51[7-9]/);
  assert.match(css,/\.dd517-owner-check\[hidden\]/);
  const check=ui.match(/async function verifyOwner517\(\)\{([\s\S]*?)\n  \}\n  async function approveOwner517/);
  assert.ok(check,'Visible owner verifier must exist');
  for(const endpoint of ['product-etsy-images?product_id=','product-etsy-owner-signoff-504?product_id=',
    'product-etsy-owner-trial-507?product_id='])assert.ok(check[1].includes(endpoint),endpoint);
  assert.doesNotMatch(check[1],/api\([^,]+,\s*\{\s*action:/);
  assert.match(ui,/action:'approve_verified_draft'/);
  assert.match(ui,/state\.live517\?\.ready/);
  assert.match(ui,/dd517OwnerConfirm'\)\.checked/);
  assert.match(ui,/clearOwnerVerification517\('HOLD — A draft update has started/);
  assert.doesNotMatch(ui,/publishListing\(|activateListing\(/);
});
