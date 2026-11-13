import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ageMedia703,ownerFollowupEligible704} from '../functions/api/admin/_cameraField702.mjs';
import {claim704,eligibleLive704,assessFinance704,sourceOrigin700} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.now(),hash='a'.repeat(64);
const original={receipt_id:503,kind:'unrecorded',media_kind:'photo',closed:false,
 opened_at:new Date(now-33*3600000).toISOString()};
const escalation={admin_action_audit_id:601,data:{open_receipt_id:503},
 created_at:new Date(now-3000000).toISOString()};
assert.equal(ownerFollowupEligible704(original,escalation,[],now),true);
assert.equal(ownerFollowupEligible704(original,escalation,[{data:{escalation_receipt_id:601}}],now),false);
assert.equal(ownerFollowupEligible704({...original,closed:true},escalation,[],now),false);
assert.equal(ownerFollowupEligible704(original,{...escalation,admin_action_audit_id:502},[],now),false);
assert.equal(ownerFollowupEligible704({...original,opened_at:'invalid'},escalation,[],now),false);
assert.equal(ownerFollowupEligible704(original,{...escalation,created_at:'invalid'},[],now),false);
assert.equal(ageMedia703(original,now).escalation_due,true);
assert.equal(sourceOrigin700('https://provider.example.com/posting/verify',
 'https://provider.example.com').origin,'https://provider.example.com');
for(const endpoint of ['http://provider.example.com/posting/verify',
 'https://localhost/posting','https://127.0.0.1/check','https://provider.example.com@evil.example.com/abc']){
 assert.equal(sourceOrigin700(endpoint,'https://provider.example.com'),null);
}
const current={queue_id:17,source_revision:'live-src-704',fingerprint_sha256:hash,
 master_fresh:true,history_complete:true,open_cases:[]};
const candidate={
 original_live_source_receipt_id:110,bookkeeping_review_receipt_id:210,
 decision_receipt_id:310,posting_receipt_id:410,owner_acceptance_receipt_id:510,
 owner_acceptance_recorded_at:new Date(now-100000).toISOString(),
 posting_document_sha256:'b'.repeat(64),
 bookkeeping_ledger_sha256:'c'.repeat(64),
 external_posting_reference:'bookkeeping/export/post-704',
 owner_acceptance_decision:'accept_document_for_manual_financial_close',
 posting_document_signed:true};
