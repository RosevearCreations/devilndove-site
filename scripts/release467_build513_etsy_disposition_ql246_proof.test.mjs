import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,createHash,sign,webcrypto} from 'node:crypto';
import {disposition513} from '../functions/api/_lib/etsyDisposition513.mjs';
import {QL246_SOURCE_FIELDS_513,QL246_NEGATIVES_513,canonicalQl246513,inspectQl246513} from '../functions/api/_lib/ql246Proof513.mjs';
import {onRequestGet as etsyGet,onRequestPost as etsyPost} from '../functions/api/admin/product-etsy-disposition-513.js';
import {onRequestGet as gatewayGet,onRequestPost as gatewayPost} from '../functions/api/admin/integration-ql246-source-comparison-513.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const actor={data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:8}}}};
const claim={claim_state:'same_product',linked:true,claim_receipt_id:'23',
 conflicting_photo_receipt_ids:[],missing_original_ids:[],issues:[],can_record_conflict_witness:true};
const product={name:'Adventurine Argon',description:'Handmade aventurine piece with actual owner-provided material, dimensions and manufacturing details.',
 sku:'DND-01130',slug:'adventurine-argon'};
const live={ready:true,listing_id:'4603838854',verified_unpublished:true,verified_canada_only:true,
 evidence_fingerprint_508:'a'.repeat(64),photo_freshness_509:{ready:true,rows:[344,345,346].map(id=>({
 product_image_id:id,ready:true,original_image_url:`https://devilndove.com/${id}.jpg`,etsy_image_url:`https://etsystatic.com/${id}.jpg`}))}};
const witness={admin_action_audit_id:90,actor_user_id:7,details_json:JSON.stringify({build:512,product_id:53,
 listing_id:'4603838854',decision:'observed_local_conflict_only',provider_modified:false})};
const recheck={admin_action_audit_id:99,actor_user_id:7,details_json:JSON.stringify({build:512,
 decision:'independently_rechecked_unchanged_photos_only',source_claim_receipt_id:'23',
 evidence_fingerprint:'a'.repeat(64),original_photo_ids:[344,345,346]})};

test('Build513 independent owner content review requires real saved details, product-appropriate tags, exact live draft and distinct photo reviewer',()=>{
 const good=disposition513({claimEvidence:claim,product,seo:{keywords:'Aventurine, jewelry, handmade'},live,
  priorWitness:witness,priorPhotoRecheck:recheck,actorId:8});
 assert.equal(good.can_record_disposition_followup,true);
 assert.equal(good.can_record_independent_content_recheck,true);
 assert.equal(good.final_owner_approval,false);
 assert.equal(disposition513({claimEvidence:claim,product:{...product,description:'Adventurine Argon'},seo:{keywords:'Aventurine'},live,priorPhotoRecheck:recheck,actorId:8}).can_record_independent_content_recheck,false);
 assert.equal(disposition513({claimEvidence:claim,product,seo:{keywords:'Aventurine'},override:{mode:'override',tags:['Soap bars']},live,priorPhotoRecheck:recheck,actorId:8}).can_record_independent_content_recheck,false);
 assert.equal(disposition513({claimEvidence:claim,product,seo:{keywords:'Aventurine'},live,priorPhotoRecheck:recheck,actorId:7}).can_record_independent_content_recheck,false);
 assert.equal(disposition513({claimEvidence:{...claim,conflicting_photo_receipt_ids:[42],issues:['Historical photo conflict']},product,seo:{keywords:'Aventurine'},live,priorPhotoRecheck:recheck,actorId:8}).can_record_independent_content_recheck,false);
 assert.equal(disposition513({claimEvidence:claim,product,seo:{keywords:'Aventurine'},live:{...live,ready:false},priorPhotoRecheck:recheck,actorId:8}).can_record_independent_content_recheck,false);
 assert.equal(disposition513({claimEvidence:claim,product,seo:{keywords:'Aventurine'},live:{...live,evidence_fingerprint_508:'b'.repeat(64)},priorPhotoRecheck:recheck,actorId:8}).can_record_independent_content_recheck,false);
});

