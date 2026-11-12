import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {assessFinance699,claim699} from '../functions/api/admin/social-post-queue.js';
import {cameraCaptureToken699,cameraPhotoObjectKey699} from '../functions/api/admin/mobile-create-product.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T15:00:00Z'),fingerprint='a'.repeat(64),revision='source699';
const current={queue_id:9,source_revision:revision,fingerprint_sha256:fingerprint,master_fresh:true,
verified_master_receipt_id:920};
const prior={history_complete:true,source_repair:{original_mismatch_count:1,items:[{
older_receipt_id:21,newer_receipt_id:23,repair_proof_intake_recorded:true,
repair_proof_receipt_id:810}]},
owner_evidence_history:[{decision:'intake_source_repair_proof',
state:'SOURCE_REPAIR_DOCUMENT_INTAKE_UNVERIFIED',
receipt_id:810,older_receipt_id:21,newer_receipt_id:23,
external_document_sha256:'b'.repeat(64),external_reference:'repair.doc.699/source'}],
recovery:{pending_followup_count:1},master:{drift_detected:true}};
const keys=await Promise.all(Array.from({length:3},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const b64=async k=>Buffer.from(await crypto.subtle.exportKey('raw',k.publicKey)).toString('base64url');
const signedBy={id:'third_independent_repair_document_verifier_699',key:await b64(keys[0]),
custodianId:'custodian_696',custodianKey:await b64(keys[1]),
reconcilerId:'reconciler_697',reconcilerKey:await b64(keys[2])};
const claim=claim699({queue_id:9,older_receipt_id:21,newer_receipt_id:23,repair_intake_receipt_id:810,
external_document_sha256:'b'.repeat(64),external_reference:'repair.doc.699/source',
source_revision:revision,fingerprint_sha256:fingerprint,
independent_verifier_id:signedBy.id,nonce:'UniqueOriginalNonce699AAAA',
issued_at:'2026-11-12T14:58:00.000Z'});
assert.deepEqual(Object.keys(claim),['v','purpose','source','queue_id','older_receipt_id',
'newer_receipt_id','repair_intake_receipt_id','external_document_sha256','external_reference',
'source_revision','fingerprint_sha256','independent_verifier_id','nonce','issued_at','decision']);
const signature=Buffer.from(await crypto.subtle.sign('Ed25519',keys[0].privateKey,
new TextEncoder().encode(JSON.stringify(claim)))).toString('base64url');
const base={decision:'attest_repair_document_provenance',older_receipt_id:21,newer_receipt_id:23,
repair_intake_receipt_id:810,
external_document_sha256:'b'.repeat(64),external_reference:'repair.doc.699/source',
source_revision:revision,fingerprint_sha256:fingerprint,
independent_verifier_id:signedBy.id,nonce:claim.nonce,issued_at:claim.issued_at,
signature,owner_reviewed:true,owner_user_id:4,
resolution_note:'Original repair document independently signed; the actual financial source remains HOLD.',
original_source_repaired:false,financial_certified:false,
continuous_connection_verified:false,external_repair_verified:false};
const row=(parts={},at='2026-11-12 14:59:00')=>({
social_post_attempt_id:830,
attempt_status:'independent_source_repair_document_signature_verified_699',
attempted_at:at,response_json:JSON.stringify({...base,...parts})});
let report=await assessFinance699(current,prior,[],signedBy,now);
assert.equal(report.independent_verification.document_intake_count,1);
assert.equal(report.independent_verification.pending_signature_count,1);
assert.equal(report.original_source_repaired,false);
assert.equal(report.independent_verification.source_readback_verified_count,0);
report=await assessFinance699(current,prior,[row()],signedBy,now);
assert.equal(report.status,'HOLD_LIVE_SOURCE_REPAIR_READBACK_REQUIRED');
assert.equal(report.history_complete,true);
assert.equal(report.independent_verification.independently_signed_document_count,1);
assert.equal(report.independent_verification.items[0].independent_witness_receipt_id,830);
assert.equal(report.owner_evidence_history[0].state,
'EXTERNAL_REPAIR_DOCUMENT_AUTHENTICATED_SOURCE_READBACK_HOLD');
assert.equal(report.original_source_repaired,false);
assert.equal(report.financial_certified,false);
assert.equal(report.connection,'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY');
for(const bad of [
row({signature:'a'.repeat(86)}),
row({older_receipt_id:22}),
row({newer_receipt_id:24}),
row({repair_intake_receipt_id:809}),
row({external_document_sha256:'d'.repeat(64)}),
row({external_reference:'repair.doc.699/incorrect'}),
row({owner_reviewed:false}),
row({external_repair_verified:true}),
row({original_source_repaired:true}),
row({financial_certified:true}),
row({issued_at:'2026-11-12T14:10:00.000Z'}),
row({nonce:'bad'}),
row({source_revision:'tampered'})
]){
const out=await assessFinance699(current,prior,[bad],signedBy,now);
assert.equal(out.history_complete,false,'Invalid row must fail closed: '+bad.response_json.slice(0,100));
assert.equal(out.invalid_owner_history_count,1);
}
assert.equal((await assessFinance699(current,prior,[row()],{
...signedBy,key:signedBy.custodianKey},now)).history_complete,false);
assert.equal((await assessFinance699(current,prior,[row()],{
...signedBy,id:signedBy.reconcilerId},now)).history_complete,false);
assert.equal((await assessFinance699(current,prior,[row(),row()],signedBy,now)).history_complete,false);
assert.equal((await assessFinance699(current,prior,Array(61).fill(row()),signedBy,now)).history_complete,false);
assert.equal((await assessFinance699({...current,source_revision:'changed'},prior,[row()],signedBy,now)).history_complete,false);
assert.equal((await assessFinance699(current,{...prior,history_complete:false},[],signedBy,now)).status,
'HOLD_FINANCIAL_699_SIGNATURE_OR_SOURCE_DRIFT');
assert.equal((await assessFinance699({queue_id:0},{history_complete:false},[],signedBy,now)).status,
'HOLD_SELECT_CAMPAIGN');
// Camera: deterministic same-draft identity, same digest and no cross-product confusion.
const token='camera699-12345678-1234-1234-1234-123456789abc';
assert.equal(cameraCaptureToken699(token),token);
assert.equal(cameraCaptureToken699('camera699-tampered'),null);
assert.equal(cameraCaptureToken699('camera698-12345678-1234-1234-1234-123456789abc'),null);
const digest='b'.repeat(64);
assert.equal(cameraPhotoObjectKey699(20,digest,'jpg'),
'products/20/camera699/'+digest+'.jpg');
assert.equal(cameraPhotoObjectKey699(20,digest,'jpg'),cameraPhotoObjectKey699(20,digest,'jpg'));
assert.notEqual(cameraPhotoObjectKey699(20,digest,'jpg'),cameraPhotoObjectKey699(21,digest,'jpg'));
assert.equal(cameraPhotoObjectKey699(20,'tampered','jpg'),null);
assert.equal(cameraPhotoObjectKey699(20,digest,'exe'),null);
assert.equal(cameraPhotoObjectKey699(0,digest,'jpg'),null);
const server=read('functions/api/admin/mobile-create-product.js');
for(const rx of [/camera699_upload_only/,/capture_reference=\? AND capture_entry_mode='camera'/,
 /existing\.capture_entry_mode!=='camera'/,
 /Number\(existing\.capture_created_by_user_id\)!==Number\(adminUser\.user_id\)/,
 /crypto\.subtle\.digest\('SHA-256',buffer\)/,
 /cameraPhotoObjectKey699\(productId,digest,extension\)/,
 /WHERE NOT EXISTS \(SELECT 1 FROM product_images WHERE product_id=\? AND image_url=\?\)/,
 /same_original_draft:true/,/automatic_retry:false/,/recovered_existing_draft:true/])
assert.match(server,rx);
const video=read('functions/api/admin/product-video-attachments.js');
for(const rx of [/camera699-/,/capture_created_by_user_id/,
 /crypto\.subtle\.digest\('SHA-256',buffer\)/,
 /WHERE NOT EXISTS \(SELECT 1 FROM product_video_attachments WHERE product_id=\? AND object_key=\?\)/,
 /internal_review/,/already_attached:true/,/same_original_draft:camera699/])
assert.match(video,rx);
const mobile=read('admin/mobile-product/index.html'),
client=read('public/js/admin-mobile-product-augment.js');
for(const id of ['dd698-camera-start','dd698CameraSave','dd699New','dd699Resume','dd699Progress'])
assert.match(mobile,new RegExp('id="'+id+'"'));
for(const rx of [/dd_camera699_active_draft/,/localStorage\.setItem\(STORE/,
 /createOrRecover\(\)/,/camera699_upload_only/,/uploadPhotos\(\)/,/uploadVideo\(\)/,
 /camera699-'\+crypto\.randomUUID\(\)/,/same_original_draft/,
 /publication_performed/,/product_video_id/,/photos\.splice\(i,1\)/])
 if(rx.source!=='publication_performed')assert.match(client,rx);
// Products-first DOM order and explicit mobile fold measurement/accessible fallback.
const shop=read('shop/index.html'),shopJS=read('public/js/shop.js'),
css=read('css/shop-uniform-cards-489.css');
for(const id of ['shop699BrowseOptions','shop699JumpProducts','shopSearchInput','shopSearchButton',
'shopResultsSection','shopProducts','build208ShopCapabilityNavigation'])
assert.match(shop,new RegExp('id="'+id+'"'));
assert.ok(shop.indexOf('id="shop698SearchPanel"')<shop.indexOf('id="shopResultsSection"'));
assert.ok(shop.indexOf('id="shopResultsSection"')<shop.indexOf('id="build208ShopCapabilityNavigation"'));
assert.match(shop,/data-dd-shop-viewport-contract="699"/);
assert.match(css,/@media\(max-width:700px\)/);
assert.match(css,/max-height:116px!important/);
assert.match(css,/#shop699JumpProducts\[hidden\]/);
const start=shopJS.indexOf('  function measureFirstProduct699(){');
const end=shopJS.indexOf('  function scheduleFirstProductMeasure699(){',start);
assert.ok(start>=0&&end>start);
const measure=shopJS.slice(start,end);
function simulateFold({top,bottom,height=667,mobile=true,hasProduct=true}){
const body={dataset:{}},jump={hidden:true};
const products={querySelector:()=>hasProduct?{getBoundingClientRect:()=>({top,bottom})}:null};
runInNewContext(measure+'\nmeasureFirstProduct699();',{
document:{body},window:{matchMedia:()=>({matches:mobile}),innerHeight:height,innerWidth:mobile?390:900},
productsEl:products,jumpProducts699:jump,Number
});
return{state:body.dataset.ddShopFirstProductViewport699,jump:jump.hidden};
}
assert.deepEqual(simulateFold({top:530,bottom:950}),{state:'VISIBLE_IN_FIRST_VIEWPORT',jump:true});
assert.deepEqual(simulateFold({top:800,bottom:1100}),{state:'BELOW_FIRST_VIEWPORT',jump:false});
assert.deepEqual(simulateFold({hasProduct:false}),{state:'NO_PRODUCT_RESULT',jump:true});
assert.deepEqual(simulateFold({mobile:false}),{state:'DESKTOP_NOT_APPLICABLE',jump:true});
assert.match(shopJS,/browseOptions699\.open=false/);
assert.match(shopJS,/window\.addEventListener\('resize',scheduleFirstProductMeasure699/);
// Third-party Admin signed claim stays outside private-key custody, source repair remains HOLD.
const admin=read('admin/social-publishing/index.html'),panel=read('public/js/admin-social-platform-preflight.js'),
finance=read('functions/api/admin/social-post-queue.js');
for(const id of ['dd699-finance','dd699Refresh','dd699Export','dd699Status','dd699Stats',
'dd699Cases','dd699Source','dd699Signer','dd699Nonce','dd699Issued','dd699Prepare',
'dd699Claim','dd699Signature','dd699Note','dd699Reviewed','dd699Submit','dd699Result'])
assert.match(admin,new RegExp('id="'+id+'"'));
for(const rx of [/export function claim699\(/,/export async function assessFinance699\(/,
 /async function ownerReview699\(/,/async function finance699\(/,
 /FINANCIAL_SOURCE_REPAIR_VERIFIER_PUBLIC_KEY_699/,
 /finance_owner_review_699/,/financial699:await finance699/,
 /owner_finance_review_699/,/if\(params.get\('export'\)==='financial699'\)/])
assert.match(finance,rx);
for(const rx of [/function draw699\(d\)/,/function claimFor699\(\)/,
 /owner_finance_review_699/,/export=financial699/,
 /draw698\(d\);\s*draw699\(d\)/])
assert.match(panel,rx);
assert.match(read('.github/workflows/current-application-quality.yml'),
/build699_camera_media_shop_source_witness_contract\.mjs/);
console.log('BUILD 699 PASS: exact third-party signed source repair document provenance remains HOLD; original camera draft recovery + idempotent R2 media; measured Shop first viewport with jump fallback');
