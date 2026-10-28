import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,createHash,sign,webcrypto} from 'node:crypto';
import {conflictReview512} from '../functions/api/_lib/etsyReview512.mjs';
import {QL245_SOURCE_KEYS_512,QL245_NEGATIVES_512,canonicalSource512,inspectQL245Source512} from '../functions/api/_lib/ql245External512.mjs';
import {onRequestGet as etsyGet,onRequestPost as etsyPost} from '../functions/api/admin/product-etsy-review-512.js';
import {onRequestGet as externalGet,onRequestPost as externalPost} from '../functions/api/admin/integration-ql245-source-evidence-512.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const listing='4603838854',fingerprint='f'.repeat(64);
const claim={confirmed:true,listing_id:listing,claim_state:'same_product',receipt_id:'171'};
const receipts=[344,345,346].map((id,index)=>({admin_action_audit_id:20+index,details_json:JSON.stringify({
  product_image_id:id,listing_id:listing,etsy_image_id:String(98000+id),verified_remote_readback:true})}));
const renewal={admin_action_audit_id:61,actor_user_id:7,details_json:JSON.stringify({build:511,
  decision:'current_evidence_renewed_local_only',listing_id:listing,source_claim_receipt_id:'171',
  evidence_fingerprint:fingerprint,original_photo_ids:[344,345,346]})};
const live={verified_unpublished:true,verified_canada_only:true,evidence_fingerprint_508:fingerprint,
 photo_freshness_509:{ready:true,rows:[344,345,346].map(id=>({product_image_id:id,ready:true,
  receipt_confirmed:true,etsy_image_id:String(98000+id),original_image_url:`https://devilndove.com/${id}.jpg`,
  etsy_image_url:`https://i.etsystatic.com/${id}.jpg`}))}};
const actor={data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:8}}}};
const uuid='5f108275-5d24-4c95-b895-2fd098a51201';

test('Build512 exact listing claim and immutable photo conflicts cannot become accepted visual evidence',()=>{
 const r=conflictReview512({claim,receipts,renewal,live,actorId:8});
 assert.equal(r.can_record_independent_photo_recheck,true);
 assert.equal(r.current_three_verified,true);
 assert.equal(r.owner_final_acceptance_recorded,false);
 assert.equal(conflictReview512({claim,receipts,renewal,live,actorId:7}).can_record_independent_photo_recheck,false);
 assert.equal(conflictReview512({claim:{...claim,confirmed:false},receipts,renewal,live,actorId:8}).can_record_independent_photo_recheck,false);
 assert.equal(conflictReview512({claim,receipts,renewal,live:{...live,evidence_fingerprint_508:'a'.repeat(64)},actorId:8}).can_record_independent_photo_recheck,false);
 const foreign=[...receipts,{admin_action_audit_id:99,details_json:JSON.stringify({product_image_id:344,listing_id:'1234',etsy_image_id:'1111',verified_remote_readback:true})}];
 const conflicting=conflictReview512({claim,receipts:foreign,renewal,live,actorId:8});
 assert.deepEqual(conflicting.conflicting_photo_receipt_ids,[99]);
 assert.equal(conflicting.can_record_independent_photo_recheck,false);
 assert.equal(conflicting.can_record_conflict_witness,true);
 assert.equal(conflictReview512({claim,receipts:receipts.slice(1),renewal,live,actorId:8}).can_record_independent_photo_recheck,false);
});

const keyPair=generateKeyPairSync('ed25519');
const spki=keyPair.publicKey.export({format:'der',type:'spki'});
const pin=createHash('sha256').update(spki).digest('hex');
const now=Date.now();
const ids=QL245_NEGATIVES_512.map(k=>[k,{outcome:'DENIED',audit_receipt_id:`np-proof-${k}`}]);
const example={schema_version:'rosevear.integration.v1',source_system:'devilndove',
 signer_key_id:'np-devilndove-signature',business_id:'devilndove',tenant_id:null,environment:'nonproduction',
 source_revision:'a'.repeat(40),ci_run_url:'https://github.com/RosevearCreations/devilndove-site/actions/runs/40629045725',
 key_id:'np-devilndove-key',registry_receipt_id:'np-registry-test',health_receipt_id:'np-health-test',
 capabilities_receipt_id:'np-capabilities-test',gateway_audit_id:'np-gateway-test',
 allowed_paths:['/api/integration/v1/health','/api/integration/v1/capabilities'],
 scope:['read_health','read_capabilities'],negative_tests:Object.fromEntries(ids),
 source_receipt_id:'np-source-test',audit_storage_review:'INDEPENDENT_RESTART_PROOF_PENDING',
 owner_authorization:'NOT_GIVEN',connection_state:'DISCONNECTED',issued_at:now-10000,expires_at:now+100000};
const payload=Object.fromEntries(QL245_SOURCE_KEYS_512.map(k=>[k,example[k]]));
const signature=sign(null,Buffer.from(canonicalSource512(payload)),keyPair.privateKey).toString('base64url');
const input={payload,signature,publicKeySpkiBase64:spki.toString('base64'),env:{ROSEVEAR_QL245_TRUSTED_DEVILNDOVE_SPKI_SHA256:pin},now};

