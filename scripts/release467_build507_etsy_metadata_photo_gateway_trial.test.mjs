import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {linkedReceipt506,onRequestGet as linkGet} from '../functions/api/admin/product-etsy-existing-draft.js';
import {metadataReview507,onRequestGet as trialGet} from '../functions/api/admin/product-etsy-owner-trial-507.js';
import {canonical506,sign506} from '../functions/api/_lib/integrationContract506.mjs';
import {onRequestGet as gatewayHealth} from '../functions/api/integration/v1/health.js';
import {onRequestGet as gatewayCapabilities} from '../functions/api/integration/v1/capabilities.js';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const owner={data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7,email:'owner@test.invalid'}}}};
const listing='4603838854';
function localDb507(claims){
 const product={product_id:53,name:'Adventurine Argon',sku:'DND-01130',slug:'adventurine-argon'};
 return {withSession(mode){assert.equal(mode,'first-primary');return this;},prepare(sql){return {bind(...params){return {
  async first(){if(sql.includes('FROM products WHERE product_id'))return product;
   if(sql.includes('LEFT JOIN products')){const item=claims.find(row=>String(row.external_reference)===String(params[0]));
    return item?{...item,product_name:product.name,product_sku:product.sku,product_slug:product.slug}:null;}
   return null;},
  async all(){return {results:claims.filter(row=>String(row.external_reference)===String(params[0])).slice(0,3)};}
 };}};}};
}
test('Build507 recovers one exact saved Etsy ID from primary listing lookup if legacy Product lookup is stale',async()=>{
 const row={id:'verified-original-receipt',product_id:'53',external_reference:listing};
 const request=new Request(`https://devilndove.com/api/admin/product-etsy-existing-draft?product_id=53&candidate_listing_id=${listing}`);
 const response=await linkGet({...owner,request,env:{DB:localDb507([row])}});
 assert.equal(response.status,200);const data=await response.json();
 assert.equal(data.linked_listing_id,listing);assert.equal(data.saved_link_readback_confirmed,true);
 assert.equal(data.receipt_id,row.id);assert.equal(data.linked_source,'unique_primary_listing_claim_507');
 assert.equal(data.product_sku,'DND-01130');assert.equal(data.product_slug,'adventurine-argon');
});
test('Build507 rejects foreign and duplicate listing claims without changing any local record',async()=>{
 const request=new Request(`https://devilndove.com/api/admin/product-etsy-existing-draft?product_id=53&candidate_listing_id=${listing}`);
 for(const claims of [
  [{id:'foreign',product_id:'52',external_reference:listing}],
  [{id:'first',product_id:'53',external_reference:listing},{id:'second',product_id:'53',external_reference:listing}],
  [{id:'first',product_id:'53',external_reference:listing},{id:'foreign',product_id:'52',external_reference:listing}]
 ]){
  const response=await linkGet({...owner,request,env:{DB:localDb507(claims)}});
  assert.equal(response.status,200);const data=await response.json();
  assert.equal(data.linked_listing_id,null);assert.equal(data.saved_link_readback_confirmed,false);
 }
 const proof=await linkedReceipt506(localDb507([{id:'a',product_id:'53',external_reference:listing},{id:'b',product_id:'53',external_reference:listing}]),53,listing);
 assert.equal(proof.confirmed,false);assert.equal(proof.claim_state,'multiple_local_claims');
});
test('Product #53 metadata remains on HOLD for name-only descriptions and unapproved Soap bars tag',()=>{
 const product={name:'Adventurine Argon',description:'Adventurine Argon'};
 const result=metadataReview507({product,listing:null,tags:{ready:true,tags:['Soap bars']},receipt:{confirmed:false,claim_state:'unclaimed'}});
 assert.match(result.join(' '),/materials/);assert.match(result.join(' '),/Soap bars/);
 assert.match(result.join(' '),/unclaimed/);assert.match(result.join(' '),/could not be independently read/);
 const okay=metadataReview507({product:{...product,description:'Owner verified item materials, size, process and use.'},
   listing:{listing_id:listing},tags:{ready:true,tags:['handmade']},receipt:{confirmed:true}});
 assert.deepEqual(okay,[]);
});
test('only authenticated admin can run Etsy owner trial; no real Etsy or sign-off side effect occurs in public route',async()=>{
 const url=`https://devilndove.com/api/admin/product-etsy-owner-trial-507?product_id=53&listing_id=${listing}`;
 assert.equal((await trialGet({request:new Request(url),env:{}})).status,401);
 assert.equal((await trialGet({...owner,request:new Request('https://devilndove.com/api/admin/product-etsy-owner-trial-507?product_id=53&listing_id=bad'),env:{DB:{prepare(){throw Error('must not read D1');}}}})).status,400);
 const api=source('functions/api/admin/product-etsy-owner-trial-507.js'),client=source('public/js/admin-product-etsy-package-v500.mjs'),html=source('admin/product-editor/index.html');
 assert.match(api,/verifyExistingDraft486/);assert.ok(api.includes("readEtsy486('listings/"));
 assert.doesNotMatch(api,/method:\s*['"](?:POST|PATCH|PUT|DELETE)['"]|\.run\(\)/);
 assert.match(client,/reviewTrial507/);assert.match(html,/dd507TrialCheck/);
 assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=(?:509|51[01])/);
});
test('integration v1 handshake trial accepts independent signed GETs and rejects replay, no product read/command grants',async()=>{
 const config={ROSEVEAR_INTEGRATION_HMAC_SECRET_V1:'synthetic-507-server-only-credential-sample',ROSEVEAR_INTEGRATION_KEY_ID_V1:'gateway-test-507',ROSEVEAR_INTEGRATION_ENVIRONMENT_V1:'test'};
 const seen=new Set(),db={prepare(sql){assert.match(sql,/NOT EXISTS/);return {bind(nonce){return {async run(){const allowed=!seen.has(nonce);seen.add(nonce);return {meta:{changes:Number(allowed)}};}};}};}};
 const sign=async(path,nonce)=>{
  const identity={method:'GET',path,timestamp:String(Date.now()),nonce,keyId:config.ROSEVEAR_INTEGRATION_KEY_ID_V1,source:'ai-data-platform',destination:'devilndove',business:'devilndove',tenant:'',environment:'test'};
  const signature=await sign506(config.ROSEVEAR_INTEGRATION_HMAC_SECRET_V1,canonical506(identity));
  return new Request('https://devilndove.com'+path,{headers:{'x-rosevear-key-id':identity.keyId,'x-rosevear-timestamp':identity.timestamp,
   'x-rosevear-nonce':nonce,'x-rosevear-source':identity.source,'x-rosevear-destination':identity.destination,
   'x-rosevear-business':identity.business,'x-rosevear-tenant':'','x-rosevear-environment':'test','x-rosevear-signature':signature}});
 };
 const first=await sign('/api/integration/v1/health','distinct-read-only-health-nonce-507');
 const success=await gatewayHealth({request:first,env:{...config,DB:db}});assert.equal(success.status,200);
 assert.equal((await success.json()).connection_state,'TESTING');
 assert.equal((await gatewayHealth({request:first,env:{...config,DB:db}})).status,409);
 const second=await gatewayCapabilities({request:await sign('/api/integration/v1/capabilities','separate-capabilities-nonce-507'),env:{...config,DB:db}});
 assert.equal(second.status,200);const value=await second.json();
 assert.equal(value.capabilities.product_reference.enabled,false);
 assert.equal(value.capabilities.commands.enabled,false);assert.equal(value.capabilities.events.enabled,false);
});
