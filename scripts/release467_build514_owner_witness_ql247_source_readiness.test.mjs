import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ownerWitnessReadiness514} from '../functions/api/_lib/etsyOwnerWitness514.mjs';
import {ql247SourceReadiness514} from '../functions/api/_lib/ql247Readiness514.mjs';
import {onRequestGet as ownerGet,onRequestPost as ownerPost} from '../functions/api/admin/product-etsy-owner-witness-514.js';
import {onRequestGet as gatewayGet,onRequestPost as gatewayPost} from '../functions/api/admin/integration-ql247-readiness-514.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const admin={data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:8}}}};
const evidence={product_id:53,source_claim_state:'same_product',source_claim_receipt_id:'23',
 conflicting_photo_receipt_ids:[],issues:[],etsy_readback_ready:true,
 current_evidence_fingerprint:'a'.repeat(64),tags_require_owner_correction:false,
 description_sufficient:true,missing_original_ids:[],
 can_record_independent_content_recheck:true};
const content={admin_action_audit_id:114,actor_user_id:7,details_json:JSON.stringify({
 build:513,decision:'independent_content_evidence_rechecked_only',provider_modified:false,
 product_id:53,listing_id:'4603838854',source_claim_receipt_id:'23',
 evidence_fingerprint:'a'.repeat(64)})};

test('Build 514 owner-witness review separates factual observation from final owner acceptance and independently reviewed content',()=>{
 const good=ownerWitnessReadiness514({evidence513:evidence,priorContent:content,actorId:8});
 assert.equal(good.can_record_factual_owner_observation,true);
 assert.equal(good.can_record_independent_disposition_recheck,true);
 assert.equal(good.final_owner_content_acceptance,false);
 assert.equal(good.independent_owner_identity_verified,false);
 assert.equal(good.all_three_etsy_photos_finally_accepted,false);
 const alternating=ownerWitnessReadiness514({evidence513:{...evidence,can_record_independent_content_recheck:false,
   issues:['Independent content correction recheck requires a different verified Admin from the Build 512 photo reviewer.']},
   priorContent:content,actorId:8});
 assert.equal(alternating.can_record_independent_disposition_recheck,true);
 for(const bad of [
  {priorContent:null,actorId:8},
  {priorContent:content,actorId:7},
  {priorContent:content,actorId:8,evidence513:{...evidence,issues:['Old photo receipt conflict']}},
  {priorContent:content,actorId:8,evidence513:{...evidence,source_claim_state:'another_product'}},
  {priorContent:content,actorId:8,evidence513:{...evidence,current_evidence_fingerprint:'b'.repeat(64)}},
  {priorContent:content,actorId:8,evidence513:{...evidence,conflicting_photo_receipt_ids:[88]}},
  {priorContent:content,actorId:8,evidence513:{...evidence,tags_require_owner_correction:true}},
  {priorContent:content,actorId:8,evidence513:{...evidence,description_sufficient:false}},
 ])assert.equal(ownerWitnessReadiness514({evidence513:evidence,actorId:8,...bad}).can_record_independent_disposition_recheck,false);
});

test('QL-247 source preparation is never misreported as seven real gateway denials, key provisioning or owner pilot',()=>{
 const p=ql247SourceReadiness514({source_side_hmac_receipts_current:true,
   ql246_trusted_pin_provisioned:true,ql246_operator_challenge_provisioned:true});
 assert.equal(p.connection_state,'DISCONNECTED');
 assert.equal(p.phase_a.main_git_and_ci_provenance,'VERIFY_INDEPENDENTLY_ON_EACH_PROMOTION');
 assert.equal(p.phase_a.exact_current_main_sha,null);
 assert.equal(p.phase_b.status,'NOT_AUTHORIZED_OR_INDEPENDENTLY_VERIFIED');
 assert.deepEqual(Object.values(p.phase_b.independently_observed_negative_tests),Array(7).fill(false));
 assert.equal(p.can_publish_ql246_signed_proof,false);
 assert.equal(p.can_enable_real_gateway_connection,false);
 assert.equal(p.owner_pilot_authorization,'NOT_GIVEN');
});

const db={prepare(sql){return {bind(){return this;},async all(){return {results:[]};},
 async first(){if(sql.includes('FROM products WHERE product_id=?'))return {
  name:'Adventurine Argon',description:'Actually handmade owner-provided materials and sizes for this product',sku:'DND-01130',slug:'adventurine-argon',product_id:53};
  return null;},async run(){return {meta:{changes:1,last_row_id:204}};}};}};
