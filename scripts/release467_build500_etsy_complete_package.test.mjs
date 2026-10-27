import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessEtsyPackage500,verifiedEtsyPackage500} from '../public/js/etsy-package-500.mjs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const gallery=[344,345,346].map(product_image_id=>({product_image_id,approved_for_distribution:true,image_url:`https://example.test/${product_image_id}.jpg`}));
const images=gallery.map(({product_image_id})=>({product_image_id,transferable:true,transferred:false,hold:false}));
const tags={ready:true,local_tags:['Silver Rings'],unresolved_attempt:false};

test('Build 500 treats all three authorized #53 originals as one complete package',()=>{
 const state=assessEtsyPackage500({gallery},{images,hold_unconfirmed_claims:0},tags);
 assert.equal(state.ready,true);assert.equal(state.count,3);assert.deepEqual(state.pending,[344,345,346]);
 assert.equal(state.transferred,0);
});

test('Build 500 holds the whole package for even one unapproved, missing, duplicate or uncertain image',()=>{
 const unapproved=gallery.map((x,i)=>i===1?{...x,approved_for_distribution:false,hold_reasons:['no public-use consent']}:x);
 assert.equal(assessEtsyPackage500({gallery:unapproved},{images},tags).ready,false);
 assert.equal(assessEtsyPackage500({gallery},{images:images.slice(0,2)},tags).ready,false);
 assert.equal(assessEtsyPackage500({gallery:[...gallery,gallery[0]]},{images},tags).ready,false);
 assert.equal(assessEtsyPackage500({gallery},{images,hold_unconfirmed_claims:1},tags).ready,false);
 assert.equal(assessEtsyPackage500({gallery},{images}, {...tags,unresolved_attempt:true}).ready,false);
 assert.equal(assessEtsyPackage500({gallery:[]},{images:[]},tags).ready,false);
});

test('Build 500 requires verified exact listing ID, native tags, photos and saved local Product',()=>{
 const link={product_id:53,linked_listing_id:'4603838854'};
 const photos={listing_id:'4603838854',remote_reconciliation:{ready:true},photo_gap_492:{state:'matched'},transferred:3,pending:0};
 const checked={listing_id:'4603838854',matching_tags:true,verified_draft:true,verified_canada_only:true,unresolved_attempt:false};
 assert.equal(verifiedEtsyPackage500(53,link,photos,checked,3),true);
 assert.equal(verifiedEtsyPackage500(54,link,photos,checked,3),false);
 assert.equal(verifiedEtsyPackage500(53,link,{...photos,pending:1},checked,3),false);
 assert.equal(verifiedEtsyPackage500(53,link,photos,{...checked,listing_id:'999'},3),false);
 assert.equal(verifiedEtsyPackage500(53,link,photos,{...checked,verified_canada_only:false},3),false);
});

test('Build 500 UI is one Create/Update action with separate existing ID verification and hidden advanced troubleshooting',()=>{
 const editor=source('admin/product-editor/index.html'),ui=source('public/js/admin-product-etsy-package-v500.mjs');
 for(const name of ['dd500Package','dd500Identity','dd500ListingId','dd500LinkButton','dd500NewSettings',
  'dd500Consent','dd500Send','dd500Checklist','dd500Legacy'])assert.ok(editor.includes(name),name);
 assert.match(editor,/<details id="dd500Legacy"/);
 assert.match(editor,/admin-product-etsy-package-v500\.mjs\?v=50[013]/);
 assert.match(ui,/send\.textContent=hasCandidate\?`Step 1: Verify and link existing Etsy draft/);
 assert.match(ui,/linked\?`Step 2: Update Etsy draft/);
 assert.match(ui,/created\.listing_id/);assert.match(ui,/linked\.linked_listing_id/);
 assert.match(ui,/product-etsy-unified-approval/);
 assert.match(ui,/for\(const imageId of state\.assessment\.pending\)/);
 assert.match(ui,/confirm_approved_media:true/);assert.match(ui,/confirm_canada_only:true/);
 assert.match(ui,/remote_reconciliation\?\.ready!==true/);
 assert.match(ui,/ready_for_separate_owner_approval/);
 assert.match(ui,/verifiedEtsyPackage500/);assert.match(ui,/dd497ChannelRemote/);
 assert.doesNotMatch(ui,/state:'active'|publishListing|method:'DELETE'/);
});
