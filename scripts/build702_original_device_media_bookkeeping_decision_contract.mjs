import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {camera701Ready,camera700SummarizeReadback} from '../functions/api/admin/mobile-create-product.js';
import {sameMedia702,reattestationReady702,canCloseMedia702} from '../functions/api/admin/_cameraField702.mjs';
import {claim702,assessFinance702} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.now(),digest='a'.repeat(64);
const photo={kind:'photo',attachment_id:12,r2_key:'products/17/camera699/'+digest+'.jpg',
 r2_bytes:24000,confirmed:true,publication_status:'draft_only'};
const movie={kind:'video',attachment_id:16,r2_key:'products/17/video/camera699-'+digest+'.mp4',
 r2_bytes:62000,confirmed:true,publication_status:'internal_review'};
const media=[photo,movie],live={...camera700SummarizeReadback([photo],[movie]),bounded_rows:true};
const flags={phone:true,draft:true,photo:true,recovery:true,video:true};
const note='Actual physical phone re-attested by original owner; no external witness or publication.';
const old={build:701,owner_reported_real_phone:true,independent_device_witness_verified:false,media_snapshot:media};
assert.equal(sameMedia702(media,media),true);
assert.equal(sameMedia702(media,[movie,photo]),false);
assert.equal(reattestationReady702(old,live,flags,note,media,camera701Ready),true);
assert.equal(reattestationReady702(old,{...live,bounded_rows:false},flags,note,media,camera701Ready),false);
assert.equal(reattestationReady702(old,live,{...flags,phone:false},note,media,camera701Ready),false);
assert.equal(reattestationReady702(old,live,flags,note,[{...photo,r2_bytes:5},movie],camera701Ready),false);
const open={kind:'linked',attachment_id:12,media_kind:'photo',r2_key:photo.r2_key,original_701_receipt_id:201};
const reattest={owner_re_attested:true,original_701_receipt_id:201,media_snapshot:media,
 issued_at:new Date(now-5000).toISOString()};
assert.equal(canCloseMedia702(open,photo,reattest,live,now),true);
assert.equal(canCloseMedia702({...open,kind:'unrecorded'},photo,reattest,live,now),false);
assert.equal(canCloseMedia702(open,{...photo,confirmed:false},reattest,live,now),false);
assert.equal(canCloseMedia702(open,{...photo,r2_key:'other'},reattest,live,now),false);
assert.equal(canCloseMedia702(open,photo,{...reattest,issued_at:new Date(now-86400001).toISOString()},live,now),false);
assert.equal(canCloseMedia702(open,photo,reattest,{...live,media:[{...photo,r2_bytes:77},movie]},now),false);
assert.equal(canCloseMedia702({...open,media_kind:'video',attachment_id:16,r2_key:movie.r2_key},movie,reattest,live,now),true);
assert.equal(canCloseMedia702({...open,media_kind:'video',attachment_id:16,r2_key:movie.r2_key},
 {...movie,publication_status:'public'},reattest,live,now),false);
const current={queue_id:5,source_revision:'source702',fingerprint_sha256:digest};
const prior={history_complete:true,review:{items:[{
 original_live_source_receipt_id:703,bookkeeping_review_receipt_id:807,
 older_receipt_id:10,newer_receipt_id:11,
 external_document_sha256:'b'.repeat(64),bookkeeping_ledger_sha256:'c'.repeat(64),
 bookkeeping_review_recorded_at:new Date(now-120000).toISOString(),
 independent_bookkeeping_evidence_reviewed:true}]}};
