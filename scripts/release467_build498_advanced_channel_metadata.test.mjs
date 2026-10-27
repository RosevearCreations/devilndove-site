import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {channelTags498,hashtag498,semanticTags498} from '../public/js/product-semantic-tags-v498.mjs';
import {preparedEtsyTags497} from '../functions/api/_lib/etsyNativeTags497.mjs';

const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Build 498 maps one saved semantic search phrase into native and social formats without inventing synonyms',()=>{
 const tags=channelTags498('Silver Rings, Sterling silver, Canadian artisan');
 assert.deepEqual(tags.canonical,['Silver Rings','Sterling silver','Canadian artisan']);
 assert.deepEqual(tags.etsy,tags.canonical);
 assert.deepEqual(tags.facebook,tags.canonical);
 assert.deepEqual(tags.google,tags.canonical);
 assert.deepEqual(tags.instagram,['#SilverRings','#SterlingSilver','#CanadianArtisan']);
 assert.deepEqual(tags.instagram,tags.tiktok);
 assert.deepEqual(tags.pinterest,tags.canonical);
 assert.equal(tags.etsyReady,true);
 assert.equal(hashtag498('Émail / Wire wrap'), '#EmailWireWrap');
 assert.deepEqual(semanticTags498('Silver Rings, silver rings, Fine Ring').duplicates,['silver rings']);
});

test('Build 498 raises tag exceptions rather than silently truncating Etsy metadata',()=>{
 for(const input of ['Silver Rings, silver rings','Made by an Ontario artisan',Array.from({length:14},(_,i)=>'ring '+i).join(','),'Green / Silver']){
  const mapping=channelTags498(input);
  assert.equal(mapping.etsyReady,false);
  assert.ok(mapping.warnings.length);
  assert.equal(preparedEtsyTags497(input).ready,false);
 }
 const permitted=channelTags498('Création, gold™');
 assert.equal(permitted.etsyReady,true);
 assert.equal(preparedEtsyTags497(permitted.etsy.join(',')).ready,true);
});

test('Build 498 exposes linked Etsy ID with authoritative Product SKU and slug, not a guessed URL or a new draft',()=>{
 const endpoint=read('functions/api/admin/product-etsy-existing-draft.js');
 const editor=read('admin/product-editor/index.html');
 const ui=read('public/js/admin-product-channel-advanced-v498.mjs');
 assert.match(endpoint,/SELECT product_id,name,sku,slug,/);
 for(const text of ['product_sku','product_slug','linked_listing_id','product_id:Number\(id\)'])assert.ok(endpoint.includes(text));
 for(const text of ['dd498Identity','dd498IdentityRefresh','dd498EtsyAdvanced','dd498MarketplaceAdvanced',
  'dd498TagLibrary','dd498OwnerAcceptance','admin-product-channel-advanced-v498.mjs?v=498'])assert.ok(editor.includes(text),text);
 assert.match(ui,/Etsy draft ID/);
 assert.match(ui,/product_sku/);
 assert.match(ui,/product_slug/);
 assert.match(ui,/data\.linked_listing_id/);
 assert.match(ui,/https:\/\/www\.etsy\.com\/your\/shops\/me\/listings\/drafts/);
 assert.doesNotMatch(ui,/\/listing\/\$\{listing\}/);
});

test('Build 498 saves separately verified advanced profiles and does not call provider posting or alter Product persistence',()=>{
 const profile=read('functions/api/admin/marketplace-listing-profile.js');
 const advanced=read('public/js/admin-product-channel-advanced-v498.mjs');
 assert.match(profile,/INSERT INTO marketplace_listing_profiles/);
 assert.match(profile,/provider_execution: false/);
 assert.match(profile,/publication_allowed: false/);
 assert.match(profile,/ON CONFLICT\(channel_key,product_id\)/);
 assert.match(advanced,/marketplace-listing-profile\?channel=/);
 assert.match(advanced,/api\('\/api\/admin\/marketplace-listing-profile',body\)/);
 for(const field of ['who_made','when_made','taxonomy_id','shipping_profile_reference','readiness_state_reference',
  'materials','styles','production_partner_refs','title_override','description_override'])assert.ok(advanced.includes(field),field);
 assert.match(advanced,/JSON\.stringify\(parseList\(profile\.tags_json\)\)===JSON\.stringify\(body\.tags\)/);
 assert.match(advanced,/record\.uncertain=true/);
 assert.match(advanced,/!saved\(\)/);
 assert.doesNotMatch(advanced,/fetch\('https:\/\/api\.etsy\.com|fetch\('https:\/\/graph\.facebook\.com/);
 assert.doesNotMatch(advanced,/create_draft|transfer_one|publishListing|\.click\(\).*dd438EtsyCreate/);
});

test('Build 498 preserves separate link vs updated events and requires live, read-only Product #53 acceptance',()=>{
 const existing=read('public/js/admin-product-existing-etsy-draft-v486.js');
 const state=read('public/js/admin-product-syndication-state-v495.js');
 const advanced=read('public/js/admin-product-channel-advanced-v498.mjs');
 assert.match(existing,/link\?'dd:etsy-existing-draft-linked':'dd:etsy-existing-draft-updated'/);
 assert.match(state,/dd:etsy-existing-draft-linked/);
 for(const text of ['productId!==53','4603838854','product-etsy-images?product_id=53&reconcile=1',
  'product-etsy-tags?product_id=53&reconcile=1','photo_gap_492','matching_tags===true','HOLD —'])assert.ok(advanced.includes(text),text);
 assert.doesNotMatch(advanced,/confirm_approved_media:true|confirm_replace_existing_tags:true|method:'PATCH'/);
});