const prior={history_complete:true,posting:{items:[candidate]}};
assert.equal(eligibleLive704(current,candidate,now),true);
assert.equal(eligibleLive704({...current,master_fresh:false},candidate,now),false);
assert.equal(eligibleLive704({...current,open_cases:[{case_id:'case-1'}]},candidate,now),false);
assert.equal(eligibleLive704(current,{...candidate,owner_acceptance_decision:'hold_posting_discrepancy'},now),false);
assert.equal(eligibleLive704(current,{...candidate,owner_acceptance_recorded_at:new Date(now-90000000).toISOString()},now),false);
const keys=await Promise.all(Array.from({length:8},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const pub=async pair=>Buffer.from(await crypto.subtle.exportKey('raw',pair.publicKey)).toString('base64url');
const signer={
 id:'eighth_signed_live_verifier_704',key:await pub(keys[0]),
 seventhId:'seventh_document_703',seventhKey:await pub(keys[1]),
 sixthId:'sixth_closure_702',sixthKey:await pub(keys[2]),
 fifthId:'fifth_bookkeeper_701',fifthKey:await pub(keys[3]),
 fourthId:'fourth_live_source_700',fourthKey:await pub(keys[4]),
 thirdId:'third_original_document_699',thirdKey:await pub(keys[5]),
 secondId:'second_reconciler_697',secondKey:await pub(keys[6]),
 firstId:'first_custodian_696',firstKey:await pub(keys[7]),originAuthorized:true};
const claim=claim704({queue_id:17,
 original_live_source_receipt_id:110,bookkeeping_review_receipt_id:210,
 closure_decision_receipt_id:310,posting_receipt_id:410,
 owner_document_acceptance_receipt_id:510,
 posting_document_sha256:candidate.posting_document_sha256,
 bookkeeping_ledger_sha256:candidate.bookkeeping_ledger_sha256,
 external_posting_reference:candidate.external_posting_reference,
 source_revision:current.source_revision,fingerprint_sha256:hash,
 posting_status:'posted',external_record_observed:true,
 signer_id:signer.id,nonce:'independent-live-posting-nonce-704',
 observed_at:new Date(now-55000).toISOString()});
const signature=Buffer.from(await crypto.subtle.sign('Ed25519',keys[0].privateKey,
 new TextEncoder().encode(JSON.stringify(claim)))).toString('base64url');
function makeLive(override={}){
 return {social_post_attempt_id:511,
  attempt_status:'independent_live_posting_source_readback_704',
  attempted_at:new Date(now-25000).toISOString(),
  response_json:JSON.stringify({...claim,signature,
   independent_live_source_verified:true,owner_user_id:3,owner_reviewed:true,
   resolution_note:'Original owner approved a nonce-bound independent read-only live posting provider readback.',
   bookkeeping_closed:false,financial_certified:false,
   continuous_connection_verified:false,...override})};
}
function makeOwner(decision='ready_for_final_owner_closure_review',override={}){
 return {social_post_attempt_id:512,
  attempt_status:decision==='hold_external_posting'?
   'owner_live_posting_readback_hold_704':'owner_financial_closure_readiness_704',
  attempted_at:new Date(now-10000).toISOString(),
  response_json:JSON.stringify({live_receipt_id:511,posting_receipt_id:410,
   owner_document_acceptance_receipt_id:510,
   posting_document_sha256:candidate.posting_document_sha256,
   external_posting_reference:candidate.external_posting_reference,
   source_revision:current.source_revision,fingerprint_sha256:hash,
   owner_user_id:3,owner_reviewed:true,decision,
   resolution_note:'Original owner examined the signed source posting receipt and will not mark actual books closed.',
   bookkeeping_closed:false,financial_certified:false,
   continuous_connection_verified:false,...override})};
}
let report=await assessFinance704(current,prior,[],[],signer,now);
assert.equal(report.status,'HOLD_LIVE_BOOKKEEPING_POSTING_SOURCE_READBACK_REQUIRED');
report=await assessFinance704(current,prior,[makeLive()],[],signer,now);
assert.equal(report.history_complete,true);
assert.equal(report.readback.verified_count,1);
assert.equal(report.status,'INDEPENDENT_LIVE_POSTING_VERIFIED_OWNER_READINESS_HOLD');
report=await assessFinance704(current,prior,[makeLive()],[makeOwner()],signer,now);
assert.equal(report.history_complete,true);
assert.equal(report.status,'OWNER_FINANCIAL_CLOSURE_READINESS_RECORDED_ACTUAL_BOOK_CLOSE_HOLD');
assert.equal(report.bookkeeping_closed,false);
assert.equal(report.financial_certified,false);
report=await assessFinance704(current,prior,[makeLive()],[makeOwner('hold_external_posting')],signer,now);
assert.equal(report.status,'OWNER_LIVE_POSTING_EXCEPTION_HOLD');
for(const tamper of [
 {signature:'bad'},{nonce:'changed'}, {posting_receipt_id:411},
 {owner_document_acceptance_receipt_id:511},
 {bookkeeping_ledger_sha256:'d'.repeat(64)},{posting_document_sha256:'e'.repeat(64)},
 {external_posting_reference:'tampered'}, {source_revision:'drift'},
 {fingerprint_sha256:'d'.repeat(64)},{posting_status:'pending'},
 {external_record_observed:false},{independent_live_source_verified:false},
 {owner_reviewed:false},{bookkeeping_closed:true},{financial_certified:true},
 {continuous_connection_verified:true},{signer_id:'other'}
]){
 const x=await assessFinance704(current,prior,[makeLive(tamper)],[],signer,now);
 assert.equal(x.history_complete,false,'Signed external source tamper must HOLD '+JSON.stringify(tamper));
}
for(const tamper of [
 {live_receipt_id:512},{posting_receipt_id:411},
 {posting_document_sha256:'f'.repeat(64)},{owner_document_acceptance_receipt_id:511},
 {source_revision:'changed'},{fingerprint_sha256:'d'.repeat(64)},
 {owner_reviewed:false},{bookkeeping_closed:true},{financial_certified:true},
 {continuous_connection_verified:true}
]){
 const x=await assessFinance704(current,prior,[makeLive()],[makeOwner('ready_for_final_owner_closure_review',tamper)],signer,now);
 assert.equal(x.history_complete,false,'Original owner readback tamper must HOLD '+JSON.stringify(tamper));
}
for(const wrong of [{...signer,id:signer.seventhId},
 {...signer,key:signer.fourthKey},{...signer,originAuthorized:false}]){
 const x=await assessFinance704(current,prior,[makeLive()],[],wrong,now);
 assert.equal(x.history_complete,false,'Distinct signer and pinned origin required');
}
assert.equal((await assessFinance704(current,prior,[makeLive(),makeLive()],[],signer,now)).history_complete,false);
assert.equal((await assessFinance704(current,{...prior,history_complete:false},[],[],signer,now)).history_complete,false);
assert.equal((await assessFinance704({...current,open_cases:[{id:2}]},prior,[makeLive()],[],signer,now)).history_complete,false);
assert.equal((await assessFinance704({...current,master_fresh:false},prior,[makeLive()],[],signer,now)).history_complete,false);
assert.equal((await assessFinance704(current,prior,Array(61).fill(makeLive()),[],signer,now)).history_complete,false);
for(const [path,checks] of Object.entries({
 'functions/api/admin/_cameraField702.mjs':[/ownerFollowupEligible704/,/camera704_media_owner_followup/,/owner_followup_due_704/],
 'functions/api/admin/mobile-create-product.js':[/camera704_inspect/,/camera704_followup/],
 'admin/mobile-product/index.html':[/id="dd704Followup"/,/id="dd704FollowupRecord"/],
 'public/js/admin-mobile-product-augment.js':[/function draw704\(/,/camera704_followup/],
 'functions/api/admin/social-post-queue.js':[/export function claim704/,/async function livePostingReadback704/,
  /financial704:await finance704/,/owner_financial_readiness_704/,/export'\)==='financial704'/],
 'admin/social-publishing/index.html':[/id="dd704-finance"/,/id="dd704FinanceLiveForm"/],
 'public/js/admin-social-platform-preflight.js':[/function draw704\(/,/live_posting_source_readback_704/,/owner_financial_readiness_704/,/export=financial704/],
 '.github/workflows/current-application-quality.yml':[/build704_media_followup_live_posting_source_contract.mjs/]
})){
 const content=read(path);
 for(const pattern of checks)assert.match(content,pattern,'Missing contract: '+path);
}
console.log('BUILD 704 PASS: 24h media escalation follow-up, exact D1 receipt; pinned HTTPS live posting source, eighth Ed25519 signed response, owner readiness HOLD, forged/replay/stale/source drift negative tests');