const {privateKey,publicKey}=generateKeyPairSync('ed25519');
const spki=publicKey.export({format:'der',type:'spki'});
const pin=createHash('sha256').update(spki).digest('hex');
const now=Date.now();const sha='b'.repeat(40);
const draft={schema_version:'rosevear.integration.v1',source_system:'devilndove',
 repository:'RosevearCreations/devilndove-site',source_revision:sha,
 challenge_id:'np-operator-513',challenge_sha256:'a'.repeat(64),
 business_id:'devilndove',tenant_id:null,environment:'nonproduction',
 ci_run_url:'https://github.com/RosevearCreations/devilndove-site/actions/runs/40694167077',
 allowed_methods:['GET'],allowed_paths:['/api/integration/v1/health','/api/integration/v1/capabilities'],
 negative_tests:Object.fromEntries(QL246_NEGATIVES_513.map(k=>[k,true])),
 gateway_audit_receipt_id:null,health_receipt_id:null,capabilities_receipt_id:null,registered_key_id:null,
 owner_authorization:'NOT_GIVEN',connection_state:'DISCONNECTED',
 external_gateway_get_verified:false,durable_audit_verified:false,owner_identity_verified:false,
 issued_at:now-10000,expires_at:now+360000};
const payload=Object.fromEntries(QL246_SOURCE_FIELDS_513.map(k=>[k,draft[k]]));
const signature=sign(null,Buffer.from(canonicalQl246513(payload)),privateKey).toString('base64url');
const record={publicKeyPem:publicKey.export({format:'pem',type:'spki'}),payload,signature};
const rawJson=JSON.stringify(record);
const env={ROSEVEAR_QL246_TRUSTED_DEVILNDOVE_SPKI_SHA256:pin,
 ROSEVEAR_QL246_CHALLENGE_ID:'np-operator-513',ROSEVEAR_QL246_CHALLENGE_SHA256:'a'.repeat(64),
 ROSEVEAR_QL246_EXPECTED_SOURCE_REVISION:sha};

test('Build513 QL-246 uses exact signed field-name/value newline pairs and independently pinned public PEM, challenge and source revision',async()=>{
 assert.equal(canonicalQl246513(payload).split('\n').length,24);
 assert.match(canonicalQl246513(payload).split('\n')[0],/^\["schema_version","rosevear\.integration\.v1"\]$/);
 const good=await inspectQl246513({rawJson,env,now});
 assert.equal(good.matched,true);assert.equal(good.connection_state,'DISCONNECTED');
 assert.equal(good.six_app_evidence_accepted,false);
 assert.equal(good.owner_pilot_authorized,false);
 assert.equal((await inspectQl246513({rawJson,env:{},now})).matched,false);
 assert.equal((await inspectQl246513({rawJson,env:{...env,ROSEVEAR_QL246_TRUSTED_DEVILNDOVE_SPKI_SHA256:'f'.repeat(64)},now})).matched,false);
 assert.equal((await inspectQl246513({rawJson,env:{...env,ROSEVEAR_QL246_CHALLENGE_ID:'np-wrong'},now})).matched,false);
 assert.equal((await inspectQl246513({rawJson,env:{...env,ROSEVEAR_QL246_EXPECTED_SOURCE_REVISION:'c'.repeat(40)},now})).matched,false);
 assert.equal((await inspectQl246513({rawJson:JSON.stringify({...record,payload:{...payload,negative_tests:{...payload.negative_tests,write_denied:false}}}),env,now})).matched,false);
 assert.equal((await inspectQl246513({rawJson:JSON.stringify({...record,payload:{...payload,connection_state:'CONNECTED'}}),env,now})).matched,false);
 assert.equal((await inspectQl246513({rawJson:JSON.stringify({...record,payload:{...payload,source_revision:'c'.repeat(40)}}),env,now})).matched,false);
 assert.equal((await inspectQl246513({rawJson:JSON.stringify({...record,signature:'A'+signature.slice(1)}),env,now})).matched,false);
 assert.equal((await inspectQl246513({rawJson,env,now:now+3600000})).matched,false);
});

