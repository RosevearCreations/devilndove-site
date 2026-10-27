import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {preparedEtsyTags497,tagsMatch497} from '../functions/api/_lib/etsyNativeTags497.mjs';
import {confirmedEtsyImageReadback497} from '../functions/api/_lib/productEtsyImages443.mjs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('Build 497 maps Product SEO comma-separated phrases to valid native Etsy tags',()=>{
 const input=preparedEtsyTags497('Aventurine ring, Green gemstone, Made in Canada');
 assert.equal(input.ready,true);assert.deepEqual(input.tags,['Aventurine ring','Green gemstone','Made in Canada']);
 assert.equal(tagsMatch497(input.tags,['made in canada','aventurine ring','green gemstone']),true);
 assert.equal(tagsMatch497(input.tags,['made in canada','aventurine ring']),false);
 assert.equal(preparedEtsyTags497('').ready,false);
 assert.equal(preparedEtsyTags497('a,a').ready,false);
 assert.equal(preparedEtsyTags497('a, A').ready,false);
 assert.equal(preparedEtsyTags497('very very very very long').ready,false);
 assert.equal(preparedEtsyTags497('green/gemstone').ready,false);
 assert.equal(preparedEtsyTags497(Array.from({length:14},(_,i)=>'Tag'+i).join(',')).ready,false);
 assert.equal(preparedEtsyTags497('Création, gold™').ready,true);
});

test('Build 497 rejects absent, wrong-draft and malformed provider photo readbacks',()=>{
 const rows={results:[{listing_image_id:889,listing_id:4603838854}]};
 assert.equal(confirmedEtsyImageReadback497(rows,4603838854,889),true);
 assert.equal(confirmedEtsyImageReadback497(rows,4603838854,999),false);
 assert.equal(confirmedEtsyImageReadback497(rows,999999999,889),false);
 assert.equal(confirmedEtsyImageReadback497({results:null},4603838854,889),false);
});

test('Build 497 holds remote Etsy writes behind owner consent, receipt claim and readback',()=>{
 const tags=read('functions/api/admin/product-etsy-tags.js');
 const existing=read('functions/api/admin/product-etsy-existing-draft.js');
 const photos=read('functions/api/admin/product-etsy-images.js');
 for(const fragment of ['verifiedAdminFromModule','Same-origin request required','confirm_replace_existing_tags',
  'confirm_unpublished_only','confirm_canada_only','confirm_saved_product_tags','request_key','reviewed_tags',
  'etsy_native_tags_497_claimed','etsy_native_tags_497_confirmed','method:\'PATCH\'',
  'verified_remote_tags','readEtsy486','tagsMatch497','product_seo'])assert.ok(tags.includes(fragment),fragment);
 assert.match(tags,/Number\(local\.claims\?\.claimed\)!==Number\(local\.claims\?\.confirmed\)/);
 assert.match(existing,/verifyExistingDraft486/);
 assert.match(photos,/confirmedEtsyImageReadback497/);
 assert.match(photos,/verified_remote_readback:true/);
 assert.match(photos,/receipt_listing_identity_changed/);
 assert.match(photos,/Only a verified, unpublished Canada-only/);
 assert.doesNotMatch(tags,/publishListing|method:'DELETE'|automatic_retry:true/);
});

test('Build 497 offers accessible in-editor native tag and three-channel owner workflow',()=>{
 const page=read('admin/product-editor/index.html');
 const card=read('public/js/admin-product-channel-cards-v497.js');
 const ui=read('public/js/admin-product-etsy-tags-v497.js');
 for(const name of ['dd497NativeTags','dd497TagsConsent','dd497TagsSend',
  'dd497ChannelCards','dd497ChannelRemote','admin-product-etsy-tags-v497.js',
  'admin-product-channel-cards-v497.js'])assert.ok(page.includes(name),name);
 for(const name of ['product-distribution-406','product-etsy-existing-draft','product-etsy-images',
  'product-etsy-tags','facebook','etsy','photo_gap_492','matching_tags','verified_canada_only'])
  assert.ok(card.includes(name),name);
 assert.match(ui,/confirm_replace_existing_tags:true/);
 assert.match(ui,/dd:etsy-native-tags-verified/);
 assert.match(ui,/dd:save-succeeded/);
 assert.doesNotMatch(card,/method:'POST'|action:'transfer_one'|publishListing/);
});
