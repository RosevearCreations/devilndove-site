import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {evidencePacket508,fingerprint508,priorOwnerApproval508} from '../functions/api/_lib/etsyCloseout508.mjs';
import {onRequestGet as closeoutGet,onRequestPost as closeoutPost} from '../functions/api/admin/product-etsy-owner-closeout-508.js';
import {gatewayReadiness508,onRequestGet as gatewayGet} from '../functions/api/admin/integration-gateway-readiness-508.js';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const owner={data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7,email:'owner@test.invalid'}}}};
const url='https://devilndove.com/api/admin/product-etsy-owner-closeout-508';
const product={product_id:53,sku:'DND-01130',slug:'adventurine-argon',name:'Adventurine Argon',description:'Owner verified materials and exact size',price_cents:2200,currency:'CAD',inventory_quantity:1};
const listing={listing_id:'4603838854',shop_id:5,title:'Adventurine Argon',description:product.description,state:'draft',taxonomy_id:1,
 shipping_profile_id:2,quantity:1,price:{amount:2200,divisor:100,currency_code:'CAD'},tags:['adventurine','handmade']};
const gallery=[344,345,346].map(product_image_id=>({product_image_id}));
const remoteImages=[111,112,113].map(listing_image_id=>({listing_image_id}));
const accepted=gallery.map((row,index)=>({...row,listing_id:listing.listing_id,etsy_image_id:String(remoteImages[index].listing_image_id),verified_remote_readback:true}));

test('Build508 exact evidence fingerprint changes with metadata, original photo or Etsy receipt, not row order',async()=>{
 const packet=evidencePacket508({product,listing,gallery,remoteImages,accepted,tags:['handmade','adventurine']});
 const same=evidencePacket508({product,listing,gallery:[...gallery].reverse(),remoteImages:[...remoteImages].reverse(),accepted:[...accepted].reverse(),tags:['adventurine','handmade']});
 const fp=await fingerprint508(packet);
 assert.match(fp,/^[a-f0-9]{64}$/);assert.equal(await fingerprint508(same),fp);
 for(const changes of [
  {product:{...product,description:'Different materials'}},
  {gallery:[gallery[0],gallery[1]]},
  {listing:{...listing,tags:['wrong-tag']}},
  {remoteImages:[remoteImages[0],remoteImages[1]]},
  {accepted:[accepted[0],accepted[1]]}
 ])assert.notEqual(await fingerprint508(evidencePacket508({product,listing,gallery,remoteImages,accepted,tags:['handmade','adventurine'],...changes})),fp);
});

test('prior witnessed owner sign-off must match exact listing and same three original photo IDs',()=>{
 const review={ready:true,listing_id:'4603838854',confirmed_photo_ids:[344,345,346],evidence_fingerprint_508:'f'.repeat(64)};
 const approved={listing_id:review.listing_id,confirmed_photo_ids:[346,344,345],evidence_fingerprint_508:review.evidence_fingerprint_508,publication_performed:false};
 assert.equal(priorOwnerApproval508(JSON.stringify(approved),review),true);
 assert.equal(priorOwnerApproval508({...approved,listing_id:'4'},review),false);
 assert.equal(priorOwnerApproval508({...approved,confirmed_photo_ids:[344,345]},review),false);
 assert.equal(priorOwnerApproval508({...approved,publication_performed:true},review),false);
 assert.equal(priorOwnerApproval508({...approved,evidence_fingerprint_508:'a'.repeat(64)},review),false);
 assert.equal(priorOwnerApproval508({...approved,evidence_fingerprint_508:undefined},review),false);
 assert.equal(priorOwnerApproval508(approved,{...review,ready:false}),false);
});

test('Build508 owner closeout fails closed for missing auth, wrong Product, cross-site submit and unchecked assertions',async()=>{
 assert.equal((await closeoutGet({request:new Request(url+'?product_id=53'),env:{}})).status,401);
 const db={prepare(){throw Error('must not read D1 for an invalid owner request');}};
 assert.equal((await closeoutGet({...owner,request:new Request(url+'?product_id=52'),env:{DB:db}})).status,400);
 const payload={action:'record_owner_closeout_508',product_id:53,listing_id:'4603838854',
  request_key:'de10ac0f-334e-40ee-832f-006db7498251',evidence_fingerprint:'a'.repeat(64)};
 const foreign=new Request(url,{method:'POST',headers:{Origin:'https://unrelated.example','Content-Type':'application/json'},body:JSON.stringify(payload)});
 assert.equal((await closeoutPost({...owner,request:foreign,env:{DB:db}})).status,403);
 const unchecked=new Request(url,{method:'POST',headers:{Origin:'https://devilndove.com','Content-Type':'application/json'},body:JSON.stringify(payload)});
 assert.equal((await closeoutPost({...owner,request:unchecked,env:{DB:db}})).status,400);
});