test('Build513 local Product #53 disposition remains factual when primary claim unverified',async()=>{
 const db={prepare(sql){return {bind(){return this;},async all(){return {results:[]};},
  async first(){if(sql.includes('FROM products WHERE product_id=?'))return {...product,product_id:53};return null;},
  async run(){return {meta:{changes:1,last_row_id:180}};}};}};
 const url='https://devilndove.com/api/admin/product-etsy-disposition-513';
 assert.equal((await etsyGet({env:{DB:db},request:new Request(url+'?product_id=53')})).status,401);
 const ctx={...actor,env:{DB:db}};
 const result=await etsyGet({...ctx,request:new Request(url+'?product_id=53')});
 assert.equal(result.status,200);
 const evidence=await result.json();assert.equal(evidence.source_claim_state,'unclaimed');
 assert.equal(evidence.can_record_independent_content_recheck,false);
 const data={action:'record_exception_disposition_followup',request_key:'28eb8e7f-16a9-4d04-b483-b1cdb5151303',
  product_id:53,listing_id:'4603838854',confirm_no_etsy_changes:true,
  expected_claim_state:'unclaimed',expected_claim_receipt_id:null,
  expected_conflicting_receipt_ids:[],confirm_unresolved_exception_review:true,
  disposition_note:'We observed the existing Etsy draft but the local listing link remains unconfirmed. Check original receipts.'};
 const make=(d,origin='https://devilndove.com')=>new Request(url,{method:'POST',headers:{Origin:origin},body:JSON.stringify(d)});
 assert.equal((await etsyPost({...ctx,request:make(data,'https://wrong.invalid')})).status,403);
 assert.equal((await etsyPost({...ctx,request:make({...data,expected_claim_state:'same_product'})})).status,409);
 const posted=await etsyPost({...ctx,request:make(data)});
 assert.equal(posted.status,200);
 assert.equal((await posted.json()).owner_final_approval,false);
});

test('Build513 QL-246 comparison is Admin-only, no live connection, all negative tests unverified by local audit',async()=>{
 const db={prepare(){return {bind(){return this;},async first(){return null;},async all(){return {results:[]};}};}};
 const url='https://devilndove.com/api/admin/integration-ql246-source-comparison-513';
 assert.equal((await gatewayGet({env:{DB:db},request:new Request(url)})).status,401);
 const value=await (await gatewayGet({...actor,env:{DB:db},request:new Request(url)})).json();
 assert.equal(value.connection_state,'DISCONNECTED');
 assert.equal(value.signed_public_source_file_published,false);
 assert.deepEqual(Object.values(value.independently_witnessed_negative_tests),Array(7).fill(false));
 assert.equal(value.ql246_proof_publication_decision,'PENDING_NOT_AUTHORIZED');
 const bad=await gatewayPost({...actor,env:{DB:db},request:new Request(url,{method:'POST',headers:{Origin:'https://devilndove.com'},body:JSON.stringify({action:'inspect_ql246_public_source_signature',request_key:'a6998e7f-16a9-4d04-b483-b1cdb5151303',raw_public_json:rawJson,confirm_nonproduction_only:true,confirm_no_private_keys:true,confirm_no_gateway_or_owner_approval:true})})});
 assert.equal(bad.status,409);
});

test('Build513 UI/copy exposes safe exception notes and QL-246 public proof but never automatic gateway activation',()=>{
 const html=read('admin/product-editor/index.html'),js=read('public/js/admin-product-etsy-package-v500.mjs');
 for(const id of ['dd513EtsyPanel','dd513ReviewContent','dd513DispositionNote','dd513RecordFollowup',
   'dd513RecordContent','dd513GatewayPanel','dd513ReviewGateway','dd513RawProof','dd513InspectPublic']){
  assert.ok(html.includes(id),id);assert.ok(js.includes(id),id);
 }
 assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=5\d\d/);
 assert.match(html,/etsy-package-500\.css\?v=5\d\d/);
 for(const file of ['functions/api/admin/product-etsy-disposition-513.js',
   'functions/api/admin/integration-ql246-source-comparison-513.js']){
  assert.doesNotMatch(read(file),/publishEtsy|createEtsy|uploadEtsy|UPDATE\s+marketplace_syndication_drafts|fetch\s*\(/i);
 }
});
