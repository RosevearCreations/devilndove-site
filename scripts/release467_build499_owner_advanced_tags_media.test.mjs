import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHANNELS499,phraseList499,parseOverride499,effectiveEtsyTags499} from '../functions/api/_lib/channelTagOverrides499.mjs';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Build 499 keeps an exact owner-photographed Etsy ID while requiring remote verification before linking',()=>{
 const endpoint=source('functions/api/admin/product-etsy-existing-draft.js');
 const editor=source('admin/product-editor/index.html');
 const ui=source('public/js/admin-product-owner-sync-v499.mjs');
 assert.match(endpoint,/external_reference IS NOT NULL AND \(product_id=\? OR external_reference=\?\)/);
 assert.match(endpoint,/verify\(c\.env,s,listingId,headers\)/);
 assert.match(endpoint,/confirm_prior_title_difference/);
 assert.match(ui,/input\.value='4603838854'/);
 assert.match(ui,/dispatchEvent\(new Event\('input'/);
 assert.match(ui,/Nothing linked or uploaded/);
 for(const id of ['dd499ExistingDraftHint','dd499UsePhotoDraftId','dd499DirectEtsyDraft'])assert.ok(editor.includes(id));
 assert.match(editor,/etsy\.com\/your\/shops\/me\/listing-editor\/edit\/4603838854#media/);
});

test('Build 499 preserves seven independent channel overrides with shared SEO as the default',()=>{
 assert.deepEqual(CHANNELS499,['etsy','facebook','google','instagram','tiktok','pinterest','youtube']);
 assert.deepEqual(phraseList499('Silver Rings, artisan silver'),['Silver Rings','artisan silver']);
 assert.throws(()=>phraseList499('Silver Rings, silver rings'),/Duplicate tag/);
 assert.throws(()=>phraseList499(Array.from({length:31},(_,i)=>`tag${i}`)),/30/);
 assert.deepEqual(parseOverride499({details_json:'{"channel":"etsy","mode":"override","tags":["Silver Rings"]}'},'etsy'),{mode:'override',tags:['Silver Rings'],changed_at:null});
 const shared=effectiveEtsyTags499('Green bar soap',{mode:'shared',tags:[]});
 assert.equal(shared.source,'shared_product_seo');assert.deepEqual(shared.tags,['Green bar soap']);
 const override=effectiveEtsyTags499('Green bar soap',{mode:'override',tags:['Canadian soap','Handcrafted soap']});
 assert.equal(override.source,'etsy_override');assert.equal(override.ready,true);
 assert.deepEqual(override.tags,['Canadian soap','Handcrafted soap']);
 assert.equal(effectiveEtsyTags499('anything',{mode:'override',tags:['Tag longer than twenty characters']}).ready,false);
});

test('Build 499 writes only explicit local override audits; native Etsy tags honor saved Etsy overrides',()=>{
 const endpoint=source('functions/api/admin/product-channel-tags-499.js');
 const native=source('functions/api/admin/product-etsy-tags.js');
 const advanced=source('public/js/admin-product-channel-advanced-v498.mjs');
 for(const token of ['verifiedAdminFromModule','Same-origin request required','product_channel_tags_499_changed',
  'confirm_local_tags_only','readOverride499','INSERT INTO admin_action_audit','saved_locally:true'])assert.ok(endpoint.includes(token),token);
 assert.doesNotMatch(endpoint,/fetch\(|https:\/\/api\.etsy\.com|publishListing/);
 assert.match(native,/effectiveEtsyTags499\(record\?\.keywords,override\)/);
 assert.match(native,/tag_source/);
 assert.match(advanced,/overrideData\.overrides\?\.\[channel\]/);
 assert.match(advanced,/selectedTags/);
 assert.match(advanced,/dd:etsy-advanced-profile-saved/);
});

test('Build 499 advanced draft patch is narrowly scoped to a verified unpublished Canada-only listing and never blindly retries',()=>{
 const endpoint=source('functions/api/admin/product-etsy-advanced-sync.js');
 for(const token of ['verifiedAdminFromModule','Same-origin required','verifyExistingDraft486',
  'effectiveEtsyTags499','review_fingerprint','confirm_reviewed_changes','confirm_unpublished_only',
  'confirm_canada_only','confirm_no_photo_or_shipping_change','etsy_advanced_499_claimed',
  'etsy_advanced_499_confirmed',"method:'PATCH'",'verified_advanced_metadata:true',
  'previousUncertain','crypto.subtle.digest','no automatic retry'])assert.ok(endpoint.includes(token),token);
 assert.doesNotMatch(endpoint,/\bpublishListing\b|\buploadListingImage\b|method:'DELETE'/);
 assert.match(endpoint,/publication_performed:false/);
 assert.match(endpoint,/images_modified:false/);
 assert.match(endpoint,/shipping_modified:false/);
 assert.match(endpoint,/checked=await verifyExistingDraft486/);
 assert.match(endpoint,/remote\.is_supply/);
});

test('Build 499 UI demands fresh Etsy comparison and owner consent; Product #53 acceptance directs linking before photo checks',()=>{
 const editor=source('admin/product-editor/index.html');
 const ui=source('public/js/admin-product-owner-sync-v499.mjs');
 const owner=source('public/js/admin-product-channel-advanced-v498.mjs');
 for(const id of ['dd499TagOverrides','dd499TagsChannel','dd499TagsMode','dd499TagsValue','dd499TagsSave',
  'dd499AdvancedSync','dd499AdvancedCompare','dd499AdvancedChanges','dd499AdvancedConsent','dd499AdvancedSend'])assert.ok(editor.includes(id),id);
 assert.equal(editor.match(/src="\/public\/js\/admin-product-owner-sync-v499\.mjs\?v=499"/g)?.length,1);
 assert.match(ui,/confirm_reviewed_changes:true/);
 assert.match(ui,/confirm_no_photo_or_shipping_change:true/);
 assert.match(ui,/!consent\.checked/);
 assert.match(ui,/dd:product-channel-tags-changed/);
 assert.match(ui,/advance\.uncertain=true/);
 assert.match(owner,/if\(!normal\(link\.linked_listing_id\)\)/);
 assert.match(owner,/Do not create another draft/);
 assert.match(owner,/product-etsy-images\?product_id=53&reconcile=1/);
 assert.match(owner,/photo_gap_492/);
});
