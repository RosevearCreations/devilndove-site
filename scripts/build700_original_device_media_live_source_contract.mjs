import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {claim700,assessFinance700,sourceOrigin700} from '../functions/api/admin/social-post-queue.js';
import {camera700MediaKey,camera700SummarizeReadback} from '../functions/api/admin/mobile-create-product.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T20:00:00Z'),fp='a'.repeat(64),rev='source700';
const current={queue_id:9,source_revision:rev,fingerprint_sha256:fp,
master_fresh:true,verified_master_receipt_id:920};
const prior={history_complete:true,
independent_verification:{items:[{
older_receipt_id:11,newer_receipt_id:12,
repair_intake_receipt_id:710,independent_witness_receipt_id:810,
external_document_sha256:'b'.repeat(64),
independent_document_signature_verified:true}]},master_drift_detected:true};
const keys=await Promise.all(Array.from({length:4},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const pub=async k=>Buffer.from(await crypto.subtle.exportKey('raw',k.publicKey)).toString('base64url');
const signer={id:'external_live_source_700',key:await pub(keys[0]),
thirdId:'third_document_witness_699',thirdKey:await pub(keys[1]),
custodianId:'original_custodian_696',custodianKey:await pub(keys[2]),
reconcilerId:'independent_reconciler_697',reconcilerKey:await pub(keys[3]),
originAuthorized:true};
const claim=claim700({queue_id:9,older_receipt_id:11,newer_receipt_id:12,
repair_intake_receipt_id:710,independent_document_witness_receipt_id:810,
external_document_sha256:'b'.repeat(64),source_revision:rev,
fingerprint_sha256:fp,source_discrepancies_remaining:0,
source_repair_claimed:true,signer_id:signer.id,
nonce:'aaaabbbb-cccc-dddd-eeee-ffff00001111',
observed_at:'2026-11-12T19:58:30.000Z'});
assert.deepEqual(Object.keys(claim),['v','purpose','source','queue_id',
'older_receipt_id','newer_receipt_id','repair_intake_receipt_id',
'independent_document_witness_receipt_id','external_document_sha256',
'source_revision','fingerprint_sha256','source_discrepancies_remaining',
'source_repair_claimed','signer_id','nonce','observed_at','decision']);
const signature=Buffer.from(await crypto.subtle.sign('Ed25519',keys[0].privateKey,
new TextEncoder().encode(JSON.stringify(claim)))).toString('base64url');
const payload={...claim,signature,
independent_source_signature_verified:true,original_financial_certified:false,
continuous_connection_verified:false,owner_user_id:4,owner_reviewed:true,
resolution_note:'Independent original source readback checked; bookkeeping source remains HOLD.'};
const row=(diff={},at='2026-11-12 19:59:00')=>({
social_post_attempt_id:850,attempt_status:'independent_live_source_snapshot_readback_700',
attempted_at:at,response_json:JSON.stringify({...payload,...diff})});
let r=await assessFinance700(current,prior,[],signer,now);
assert.equal(r.status,'HOLD_LIVE_SOURCE_READBACK_REQUIRED');
assert.equal(r.readback.source_receipt_count,0);
r=await assessFinance700(current,prior,[row()],signer,now);
assert.equal(r.history_complete,true);
assert.equal(r.readback.source_receipt_count,1);
assert.equal(r.readback.items[0].source_readback_receipt_id,850);
assert.equal(r.receipt_history[0].state,'FRESH_INDEPENDENT_SOURCE_SNAPSHOT_NO_FINANCIAL_CLOSE');
assert.equal(r.status,'EXTERNAL_SOURCE_SNAPSHOT_VERIFIED_PENDING_INDEPENDENT_BOOKKEEPING_ACCEPTANCE');
assert.equal(r.original_source_repaired,false);
assert.equal(r.financial_certified,false);
assert.equal(r.continuous_connection_verified,false);
for(const item of [
row({signature:'invalid'}),row({source_revision:'drift'}),
row({fingerprint_sha256:'c'.repeat(64)}),
row({external_document_sha256:'d'.repeat(64)}),
row({source_discrepancies_remaining:1}),
row({source_repair_claimed:false}),
row({signer_id:'other_source'}),
row({nonce:'not-fresh'}),
row({independent_document_witness_receipt_id:809}),
row({repair_intake_receipt_id:709}),
row({observed_at:'2026-11-12T19:00:00.000Z'}),
row({original_financial_certified:true}),
row({continuous_connection_verified:true}),
row({independent_source_signature_verified:false}),
row({resolution_note:'short'}),row({owner_reviewed:false}),
row({},'2026-11-12 19:50:00')
]){
const x=await assessFinance700(current,prior,[item],signer,now);
assert.equal(x.history_complete,false,'Tampered external receipt must fail closed');
assert.equal(x.readback.invalid_count,1);
}
for(const duplicateSigner of [
{...signer,id:signer.thirdId},{...signer,key:signer.thirdKey},
{...signer,id:signer.custodianId},{...signer,key:signer.custodianKey},
{...signer,id:signer.reconcilerId},{...signer,key:signer.reconcilerKey}]){
assert.equal((await assessFinance700(current,prior,[row()],duplicateSigner,now)).history_complete,false);
}
assert.equal((await assessFinance700(current,prior,[row(),row()],signer,now)).history_complete,false);
assert.equal((await assessFinance700(current,prior,Array(61).fill(row()),signer,now)).history_complete,false);
assert.equal((await assessFinance700(current,{...prior,history_complete:false},[],signer,now)).history_complete,false);
assert.equal((await assessFinance700({queue_id:0},{history_complete:false},[],signer,now)).status,'HOLD_SELECT_CAMPAIGN');
assert.equal((await assessFinance700(current,prior,[],{...signer,originAuthorized:false},now)).readback.source_origin_authorized,false);
// Pinned origin only, https and not local/private hosts.
assert.ok(sourceOrigin700('https://example.org/readback/v1','https://example.org'));
for(const [url,origin] of [
['http://example.org/readback','http://example.org'],
['https://other.example.org/readback','https://example.org'],
['https://localhost/readback','https://localhost'],
['https://127.0.0.1/readback','https://127.0.0.1'],
['https://192.168.1.2/readback','https://192.168.1.2'],
['https://169.254.169.254/latest','https://169.254.169.254'],
['https://internal.local/readback','https://internal.local'],
['https://user:pass@example.org/readback','https://example.org']])
assert.equal(sourceOrigin700(url,origin),null,'untrusted configured endpoint rejected: '+url);
const digest='c'.repeat(64),photo='products/28/camera699/'+digest+'.jpg',
video='products/28/video/camera699-'+digest+'.mp4';
assert.equal(camera700MediaKey(28,'photo','https://cdn.example.org/'+photo),photo);
assert.equal(camera700MediaKey(28,'photo',photo),photo);
assert.equal(camera700MediaKey(28,'video',video),video);
assert.equal(camera700MediaKey(29,'photo',photo),null);
assert.equal(camera700MediaKey(28,'photo','products/28/camera699/malicious.jpg'),null);
assert.equal(camera700MediaKey(28,'video','products/28/video/camera699-'+digest+'.exe'),null);
const positive=camera700SummarizeReadback([{kind:'photo',confirmed:true,r2_bytes:1400}],
[{kind:'video',confirmed:true,r2_bytes:24000,publication_status:'internal_review'}]);
assert.equal(positive.status,'MEDIA_R2_D1_READBACK_CONFIRMED');
assert.equal(positive.field_trial_accepted,false);
assert.equal(positive.device_accepted,false);
assert.equal(camera700SummarizeReadback([{kind:'photo',confirmed:false}],[]).status,
'HOLD_MEDIA_INCOMPLETE_OR_UNVERIFIED');
assert.equal(camera700SummarizeReadback([],[]).status,'HOLD_MEDIA_INCOMPLETE_OR_UNVERIFIED');
// Server and UI real-proof contract; no synthetic device is asserted.
const camera=read('functions/api/admin/mobile-create-product.js'),
mobile=read('admin/mobile-product/index.html'),
client=read('public/js/admin-mobile-product-augment.js');
for(const rx of [/camera700_readback/,/original_owner_verified:true/,
 /capture_reference_verified:true/,/r2_head_checked:true/,
 /typeof bucket\.head!=='function'/,/bucket\.head\(key\)/,
 /SELECT product_video_id,object_key,publication_status,file_size_bytes/,
 /SELECT product_image_id,image_url/,
 /publication_status==='internal_review'/,
 /status:photoRows\.length&&items\.length&&/])
assert.match(camera,rx);
for(const id of ['dd700FieldProof','dd700Readback','dd700ReadbackStatus',
'dd700ReadbackDetails','dd700Export','dd700ExportStatus','dd700DeviceNotes'])
assert.match(mobile,new RegExp('id="'+id+'"'));
for(const rx of [/camera700_readback/,/field700=result/,/original_owner_verified/,
 /MEDIA_R2_D1_READBACK_CONFIRMED/,/OWNER_REPORTED_FIELD_TRIAL_WITH_R2_RECEIPTS/,
 /authenticated_physical_device_testing_by_assistant:false/,
 /localStorage\.setItem\(STORE/,/independent_owner_review_required:true/,
 /Only Start Another Product clears it/])assert.match(client,rx);
// Finances: owner-triggered external GET only; no automatic GET polling or close.
const finance=read('functions/api/admin/social-post-queue.js'),
admin=read('admin/social-publishing/index.html'),
financeClient=read('public/js/admin-social-platform-preflight.js');
for(const rx of [/export function claim700\(/,/export async function assessFinance700\(/,
 /async function liveSourceReadback700\(/,/async function finance700\(/,
 /sourceOrigin700\(env\?\.FINANCIAL_SOURCE_LIVE_READBACK_URL_700/,
 /FINANCIAL_SOURCE_LIVE_READBACK_BEARER_700/,/redirect:'manual'/,
 /crypto\.randomUUID\(\)/,/AbortController\(\)/,
 /independent_live_source_snapshot_readback_700/,/finance_owner_review_700/,
 /owner_live_source_readback_700/,/financial700:await finance700/,
 /if\(params.get\('export'\)==='financial700'\)/,
 /original_source_repaired:false,financial_certified:false/])
assert.match(finance,rx);
for(const id of ['dd700-finance','dd700FinanceRefresh','dd700FinanceExport',
'dd700FinanceStatus','dd700FinanceStats','dd700FinanceCases',
'dd700FinanceForm','dd700FinanceSource','dd700FinanceNote',
'dd700FinanceReviewed','dd700FinanceSubmit','dd700FinanceResult'])
assert.match(admin,new RegExp('id="'+id+'"'));
for(const rx of [/function draw700\(d\)/,/owner_live_source_readback_700/,
 /export=financial700/,/draw699\(d\);\s*draw700\(d\)/])
assert.match(financeClient,rx);
assert.match(read('.github/workflows/current-application-quality.yml'),
/build700_original_device_media_live_source_contract\.mjs/);
console.log('BUILD 700 PASS: independent real phone field proof remains owner-only, exact D1/R2 HEAD readback, fourth signer fresh external HTTPS source readback with no automatic financial closure');
