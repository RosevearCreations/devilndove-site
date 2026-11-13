import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canReconcileLinked705} from '../functions/api/admin/_cameraField702.mjs';
import {claim704,eligibleRenewal705,assessFinance705,sourceOrigin700} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.now(),sha='a'.repeat(64);
const linked={receipt_id:520,kind:'linked',media_kind:'photo',attachment_id:4,
 r2_key:'product/554/original.jpg',original_701_receipt_id:111,closed:false};
const item={kind:'photo',attachment_id:4,r2_key:linked.r2_key,
 r2_bytes:4096,confirmed:true,publication_status:'draft'};
const live={media:[item]};
const followup={admin_action_audit_id:850,created_at:new Date(now-3600000).toISOString(),
 data:{open_receipt_id:520,escalation_receipt_id:700}};
const latest={data:{owner_re_attested:true,original_701_receipt_id:111,
 media_snapshot:[item],issued_at:new Date(now-120000).toISOString()}};
assert.equal(canReconcileLinked705(linked,followup,latest,item,live,now),true);
for(const [a,b,c,d,e] of [
 [{...linked,kind:'unrecorded'},followup,latest,item,live],
 [{...linked,closed:true},followup,latest,item,live],
 [linked,{...followup,admin_action_audit_id:600},latest,item,live],
 [linked,{...followup,data:{open_receipt_id:999,escalation_receipt_id:700}},latest,item,live],
 [linked,followup,{data:{...latest.data,issued_at:new Date(now-7200000).toISOString()}},item,live],
 [linked,followup,latest,{...item,r2_key:'tampered'},live],
 [linked,followup,latest,{...item,confirmed:false},live],
 [linked,followup,latest,item,{media:[]}]
])assert.equal(canReconcileLinked705(a,b,c,d,e,now),false,'Original recovered attachment must fail closed');
const keys=await Promise.all(Array.from({length:8},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const pub=async p=>Buffer.from(await crypto.subtle.exportKey('raw',p.publicKey)).toString('base64url');
const signer={id:'independent_live_704',key:await pub(keys[0]),originAuthorized:true,
 seventhId:'posting_703',seventhKey:await pub(keys[1]),
 sixthId:'closure_702',sixthKey:await pub(keys[2]),
 fifthId:'bookkeeper_701',fifthKey:await pub(keys[3]),
 fourthId:'source_700',fourthKey:await pub(keys[4]),
 thirdId:'document_699',thirdKey:await pub(keys[5]),
 secondId:'reconciliation_697',secondKey:await pub(keys[6]),
 firstId:'custodian_696',firstKey:await pub(keys[7])};
const current={queue_id:17,source_revision:'live-src-rev-705',
 fingerprint_sha256:sha,master_fresh:true,history_complete:true,open_cases:[]};
const original={posting_receipt_id:410,live_receipt_id:511,
 financial_readiness_receipt_id:612,
 original_live_source_receipt_id:110,bookkeeping_review_receipt_id:210,
 decision_receipt_id:310,owner_acceptance_receipt_id:510,
 original_live_nonce_704:'original-nonce-704-abcdefg',
 source_observed_at:new Date(now-7200000).toISOString(),
 financial_readiness_recorded_at:new Date(now-3600000).toISOString(),
 posting_document_sha256:'b'.repeat(64),bookkeeping_ledger_sha256:'c'.repeat(64),
 external_posting_reference:'books/original/entry/705',
 independent_live_source_verified:true,
 financial_readiness_decision:'ready_for_final_owner_closure_review'};
const prior={history_complete:true,readback:{items:[original]}};
assert.equal(eligibleRenewal705(current,original,now),true);
for(const wrong of [
 {...original,original_live_nonce_704:null},
 {...original,source_observed_at:'invalid'},
 {...original,financial_readiness_decision:'hold_external_posting'},
 {...original,financial_readiness_recorded_at:new Date(now+3600000).toISOString()},
 {...original,independent_live_source_verified:false}
])assert.equal(eligibleRenewal705(current,wrong,now),false);
assert.equal(eligibleRenewal705({...current,open_cases:[{id:2}]},original,now),false);
assert.equal(eligibleRenewal705({...current,master_fresh:false},original,now),false);
const claim=claim704({queue_id:17,
 original_live_source_receipt_id:110,bookkeeping_review_receipt_id:210,
 closure_decision_receipt_id:310,posting_receipt_id:410,
 owner_document_acceptance_receipt_id:510,
 posting_document_sha256:original.posting_document_sha256,
 bookkeeping_ledger_sha256:original.bookkeeping_ledger_sha256,
 external_posting_reference:original.external_posting_reference,
 source_revision:current.source_revision,fingerprint_sha256:sha,
 posting_status:'posted',external_record_observed:true,
 signer_id:signer.id,nonce:'fresh-independent-continuity-nonce-705',
 observed_at:new Date(now-45000).toISOString()});
const signature=Buffer.from(await crypto.subtle.sign('Ed25519',keys[0].privateKey,
 new TextEncoder().encode(JSON.stringify(claim)))).toString('base64url');
const makeRenew=(over={})=>({
 social_post_attempt_id:613,attempt_status:'independent_posting_continuity_source_705',
 attempted_at:new Date(now-20000).toISOString(),
 response_json:JSON.stringify({...claim,signature,prior_live_receipt_id:511,
 prior_owner_readiness_receipt_id:612,independent_source_continuity_verified:true,
 owner_user_id:3,owner_reviewed:true,
 resolution_note:'Original independently signed posting checked again through a fresh direct provider GET and challenge.',
 bookkeeping_closed:false,financial_certified:false,
 continuous_connection_verified:false,...over})});
const makeOwner=(decision='recommend_manual_financial_closure_review',over={})=>({
 social_post_attempt_id:614,
 attempt_status:decision==='hold_posting_continuity_drift'?
   'owner_posting_continuity_hold_705':'owner_financial_evidence_review_705',
 attempted_at:new Date(now-10000).toISOString(),
 response_json:JSON.stringify({continuity_receipt_id:613,
 prior_live_receipt_id:511,posting_receipt_id:410,
 posting_document_sha256:original.posting_document_sha256,
 bookkeeping_ledger_sha256:original.bookkeeping_ledger_sha256,
 external_posting_reference:original.external_posting_reference,
 source_revision:current.source_revision,fingerprint_sha256:sha,
 decision,owner_user_id:3,owner_reviewed:true,
 resolution_note:'Original owner checked the two independent live posting receipts and evidence history; actual books remain open pending separate closure.',
 bookkeeping_closed:false,financial_certified:false,
 continuous_connection_verified:false,...over})});
let result=await assessFinance705(current,prior,[],[],signer,now);
assert.equal(result.status,'HOLD_FRESH_INDEPENDENT_POSTING_CONTINUITY_REQUIRED');
result=await assessFinance705(current,prior,[makeRenew()],[],signer,now);
assert.equal(result.history_complete,true);
assert.equal(result.continuity_verified_count,1);
assert.equal(result.status,'FRESH_POSTING_CONTINUITY_VERIFIED_OWNER_EVIDENCE_REVIEW_HOLD');
result=await assessFinance705(current,prior,[makeRenew()],[makeOwner()],signer,now);
assert.equal(result.status,'OWNER_EVIDENCE_REVIEW_RECOMMENDATION_BOOKS_STILL_HOLD');
assert.equal(result.bookkeeping_closed,false);
assert.equal(result.actual_financial_book_close,false);
result=await assessFinance705(current,prior,[makeRenew()],[makeOwner('hold_posting_continuity_drift')],signer,now);
assert.equal(result.status,'OWNER_POSTING_CONTINUITY_DISCREPANCY_HOLD');
for(const bad of [
 {signature:'forgery'}, {nonce:original.original_live_nonce_704},
 {nonce:'different-not-signed'}, {observed_at:new Date(now-9000000).toISOString()},
 {posting_receipt_id:999},{prior_live_receipt_id:999},
 {prior_owner_readiness_receipt_id:999},
 {posting_document_sha256:'d'.repeat(64)},
 {bookkeeping_ledger_sha256:'d'.repeat(64)},
 {external_posting_reference:'other'}, {source_revision:'source-drift'},
 {fingerprint_sha256:'d'.repeat(64)}, {posting_status:'pending'},
 {external_record_observed:false}, {independent_source_continuity_verified:false},
 {owner_reviewed:false},{bookkeeping_closed:true},{financial_certified:true},
 {continuous_connection_verified:true}
]){
 const rejected=await assessFinance705(current,prior,[makeRenew(bad)],[],signer,now);
 assert.equal(rejected.history_complete,false,'Tampered signed continuity HOLD: '+JSON.stringify(bad));
}
for(const bad of [
 {continuity_receipt_id:999}, {prior_live_receipt_id:999},
 {posting_document_sha256:'d'.repeat(64)},
 {bookkeeping_ledger_sha256:'d'.repeat(64)}, {external_posting_reference:'drift'},
 {source_revision:'drift'},{fingerprint_sha256:'e'.repeat(64)},
 {owner_reviewed:false},{bookkeeping_closed:true},
 {financial_certified:true},{continuous_connection_verified:true}
]){
 const rejected=await assessFinance705(current,prior,[makeRenew()],[makeOwner('recommend_manual_financial_closure_review',bad)],signer,now);
 assert.equal(rejected.history_complete,false,'Tampered owner decision HOLD: '+JSON.stringify(bad));
}
for(const bad of [{...signer,key:signer.seventhKey},
 {...signer,id:signer.seventhId},{...signer,originAuthorized:false}]){
 const rejected=await assessFinance705(current,prior,[makeRenew()],[],bad,now);
 assert.equal(rejected.history_complete,false);
}
assert.equal((await assessFinance705(current,prior,[makeRenew(),makeRenew()],[],signer,now)).history_complete,false);
assert.equal((await assessFinance705(current,{...prior,history_complete:false},[],[],signer,now)).history_complete,false);
assert.equal(sourceOrigin700('http://provider.example.com/readback','https://provider.example.com'),null);
for(const [path,patterns] of Object.entries({
 'functions/api/admin/_cameraField702.mjs':[/canReconcileLinked705/,/camera705_media_recovery_reconciled/,/linked_recovery_ready_705/],
 'functions/api/admin/mobile-create-product.js':[/camera705_inspect/,/camera705_reconcile_linked/],
 'admin/mobile-product/index.html':[/id="dd705Recovery"/,/id="dd705RecoveryRecord"/],
 'public/js/admin-mobile-product-augment.js':[/function draw705\(/,/camera705_reconcile_linked/],
 'functions/api/admin/social-post-queue.js':[/export async function assessFinance705/,/async function livePostingContinuity705/,
 /financial705:await finance705/,/owner_financial_evidence_review_705/,
 /export'\)==='financial705'/],
 'admin/social-publishing/index.html':[/id="dd705-finance"/,/id="dd705FinanceOwnerForm"/],
 'public/js/admin-social-platform-preflight.js':[/function draw705\(/,/live_posting_continuity_705/,/owner_financial_evidence_review_705/,/export=financial705/],
 '.github/workflows/current-application-quality.yml':[/build705_posting_continuity_media_reconciliation_contract.mjs/]
})){
 for(const pattern of patterns)assert.match(read(path),pattern,'Build 705 wire '+path);
}
console.log('BUILD 705 PASS: exact original R2 linked recovery, fresh independent second posting source signature, signed owner financial evidence decision, no automatic book closure and forged/replay/drift failure gates');