const keys=await Promise.all(Array.from({length:6},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const pub=async k=>Buffer.from(await crypto.subtle.exportKey('raw',k.publicKey)).toString('base64url');
const signer={id:'sixth_closure_signer_702',key:await pub(keys[0]),
 bookkeeperId:'fifth_bookkeeper_701',bookkeeperKey:await pub(keys[1]),
 sourceId:'fourth_source_700',sourceKey:await pub(keys[2]),
 thirdId:'third_document_699',thirdKey:await pub(keys[3]),
 custodianId:'first_custodian_696',custodianKey:await pub(keys[4]),
 reconcilerId:'second_reconciler_697',reconcilerKey:await pub(keys[5])};
const mkClaim=(decision='recommend_owner_manual_close',remaining_exception_count=0)=>
 claim702({queue_id:5,original_live_source_receipt_id:703,bookkeeping_review_receipt_id:807,
 older_receipt_id:10,newer_receipt_id:11,
 external_document_sha256:'b'.repeat(64),bookkeeping_ledger_sha256:'c'.repeat(64),
 source_revision:'source702',fingerprint_sha256:digest,
 independent_closure_signer_id:signer.id,remaining_exception_count,decision,
 nonce:'original-sixth-signer-closure-702',
 issued_at:new Date(now-45000).toISOString()});
const makeRow=async(decision='recommend_owner_manual_close',remaining=0,delta={})=>{
 const claim=mkClaim(decision,remaining);
 const signature=Buffer.from(await crypto.subtle.sign('Ed25519',keys[0].privateKey,
   new TextEncoder().encode(JSON.stringify(claim)))).toString('base64url');
 return {social_post_attempt_id:912,attempt_status:'independent_bookkeeping_closure_decision_702',
 attempted_at:new Date(now-3000).toISOString(),response_json:JSON.stringify({...claim,signature,
   owner_user_id:3,owner_reviewed:true,
   resolution_note:'Original bookkeeping ledger reviewed; posting and external close remain separate.',
   original_source_repaired:false,bookkeeping_closed:false,
   financial_certified:false,continuous_connection_verified:false,...delta})};
};
const empty=await assessFinance702(current,prior,[],signer,now);
assert.equal(empty.status,'HOLD_SIGNED_INDEPENDENT_BOOKKEEPING_DECISION_REQUIRED');
const row=await makeRow();
let result=await assessFinance702(current,prior,[row],signer,now);
assert.equal(result.history_complete,true);
assert.equal(result.review.recorded_count,1);
assert.equal(result.review.items[0].decision_receipt_id,912);
assert.equal(result.status,'INDEPENDENT_CLOSURE_RECOMMENDATION_RECORDED_MANUAL_LEDGER_POSTING_HOLD');
assert.equal(result.bookkeeping_closed,false);
assert.equal(result.financial_certified,false);
result=await assessFinance702(current,prior,[await makeRow('hold_discrepancy',2)],signer,now);
assert.equal(result.status,'INDEPENDENT_SIGNED_BOOKKEEPING_DISCREPANCY_HOLD');
for(const tamper of [
 {signature:'invalid'},{independent_closure_signer_id:'other'},
 {bookkeeping_review_receipt_id:806},{original_live_source_receipt_id:704},
 {source_revision:'drift'},{fingerprint_sha256:'d'.repeat(64)},
 {bookkeeping_ledger_sha256:'e'.repeat(64)},{remaining_exception_count:1},
 {decision:'unknown'},{owner_reviewed:false},{resolution_note:'short'},
 {bookkeeping_closed:true},{financial_certified:true},
 {continuous_connection_verified:true},{nonce:'invalid'}
]){
 const invalid=await assessFinance702(current,prior,[await makeRow('recommend_owner_manual_close',0,tamper)],signer,now);
 assert.equal(invalid.history_complete,false,'Tamper must HOLD '+JSON.stringify(tamper));
}
for(const invalidSigner of [
 {...signer,id:signer.bookkeeperId},{...signer,key:signer.sourceKey}]){
 assert.equal((await assessFinance702(current,prior,[row],invalidSigner,now)).history_complete,false);
}
assert.equal((await assessFinance702(current,prior,[row,row],signer,now)).history_complete,false);
assert.equal((await assessFinance702(current,{...prior,history_complete:false},[],signer,now)).history_complete,false);
assert.equal((await assessFinance702(current,prior,Array(61).fill(row),signer,now)).history_complete,false);
const stale={...prior,review:{items:[{...prior.review.items[0],
 bookkeeping_review_recorded_at:new Date(now-86400000-60000).toISOString()}]}};
assert.equal((await assessFinance702(current,stale,[row],signer,now)).history_complete,false);
for(const [path,expressions] of Object.entries({
 'functions/api/admin/mobile-create-product.js':[/handleCamera702/,/camera702_reattest/,/camera702_triage_close/],
 'functions/api/admin/_cameraField702.mjs':[/sameMedia702/,/camera702_media_issue_open/,/mediaBucket|live.media/],
 'public/js/admin-mobile-product-augment.js':[/camera702_inspect/,/camera702_triage_open/,/camera702_reattest/,/camera702_triage_close/],
 'admin/mobile-product/index.html':[/id="dd702PhoneAudit"/,/id="dd702OpenCases"/],
 'functions/api/admin/social-post-queue.js':[/export function claim702/,/owner_bookkeeping_decision_702/,/financial702:await finance702/,/export'\)==='financial702'/],
 'public/js/admin-social-platform-preflight.js':[/function draw702/,/function claimFor702/,/owner_bookkeeping_decision_702/,/export=financial702/],
 'admin/social-publishing/index.html':[/id="dd702-finance"/,/id="dd702FinanceForm"/],
 '.github/workflows/current-application-quality.yml':[/build702_original_device_media_bookkeeping_decision_contract.mjs/]
})){
 const text=read(path);for(const exp of expressions)assert.match(text,exp,'Build 702 contract missing '+path);
}
console.log('BUILD 702 PASS: original owner phone re-attestation; R2 linked recovery vs unrecorded HOLD; signed separate sixth bookkeeper decision, bounded immutable history and accounting close HOLD');
