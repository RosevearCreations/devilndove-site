import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessFinance696,claim696} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T15:00:00Z'),fp='a'.repeat(64),
caseId='incident-owner-aaaaaaaaaaaa',sourceRevision='exact-source-696';
const current={queue_id:42,fingerprint_sha256:fp,source_revision:sourceRevision,
master_fresh:true,verified_master_receipt_id:82};
const intake={receipt_id:430,decision:'intake_source_correction',
older_receipt_id:41,newer_receipt_id:82,
external_evidence_sha256:'b'.repeat(64),
external_custodian_id:'independent.custodian.v1',
state:'SOURCE_CORRECTION_EVIDENCE_INTAKE_UNVERIFIED'};
const pair={older_receipt_id:41,newer_receipt_id:82,
source_pins_match:false,revalidated_for_current_master:false,
original_owner_closure_receipt_id:null,last_owner_revalidation_receipt_id:null};
const aging={case_id:caseId,owner_resolution_receipt_id:300,
source_recheck_receipt_id:290,age_minutes:280,owner_followup_due:true,
owner_followup_critical:true};
const prior={history_complete:true,master_accepted_now:false,
aging:{items:[aging]},
source_correction:{items:[pair],unverified_evidence_receipts:[intake]},
master_closure:{current_master_receipt_id:null,items:[pair]}};
const keypair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const pub=Buffer.from(await crypto.subtle.exportKey('raw',keypair.publicKey)).toString('base64url');
const signer={id:'independent_custodian_signer_696',key:pub};
const claim=claim696({
queue_id:42,reference_receipt_id:41,newer_receipt_id:82,original_intake_receipt_id:430,
external_evidence_sha256:intake.external_evidence_sha256,
external_custodian_id:intake.external_custodian_id,
fingerprint_sha256:fp,source_revision:sourceRevision,signer_id:signer.id,
nonce:'FreshNonceForSource696XXXX',issued_at:'2026-11-12T14:58:00.000Z'
});
assert.deepEqual(Object.keys(claim),[
'v','purpose','source','queue_id','reference_receipt_id','newer_receipt_id',
'original_intake_receipt_id','external_evidence_sha256','external_custodian_id',
'fingerprint_sha256','source_revision','signer_id','nonce','issued_at','decision']);
const signature=Buffer.from(await crypto.subtle.sign('Ed25519',keypair.privateKey,
new TextEncoder().encode(JSON.stringify(claim)))).toString('base64url');
const base={fingerprint_sha256:fp,source_revision:sourceRevision,owner_user_id:9,
owner_reviewed:true,resolution_note:
'Owner inspected source-bound original evidence; no external source repair asserted.',
financial_certified:false,continuous_connection_verified:false,
external_source_repair_proven:false};
const row=(id,decision,more={},time='2026-11-12T14:59:00Z')=>({
social_post_attempt_id:id,attempted_at:time,
attempt_status:({
verify_correction_attestation:'independent_correction_signature_verified_696',
escalate_aging_followup:'owner_aging_escalation_followup_recorded_696',
recheck_master_continuity:'owner_master_continuity_rechecked_696'})[decision],
response_json:JSON.stringify({...base,decision,reference_receipt_id:41,
newer_receipt_id:82,...more})});
const signedRow=row(550,'verify_correction_attestation',{
original_intake_receipt_id:430,external_evidence_sha256:intake.external_evidence_sha256,
external_custodian_id:intake.external_custodian_id,
signer_id:signer.id,nonce:claim.nonce,issued_at:claim.issued_at,signature});
let a=await assessFinance696(current,prior,[],signer,now);
assert.equal(a.status,'HOLD_INDEPENDENT_SOURCE_CORRECTION_RECONCILIATION');
assert.equal(a.source_verification.original_mismatch_count,1);
assert.equal(a.source_verification.unverified_intake_count,1);
assert.equal(a.source_verification.authenticated_custodian_signature_count,0);
assert.equal(a.aging.pending_escalation_count,1);
assert.equal(a.master_closure.eligible_continuity_count,0);
a=await assessFinance696(current,prior,[signedRow],signer,now);
assert.equal(a.history_complete,true);
assert.equal(a.source_verification.authenticated_custodian_signature_count,1);
assert.equal(a.source_verification.verified_attestations[0].external_custodian_signature_verified,true);
assert.equal(a.owner_history[0].state,
'EXTERNAL_CUSTODIAN_SIGNATURE_VERIFIED_SOURCE_MISMATCH_HOLD');
assert.equal(a.status,'HOLD_INDEPENDENT_SOURCE_CORRECTION_RECONCILIATION');
assert.equal(a.source_mismatch_cleared,false);
assert.equal(a.master_accepted_now,false);
assert.equal(a.financial_certified,false);
assert.equal(a.external_replay_performed,false);
assert.equal(a.connection,'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY');
const changedField=row(550,'verify_correction_attestation',{
original_intake_receipt_id:430,external_evidence_sha256:'c'.repeat(64),
external_custodian_id:intake.external_custodian_id,
signer_id:signer.id,nonce:claim.nonce,issued_at:claim.issued_at,signature});
assert.equal((await assessFinance696(current,prior,[changedField],signer,now)).invalid_owner_history_count,1);
assert.equal((await assessFinance696(current,prior,[signedRow],{...signer,key:'a'.repeat(43)},now)).history_complete,false);
assert.equal((await assessFinance696({...current,source_revision:'other'},prior,[signedRow],signer,now)).history_complete,false);
assert.equal((await assessFinance696(current,prior,[{
...signedRow,response_json:JSON.stringify({...JSON.parse(signedRow.response_json),
signature:'a'.repeat(86)})}],signer,now)).history_complete,false);
assert.equal((await assessFinance696(current,prior,[
signedRow,{...signedRow,social_post_attempt_id:549,attempted_at:'2026-11-12T14:58:59Z'}
],signer,now)).invalid_owner_history_count,1);
const escalated=row(540,'escalate_aging_followup',{reference_receipt_id:300,
newer_receipt_id:null,case_id:caseId,original_resolution_receipt_id:300,
external_correction_verified:false});
a=await assessFinance696(current,prior,[escalated],signer,now);
assert.equal(a.history_complete,true);
assert.equal(a.aging.pending_escalation_count,0);
assert.equal(a.aging.recorded_escalation_count,1);
assert.equal(a.aging.items[0].owner_escalation_receipt_id,540);
assert.equal(a.owner_history[0].state,'OWNER_AGING_ESCALATION_RECORDED_NO_REMEDIATION');
assert.equal((await assessFinance696(current,prior,[
row(541,'escalate_aging_followup',{reference_receipt_id:300,newer_receipt_id:null,
case_id:caseId,original_resolution_receipt_id:300,external_correction_verified:true})
],signer,now)).history_complete,false);
const recoveredPair={older_receipt_id:41,newer_receipt_id:82,
source_pins_match:true,revalidated_for_current_master:true,
original_owner_closure_receipt_id:360,last_owner_revalidation_receipt_id:480};
const recovered={...prior,master_accepted_now:true,
source_correction:{items:[],unverified_evidence_receipts:[]},
master_closure:{current_master_receipt_id:82,items:[recoveredPair]}};
a=await assessFinance696(current,recovered,[],signer,now);
assert.equal(a.master_accepted_now,true);
assert.equal(a.master_closure.eligible_continuity_count,1);
assert.equal(a.master_closure.pending_continuity_count,1);
const continuity=row(560,'recheck_master_continuity',{
prior_master_revalidation_receipt_id:480,master_receipt_id:82,
historical_signatures_reverified:false});
a=await assessFinance696(current,recovered,[continuity],signer,now);
assert.equal(a.master_closure.pending_continuity_count,0);
assert.equal(a.master_closure.items[0].continuity_receipt_id,560);
assert.equal(a.owner_history[0].state,'OWNER_MASTER_CONTINUITY_RECHECKED_CURRENT_RECEIPT_ONLY');
assert.equal((await assessFinance696(current,recovered,[
row(561,'recheck_master_continuity',{prior_master_revalidation_receipt_id:479,
master_receipt_id:82,historical_signatures_reverified:false})
],signer,now)).history_complete,false);
assert.equal((await assessFinance696(current,recovered,[
row(561,'recheck_master_continuity',{prior_master_revalidation_receipt_id:480,
master_receipt_id:83,historical_signatures_reverified:false})
],signer,now)).history_complete,false);
assert.equal((await assessFinance696({...current,master_fresh:false},
{...recovered,master_accepted_now:false},[continuity],signer,now)).history_complete,false);
assert.equal((await assessFinance696(current,prior,Array(61).fill(signedRow),signer,now)).history_complete,false);
assert.equal((await assessFinance696(current,{...prior,history_complete:false},[],signer,now)).status,
'HOLD_FINANCIAL_696_EVIDENCE_DRIFT');
assert.equal((await assessFinance696({queue_id:0},{history_complete:false},[],{},now)).status,
'HOLD_SELECT_CAMPAIGN');
const server=read('functions/api/admin/social-post-queue.js'),
client=read('public/js/admin-social-platform-preflight.js'),
html=read('admin/social-publishing/index.html'),
ci=read('.github/workflows/current-application-quality.yml');
for(const pattern of [/export function claim696\(/,/export async function assessFinance696\(/,
 /async function finance696\(/,/async function ownerReview696\(/,
 /FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696/,
 /FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696/,/await verify684\(signer.key,claim696/,
 /finance_owner_review_696/,/financial696:await finance696/,
 /owner_finance_review_696/,/if\(params.get\('export'\)==='financial696'\)/,
 /source_mismatch_cleared:false/,/financial_certified:false/])
assert.match(server,pattern);
for(const id of ['dd696-finance','dd696-title','dd696Refresh','dd696Export',
'dd696Status','dd696Stats','dd696Corrections','dd696Aging','dd696Master',
'dd696Form','dd696Decision','dd696Source','dd696Signer','dd696Nonce',
'dd696Issued','dd696Prepare','dd696Claim','dd696Signature','dd696Note',
'dd696Reviewed','dd696Submit','dd696Result'])assert.ok(html.includes('id="'+id+'"'),id);
for(const pattern of [/function draw696\(d\)/,/function chooseSources696\(\)/,
 /function claimFor696\(\)/,/owner_finance_review_696/,/export=financial696/,
 /draw695\(d\);\s*draw696\(d\)/])assert.match(client,pattern);
assert.match(ci,/build696_financial_independent_correction_aging_master_continuity_contract\.mjs/);
console.log('BUILD 696: independent correction Ed25519 attestation, aged owner escalation and current Master closure continuity PASS');
