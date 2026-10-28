import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomBytes,webcrypto} from 'node:crypto';
import {evidenceRenewal511} from '../functions/api/_lib/etsyRenewal511.mjs';
import {gatewayReceiptReadiness511} from '../functions/api/_lib/gatewayReceipt511.mjs';
import {onRequestGet as evidenceGet,onRequestPost as evidencePost} from '../functions/api/admin/product-etsy-evidence-renewal-511.js';
import {onRequestGet as gatewayGet,onRequestPost as gatewayPost} from '../functions/api/admin/integration-gateway-receipt-verification-511.js';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const owner={data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7,email:'owner@test.invalid'}}}};
const listing='4603838854',fingerprint='c'.repeat(64);
const claim={confirmed:true,claim_state:'same_product',listing_id:listing,receipt_id:'etsy-saved-primary-53'};
const witness={admin_action_audit_id:31,actor_user_id:7,details_json:JSON.stringify({build:510,product_id:53,listing_id:listing,
  source_claim_state:'unclaimed',conclusion:'observation_only_not_provider_verified'})};
const retest={admin_action_audit_id:41,actor_user_id:7,details_json:JSON.stringify({build:510,listing_id:listing,
  source_claim_receipt_id:claim.receipt_id,evidence_fingerprint:fingerprint,source_evidence_verified:true,
  photo_original_ids:[344,345,346],publication_performed:false,provider_modified:false})};
const rows=[344,345,346].map(id=>({product_image_id:id,ready:true,receipt_confirmed:true,
  etsy_image_id:String(1000+id),original_image_url:`https://devilndove.com/media/${id}.jpg`,
  etsy_image_url:`https://i.etsystatic.com/images/${id}.jpg`}));
const live={verified_unpublished:true,verified_canada_only:true,evidence_fingerprint_508:fingerprint,
  photo_freshness_509:{ready:true,rows}};
const config={ROSEVEAR_QL243_DEPLOYMENT_CLASS:'nonproduction',ROSEVEAR_QL243_NONPROD_KEY_ID:'np-devilndove-current',
 ROSEVEAR_QL243_NONPROD_HMAC_KEY_B64:randomBytes(32).toString('base64')};

test('Build511 photo evidence renewal requires same primary link, current three URLs/receipts, prior Build510 digest and distinct Admin',()=>{
 const fresh=evidenceRenewal511({claim,review:live,witness,retest,reviewerId:8});
 assert.equal(fresh.can_record_photo_renewal,true);
 assert.equal(fresh.can_record_witness_followup,true);
 assert.equal(fresh.fresh_three_original_pairs,true);
 assert.equal(fresh.owner_final_acceptance_recorded,false);
 assert.equal(evidenceRenewal511({claim,review:live,witness,retest,reviewerId:7}).can_record_photo_renewal,false);
 assert.equal(evidenceRenewal511({claim:{...claim,confirmed:false},review:live,witness,retest,reviewerId:8}).can_record_photo_renewal,false);
 assert.equal(evidenceRenewal511({claim,review:{...live,evidence_fingerprint_508:'d'.repeat(64)},witness,retest,reviewerId:8}).can_record_photo_renewal,false);
 assert.equal(evidenceRenewal511({claim,review:{...live,photo_freshness_509:{ready:false,rows}},witness,retest,reviewerId:8}).can_record_photo_renewal,false);
 assert.equal(evidenceRenewal511({claim,review:{...live,photo_freshness_509:{ready:true,rows:rows.slice(1)}},witness,retest,reviewerId:8}).can_record_photo_renewal,false);
 assert.equal(evidenceRenewal511({claim,review:live,witness,retest:{...retest,details_json:JSON.stringify({...JSON.parse(retest.details_json),publication_performed:true})},reviewerId:8}).can_record_photo_renewal,false);
});