test('gateway credentials are strictly server only; source and both accepted signed GET receipts are required for TESTING',()=>{
 const empty=gatewayReadiness508({});assert.equal(empty.state,'DISCONNECTED');assert.equal(empty.connected,false);
 const env={ROSEVEAR_INTEGRATION_KEY_ID_V1:'owner-test-key',ROSEVEAR_INTEGRATION_HMAC_SECRET_V1:'not-a-real-secret-for-test-only-keep-private',ROSEVEAR_INTEGRATION_ENVIRONMENT_V1:'test'};
 assert.equal(gatewayReadiness508({...env,ROSEVEAR_INTEGRATION_REVOKED_V1:'true'}).state,'REVOKED');
 assert.equal(gatewayReadiness508(env).state,'CONFIGURED');
 const details_json=JSON.stringify({source:'ai-data-platform',business:'devilndove',key_id:env.ROSEVEAR_INTEGRATION_KEY_ID_V1,
  environment:'test',decision:'read_only_accepted'});
 const health={request_path:'/api/integration/v1/health',created_at:'2026-10-27',details_json};
 const caps={...health,request_path:'/api/integration/v1/capabilities'};
 assert.equal(gatewayReadiness508(env,[health]).state,'CONFIGURED');
 const readback=gatewayReadiness508(env,[health,caps]);assert.equal(readback.state,'TESTING');
 assert.equal(readback.accepted_health_receipt,true);assert.equal(readback.accepted_capabilities_receipt,true);
 assert.equal(readback.connected,false);assert.equal(readback.owner_data_access_approved,false);
 assert.doesNotMatch(JSON.stringify(readback),/not-a-real-secret/);
 assert.equal(gatewayReadiness508(env,[{...health,details_json:JSON.stringify({...JSON.parse(details_json),business:'other'})},caps]).state,'CONFIGURED');
});

test('gateway readiness endpoint is admin-only, GET-only and cannot provision or expose credentials',async()=>{
 assert.equal((await gatewayGet({request:new Request('https://devilndove.com/api/admin/integration-gateway-readiness-508'),env:{}})).status,401);
 const gateway=source('functions/api/admin/integration-gateway-readiness-508.js');
 assert.doesNotMatch(gateway,/export\s+async\s+function\s+onRequestPost|credentials_returned:true|connected:true/);
 assert.match(gateway,/rosevear_integration_v1_nonce_506/);
 assert.match(gateway,/READ|read_only|read-only/i);
 const closeout=source('functions/api/admin/product-etsy-owner-closeout-508.js');
 assert.doesNotMatch(closeout,/etsyCreate|createEtsy|uploadEtsy|publishEtsy|fetch\s*\(/i);
 assert.match(closeout,/etsy_508_verified_owner_closeout/);
 assert.match(closeout,/json_extract\(details_json,'\$\.evidence_fingerprint'\)/);
});

test('Product #53 UI requires four separate confirmations, fresh preflight and read-only gateway review',()=>{
 const html=source('admin/product-editor/index.html');
 const js=source('public/js/admin-product-etsy-package-v500.mjs');
 for(const field of ['dd508Preflight','dd508SameDraft','dd508EachPhoto','dd508Metadata','dd508Unpublished','dd508Record','dd508GatewayCheck']){
  assert.match(html,new RegExp(field));assert.match(js,new RegExp(field));
 }
 assert.match(js,/ready_for_owner_closeout/);assert.match(js,/evidence_fingerprint/);
 assert.match(js,/record_owner_closeout_508/);
 assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=508/);
 assert.match(html,/etsy-package-500\.css\?v=508/);
 assert.match(html,/does not publish, upload photographs, create a draft or change Etsy/);
});
