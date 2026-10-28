import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {conflictReassessment515,DISPOSITIONS_515} from '../functions/api/_lib/etsyConflictReassessment515.mjs';
import {ql248Prerequisites515} from '../functions/api/_lib/ql248Prerequisites515.mjs';
import {onRequestGet as ownerGet,onRequestPost as ownerPost} from '../functions/api/admin/product-etsy-conflict-reassessment-515.js';
import {onRequestGet as gatewayGet,onRequestPost as gatewayPost} from '../functions/api/admin/integration-ql247-prerequisites-515.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const admin={data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:8}}}};
const review514={product_id:53,claim_state:'unclaimed',claim_receipt_id:null,
 conflicting_photo_receipt_ids:[],current_evidence_fingerprint:null,issues:['Unlinked exact primary draft']};
const owner={admin_action_audit_id:137,actor_user_id:7,details_json:JSON.stringify({build:514,
 product_id:53,listing_id:'4603838854',decision:'factual_owner_draft_observation_only',
 claim_state:'unclaimed',claim_receipt_id:null,conflicting_photo_receipt_ids:[],
 observation_note:'We inspected the exact draft, but an independent current Etsy source linkage has not been verified.',
 etsy_provider_modified:false,final_owner_approval:false})};

test('Build 515 unresolved owner-conflict reassessment requires exact previous witness and distinct Admin',()=>{
 const good=conflictReassessment515({review514,priorOwner:owner,actorId:8});
 assert.equal(good.can_record_independent_conflict_reassessment,true);
 assert.equal(good.final_owner_approval,false);
 assert.equal(good.historical_media_conflict_resolved,false);
 assert.equal(good.etsy_provider_modified,false);
 assert.deepEqual(good.allowed_unresolved_dispositions,[...DISPOSITIONS_515]);
 assert.equal(conflictReassessment515({review514,actorId:8}).can_record_independent_conflict_reassessment,false);
 assert.equal(conflictReassessment515({review514,priorOwner:owner,actorId:7}).can_record_independent_conflict_reassessment,false);
 assert.equal(conflictReassessment515({review514:{...review514,claim_state:'another_product'},priorOwner:owner,actorId:8}).can_record_independent_conflict_reassessment,false);
 assert.equal(conflictReassessment515({review514:{...review514,conflicting_photo_receipt_ids:[42]},priorOwner:owner,actorId:8}).can_record_independent_conflict_reassessment,false);
 assert.equal(conflictReassessment515({review514:{...review514,claim_receipt_id:'99'},priorOwner:owner,actorId:8}).can_record_independent_conflict_reassessment,false);
});

test('QL-248 preserves distinct signed source SHA and later proof commit, without claiming external consumer or GET approval',()=>{
 const value=ql248Prerequisites515({phase:'A_PUBLIC_SOURCE_PREPARATION',phase_a:{trusted_ql246_public_pin_configured:true}});
 assert.equal(value.connection_state,'DISCONNECTED');
 assert.equal(value.ql248_two_revision_amendment.status,'PROPOSED_AWAITING_INDEPENDENT_CONSUMER_AGREEMENT');
 assert.equal(value.ql248_two_revision_amendment.signed_source_revision_field,'payload.source_revision');
 assert.equal(value.ql248_two_revision_amendment.proof_commit_field,'proofCommitSha');
 assert.equal(value.ql248_two_revision_amendment.proof_commit_location,'INDEPENDENT_OPERATOR_MANIFEST_NOT_SIGNED_FILE');
 assert.equal(value.ql248_two_revision_amendment.ai_data_platform_consumer_agreement_verified,false);
 assert.equal(value.scope.owner_nonproduction_test_authorized,false);
 assert.deepEqual(Object.values(value.phase_b.real_negative_denial_cases),Array(7).fill(false));
 assert.equal(value.can_run_authenticated_test,false);
 assert.equal(value.can_publish_ql246_proof,false);
 assert.equal(value.can_mark_connected,false);
});

const db={prepare(sql){return {bind(){return this;},async all(){return {results:[]};},
 async first(){if(sql.includes('FROM products WHERE product_id=?'))return {product_id:53,
  name:'Adventurine Argon',description:'Genuine owner handmade materials, dimensions and visual details',sku:'DND-01130',slug:'adventurine-argon'};
  if(sql.includes("action_type='etsy_514_factual_owner_witness'"))return owner;
  return null;},async run(){return {meta:{changes:1,last_row_id:277}};}};}};
const ownerUrl='https://devilndove.com/api/admin/product-etsy-conflict-reassessment-515';
const gatewayUrl='https://devilndove.com/api/admin/integration-ql247-prerequisites-515';