test('Build511 local witness follow-up is never a verified Etsy linking action and independently checks source claim state',async()=>{
 const db={statements:[],prepare(sql){this.statements.push(sql);return {bind(){return this;},
  async all(){return {results:[]};},async first(){
   if(sql.includes("action_type='etsy_510_unlinked_candidate_witnessed'"))return witness;
   return null;
  },async run(){return {meta:{changes:1,last_row_id:75}};}};}};
 const path='https://devilndove.com/api/admin/product-etsy-evidence-renewal-511';
 const context={...owner,env:{DB:db}};
 assert.equal((await evidenceGet({env:{},request:new Request(path+'?product_id=53')})).status,401);
 const preview=await evidenceGet({...context,request:new Request(path+'?product_id=53')});
 assert.equal(preview.status,200);const check=await preview.json();
 assert.equal(check.claim_state,'unclaimed');assert.equal(check.can_record_witness_followup,true);
 assert.equal(check.can_record_photo_renewal,false);
 const body={action:'record_claim_witness_followup',product_id:53,listing_id:listing,
  expected_claim_state:'unclaimed',request_key:'e09a2443-22e1-402f-ae8d-9d198043220c',
  confirm_manual_claim_review:true,confirm_no_provider_write:true,
  next_action:'Read the actual Etsy draft and confirm the exact saved Product claim before changing anything.'};
 const request=(origin,b)=>new Request(path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(b)});
 assert.equal((await evidencePost({...context,request:request('https://example.invalid',body)})).status,403);
 assert.equal((await evidencePost({...context,request:request('https://devilndove.com',{...body,expected_claim_state:'same_product'})})).status,409);
 const saved=await evidencePost({...context,request:request('https://devilndove.com',body)});
 assert.equal(saved.status,200);const result=await saved.json();
 assert.equal(result.witness_followup_recorded,true);assert.equal(result.etsy_draft_created,false);
 assert.equal(result.local_claim_reassigned,false);assert.equal(result.provider_modified,false);
 assert.ok(!db.statements.some(sql=>/UPDATE\s+marketplace_syndication_drafts|INSERT\s+INTO\s+marketplace_syndication_drafts/i.test(sql)));
});

test('Build511 gateway source receipt verification requires actual fresh identity-matched source receipts and separate owner review; external gateway proof remains absent',()=>{
 const now=Date.now(),time=new Date(now-180000).toISOString();
 const record=(path,id)=>({admin_action_audit_id:id,request_path:path,created_at:time,details_json:JSON.stringify({
  source:'ai-data-platform',destination:'devilndove',business:'devilndove',tenant:null,
  environment:'nonproduction',key_id:config.ROSEVEAR_QL243_NONPROD_KEY_ID,
  contract_version:'rosevear.integration.v1',scope:'health_capabilities_get_only',
  decision:'read_only_accepted',provider_modified:false,publication_performed:false})});
 const proofs=[record('/api/integration/v1/health',11),record('/api/integration/v1/capabilities',12)];
 const handoff={admin_action_audit_id:20,actor_user_id:7,details_json:JSON.stringify({environment:'nonproduction',
  source_side_receipts_only:true,nonproduction_key_id:config.ROSEVEAR_QL243_NONPROD_KEY_ID,
  scope:'read_only_health_and_capabilities_handoff',credentials_provisioned:false,approved_for_live_data:false})};
 const separated={admin_action_audit_id:30,actor_user_id:8,details_json:JSON.stringify({owner_handoff_receipt_id:20,
  source_health_receipt_id:11,source_capabilities_receipt_id:12,review_scope:'nonproduction_signed_gets_only',
  gateway_signed_receipts_verified:false,owner_pilot_authorized:false})};
 const check=gatewayReceiptReadiness511(config,proofs,handoff,separated,now);
 assert.equal(check.source_receipts_verified,true);assert.equal(check.owner_separation_verified,true);
 assert.equal(check.connection_state,'HOLD');assert.equal(check.gateway_signed_receipts_verified,false);
 assert.equal(check.owner_read_only_pilot_authorized,false);assert.equal(check.gateway_audit_id,null);
 assert.equal(gatewayReceiptReadiness511(config,proofs,{...handoff,actor_user_id:8},separated,now).owner_separation_verified,false);
 assert.equal(gatewayReceiptReadiness511(config,proofs,handoff,{...separated,details_json:JSON.stringify({...JSON.parse(separated.details_json),source_health_receipt_id:99})},now).owner_separation_verified,false);
 assert.equal(gatewayReceiptReadiness511(config,[{...proofs[0],created_at:new Date(now-86400001).toISOString()},proofs[1]],handoff,separated,now).source_receipts_verified,false);
 assert.equal(gatewayReceiptReadiness511(config,[{...proofs[0],details_json:JSON.stringify({...JSON.parse(proofs[0].details_json),business:'yw'})},proofs[1]],handoff,separated,now).source_receipts_verified,false);
 assert.equal(gatewayReceiptReadiness511({...config,ROSEVEAR_QL243_NONPROD_REVOKED:'true'},proofs,handoff,separated,now).source_receipts_verified,false);
});