test('Build512 checks the actual Ed25519 canonical source signature against an independently provisioned pin, never approves a connection',async()=>{
 const good=await inspectQL245Source512(input);
 assert.equal(good.accepted,true);assert.equal(good.signature_matched,true);
 assert.equal(good.owner_pilot_authorized,false);
 assert.equal(good.seven_independent_source_assessor_signatures_verified,false);
 assert.equal(good.connection_state,'DISCONNECTED');
 assert.equal((await inspectQL245Source512({...input,env:{}})).accepted,false);
 assert.equal((await inspectQL245Source512({...input,env:{ROSEVEAR_QL245_TRUSTED_DEVILNDOVE_SPKI_SHA256:'0'.repeat(64)}})).accepted,false);
 assert.equal((await inspectQL245Source512({...input,signature:'A'+signature.slice(1)})).accepted,false);
 assert.equal((await inspectQL245Source512({...input,payload:{...payload,business_id:'yw'}})).accepted,false);
 assert.equal((await inspectQL245Source512({...input,payload:{...payload,connection_state:'CONNECTED'}})).accepted,false);
 assert.equal((await inspectQL245Source512({...input,payload:{...payload,source_revision:'fake'}})).accepted,false);
 assert.equal((await inspectQL245Source512({...input,payload:{...payload,issued_at:now-7200000}})).accepted,false);
 assert.equal((await inspectQL245Source512({...input,payload:{...payload,allowed_paths:[...payload.allowed_paths,'/api/product']}})).accepted,false);
 assert.equal((await inspectQL245Source512({...input,payload:{...payload,negative_tests:Object.fromEntries(ids.slice(1))}})).accepted,false);
});

test('Build512 local conflict witness requires exact claim-state lease; no provider mutations or reassignment',async()=>{
 const db={prepare(sql){return {bind(){return this;},async all(){return {results:[]};},async first(){return null;},
  async run(){return {meta:{changes:1,last_row_id:90}};}};}};
 const path='https://devilndove.com/api/admin/product-etsy-review-512';
 assert.equal((await etsyGet({env:{DB:db},request:new Request(path+'?product_id=53')})).status,401);
 const context={...actor,env:{DB:db},request:new Request(path+'?product_id=53')};
 const r=await etsyGet(context);assert.equal(r.status,200);
 const preview=await r.json();assert.equal(preview.claim_state,'unclaimed');
 assert.equal(preview.can_record_independent_photo_recheck,false);
 const body={action:'witness_conflict',request_key:uuid,product_id:53,listing_id:listing,
  confirm_no_changes:true,expected_claim_state:'unclaimed',expected_claim_receipt_id:null,
  expected_conflicting_receipt_ids:[],confirm_inspected_existing_draft:true,
  observation:'Observed this same existing draft but no uniquely verified Product claim; no correction attempted.'};
 const post=(b,origin='https://devilndove.com')=>new Request(path,{method:'POST',
  headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(b)});
 assert.equal((await etsyPost({...context,request:post(body,'https://attacker.invalid')})).status,403);
 assert.equal((await etsyPost({...context,request:post({...body,expected_claim_state:'same_product'})})).status,409);
 const saved=await etsyPost({...context,request:post(body)});
 assert.equal(saved.status,200);assert.equal((await saved.json()).local_claim_reassigned,false);
});

test('Build512 gateway QL-245 Admin intake is DISCONNECTED and accepts no unpinned evidence',async()=>{
 const db={prepare(){return {bind(){return this;},async first(){return null;},async run(){return {meta:{changes:1,last_row_id:91}};}};}};
 const path='https://devilndove.com/api/admin/integration-ql245-source-evidence-512';
 assert.equal((await externalGet({env:{DB:db},request:new Request(path)})).status,401);
 const ctx={...actor,env:{DB:db},request:new Request(path)};
 const status=await (await externalGet(ctx)).json();assert.equal(status.connection_state,'DISCONNECTED');
 assert.equal(status.independently_sourced_spki_pin_configured,false);
 const data={action:'inspect_signed_source_metadata',request_key:uuid,payload,
  signature,public_key_spki_base64:spki.toString('base64'),confirm_nonproduction_only:true,
  confirm_no_owner_pilot:true,confirm_no_secrets:true};
 const post=new Request(path,{method:'POST',headers:{Origin:'https://devilndove.com'},body:JSON.stringify(data)});
 const held=await externalPost({...ctx,request:post});assert.equal(held.status,409);
 assert.equal((await held.json()).connection_state,'DISCONNECTED');
});

test('Build512 editor has an actionable but non-automated Etsy conflict and QL-245 receipt review',()=>{
 const html=read('admin/product-editor/index.html'),js=read('public/js/admin-product-etsy-package-v500.mjs');
 for(const id of ['dd512EtsyPanel','dd512ReviewEtsy','dd512Observation','dd512RecordWitness',
   'dd512RecordPhotoRecheck','dd512Photo344','dd512Photo345','dd512Photo346',
   'dd512GatewayPanel','dd512ReviewGateway','dd512PublicMetadata','dd512PublicSpki',
   'dd512PublicSignature','dd512InspectSignature']){
  assert.ok(html.includes(id),id);assert.ok(js.includes(id),id);
 }
 assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=5\d\d/);
 assert.match(html,/etsy-package-500\.css\?v=5\d\d/);
 for(const file of ['functions/api/admin/product-etsy-review-512.js',
   'functions/api/admin/integration-ql245-source-evidence-512.js']){
  const s=read(file);
  assert.doesNotMatch(s,/uploadEtsy|createEtsy|publishEtsy|UPDATE\s+marketplace_syndication_drafts|fetch\s*\(/i);
 }
});
