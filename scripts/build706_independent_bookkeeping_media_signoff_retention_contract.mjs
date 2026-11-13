import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canOwnerSignoff706} from '../functions/api/admin/_cameraField702.mjs';
import {claim706,retentionManifest706,eligibleExceptionReview706,assessFinance706}
 from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.now(),sha='a'.repeat(64),packet='e'.repeat(64);
const linked={receipt_id:520,kind:'linked',media_kind:'photo',attachment_id:4,
 r2_key:'product/554/original.jpg',original_701_receipt_id:111,closed:true};
const media={kind:'photo',attachment_id:4,r2_key:linked.r2_key,
 r2_bytes:4096,confirmed:true,publication_status:'draft'};
const live={media:[media]};
const recovery={admin_action_audit_id:850,created_at:new Date(now-9000000).toISOString(),
 data:{open_receipt_id:520,recovery_kind:'LINKED_D1_ATTACHMENT_R2_HEAD_VERIFIED_ONLY',
  followup_receipt_id:770,original_reattest_receipt_id:840,
  r2_key:linked.r2_key,r2_bytes:4096,media_kind:'photo',attachment_id:4}};
const closure={admin_action_audit_id:950,created_at:new Date(now-3600000).toISOString(),
 data:{open_receipt_id:520,status:'CLOSED_VERIFIED_LINKED_R2_ATTACHMENT_ONLY',
  reattest_receipt_id:845,r2_key:linked.r2_key,verified_r2_bytes:4096,
  media_kind:'photo',attachment_id:4}};
const latest={data:{owner_re_attested:true,original_701_receipt_id:111,
 media_snapshot:[media],issued_at:new Date(now-120000).toISOString()}};
