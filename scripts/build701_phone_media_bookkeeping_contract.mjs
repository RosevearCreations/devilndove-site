import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {camera701Ready,camera700SummarizeReadback} from '../functions/api/admin/mobile-create-product.js';
import {claim701,assessFinance701} from '../functions/api/admin/social-post-queue.js';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const digest='a'.repeat(64),now=Date.now();
const media=[{kind:'photo',attachment_id:12,r2_key:'products/5/camera699/'+digest+'.jpg',
 r2_bytes:1525,confirmed:true,publication_status:'draft_only'}];
const summary={...camera700SummarizeReadback(media,[]),bounded_rows:true};
const checks={phone:true,draft:true,photo:true,recovery:true,video:true};
const note='Actual phone owner review; original draft and manual retry succeeded.';
assert.equal(camera701Ready(summary,checks,note,media),true);
for(const bad of [{...summary,bounded_rows:false},{...summary,unverified_count:1},
 {...summary,status:'HOLD_MEDIA_INCOMPLETE_OR_UNVERIFIED'}])
assert.equal(camera701Ready(bad,checks,note,media),false);
assert.equal(camera701Ready(summary,{...checks,recovery:false},note,media),false);
assert.equal(camera701Ready(summary,checks,'short',media),false);
assert.equal(camera701Ready(summary,checks,note,[{...media[0],r2_bytes:1526}]),false);
const curr={queue_id:5,source_revision:'book701',fingerprint_sha256:digest};
const prior={history_complete:true,readback:{items:[{source_readback_independently_signed:true,
 source_readback_receipt_id:703,older_receipt_id:10,newer_receipt_id:11,
 external_document_sha256:'b'.repeat(64)}]}};
const keys=await Promise.all(Array.from({length:5},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const pub=async k=>Buffer.from(await crypto.subtle.exportKey('raw',k.publicKey)).toString('base64url');
const signer={id:'fifth_bookkeeper_701',key:await pub(keys[0]),
 sourceId:'fourth_source_700',sourceKey:await pub(keys[1]),
 thirdId:'third_document_699',thirdKey:await pub(keys[2]),
 custodianId:'first_custodian_696',custodianKey:await pub(keys[3]),
 reconcilerId:'second_reconciler_697',reconcilerKey:await pub(keys[4])};
const claim=claim701({queue_id:5,original_live_source_receipt_id:703,
 older_receipt_id:10,newer_receipt_id:11,external_document_sha256:'b'.repeat(64),
 bookkeeping_ledger_sha256:'c'.repeat(64),source_revision:'book701',
 fingerprint_sha256:digest,independent_bookkeeper_id:signer.id,
 nonce:'aaaa1111-bbbb-2222-cccc-3333dddd4444',issued_at:new Date(now-50000).toISOString()});
const signature=Buffer.from(await crypto.subtle.sign('Ed25519',keys[0].privateKey,
 new TextEncoder().encode(JSON.stringify(claim)))).toString('base64url');
const payload={...claim,signature,owner_user_id:3,owner_reviewed:true,
 resolution_note:'Independently reviewed source ledger evidence; original accounting close HOLD.',
 original_source_repaired:false,financial_certified:false,
 bookkeeping_closed:false,continuous_connection_verified:false};
const row=(diff={})=>({social_post_attempt_id:807,
 attempt_status:'independent_bookkeeping_evidence_review_701',
 attempted_at:new Date(now-10000).toISOString(),response_json:JSON.stringify({...payload,...diff})});
let x=await assessFinance701(curr,prior,[],signer,now);
assert.equal(x.status,'HOLD_INDEPENDENT_BOOKKEEPING_EVIDENCE_REVIEW');
x=await assessFinance701(curr,prior,[row()],signer,now);
assert.equal(x.history_complete,true);
assert.equal(x.review.recorded_count,1);
assert.equal(x.receipt_history[0].independent_bookkeeping_evidence_verified,true);
assert.equal(x.bookkeeping_closed,false);
assert.equal(x.financial_certified,false);
for(const diff of [{signature:'tampered'},{bookkeeping_ledger_sha256:'d'.repeat(64)},
 {original_live_source_receipt_id:702},{fingerprint_sha256:'e'.repeat(64)},
 {source_revision:'drift'},{owner_reviewed:false},{bookkeeping_closed:true},
 {financial_certified:true},{continuous_connection_verified:true},
 {resolution_note:'short'},{nonce:'INVALID'}]){
 const y=await assessFinance701(curr,prior,[row(diff)],signer,now);
 assert.equal(y.history_complete,false,'Tampered signed bookkeeper claim must fail closed');
}
for(const duplicate of [{...signer,id:signer.sourceId},{...signer,key:signer.thirdKey}]){
 const y=await assessFinance701(curr,prior,[row()],duplicate,now);
 assert.equal(y.history_complete,false);
}
assert.equal((await assessFinance701(curr,prior,[row(),row()],signer,now)).history_complete,false);
assert.equal((await assessFinance701(curr,{...prior,history_complete:false},[],signer,now)).history_complete,false);
assert.equal((await assessFinance701(curr,prior,Array(61).fill(row()),signer,now)).history_complete,false);
for(const [p,patterns] of Object.entries({
 'functions/api/admin/mobile-create-product.js':[/camera701_adopt_receipt/,/admin_action_audit/,/bucket.head\(key\)/,/independent_physical_device_verified:false/],
 'public/js/admin-mobile-product-augment.js':[/dd701Adopt/,/media_snapshot_json/,/owner_checklist_json/,/camera701_adopt_receipt/],
 'admin/mobile-product/index.html':[/id="dd701FieldReceipt"/,/id="dd701Adopt"/],
 'functions/api/admin/social-post-queue.js':[/export function claim701/,/owner_bookkeeping_review_701/,/finance_owner_review_701/,/financial701:await finance701/,/params.get\('export'\)==='financial701'/],
 'public/js/admin-social-platform-preflight.js':[/function draw701/,/function claimFor701/,/owner_bookkeeping_review_701/,/export=financial701/],
 'admin/social-publishing/index.html':[/id="dd701-finance"/,/id="dd701Form"/],
 '.github/workflows/current-application-quality.yml':[/build701_phone_media_bookkeeping_contract.mjs/]
})){
 const text=src(p);for(const pattern of patterns)assert.match(text,pattern,'Build 701 missing: '+p);
}
console.log('BUILD 701 PASS: same-original-owner phone adoption, exact fresh R2/D1 attachment proof, replay/tamper denial and independent fifth-signer bookkeeping review; no automatic financial close.');
