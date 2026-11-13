import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ageMedia703,mediaEscalationEligible703} from '../functions/api/admin/_cameraField702.mjs';
import {claim703,source703Eligible,assessFinance703} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.now(),digest='a'.repeat(64);
const c={receipt_id:501,kind:'unrecorded',media_kind:'photo',closed:false,
 opened_at:new Date(now-26*3600000).toISOString()};
assert.equal(ageMedia703(c,now).escalation_due,true);
assert.equal(ageMedia703(c,now).age_hours,26);
assert.equal(mediaEscalationEligible703(c,ageMedia703(c,now),[]),true);
assert.equal(mediaEscalationEligible703(c,ageMedia703(c,now),[{data:{open_receipt_id:501}}]),false);
assert.equal(mediaEscalationEligible703({...c,closed:true},ageMedia703({...c,closed:true},now),[]),false);
assert.equal(ageMedia703({...c,opened_at:'not-a-time'},now).status,'HOLD_INVALID_SOURCE_TIMESTAMP');
assert.equal(ageMedia703({...c,opened_at:new Date(now-49*3600000).toISOString()},now).status,'CRITICAL_ORIGINAL_MEDIA_EXCEPTION_AGED_48H');
assert.equal(ageMedia703({...c,opened_at:new Date(now-120000).toISOString()},now).escalation_due,false);
const current={queue_id:17,source_revision:'source-703',fingerprint_sha256:digest,
 master_fresh:true,history_complete:true,open_cases:[]};
const item={original_live_source_receipt_id:110,bookkeeping_review_receipt_id:210,
 decision_receipt_id:310,decision_recorded_at:new Date(now-60000).toISOString(),
 bookkeeping_ledger_sha256:'b'.repeat(64),
 signed_closure_decision_recorded:true,signed_decision:'recommend_owner_manual_close'};
const prior={history_complete:true,review:{items:[item]}};
assert.equal(source703Eligible(current,item,now),true);
assert.equal(source703Eligible({...current,master_fresh:false},item,now),false);
assert.equal(source703Eligible({...current,open_cases:[{id:1}]},item,now),false);
assert.equal(source703Eligible(current,{...item,signed_decision:'hold_discrepancy'},now),false);
assert.equal(source703Eligible(current,{...item,decision_recorded_at:new Date(now-90000000).toISOString()},now),false);
const keypairs=await Promise.all(Array.from({length:7},()=>crypto.subtle.generateKey('Ed25519',true,['sign','verify'])));
const pub=async x=>Buffer.from(await crypto.subtle.exportKey('raw',x.publicKey)).toString('base64url');
const signer={id:'independent_seventh_703',key:await pub(keypairs[0]),
 sixthId:'independent_sixth_702',sixthKey:await pub(keypairs[1]),
 bookkeeperId:'bookkeeper_fifth_701',bookkeeperKey:await pub(keypairs[2]),
 sourceId:'external_fourth_700',sourceKey:await pub(keypairs[3]),
 thirdId:'third_699',thirdKey:await pub(keypairs[4]),
 custodianId:'first_696',custodianKey:await pub(keypairs[5]),
 reconcilerId:'second_697',reconcilerKey:await pub(keypairs[6])};
const claim=claim703({queue_id:17,original_live_source_receipt_id:110,
 bookkeeping_review_receipt_id:210,closure_decision_receipt_id:310,
 bookkeeping_ledger_sha256:'b'.repeat(64),
 posting_document_sha256:'c'.repeat(64),
 external_posting_reference:'bookkeeping-export/2026-11-12/ref-703',
 source_revision:current.source_revision,fingerprint_sha256:digest,
 independent_posting_verifier_id:signer.id,nonce:'posting703-independent-original-claim',
 issued_at:new Date(now-20000).toISOString()});
const signature=Buffer.from(await crypto.subtle.sign('Ed25519',keypairs[0].privateKey,
 new TextEncoder().encode(JSON.stringify(claim)))).toString('base64url');
const makePosting=(over={})=>({
 social_post_attempt_id:311,attempt_status:'independent_external_posting_document_intake_703',
 attempted_at:new Date(now-10000).toISOString(),
 response_json:JSON.stringify({...claim,signature,owner_user_id:3,owner_reviewed:true,
 resolution_note:'The real external bookkeeping posting document digest and reference were reviewed.',
 actual_posting_independently_read_back:false,bookkeeping_closed:false,
 financial_certified:false,continuous_connection_verified:false,...over})});
const makeOwner=(decision='accept_document_for_manual_financial_close',over={})=>({
 social_post_attempt_id:312,attempt_status:decision==='hold_posting_discrepancy'?
 'owner_posting_evidence_disputed_703':'owner_posting_evidence_accepted_703',
 attempted_at:new Date(now-2000).toISOString(),
 response_json:JSON.stringify({
 posting_receipt_id:311,closure_decision_receipt_id:310,
 posting_document_sha256:claim.posting_document_sha256,
 external_posting_reference:claim.external_posting_reference,
 source_revision:current.source_revision,fingerprint_sha256:digest,
 decision,owner_user_id:3,owner_reviewed:true,
 resolution_note:'Original owner inspected the independently signed document and source-bound disposition for closure review.',
 actual_posting_independently_read_back:false,bookkeeping_closed:false,
 financial_certified:false,continuous_connection_verified:false,...over})});
