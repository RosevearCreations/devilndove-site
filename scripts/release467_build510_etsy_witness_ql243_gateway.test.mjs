import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes,webcrypto} from 'node:crypto';
import {canonical510,sign510,nonproductionSettings510,validateQL243Headers510} from '../functions/api/_lib/integrationContract510.mjs';
import {onRequestGet as health510,onRequestPost as healthPost510} from '../functions/api/integration/v1/health.js';
import {onRequestGet as capabilities510} from '../functions/api/integration/v1/capabilities.js';
import {onRequestGet as witnessGet510,onRequestPost as witnessPost510} from '../functions/api/admin/product-etsy-witness-trail-510.js';
import {separationReadiness510,onRequestGet as separationGet510,onRequestPost as separationPost510} from '../functions/api/admin/integration-gateway-separation-510.js';
import {onRequestGet as handoffGet509} from '../functions/api/admin/integration-gateway-security-handoff-509.js';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const secret=randomBytes(32),keyId='np-source-devilndove-build510';
const env={ROSEVEAR_QL243_NONPROD_HMAC_KEY_B64:secret.toString('base64'),ROSEVEAR_QL243_NONPROD_KEY_ID:keyId,
 ROSEVEAR_QL243_DEPLOYMENT_CLASS:'nonproduction'};
const admin={data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7,email:'owner@test.invalid'}}}};
const stem='https://devilndove.com',nonce=()=>`np-${randomBytes(16).toString('hex')}`;
function dbFixture(){const history=new Set(),sqls=[];
 const db={prepare(sql){sqls.push(sql);return {bind(...values){this.values=values;return this;},
  async run(){if(sql.includes('rosevear_integration_v1_nonce_510')){const key=this.values[0];
    if(history.has(key))return {meta:{changes:0,last_row_id:0}};history.add(key);}
   return {meta:{changes:1,last_row_id:history.size+1}};},
  async all(){return {results:[]};},async first(){return null;}};}};
 return {db,history,sqls};}
async function signed(path,options={}){
 const identity={path,timestamp:options.timestamp||String(Date.now()),nonce:options.nonce||nonce(),source:options.source||'ai-data-platform',
  destination:options.destination||'devilndove',business:options.business||'devilndove',tenant:options.tenant||'-',
  keyId:options.keyId||keyId};
 const signature=await sign510(options.secret||secret,canonical510(identity));
 const headers={'Accept':'application/json','X-Rosevear-Contract':'rosevear.integration.v1','X-Rosevear-Environment':options.environment||'nonproduction',
  'X-Rosevear-Source':identity.source,'X-Rosevear-Destination':identity.destination,'X-Rosevear-Business':identity.business,
  'X-Rosevear-Tenant':identity.tenant,'X-Rosevear-Key-Id':identity.keyId,'X-Rosevear-Timestamp':identity.timestamp,
  'X-Rosevear-Nonce':identity.nonce,'X-Rosevear-Signature':signature};
 return new Request(stem+path,{headers});
}