const ownerUrl='https://devilndove.com/api/admin/product-etsy-owner-witness-514';
const gatewayUrl='https://devilndove.com/api/admin/integration-ql247-readiness-514';

test('Build 514 owner endpoint is Admin-only, factual and conflict-sensitive; independent disposition cannot bypass prior source evidence',async()=>{
 assert.equal((await ownerGet({env:{DB:db},request:new Request(ownerUrl+'?product_id=53')})).status,401);
 const ctx={...admin,env:{DB:db}};
 const r=await ownerGet({...ctx,request:new Request(ownerUrl+'?product_id=53')});
 assert.equal(r.status,200);const v=await r.json();
 assert.equal(v.claim_state,'unclaimed');
 assert.equal(v.can_record_independent_disposition_recheck,false);
 const b={action:'record_factual_owner_witness',request_key:'9be913f1-35aa-46e0-a3ab-e6bea17b4f14',
  product_id:53,listing_id:'4603838854',confirm_existing_draft_only:true,
  confirm_no_etsy_changes:true,confirm_not_final_approval:true,
  expected_claim_state:'unclaimed',expected_claim_receipt_id:null,
  expected_conflicting_photo_receipt_ids:[],
  observation_note:'We inspected the existing owner draft; local receipt and linked media remain unverified, and no Etsy correction was performed.',
  confirm_direct_owner_draft_inspection:true,confirm_unresolved_media_conflicts:true};
 const make=(body,origin='https://devilndove.com')=>new Request(ownerUrl,{method:'POST',headers:{Origin:origin},body:JSON.stringify(body)});
 assert.equal((await ownerPost({...ctx,request:make(b,'https://wrong.invalid')})).status,403);
 assert.equal((await ownerPost({...ctx,request:make({...b,confirm_not_final_approval:false})})).status,400);
 assert.equal((await ownerPost({...ctx,request:make({...b,expected_claim_state:'same_product'})})).status,409);
 const out=await ownerPost({...ctx,request:make(b)});
 assert.equal(out.status,200);
 const saved=await out.json();
 assert.equal(saved.factual_owner_observation_recorded,true);
 assert.equal(saved.owner_final_approval,false);
 assert.equal(saved.etsy_provider_modified,false);
 assert.equal((await ownerPost({...ctx,request:make({...b,action:'record_independent_disposition_recheck',
  confirm_corrected_description:true,confirm_corrected_tags:true,
  confirm_current_category_delivery:true,confirm_all_three_originals:true,
  confirm_independent_reviewer:true,evidence_fingerprint:'a'.repeat(64),prior_content_recheck_id:114})})).status,409);
});

test('Build 514 gateway readiness is read-only, Admin-only and accurately disconnected',async()=>{
 assert.equal((await gatewayGet({env:{DB:db},request:new Request(gatewayUrl)})).status,401);
 const v=await (await gatewayGet({...admin,env:{DB:db},request:new Request(gatewayUrl)})).json();
 assert.equal(v.connection_state,'DISCONNECTED');
 assert.equal(v.phase_a.public_ql246_source_proof_published,false);
 assert.equal(v.can_enable_real_gateway_connection,false);
 assert.equal((await gatewayPost({...admin,env:{DB:db},request:new Request(gatewayUrl,{method:'POST'})})).status,405);
});

test('Build 514 Editor surfaces actual hold actions and QL-247 phases without automatic provider or gateway calls',()=>{
 const html=read('admin/product-editor/index.html'),js=read('public/js/admin-product-etsy-package-v500.mjs');
 for(const id of ['dd514OwnerPanel','dd514Review','dd514Note','dd514RecordOwner','dd514RecordRecheck',
  'dd514GatewayPanel','dd514ReviewGateway']){
  assert.ok(html.includes(id),id);assert.ok(js.includes(id),id);
 }
 assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=5\d\d/);
 assert.match(html,/etsy-package-500\.css\?v=5\d\d/);
 assert.match(read('functions/api/admin/integration-ql247-readiness-514.js'),/read.only/i);
 for(const name of ['functions/api/admin/product-etsy-owner-witness-514.js',
  'functions/api/admin/integration-ql247-readiness-514.js'])
  assert.doesNotMatch(read(name),/publishEtsy|createEtsy|uploadEtsy|UPDATE\s+marketplace_syndication_drafts|fetch\s*\(/i);
});