test('Build511 gateway verifier is read-only verified-Admin, and no POST can approve a gateway',async()=>{
 const path='https://devilndove.com/api/admin/integration-gateway-receipt-verification-511';
 assert.equal((await gatewayGet({env:{},request:new Request(path)})).status,401);
 assert.equal((await gatewayPost({request:new Request(path,{method:'POST'})})).status,405);
 const db={prepare(){return {bind(){return this;},async all(){return {results:[]};},async first(){return null;}};}};
 const response=await gatewayGet({...owner,env:{DB:db},request:new Request(path)});
 assert.equal(response.status,200);const body=await response.json();
 assert.equal(body.connection_state,'HOLD');assert.equal(body.gateway_signed_receipts_verified,false);
 assert.equal(body.gateway_audit_datastore_restart_verified,false);
});

test('Build511 Etsy numeric listing guard prevents the observed #true button and unverified photo-receipt mismatch',async()=>{
 const js=read('public/js/admin-product-etsy-package-v500.mjs');
 assert.match(js,/numericEtsyListing511\(partial\.value\?\.linked_listing_id\)/);
 assert.match(js,/state\.linked=numericEtsyListing511\(error\.partialLink\)/);
 assert.match(js,/state\.linkReadbackHold=error\.linkReadbackHold===true/);
 assert.match(js,/assessment\.media_identity_hold=true/);
 assert.match(js,/photo-record verification is missing/);
 // Import in an inert page shell to exercise the actual browser helper.
 globalThis.document={getElementById:()=>null};globalThis.location={search:''};
 const {numericEtsyListing511}=await import('../public/js/admin-product-etsy-package-v500.mjs');
 for(const raw of [true,false,'true','false',null,undefined,{},[],0,-1,'0','abc','1.5','9999999999999999999'])
  assert.equal(numericEtsyListing511(raw),'',JSON.stringify(raw));
 assert.equal(numericEtsyListing511(listing),listing);
 assert.equal(numericEtsyListing511(Number(listing)),listing);
});

test('Build511 UI has separately actionable witness follow-up, independent three-photo renewal and gateway provenance checks',()=>{
 const html=read('admin/product-editor/index.html'),js=read('public/js/admin-product-etsy-package-v500.mjs');
 for(const id of ['dd511EvidencePanel','dd511ReviewEvidence','dd511NextAction','dd511ManualClaim','dd511NoProvider',
  'dd511RecordWitnessFollowup','dd511PhotoPairs','dd511Photo344','dd511Photo345','dd511Photo346',
  'dd511Visual','dd511Independent','dd511RecordPhotoRenewal','dd511GatewayPanel','dd511ReviewGateway']){
   assert.ok(html.includes(id),id);assert.ok(js.includes(id),id);
 }
 assert.match(html,/admin-product-etsy-package-v500\.mjs\?v=5\d\d/);
 assert.match(html,/etsy-package-500\.css\?v=5\d\d/);
 assert.doesNotMatch(read('functions/api/admin/product-etsy-evidence-renewal-511.js'),/fetch\s*\(|publishEtsy|uploadEtsy|createEtsy/);
});