assert.equal(canOwnerSignoff706(linked,recovery,closure,latest,media,live,now),true);
for(const [a,b,c,d,e,v] of [
 [{...linked,kind:'unrecorded'},recovery,closure,latest,media,live],
 [{...linked,closed:false},recovery,closure,latest,media,live],
 [linked,{...recovery,admin_action_audit_id:750},closure,latest,media,live],
 [linked,{...recovery,data:{...recovery.data,open_receipt_id:519}},closure,latest,media,live],
 [linked,recovery,{...closure,admin_action_audit_id:849},latest,media,live],
 [linked,recovery,{...closure,data:{...closure.data,reattest_receipt_id:839}},latest,media,live],
 [linked,recovery,{...closure,data:{...closure.data,r2_key:'altered'}},latest,media,live],
 [linked,recovery,closure,latest,{...media,r2_bytes:5000},live],
 [linked,recovery,closure,latest,{...media,confirmed:false},live],
 [linked,recovery,closure,latest,media,{media:[]}],
 [linked,recovery,closure,{data:{...latest.data,owner_re_attested:false}},media,live],
 [linked,recovery,closure,{data:{...latest.data,issued_at:new Date(now-100000000).toISOString()}},media,live]
]){
 assert.equal(canOwnerSignoff706(a,b,c,d,e,v,now),false,
  'Original linked recovery must fail closed on missing or tampered proof');
}
const keys=await Promise.all(Array.from({length:9},()=>
 crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const pub=async k=>Buffer.from(await crypto.subtle.exportKey('raw',k.publicKey)).toString('base64url');
const signer={
 id:'ninth_independent_financial_review_706',key:await pub(keys[0]),
 eighthId:'eighth_live_704',eighthKey:await pub(keys[1]),
 seventhId:'seventh_posting_703',seventhKey:await pub(keys[2]),
 sixthId:'sixth_closure_702',sixthKey:await pub(keys[3]),
 fifthId:'fifth_bookkeeper_701',fifthKey:await pub(keys[4]),
 fourthId:'fourth_live_700',fourthKey:await pub(keys[5]),
 thirdId:'third_repair_699',thirdKey:await pub(keys[6]),
 secondId:'second_reconciler_697',secondKey:await pub(keys[7]),
 firstId:'first_custodian_696',firstKey:await pub(keys[8])};
const current={queue_id:17,source_revision:'src-rev-706',fingerprint_sha256:sha,
 master_fresh:true,history_complete:true,open_cases:[]};
const original={posting_receipt_id:410,live_receipt_id:511,
 continuity_receipt_id:613,review_receipt_id:614,
 reviewed_at:new Date(now-3600000).toISOString(),
 continued_at:new Date(now-7200000).toISOString(),
 review_recorded_at:new Date(now-3600000).toISOString(),
 posting_document_sha256:'b'.repeat(64),
 bookkeeping_ledger_sha256:'c'.repeat(64),
 external_posting_reference:'bookkeeping/original/entry-706',
 review_decision:'recommend_manual_financial_closure_review',
 continuity_verified:true};
const prior={history_complete:true,items:[original]};
assert.equal(eligibleExceptionReview706(current,original,now),true);
assert.equal(eligibleExceptionReview706({...current,open_cases:[{id:2}]},original,now),false);
assert.equal(eligibleExceptionReview706({...current,master_fresh:false},original,now),false);
assert.equal(eligibleExceptionReview706(current,{...original,review_decision:null},now),false);
assert.equal(eligibleExceptionReview706(current,{...original,review_receipt_id:612},now),false);
assert.equal(eligibleExceptionReview706(current,{...original,review_recorded_at:new Date(now-90000000).toISOString()},now),false);
const claim=claim706({queue_id:17,
 original_live_receipt_id:511,continuity_receipt_id:613,
 original_owner_review_receipt_id:614,posting_receipt_id:410,
 posting_document_sha256:original.posting_document_sha256,
 bookkeeping_ledger_sha256:original.bookkeeping_ledger_sha256,
 external_posting_reference:original.external_posting_reference,
 source_revision:current.source_revision,fingerprint_sha256:sha,
 review_packet_sha256:packet,
 reviewer_disposition:'no_new_continuity_exception_observed',
 independent_reviewer_id:signer.id,
 nonce:'new-ninth-independent-challenge-706',issued_at:new Date(now-120000).toISOString()});
const signature=Buffer.from(await crypto.subtle.sign('Ed25519',keys[0].privateKey,
 new TextEncoder().encode(JSON.stringify(claim)))).toString('base64url');
const review=(changes={})=>({
 social_post_attempt_id:615,attempt_status:'independent_continuity_exception_review_706',
 attempted_at:new Date(now-25000).toISOString(),
 response_json:JSON.stringify({...claim,signature,
 independent_signature_verified:true,owner_user_id:3,owner_reviewed:true,
 resolution_note:'Original owner reviewed the ninth independent signed external exception packet and source pins.',
 bookkeeping_closed:false,financial_certified:false,
 continuous_connection_verified:false,...changes})});
const manifest={queue_id:17,
 posting_receipt_id:410,original_live_receipt_id:511,continuity_receipt_id:613,
 original_owner_review_receipt_id:614,independent_exception_review_receipt_id:615,
 posting_document_sha256:original.posting_document_sha256,
 bookkeeping_ledger_sha256:original.bookkeeping_ledger_sha256,
 external_posting_reference:original.external_posting_reference,
 source_revision:current.source_revision,fingerprint_sha256:sha,
 review_packet_sha256:packet,reviewer_disposition:claim.reviewer_disposition,
 independent_reviewer_id:signer.id,
 retention_disposition:'retain_for_final_manual_financial_review'};
const digest=async m=>Buffer.from(await crypto.subtle.digest('SHA-256',
 new TextEncoder().encode(JSON.stringify(retentionManifest706(m))))).toString('hex');
const manifest_sha256=await digest(manifest);
const retention=(changes={})=>({
 social_post_attempt_id:616,attempt_status:'owner_financial_evidence_retention_706',
 attempted_at:new Date(now-10000).toISOString(),
 response_json:JSON.stringify({...manifest,manifest_sha256,
 owner_user_id:3,owner_reviewed:true,
 resolution_note:'Owner retains the original signed external continuity exception packet and two live source receipts for manual closure evidence review.',
 bookkeeping_closed:false,financial_certified:false,
 continuous_connection_verified:false,...changes})});
let x=await assessFinance706(current,prior,[],[],signer,now);
assert.equal(x.status,'HOLD_INDEPENDENT_BOOKKEEPING_CONTINUITY_EXCEPTION_REVIEW_REQUIRED');
x=await assessFinance706(current,prior,[review()],[],signer,now);
assert.equal(x.history_complete,true);
assert.equal(x.independently_reviewed_count,1);
assert.equal(x.status,'INDEPENDENT_EXCEPTION_REVIEW_SIGNED_OWNER_RETENTION_HOLD');
x=await assessFinance706(current,prior,[review()],[retention()],signer,now);
assert.equal(x.status,'OWNER_FINANCIAL_CLOSURE_EVIDENCE_RETAINED_MANUAL_CLOSE_REQUIRED');
assert.equal(x.history_complete,true);
assert.equal(x.retained_evidence_count,1);
assert.equal(x.items[0].retention_manifest_sha256,manifest_sha256);
assert.equal(x.actual_bookkeeping_closed,false);
assert.equal(x.financial_certified,false);
const holdClaim=claim706({...claim,reviewer_disposition:'hold_unresolved_continuity_exception'});
const holdSig=Buffer.from(await crypto.subtle.sign('Ed25519',keys[0].privateKey,
 new TextEncoder().encode(JSON.stringify(holdClaim)))).toString('base64url');
const holdReview=review({...holdClaim,signature:holdSig});
const holdManifest={...manifest,
 reviewer_disposition:'hold_unresolved_continuity_exception',
 retention_disposition:'retain_exception_on_hold'};
const holdRetention=retention({...holdManifest,manifest_sha256:await digest(holdManifest)});
x=await assessFinance706(current,prior,[holdReview],[holdRetention],signer,now);
assert.equal(x.status,'OWNER_EXCEPTION_EVIDENCE_RETAINED_BOOKS_HOLD');
for(const bad of [
 {signature:'forged'},{continuity_receipt_id:999},
 {original_live_receipt_id:999},{original_owner_review_receipt_id:999},
 {posting_receipt_id:999},{posting_document_sha256:'d'.repeat(64)},
 {bookkeeping_ledger_sha256:'d'.repeat(64)},{external_posting_reference:'tampered'},
 {source_revision:'stale'},{fingerprint_sha256:'d'.repeat(64)},
 {review_packet_sha256:'e'.repeat(63)+'f'},
 {reviewer_disposition:'unapproved'},{independent_reviewer_id:'other'},
 {nonce:'changed'},{issued_at:new Date(now-7200000).toISOString()},
 {independent_signature_verified:false},{owner_reviewed:false},
 {bookkeeping_closed:true},{financial_certified:true},
 {continuous_connection_verified:true}
]){
 const badResult=await assessFinance706(current,prior,[review(bad)],[],signer,now);
 assert.equal(badResult.history_complete,false,
  'Ninth independent witness forgery / source mismatch must HOLD '+JSON.stringify(bad));
}
for(const bad of [
 {manifest_sha256:'0'.repeat(64)},{independent_exception_review_receipt_id:999},
 {continuity_receipt_id:999},{original_live_receipt_id:999},
 {posting_receipt_id:999},{posting_document_sha256:'d'.repeat(64)},
 {bookkeeping_ledger_sha256:'d'.repeat(64)},
 {external_posting_reference:'tampered'},{source_revision:'stale'},
 {fingerprint_sha256:'d'.repeat(64)},{review_packet_sha256:'d'.repeat(64)},
 {reviewer_disposition:'hold_unresolved_continuity_exception'},
 {independent_reviewer_id:'other'},{owner_reviewed:false},
 {bookkeeping_closed:true},{financial_certified:true},{continuous_connection_verified:true}
]){
 const badResult=await assessFinance706(current,prior,[review()],[retention(bad)],signer,now);
 assert.equal(badResult.history_complete,false,
  'Retained financial evidence digest / custody mismatch must HOLD '+JSON.stringify(bad));
}
x=await assessFinance706(current,prior,[holdReview],[retention()],signer,now);
assert.equal(x.history_complete,false,'Unresolved independent HOLD cannot become accepted retained closure review');
const heldOriginal={...original,review_decision:'hold_posting_continuity_drift'};
assert.equal((await assessFinance706(current,{...prior,items:[heldOriginal]},[review()],[],signer,now)).history_complete,false);
assert.equal((await assessFinance706(current,{...prior,items:[heldOriginal]},[holdReview],[],signer,now)).history_complete,true);
for(const wrong of [
 {...signer,id:signer.eighthId},{...signer,key:signer.thirdKey},
 {...signer,ninthId:''},{...signer,seventhKey:''}
]){
 const badResult=await assessFinance706(current,prior,[review()],[],wrong,now);
 if(wrong.ninthId!=='')assert.equal(badResult.history_complete,false);
}
assert.equal((await assessFinance706(current,prior,[review(),review()],[],signer,now)).history_complete,false);
assert.equal((await assessFinance706(current,prior,[review()],[retention(),retention()],signer,now)).history_complete,false);
assert.equal((await assessFinance706(current,{...prior,history_complete:false},[],[],signer,now)).history_complete,false);
assert.equal((await assessFinance706({...current,open_cases:[{id:1}]},prior,[review()],[],signer,now)).history_complete,false);
for(const [path,patterns] of Object.entries({
 'functions/api/admin/_cameraField702.mjs':[/canOwnerSignoff706/,/camera706_owner_linked_recovery_signoff/,/owner_recovery_signoff_ready_706/],
 'functions/api/admin/mobile-create-product.js':[/camera706_inspect/,/camera706_owner_signoff/],
 'admin/mobile-product/index.html':[/id="dd706Signoff"/,/id="dd706SignoffRecord"/],
 'public/js/admin-mobile-product-augment.js':[/function draw706\(/,/camera706_owner_signoff/],
 'functions/api/admin/social-post-queue.js':[/export function claim706/,/export function retentionManifest706/,
  /export async function assessFinance706/,/async function independentContinuityReview706/,
  /async function ownerEvidenceRetention706/,/financial706:await finance706/,
  /owner_financial_evidence_retention_706/,/export'\)==='financial706'/],
 'admin/social-publishing/index.html':[/id="dd706-finance"/,/id="dd706FinanceReviewForm"/,/id="dd706RetentionForm"/],
 'public/js/admin-social-platform-preflight.js':[/function draw706\(/,/claimFor706\(/,
  /independent_continuity_exception_review_706/,/owner_financial_evidence_retention_706/,/export=financial706/],
 '.github/workflows/current-application-quality.yml':[/build706_independent_bookkeeping_media_signoff_retention_contract.mjs/]
})){
 for(const p of patterns)assert.match(read(path),p,'Missing Build 706 source contract '+path);
}
console.log('BUILD 706 PASS: original D1/R2 owner media signoff, ninth independent Ed25519 continuity review, protected SHA-256 retention, replay/forgery/source-drift no financial close HOLD');
