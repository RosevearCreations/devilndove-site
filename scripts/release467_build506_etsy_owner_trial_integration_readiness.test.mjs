import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {linkedReceipt506} from '../functions/api/admin/product-etsy-existing-draft.js';
import {canonical506,sign506,validateHeaders506} from '../functions/api/_lib/integrationContract506.mjs';
import {onRequestGet as health} from '../functions/api/integration/v1/health.js';
import {onRequestGet as capabilities} from '../functions/api/integration/v1/capabilities.js';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const root='https://devilndove.com';
const env={ROSEVEAR_INTEGRATION_HMAC_SECRET_V1:'synthetic-unpublished-local-test-secret-506',ROSEVEAR_INTEGRATION_KEY_ID_V1:'gateway-v1-test',ROSEVEAR_INTEGRATION_ENVIRONMENT_V1:'preview'};

function receiptDb(rows){return {withSession(mode){assert.equal(mode,'first-primary');return this;},prepare(sql){return {bind(...params){return {
  async all(){return {results:rows.filter(row=>String(row.external_reference)===String(params[0])).slice(0,3)};}
};}};}};}
test('Build506 Product #53 Etsy saved ID uses independent primary receipt and rejects claimant mismatch',async()=>{
  const original={id:'receipt-53',product_id:53,external_reference:'4603838854'};
  assert.deepEqual(await linkedReceipt506(receiptDb([original]),53,'4603838854'),{confirmed:true,receipt_id:'receipt-53',listing_id:'4603838854',claim_state:'same_product',claim_count_capped:1});
  assert.equal((await linkedReceipt506(receiptDb([]),53,'4603838854')).confirmed,false);
  const multi=[original,{id:'receipt-99',product_id:99,external_reference:'4603838854'}];
  assert.equal((await linkedReceipt506(receiptDb(multi.slice().reverse()),53,'4603838854')).confirmed,false);
});

async function signed(path,overrides={}){
  const identity={method:'GET',path,timestamp:String(Date.now()),nonce:'nonce-506-synthetic-replay-00001',keyId:env.ROSEVEAR_INTEGRATION_KEY_ID_V1,
    source:'ai-data-platform',destination:'devilndove',business:'devilndove',tenant:'',environment:'preview',...overrides};
  const signature=await sign506(env.ROSEVEAR_INTEGRATION_HMAC_SECRET_V1,canonical506(identity));
  const h=new Headers({'x-rosevear-key-id':identity.keyId,'x-rosevear-timestamp':identity.timestamp,'x-rosevear-nonce':identity.nonce,
    'x-rosevear-source':identity.source,'x-rosevear-destination':identity.destination,'x-rosevear-business':identity.business,
    'x-rosevear-tenant':identity.tenant,'x-rosevear-environment':identity.environment,'x-rosevear-signature':signature});
  return new Request(root+path,{headers:h});
}
function auditDb(){
 const seen=new Set();
 return {prepare(sql){
  assert.match(sql,/INSERT INTO admin_action_audit/);assert.match(sql,/NOT EXISTS/);
  return {bind(nonceKey){
   return {async run(){const first=!seen.has(nonceKey);seen.add(nonceKey);return {meta:{changes:Number(first)}};}};
  }};
 }};
}
test('gateway HMAC, atomic replay ledger, capabilities and owner-held connection state',async()=>{
  const db=auditDb(),server={...env,DB:db};
  const request=await signed('/api/integration/v1/health');
  const ok=await health({request,env:server});assert.equal(ok.status,200);
  const payload=await ok.json();assert.equal(payload.connection_state,'TESTING');assert.equal(payload.owner_approved_data_access,false);
  assert.equal((await health({request,env:server})).status,409,'identical gateway nonce cannot be replayed');
  const caps=await capabilities({request:await signed('/api/integration/v1/capabilities',{nonce:'nonce-506-synthetic-capabilities'}),env:server});
  const details=await caps.json();assert.equal(details.capabilities.product_reference.enabled,false);
  assert.equal(details.capabilities.events.enabled,false);assert.equal(details.capabilities.commands.enabled,false);
  assert.equal((await health({request,env:{}})).status,503,'no unconfigured live credentials');
  assert.equal((await health({request,env:{...server,ROSEVEAR_INTEGRATION_REVOKED_V1:'true'}})).status,403,'revoked credentials deny');
});
test('gateway rejects wrong company, tenant, environment, key, expiry, tampering and query',async()=>{
  const cases=[{business:'rosiedazzlers'},{tenant:'other-tenant'},{environment:'production'},
    {source:'some-other-system'},{keyId:'revoked-key-01'},{timestamp:String(Date.now()-200000)}];
  for(const override of cases){const request=await signed('/api/integration/v1/health',override);
    const denied=await health({request,env:{...env,DB:auditDb()}});
    assert.equal(denied.status,403,JSON.stringify(override));}
  const request=await signed('/api/integration/v1/health');
  request.headers.set('x-rosevear-signature','0'.repeat(64));
  assert.equal((await health({request,env:{...env,DB:auditDb()}})).status,403);
  const queryRequest=await signed('/api/integration/v1/health');
  assert.equal((await health({request:new Request(root+'/api/integration/v1/health?test=1',{headers:queryRequest.headers}),env:{...env,DB:auditDb()}})).status,403);
  assert.match(String(validateHeaders506(await signed('/api/integration/v1/health',{tenant:'wrong'}),env).error),/tenant/);
});
test('Etsy readback and UI remain owner-gated; no automatic duplicate, tag guess, or active gateway commands',()=>{
 const link=read('functions/api/admin/product-etsy-existing-draft.js'),ui=read('public/js/admin-product-etsy-package-v500.mjs'),html=read('admin/product-editor/index.html');
 assert.match(link,/linkedReceipt506\(g\.db,id,listingId\)/);
 assert.match(link,/saved_link_readback_confirmed:true/);
 assert.match(ui,/state\.linkReadbackHold=true/);
 assert.match(ui,/link\.linked_listing_id&&link\.saved_link_readback_confirmed!==true/);
 assert.match(ui,/reviewTrial506/);
 assert.match(html,/dd506TrialCheck/);
 assert.match(html,/etsy-package-500\.css\?v=(?:50[6789]|510)/);
 assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=(?:50[6789]|510)/);
 assert.equal(read('functions/api/integration/v1/health.js').includes('product_id'),false);
 assert.equal(read('functions/api/integration/v1/capabilities.js').includes('enabled:true,method:\'POST\''),false);
});
