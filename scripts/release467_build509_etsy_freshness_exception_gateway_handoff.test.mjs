import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {evidencePacket508,fingerprint508} from '../functions/api/_lib/etsyCloseout508.mjs';
import {sourcePhotoSnapshot509,independentReceipt509,ORIGINAL_IDS_509} from '../functions/api/_lib/etsyIndependent509.mjs';
import {onRequestGet as exceptionGet,onRequestPost as exceptionPost} from '../functions/api/admin/product-etsy-independent-review-509.js';
import {onRequestGet as handoffGet,onRequestPost as handoffPost} from '../functions/api/admin/integration-gateway-security-handoff-509.js';

if(!globalThis.crypto)globalThis.crypto=webcrypto;
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const owner={data:{ddModuleAccess:{allowed:true,user:{role:'admin',is_active:1,user_id:7,email:'owner@test.invalid'}}}};
const listing='4603838854';
const gallery=[344,345,346].map(i=>({product_image_id:i,image_url:`https://devilndove.com/media/original-${i}.jpg`,public_use_status:'approved',alt_text:'Product view'}));
const remoteImages=[344,345,346].map(i=>({listing_image_id:String(500+i),url_fullxfull:`https://i.etsystatic.com/photo-${i}.jpg`}));
const accepted=[344,345,346].map(i=>({product_image_id:i,listing_id:listing,etsy_image_id:String(500+i),verified_remote_readback:true}));

test('Build509 separately checks each source image URL and current Etsy photo URL against its unique receipt',()=>{
 const value=sourcePhotoSnapshot509({gallery,remoteImages,accepted,listingId:listing});
 assert.equal(value.ready,true);assert.deepEqual(value.rows.map(x=>x.product_image_id),ORIGINAL_IDS_509);
 assert.ok(value.rows.every(row=>row.original_image_url&&row.etsy_image_url&&row.ready));
 assert.equal(sourcePhotoSnapshot509({gallery,remoteImages:[remoteImages[0],remoteImages[1]],accepted,listingId:listing}).ready,false);
 assert.equal(sourcePhotoSnapshot509({gallery:[gallery[0],gallery[1]],remoteImages,accepted,listingId:listing}).ready,false);
 assert.equal(sourcePhotoSnapshot509({gallery,remoteImages,accepted:[accepted[0],accepted[1]],listingId:listing}).ready,false);
 assert.equal(sourcePhotoSnapshot509({gallery,remoteImages,accepted:[accepted[0],accepted[1],{...accepted[2],etsy_image_id:String(remoteImages[0].listing_image_id)}],listingId:listing}).ready,false);
 assert.equal(sourcePhotoSnapshot509({gallery,remoteImages:remoteImages.map((row,i)=>i===2?{...row,url_fullxfull:''}:row),accepted,listingId:listing}).ready,false);
});

test('Build509 evidence SHA covers actual original and Etsy URLs, even when image IDs remain identical',async()=>{
 const base={product:{product_id:53,name:'Adventurine Argon',sku:'DND-01130'},listing:{listing_id:listing,state:'draft'},gallery,remoteImages,accepted,tags:['adventurine']};
 const fp=await fingerprint508(evidencePacket508(base));
 const sourceChanged={...base,gallery:gallery.map((row,i)=>i===0?{...row,image_url:'https://devilndove.com/media/new-photo.jpg'}:row)};
 const remoteChanged={...base,remoteImages:remoteImages.map((row,i)=>i===0?{...row,url_fullxfull:'https://i.etsystatic.com/new-photo.jpg'}:row)};
 assert.notEqual(await fingerprint508(evidencePacket508(sourceChanged)),fp);
 assert.notEqual(await fingerprint508(evidencePacket508(remoteChanged)),fp);
});

test('Build509 independent review requires a different verified actor and exact unchanged signed owner closeout',()=>{
 const fp='a'.repeat(64),review={ready:true,listing_id:listing,evidence_fingerprint_508:fp,
  photo_freshness_509:sourcePhotoSnapshot509({gallery,remoteImages,accepted,listingId:listing})};
 const prior={actor_user_id:7,details_json:JSON.stringify({product_id:53,listing_id:listing,evidence_fingerprint:fp,
  confirmed_photo_ids:[344,345,346],publication_performed:false,provider_modified:false})};
 assert.equal(independentReceipt509({prior,review,actorId:7}).ready,false);
 assert.equal(independentReceipt509({prior,review,actorId:8}).ready,true);
 assert.equal(independentReceipt509({prior,review:{...review,evidence_fingerprint_508:'b'.repeat(64)},actorId:8}).ready,false);
 assert.equal(independentReceipt509({prior,review:{...review,photo_freshness_509:{ready:false}},actorId:8}).ready,false);
 assert.equal(independentReceipt509({prior:{...prior,details_json:JSON.stringify({...JSON.parse(prior.details_json),publication_performed:true})},review,actorId:8}).ready,false);
});

