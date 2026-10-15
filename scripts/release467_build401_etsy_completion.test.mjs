import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {imageType,MAX_IMAGE_BYTES,checkedImage,inspectListingImages,consentValid,statusForDraft} from '../functions/api/_lib/etsyDraftImages401.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const f=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const id='374f3df7-9a5d-4f71-abf5-75b6daabc671';
const flags={image_rights_confirmed:true,image_matches_product:true,description_and_materials_reviewed:true,
 ingredients_and_required_labels_reviewed:true,claims_and_safety_reviewed:true,shipping_returns_reviewed:true,
 confirmed_unpublished_only:true,confirmed_one_attempt_no_retry:true,request_key:'c650d018-b1e2-42d7-aa1f-cd56ebee3d20'};
const jpg=new Uint8Array([255,216,255,...Array(200).fill(0)]);
test('JPEG and PNG magic validates actual bytes and size; SVG and fake MIME rejected',()=>{
 assert.equal(imageType(jpg)?.mime,'image/jpeg');
 assert.equal(imageType(new Uint8Array([137,80,78,71,13,10,26,10]))?.mime,'image/png');
 assert.equal(imageType(new Uint8Array([60,115,118,103])) ,null);
 assert.equal(checkedImage({size:jpg.length,type:'image/jpeg'},jpg,'Handmade soap').ok,true);
 assert.equal(checkedImage({size:jpg.length,type:'image/png'},jpg,'Handmade soap').ok,false);
 assert.equal(checkedImage({size:MAX_IMAGE_BYTES+1,type:'image/jpeg'},jpg,'alt').ok,false);
 assert.equal(checkedImage({size:jpg.length,type:'image/jpeg'},jpg,'').ok,false);
});
test('Compliance is all-or-nothing; secure one-time consent required',()=>{
 assert.equal(consentValid(flags),true);
 for(const k of Object.keys(flags))assert.equal(consentValid({...flags,[k]:false}),false,k);
});
test('Remote images are evidence only; zero photos is HOLD',()=>{
 const raw={results:[{listing_image_id:32,rank:1,alt_text:'Soap',full_width:1600,full_height:1600}]};
 assert.equal(inspectListingImages(raw).image_count,1);
 assert.equal(inspectListingImages({results:[]}).has_image,false);
 assert.equal(inspectListingImages({results:[raw.results[0],raw.results[0]]}).image_count,1);
 const shop={shop_id:57459161},product={product_id:54};
 const draft={product_id:'54',channel_key:'etsy',payload_json:JSON.stringify({title:'Soap',price_cents:900,quantity:3})};
 const listing={listing_id:11,shop_id:57459161,state:'draft',title:'Soap',quantity:3,price:{amount:900,divisor:100,currency_code:'CAD'}};
 assert.equal(statusForDraft(listing,shop,product,draft,{admin_action_audit_id:10},raw,true).readiness,'READY_FOR_MANUAL_ETSY_REVIEW');
 assert.equal(statusForDraft(listing,shop,product,draft,{admin_action_audit_id:10},{results:[]},true).readiness,'HOLD_REVIEW');
 assert.equal(statusForDraft({...listing,state:'active'},shop,product,draft,{admin_action_audit_id:10},raw,true).readiness,'HOLD_REVIEW');
});
test('Verified admin, D1 claims, one image API, and no listing activation',()=>{
 assert.equal(moduleKeyForPath('/api/admin/etsy-draft-completion'),MODULE_KEYS.STOREFRONT);
 const s=f('functions/api/admin/etsy-draft-completion.js');
 assert.match(s,/verifiedAdminFromModule/);
 assert.match(s,/etsy_image_upload_401_claimed/);
 assert.match(s,/WHERE NOT EXISTS/);
 assert.match(s,/method:'POST'/);
 assert.match(s,/confirmed_one_attempt_no_retry/);
 assert.match(s,/state:'draft'|listing_remains_draft:true/);
 assert.doesNotMatch(s,/method:'PATCH'|method:'PUT'|method:'DELETE'|state.*active|publishListing\(/i);
 const get=s.split('export async function onRequestGet')[1].split('export async function onRequestPost')[0];
 assert.doesNotMatch(get,/fetch\(|decryptOAuthSecret|INSERT INTO|UPDATE /);
});
test('Operator-only UI, no provider network calls or auto retry',()=>{
 const ui=f('public/js/admin-etsy-draft-completion-v401.js'),html=f('admin/it-integrations/index.html');
 assert.match(html,/id="etsy401NoRetry"/);assert.match(html,/id="etsy401Unpublished"/);
 assert.match(ui,/addEventListener\('click'/);
 assert.match(ui,/globalThis.crypto\?\.randomUUID/);
 assert.doesNotMatch(ui,/fetch\('https:\/\/api\.etsy\.com/);
});