test('Build510 QL-243 uses the exact twelve-line nonproduction HMAC canonical form and 256-bit key',async()=>{
 const req=await signed('/api/integration/v1/health');
 const h=req.headers;
 const canon=canonical510({path:'/api/integration/v1/health',timestamp:h.get('X-Rosevear-Timestamp'),nonce:h.get('X-Rosevear-Nonce'),
  source:'ai-data-platform',destination:'devilndove',business:'devilndove',tenant:'-',keyId});
 assert.equal(canon.split('\n').length,12);
 assert.equal(canon.split('\n')[10],'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
 assert.match(h.get('X-Rosevear-Signature'),/^[A-Za-z0-9_-]{43}$/);
 assert.equal(validateQL243Headers510(req,keyId).error,undefined);
 assert.equal(nonproductionSettings510({...env,ROSEVEAR_QL243_NONPROD_HMAC_KEY_B64:'not-256-bit'}).configured,false);
 assert.equal(nonproductionSettings510({...env,ROSEVEAR_QL243_DEPLOYMENT_CLASS:'production'}).configured,false);
 for(const overrides of [
  {source:'rosevear-comms-hub'},{destination:'rosiedazzlers'},{business:'icamp'},{tenant:'foreign-company'},
  {environment:'production'},{keyId:'old-revoked-key'},
  {timestamp:String(Date.now()-301000)}]){
  const altered=await signed('/api/integration/v1/health',overrides);
  assert.ok(validateQL243Headers510(altered,keyId).error,JSON.stringify(overrides));
 }
 const query=await signed('/api/integration/v1/health?customer=1');
 assert.ok(validateQL243Headers510(query,keyId).error);
});

test('Build510 source endpoints accept only signed GETs, reject replay, tampering, revocation and writes; never activate a gateway',async()=>{
 const {db,sqls}=dbFixture(),ctx={env:{...env,DB:db}};
 const request=await signed('/api/integration/v1/health');
 const passed=await health510({...ctx,request});assert.equal(passed.status,200);
 const receipt=await passed.json();
 assert.equal(receipt.connection_state,'HOLD');assert.equal(receipt.owner_pilot_authorized,false);
 assert.equal(receipt.gateway_ed25519_receipt,false);assert.ok(receipt.source_nonce_receipt_id);
 assert.equal((await health510({...ctx,request})).status,409);
 const caps=await capabilities510({...ctx,request:await signed('/api/integration/v1/capabilities')});
 assert.equal(caps.status,200);assert.equal((await caps.json()).product_reference_enabled,false);
 const tampered=await signed('/api/integration/v1/health');tampered.headers.set('X-Rosevear-Business','yw');
 assert.equal((await health510({...ctx,request:tampered})).status,403);
 const wrongSig=await signed('/api/integration/v1/health',{secret:randomBytes(32)});
 assert.equal((await health510({...ctx,request:wrongSig})).status,403);
 const revoked=await signed('/api/integration/v1/health');
 assert.equal((await health510({env:{...ctx.env,ROSEVEAR_QL243_NONPROD_REVOKED:'true'},request:revoked})).status,403);
 assert.equal((await health510({env:{...ctx.env,ROSEVEAR_QL243_DEPLOYMENT_CLASS:'production'},request:revoked})).status,403);
 assert.equal((await healthPost510({...ctx,request:new Request(stem+'/api/integration/v1/health',{method:'POST'})})).status,405);
 assert.ok(sqls.some(sql=>sql.includes('rosevear_integration_v1_nonce_510')));
 assert.ok(sqls.some(sql=>sql.includes('rosevear_integration_v1_denied_510')));
});

test('Build510 unlinked Product #53 records owner observation but never claims an Etsy ID or sends a provider request',async()=>{
 const {db,sqls}=dbFixture(),context={...admin,env:{DB:db}},path=stem+'/api/admin/product-etsy-witness-trail-510';
 const out=await witnessGet510({...context,request:new Request(path+'?product_id=53')});
 assert.equal(out.status,200);const result=await out.json();
 assert.equal(result.local_claim_state,'unclaimed');assert.equal(result.local_link_confirmed,false);
 assert.equal(result.live_etsy_readback_confirmed,false);assert.equal(result.photo_freshness_ready,false);
 assert.equal(result.owner_acceptance_recorded,false);
 const action={action:'record_candidate_witness',product_id:53,listing_id:'4603838854',
  expected_claim_state:'unclaimed',request_key:'7fd6df8d-a3d7-4d72-a019-8db8a3c95c3e',
  confirm_no_etsy_changes:true,confirm_checked_actual_etsy:true,
  witness_note:'I checked the exact existing draft in Etsy, but our saved D1 ID remains unlinked.'};
 const request=new Request(path,{method:'POST',headers:{Origin:stem,'Content-Type':'application/json'},body:JSON.stringify(action)});
 const response=await witnessPost510({...context,request});assert.equal(response.status,200);
 const saved=await response.json();assert.equal(saved.candidate_observation_recorded,true);
 assert.equal(saved.local_link_confirmed,false);assert.equal(saved.owner_approval_granted,false);
 assert.equal((await witnessPost510({...context,request:new Request(path,{method:'POST',headers:{Origin:'https://foreign.invalid'},body:JSON.stringify(action)})})).status,403);
 const premature={...action,action:'record_photo_retest',evidence_fingerprint:'a'.repeat(64),
  confirm_original_344:true,confirm_original_345:true,confirm_original_346:true,confirm_visual_equality:true};
 const noRetest=await witnessPost510({...context,request:new Request(path,{method:'POST',headers:{Origin:stem},body:JSON.stringify(premature)})});
 assert.equal(noRetest.status,409);
 assert.ok(sqls.some(sql=>sql.includes("'product','53','POST'")));
 assert.ok(!sqls.some(sql=>/UPDATE\s+marketplace_syndication_drafts|INSERT\s+INTO\s+marketplace_syndication_drafts/i.test(sql)));
});

test('Build510 gateway separation requires exact nonproduction receipts, current owner handoff and different reviewer, but always stays HOLD',()=>{
 const sourceRow=path=>({admin_action_audit_id:path.includes('health')?11:12,request_path:path,details_json:JSON.stringify({
  source:'ai-data-platform',destination:'devilndove',business:'devilndove',tenant:null,
  environment:'nonproduction',scope:'health_capabilities_get_only',key_id:keyId,decision:'read_only_accepted'})});
 const rows=[sourceRow('/api/integration/v1/health'),sourceRow('/api/integration/v1/capabilities')];
 const handoff={admin_action_audit_id:20,actor_user_id:7,details_json:JSON.stringify({application_id:'devilndove',environment:'nonproduction',
  nonproduction_key_id:keyId,source_side_receipts_only:true,scope:'read_only_health_and_capabilities_handoff'})};
 const good=separationReadiness510(env,rows,handoff,8);
 assert.equal(good.review_ready,true);assert.equal(good.connection_state,'HOLD');
 assert.equal(good.owner_pilot_authorized,false);assert.equal(good.gateway_audit_id,null);
 assert.equal(good.gateway_public_spki_pin_verified,false);assert.equal(good.independent_gateway_datastore_verified,false);
 assert.equal(separationReadiness510(env,rows,handoff,7).review_ready,false);
 assert.equal(separationReadiness510(env,[rows[0]],handoff,8).review_ready,false);
 assert.equal(separationReadiness510(env,rows,{...handoff,details_json:JSON.stringify({...JSON.parse(handoff.details_json),nonproduction_key_id:'rotated'})},8).review_ready,false);
 assert.equal(separationReadiness510(env,[{...rows[0],details_json:JSON.stringify({...JSON.parse(rows[0].details_json),business:'yw'})},rows[1]],handoff,8).review_ready,false);
 assert.equal(separationReadiness510({...env,ROSEVEAR_QL243_NONPROD_REVOKED:'true'},rows,handoff,8).review_ready,false);
});

test('Build510 gateway Admin endpoints require identity and independent signed GET/owner evidence; Build509 can read QL-243 source receipts',async()=>{
 const path=stem+'/api/admin/integration-gateway-separation-510';
 assert.equal((await separationGet510({request:new Request(path),env:{}})).status,401);
 const {db}=dbFixture();
 assert.equal((await separationGet510({...admin,request:new Request(path),env:{...env,DB:db}})).status,200);
 const result=await (await separationGet510({...admin,request:new Request(path),env:{...env,DB:db}})).json();
 assert.equal(result.review_ready,false);assert.equal(result.connection_state,'HOLD');
 const wrong={action:'record_nonproduction_separation_review',request_key:'48b616af-5528-4313-991c-8f32210a812e',
  owner_handoff_receipt_id:1,confirm_different_reviewer:true,confirm_nonproduction_only:true,
  confirm_gateway_external_proof_pending:true,confirm_owner_pilot_not_authorized:true};
 assert.equal((await separationPost510({...admin,env:{...env,DB:db},request:new Request(path,{method:'POST',headers:{Origin:stem},body:JSON.stringify(wrong)})})).status,409);
 assert.equal((await separationPost510({...admin,env:{...env,DB:db},request:new Request(path,{method:'POST',headers:{Origin:'https://evil.invalid'},body:JSON.stringify(wrong)})})).status,403);
 const proof=await handoffGet509({...admin,env:{...env,DB:db},request:new Request(stem+'/api/admin/integration-gateway-security-handoff-509')});
 assert.equal(proof.status,200);assert.equal((await proof.json()).source_side_receipts_only,true);
});

test('Build510 UI exposes factual witness notes, separate photo confirmations, nonproduction-only approval review and fresh version',()=>{
 const page=source('admin/product-editor/index.html'),script=source('public/js/admin-product-etsy-package-v500.mjs');
 for(const el of ['dd510WitnessPanel','dd510ReadClaim','dd510WitnessNote','dd510RecordWitness','dd510PhotoPairs',
  'dd510Original344','dd510Original345','dd510Original346','dd510VisualEquality','dd510RecordRetest',
  'dd510GatewayPanel','dd510GatewayReview','dd510GatewayDifferent','dd510GatewayNonprod','dd510GatewayExternal',
  'dd510GatewayNoPilot','dd510GatewayRecord']){
   assert.match(page,new RegExp(el));assert.match(script,new RegExp(el));
 }
 assert.match(page,/admin-product-etsy-package-v500\.mjs\?v=5\d\d/);
 assert.match(page,/etsy-package-500\.css\?v=5\d\d/);
 assert.match(script,/renderPhotoPairs509\(value\.photo_pairs\|\|\[\],'dd510PhotoPairs'\)/);
 assert.match(source('admin/product-editor/etsy-package-500.css'),/object-fit:contain/);
 const route=source('functions/api/admin/product-etsy-witness-trail-510.js');
 assert.doesNotMatch(route,/publishEtsy|createEtsy|uploadEtsy|fetch\s*\(/);
});