test('Build509 Etsy exception review rejects unauthenticated, wrong Product, cross-origin and unconfirmed decisions',async()=>{
 const url='https://devilndove.com/api/admin/product-etsy-independent-review-509';
 assert.equal((await exceptionGet({request:new Request(url+'?product_id=53'),env:{}})).status,401);
 const db={prepare(){throw Error('must not use D1 on invalid input');}};
 assert.equal((await exceptionGet({...owner,request:new Request(url+'?product_id=52'),env:{DB:db}})).status,400);
 const body={action:'record_independent_acceptance',product_id:53,listing_id:listing,request_key:'ba47d4a0-ef40-4152-9123-23e0370c355e',
  evidence_fingerprint:'a'.repeat(64),confirm_no_etsy_changes:true};
 const request=(origin,b)=>new Request(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(b)});
 assert.equal((await exceptionPost({...owner,request:request('https://foreign.invalid',body),env:{DB:db}})).status,403);
 assert.equal((await exceptionPost({...owner,request:request('https://devilndove.com',body),env:{DB:db}})).status,400);
 assert.equal((await exceptionPost({...owner,request:request('https://devilndove.com',{...body,action:'record_exception_followup',category:'unknown',next_action:'Investigate the evidence'}),env:{DB:db}})).status,400);
});

test('unlinked Product #53 can record a factual manual exception follow-up without accepting or changing Etsy',async()=>{
 const statements=[];
 const db={prepare(sql){statements.push(sql);return {bind(){return this;},async first(){return null;},async run(){return {meta:{changes:1,last_row_id:93}};}};}};
 const url='https://devilndove.com/api/admin/product-etsy-independent-review-509';
 const context={...owner,env:{DB:db}};
 const preview=await exceptionGet({...context,request:new Request(url+'?product_id=53')});
 assert.equal(preview.status,200);const read=await preview.json();
 assert.equal(read.listing_id,null);assert.equal(read.exception_followup_allowed,true);
 assert.equal(read.ready_for_independent_review,false);
 const body={action:'record_exception_followup',product_id:53,listing_id:listing,
  request_key:'d938d06d-8c45-428a-a284-2524bb31c424',evidence_fingerprint:null,
  confirm_no_etsy_changes:true,category:'listing_claim',next_action:'Review our saved Etsy draft #4603838854 with the owner and establish the genuine local link.'};
 const response=await exceptionPost({...context,request:new Request(url,{method:'POST',
  headers:{Origin:'https://devilndove.com','Content-Type':'application/json'},body:JSON.stringify(body)})});
 assert.equal(response.status,200);const result=await response.json();
 assert.equal(result.exception_followup_recorded,true);assert.equal(result.owner_exception_resolved,false);
 assert.equal(result.provider_modified,false);assert.equal(result.publication_performed,false);
 assert.ok(statements.some(sql=>sql.includes('(?=0 OR EXISTS')));
});

test('Build509 gateway security handoff is authenticated and requires explicit read-only attestations',async()=>{
 const url='https://devilndove.com/api/admin/integration-gateway-security-handoff-509';
 assert.equal((await handoffGet({request:new Request(url),env:{}})).status,401);
 const db={prepare(){throw Error('must not use D1 on invalid input');}};
 const body={action:'record_read_only_security_handoff',request_key:'bdce77ec-52f8-4f8a-b4e2-48c412adfb0b',environment:'test'};
 const request=(origin,b)=>new Request(url,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(b)});
 assert.equal((await handoffPost({...owner,request:request('https://foreign.invalid',body),env:{DB:db}})).status,403);
 assert.equal((await handoffPost({...owner,request:request('https://devilndove.com',body),env:{DB:db}})).status,400);
 const api=source('functions/api/admin/integration-gateway-security-handoff-509.js');
 assert.match(api,/snapshot\.state!=='TESTING'/);assert.match(api,/accepted_health_receipt/);
 assert.match(api,/accepted_capabilities_receipt/);assert.match(api,/credentials_provisioned:false/);
 assert.match(api,/approved_for_live_data:false/);assert.doesNotMatch(api,/\.put\(|fetch\(|writeSecret/);
});

test('Build509 UI provides three side-by-side original/Etsy photos and independent manual review; no blind publish',()=>{
 const page=source('admin/product-editor/index.html'),client=source('public/js/admin-product-etsy-package-v500.mjs');
 for(const id of ['dd509Review','dd509Photos','dd509ExceptionCategory','dd509NextAction','dd509NoEtsyChange',
  'dd509RecordException','dd509ConfirmPhotos','dd509ConfirmMetadata','dd509ConfirmDelivery','dd509ConfirmSeparate','dd509IndependentAccept',
  'dd509GatewayReview','dd509GatewayRotation','dd509GatewayTenant','dd509GatewaySecrets','dd509GatewayNoDispatch','dd509GatewayHandoff']){
  assert.match(page,new RegExp(id));assert.match(client,new RegExp(id));
 }
 const css=source('admin/product-editor/etsy-package-500.css');
 assert.match(css,/\.dd509-photo-grid/);assert.match(css,/object-fit:contain/);
 assert.match(client,/record_exception_followup/);assert.match(client,/record_independent_acceptance/);
 assert.match(page,/admin-product-etsy-package-v500\.mjs\?v=5\d\d/);
 assert.match(page,/etsy-package-500\.css\?v=5\d\d/);
 const exception=source('functions/api/admin/product-etsy-independent-review-509.js');
 assert.match(exception,/separate_reviewer/);assert.match(exception,/etsy_509_exception_followup_recorded/);
 assert.doesNotMatch(exception,/publishEtsy|createEtsy|uploadEtsy|fetch\s*\(/);
});