test('Build 515 source-sensitive Admin route records only an independently reviewed unresolved owner discrepancy',async()=>{
 assert.equal((await ownerGet({env:{DB:db},request:new Request(ownerUrl+'?product_id=53')})).status,401);
 const ctx={...admin,env:{DB:db}};
 const value=await (await ownerGet({...ctx,request:new Request(ownerUrl+'?product_id=53')})).json();
 assert.equal(value.can_record_independent_conflict_reassessment,true);
 assert.equal(value.reassessment_outcome,'OWNER_EXCEPTION_UNRESOLVED_HOLD');
 const b={action:'record_independent_conflict_reassessment',request_key:'bbd7ae42-4fbe-4cb9-bbe5-60c4d7e1a515',
  product_id:53,listing_id:'4603838854',prior_owner_witness_id:137,
  expected_claim_state:'unclaimed',expected_claim_receipt_id:null,
  expected_conflicting_receipt_ids:[],expected_photo_fingerprint:null,
  disposition:'needs_listing_identity_verification',
  observation_note:'We independently inspected the saved Product; Etsy listing #4603838854 must still be independently linked and its photo receipts verified.',
  confirm_exact_existing_draft:true,confirm_distinct_reviewer:true,
  confirm_unresolved_only:true,confirm_no_etsy_changes:true};
 const request=(data,origin='https://devilndove.com')=>new Request(ownerUrl,{method:'POST',headers:{Origin:origin},body:JSON.stringify(data)});
 assert.equal((await ownerPost({...ctx,request:request(b,'https://wrong.invalid')})).status,403);
 assert.equal((await ownerPost({...ctx,request:request({...b,disposition:'conflict_closed'})})).status,400);
 assert.equal((await ownerPost({...ctx,request:request({...b,expected_claim_state:'same_product'})})).status,409);
 const good=await ownerPost({...ctx,request:request(b)});
 assert.equal(good.status,200);
 const saved=await good.json();
 assert.equal(saved.independent_unresolved_reassessment_recorded,true);
 assert.equal(saved.historical_media_conflict_resolved,false);
 assert.equal(saved.publication_performed,false);
});

test('Build 515 test-prerequisite route is Admin-only and no owner test authorization or credential issuance is possible',async()=>{
 assert.equal((await gatewayGet({env:{DB:db},request:new Request(gatewayUrl)})).status,401);
 const ctx={...admin,env:{DB:db}};
 const value=await (await gatewayGet({...ctx,request:new Request(gatewayUrl)})).json();
 assert.equal(value.nonproduction_test_authorized,false);
 assert.equal(value.ql248_two_revision_amendment.ai_data_platform_consumer_agreement_verified,false);
 const b={action:'record_local_test_prerequisite_review',request_key:'5c5e5943-30e0-4342-a12b-51f15ac8b515',
  source_system:'devilndove',business_id:'devilndove',tenant_id:null,
  prerequisite_note:'No independently authenticated owner nonproduction test scope, pin and real negative-denial trace evidence are available.',
  confirm_no_nonproduction_test_authorization:true,confirm_no_credential_or_secret_provision:true,
  confirm_two_sha_proposed_only:true,confirm_no_gateway_request:true};
 const request=(data,origin='https://devilndove.com')=>new Request(gatewayUrl,{method:'POST',headers:{Origin:origin},body:JSON.stringify(data)});
 assert.equal((await gatewayPost({...ctx,request:request(b,'https://wrong.invalid')})).status,403);
 assert.equal((await gatewayPost({...ctx,request:request({...b,confirm_no_nonproduction_test_authorization:false})})).status,400);
 assert.equal((await gatewayPost({...ctx,request:request({...b,prerequisite_note:'Bearer secret-token=broken-should-never-be-here'})})).status,400);
 const good=await gatewayPost({...ctx,request:request(b)});
 assert.equal(good.status,200);
 const saved=await good.json();
 assert.equal(saved.status,'OPERATOR_PREREQUISITES_NOT_APPROVAL');
 assert.equal(saved.credentials_provisioned,false);
 assert.equal(saved.connection_state,'DISCONNECTED');
});

test('Build 515 interface exposes only unresolved owner reassessment and QL-248 proposed prerequisite review',()=>{
 const html=read('admin/product-editor/index.html'),js=read('public/js/admin-product-etsy-package-v500.mjs');
 for(const id of ['dd515OwnerPanel','dd515ReviewOwner','dd515Disposition','dd515Observation','dd515RecordOwner',
  'dd515GatewayPanel','dd515ReviewGateway','dd515TestNote','dd515RecordGateway']){
  assert.ok(html.includes(id),id);assert.ok(js.includes(id),id);
 }
 assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=51[56]/);
 assert.match(html,/etsy-package-500\.css\?v=515/);
 for(const file of ['functions/api/admin/product-etsy-conflict-reassessment-515.js',
  'functions/api/admin/integration-ql247-prerequisites-515.js'])
  assert.doesNotMatch(read(file),/publishEtsy|createEtsy|uploadEtsy|UPDATE\s+marketplace_syndication_drafts|fetch\s*\(/i);
});