let x=await assessFinance703(current,prior,[],[],signer,now);
assert.equal(x.status,'HOLD_INDEPENDENT_POSTING_DOCUMENT_REQUIRED');
x=await assessFinance703(current,prior,[makePosting()],[],signer,now);
assert.equal(x.history_complete,true);
assert.equal(x.posting.signed_count,1);
assert.equal(x.status,'HOLD_OWNER_FINANCIAL_ACCEPTANCE_REQUIRED');
x=await assessFinance703(current,prior,[makePosting()],[makeOwner()],signer,now);
assert.equal(x.status,'OWNER_POSTING_DOCUMENT_ACCEPTANCE_RECORDED_ACTUAL_BOOK_CLOSE_HOLD');
assert.equal(x.posting.owner_accepted_count,1);
assert.equal(x.bookkeeping_closed,false);
assert.equal(x.original_external_posting_verified,false);
x=await assessFinance703(current,prior,[makePosting()],[makeOwner('hold_posting_discrepancy')],signer,now);
assert.equal(x.status,'OWNER_POSTING_DISCREPANCY_HOLD');
for(const changed of [
 {signature:'not-valid'},{independent_posting_verifier_id:'other'},
 {closure_decision_receipt_id:311},{bookkeeping_review_receipt_id:999},
 {original_live_source_receipt_id:99},{bookkeeping_ledger_sha256:'d'.repeat(64)},
 {posting_document_sha256:'e'.repeat(64)},
 {external_posting_reference:'changed'},{source_revision:'drift'},
 {fingerprint_sha256:'f'.repeat(64)},{owner_reviewed:false},
 {bookkeeping_closed:true},{actual_posting_independently_read_back:true},
 {financial_certified:true},{continuous_connection_verified:true}
]){
 const wrong=await assessFinance703(current,prior,[makePosting(changed)],[],signer,now);
 assert.equal(wrong.history_complete,false,'Tampered posting must HOLD: '+JSON.stringify(changed));
}
for(const wrong of [
 {posting_document_sha256:'f'.repeat(64)},{source_revision:'drift'},
 {fingerprint_sha256:'d'.repeat(64)},{owner_reviewed:false},
 {bookkeeping_closed:true},{financial_certified:true},
 {actual_posting_independently_read_back:true},
 {closure_decision_receipt_id:999}
]){
 const state=await assessFinance703(current,prior,[makePosting()],[makeOwner('accept_document_for_manual_financial_close',wrong)],signer,now);
 assert.equal(state.history_complete,false,'Owner tampering must HOLD: '+JSON.stringify(wrong));
}
for(const bad of [{...signer,id:signer.sixthId},{...signer,key:signer.bookkeeperKey}]){
 assert.equal((await assessFinance703(current,prior,[makePosting()],[],bad,now)).history_complete,false);
}
assert.equal((await assessFinance703(current,prior,[makePosting(),makePosting()],[],signer,now)).history_complete,false);
assert.equal((await assessFinance703(current,{...prior,history_complete:false},[],[],signer,now)).history_complete,false);
assert.equal((await assessFinance703({...current,master_fresh:false},prior,[makePosting()],[],signer,now)).history_complete,false);
assert.equal((await assessFinance703({...current,open_cases:[{case_id:'open'}]},prior,[makePosting()],[],signer,now)).history_complete,false);
for(const [path,checks] of Object.entries({
 'functions/api/admin/_cameraField702.mjs':[/export function ageMedia703/,/camera703_media_aging_escalation/,/escalation_due_count/],
 'functions/api/admin/mobile-create-product.js':[/camera703_inspect/,/camera703_escalate/],
 'admin/mobile-product/index.html':[/id="dd703Aging"/,/id="dd703Escalate"/],
 'public/js/admin-mobile-product-augment.js':[/function draw703\(/,/camera703_escalate/],
 'functions/api/admin/social-post-queue.js':[/export function claim703/,/owner_financial_closure_703/,/financial703:await finance703/,/export'\)==='financial703'/],
 'admin/social-publishing/index.html':[/id="dd703-finance"/,/id="dd703FinanceOwnerForm"/],
 'public/js/admin-social-platform-preflight.js':[/function draw703\(/,/function claimFor703/,/owner_financial_closure_703/,/export=financial703/],
 '.github/workflows/current-application-quality.yml':[/build703_original_media_financial_posting_contract.mjs/]
})){
 const content=read(path);
 for(const exp of checks)assert.match(content,exp,'Missing 703 connection '+path);
}
console.log('BUILD 703 PASS: original media 24h and 48h aging, deduplicated source escalation, seventh signed posting DOCUMENT, owner evidence acceptance, source drift/replay/forgery fail-closed; actual book closure HOLD');
