import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {channelPrefsValid,normalizeChannelPrefs,connectionRecovery,decisionPacket,ownerPacketConsent} from '../functions/api/_lib/etsyPublicationPacket405.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const f=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8'),row=(id,d)=>({admin_action_audit_id:id,details_json:JSON.stringify(d)});
test('Channel intent only accepts explicit preference switches and no-publication consent',()=>{
 const p={etsy:true,facebook:false,confirmed_no_provider_publication:true,request_key:'8fc1f13a-d54f-41c6-bfbd-c011087ef582'};
 assert.equal(channelPrefsValid(p),true);assert.equal(channelPrefsValid({...p,facebook:'yes'}),false);
 assert.equal(channelPrefsValid({...p,confirmed_no_provider_publication:false}),false);
 assert.deepEqual(normalizeChannelPrefs(null).etsy,false);
 assert.equal(normalizeChannelPrefs(row(22,p)).etsy,true);
});
test('Expired connection has deliberate reconnect action, not fabricated provider profile IDs',()=>{
 assert.equal(connectionRecovery({access_expires_at:'2020-01-01T00:00:00Z'}).needs_reconnect,true);
 assert.equal(connectionRecovery({access_expires_at:'2099-01-01T00:00:00Z'}).needs_reconnect,false);
});
test('Final packet holds missing/stale owner revalidation and explicit disabled Etsy intent',()=>{
 const baseline={snapshot:{blockers:[],listing_id:'789',selected_image_id:'7001',draft_state:'draft'},activeHolds:[],
 lastDecision:row(99,{decision:'READY_FOR_SEPARATE_MANUAL_ETSY_DECISION'}),lastHold:row(22,{decision:'HOLD_OWNER_REVIEW'}),
 selectedImage:'7001',acceptance:row(20,{}),
 revalidation:row(101,{decision:'REVALIDATED_FOR_SEPARATE_MANUAL_ETSY_DECISION',listing_id:'789',image_id:'7001',latest_403_receipt:99}),
 channelPreference:{configured:false,etsy:false}};
 assert.equal(decisionPacket(baseline).status,'READY_FOR_SEPARATE_OWNER_ETSY_DECISION');
 assert.equal(decisionPacket({...baseline,revalidation:null}).status,'OWNER_HOLD_NO_PUBLICATION');
 assert.equal(decisionPacket({...baseline,activeHolds:[row(66,{})]}).status,'OWNER_HOLD_NO_PUBLICATION');
 assert.ok(decisionPacket({...baseline,channelPreference:{configured:true,etsy:false}}).blockers.includes('etsy_channel_explicitly_disabled'));
});
test('Explicit final owner consent includes no-publish confirmation',()=>{
 const b={owner_checked_product:true,owner_checked_images:true,owner_checked_shipping:true,owner_checked_etsy_policies:true,
 owner_acknowledges_no_publication:true,owner_approves_manual_decision:true,owner_confirmed_correction:true,owner_confirmed_packet_nonpublishing:true};
 assert.equal(ownerPacketConsent(b),true);assert.equal(ownerPacketConsent({...b,owner_confirmed_packet_nonpublishing:false}),false);
});
test('Module route security, product editor single source and provider GET-only final packet',()=>{
 assert.equal(moduleKeyForPath('/api/admin/product-channel-intent'),MODULE_KEYS.STOREFRONT);
 assert.equal(moduleKeyForPath('/api/admin/etsy-publication-packet'),MODULE_KEYS.STOREFRONT);
 const e=f('functions/api/admin/product-channel-intent.js'),p=f('functions/api/admin/etsy-publication-packet.js');
 assert.match(e,/verifiedAdminFromModule/);assert.match(e,/product_channel_intent_405/);
 assert.match(e,/confirmed_no_provider_publication/);assert.doesNotMatch(e,/fetch\('https:\/\/api\.etsy/);
 assert.match(p,/verifiedAdminFromModule/);assert.match(p,/method:'GET'/);
 assert.doesNotMatch(p,/method:'PATCH'|method:'PUT'|publishListing/);
 const html=f('admin/product-editor/index.html');
 assert.match(html,/productChannel405Etsy/);assert.match(html,/productChannel405Facebook/);
 assert.match(f('public/js/admin-product-editor-v163.js'),/DDProductChannels405/);
 assert.match(f('public/js/admin-etsy-oauth-acceptance.js'),/needsReconnect/);
 const packetClient=f('public/js/admin-etsy-owner-packet-v405.js');
 assert.match(packetClient,/owner_checked_product:v.product.checked/);
 assert.match(packetClient,/owner_checked_images:v.images.checked/);
 assert.match(packetClient,/owner_confirmed_correction:v.correction.checked/);
 assert.doesNotMatch(packetClient,/owner_checked_product:true|owner_checked_images:true|owner_confirmed_correction:true/);
});
