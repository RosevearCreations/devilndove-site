import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessFinance697,claim697} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T15:00:00Z'),fingerprint='a'.repeat(64),revision='source-sha-build-697';
const current={queue_id:42,fingerprint_sha256:fingerprint,source_revision:revision,
master_fresh:true,verified_master_receipt_id:83};
const prior={
history_complete:true,master_accepted_now:false,
source_verification:{original_mismatch_items:[{older_receipt_id:41,newer_receipt_id:82}],
verified_attestations:[{
receipt_id:550,reference_receipt_id:41,newer_receipt_id:82,
external_custodian_signature_verified:true,
state:'EXTERNAL_CUSTODIAN_SIGNATURE_VERIFIED_SOURCE_MISMATCH_HOLD'}]},
aging:{items:[{case_id:'source_case_original_697',original_resolution_receipt_id:300,
owner_escalation_receipt_id:500,escalation_recorded:true,critical:true}]},
master_closure:{current_independent_master_receipt_id:null,items:[]}};
const custodianPair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const independentPair=await crypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const custodianPub=Buffer.from(await crypto.subtle.exportKey('raw',custodianPair.publicKey)).toString('base64url');
const independentPub=Buffer.from(await crypto.subtle.exportKey('raw',independentPair.publicKey)).toString('base64url');
const signer={id:'second_party_reconciler_697',key:independentPub,
custodianId:'original_source_custodian_696',custodianKey:custodianPub};
const claim=claim697({queue_id:42,older_receipt_id:41,newer_receipt_id:82,
custodian_attestation_receipt_id:550,fingerprint_sha256:fingerprint,
source_revision:revision,reconciler_id:signer.id,
nonce:'SecondPartyNonceFor697AAA',issued_at:'2026-11-12T14:58:00.000Z'});
assert.deepEqual(Object.keys(claim),['v','purpose','source','queue_id','older_receipt_id',
'newer_receipt_id','custodian_attestation_receipt_id','fingerprint_sha256',
'source_revision','reconciler_id','nonce','issued_at','decision']);
const signature=Buffer.from(await crypto.subtle.sign('Ed25519',independentPair.privateKey,
new TextEncoder().encode(JSON.stringify(claim)))).toString('base64url');
const base={fingerprint_sha256:fingerprint,source_revision:revision,
owner_reviewed:true,owner_user_id:9,resolution_note:
'We reviewed the exact original signed source evidence; no external repair was verified.',
source_repair_verified:false,financial_certified:false,
continuous_connection_verified:false};
const statuses={reconcile_correction_evidence:'independent_evidence_reconciliation_attested_697',
review_escalation_resolution:'owner_escalation_resolution_review_recorded_697',
renew_master_attestation:'owner_master_attestation_renewal_reviewed_697'};
const row=(id,decision,more={},t='2026-11-12T14:59:00Z')=>({
social_post_attempt_id:id,attempt_status:statuses[decision],
attempted_at:t,response_json:JSON.stringify({...base,decision,
reference_receipt_id:41,newer_receipt_id:82,prior_receipt_id:550,...more})});
const signed=row(600,'reconcile_correction_evidence',{
reconciler_id:signer.id,nonce:claim.nonce,issued_at:claim.issued_at,signature});
let state=await assessFinance697(current,prior,[],signer,now);
assert.equal(state.status,'HOLD_ORIGINAL_SOURCE_REPAIR_UNVERIFIED');
assert.equal(state.reconciliation.original_mismatch_count,1);
assert.equal(state.reconciliation.pending_reconciliation_count,1);
assert.equal(state.reconciliation.verified_custodian_attestation_count,1);
assert.equal(state.reconciliation.signer_configured,true);
assert.equal(state.master_accepted_now,false);
assert.equal(state.original_source_repair_verified,false);
assert.equal(state.financial_certified,false);
assert.equal(state.connection,'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY');
state=await assessFinance697(current,prior,[signed],signer,now);
assert.equal(state.history_complete,true);
assert.equal(state.reconciliation.independently_reconciled_count,1);
assert.equal(state.reconciliation.pending_reconciliation_count,0);
assert.equal(state.reconciliation.items[0].reconciliation_receipt_id,600);
assert.equal(state.owner_evidence_history[0].independent_reconciler_signature_verified,true);
assert.equal(state.owner_evidence_history[0].state,
'INDEPENDENT_EVIDENCE_RECONCILIATION_ATTESTED_SOURCE_REPAIR_HOLD');
assert.equal(state.status,'HOLD_ORIGINAL_SOURCE_REPAIR_UNVERIFIED');
assert.equal(state.original_source_repair_verified,false);
assert.equal(state.master_accepted_now,false);
assert.equal(state.external_replay_performed,false);
const bad=(fields)=>row(600,'reconcile_correction_evidence',{
reconciler_id:signer.id,nonce:claim.nonce,issued_at:claim.issued_at,signature,...fields});
for(const invalid of [
bad({signature:'a'.repeat(86)}),
bad({prior_receipt_id:551}),
bad({reference_receipt_id:43}),
bad({newer_receipt_id:84}),
bad({issued_at:'2026-11-12T14:20:00.000Z'}),
bad({source_repair_verified:true}),
bad({financial_certified:true}),
]){
const out=await assessFinance697(current,prior,[invalid],signer,now);
assert.equal(out.history_complete,false);
assert.equal(out.invalid_owner_history_count,1);
}
assert.equal((await assessFinance697(current,prior,[signed],
{...signer,key:custodianPub},now)).history_complete,false);
assert.equal((await assessFinance697(current,prior,[signed],
{...signer,id:signer.custodianId},now)).history_complete,false);
assert.equal((await assessFinance697({...current,source_revision:'new-revision'},
prior,[signed],signer,now)).history_complete,false);
assert.equal((await assessFinance697(current,prior,[signed,signed],signer,now))
.history_complete,false);
assert.equal((await assessFinance697(current,prior,Array(61).fill(signed),signer,now))
.history_complete,false);
assert.equal((await assessFinance697(current,{...prior,history_complete:false},[],signer,now))
.status,'HOLD_FINANCIAL_697_EVIDENCE_DRIFT');
assert.equal((await assessFinance697({queue_id:0},{history_complete:false},[],{},now))
.status,'HOLD_SELECT_CAMPAIGN');
const aged=row(620,'review_escalation_resolution',{
reference_receipt_id:300,newer_receipt_id:null,prior_receipt_id:500,
case_id:'source_case_original_697',disposition:'follow_up_required',
external_remediation_verified:false});
state=await assessFinance697(current,prior,[aged],signer,now);
assert.equal(state.history_complete,true);
assert.equal(state.aging.owner_escalation_count,1);
assert.equal(state.aging.pending_resolution_review_count,0);
assert.equal(state.aging.recorded_resolution_review_count,1);
assert.equal(state.aging.items[0].owner_review_receipt_id,620);
assert.equal(state.aging.items[0].underlying_financial_incident_resolved,false);
assert.equal(state.owner_evidence_history[0].state,
'OWNER_ESCALATION_RESOLUTION_REVIEWED_EXTERNAL_REMEDIATION_HOLD');
assert.equal((await assessFinance697(current,prior,[
row(620,'review_escalation_resolution',{reference_receipt_id:300,newer_receipt_id:null,
prior_receipt_id:501,case_id:'source_case_original_697',disposition:'owner_evidence_reviewed',
external_remediation_verified:false})
],signer,now)).history_complete,false);
assert.equal((await assessFinance697(current,prior,[
row(620,'review_escalation_resolution',{reference_receipt_id:300,newer_receipt_id:null,
prior_receipt_id:500,case_id:'source_case_original_697',disposition:'closed',
external_remediation_verified:false})
],signer,now)).history_complete,false);
assert.equal((await assessFinance697(current,prior,[
row(620,'review_escalation_resolution',{reference_receipt_id:300,newer_receipt_id:null,
prior_receipt_id:500,case_id:'source_case_original_697',disposition:'follow_up_required',
external_remediation_verified:true})
],signer,now)).history_complete,false);
const masterPrior={history_complete:true,master_accepted_now:true,
source_verification:{original_mismatch_items:[],verified_attestations:[]},
aging:{items:[]},master_closure:{current_independent_master_receipt_id:83,
items:[{older_receipt_id:41,newer_receipt_id:82,continuity_receipt_id:510,
current_master_continuity_recorded:true}]}};
state=await assessFinance697(current,masterPrior,[],signer,now);
assert.equal(state.master_accepted_now,true);
assert.equal(state.master.eligible_renewal_count,1);
assert.equal(state.master.pending_renewal_review_count,1);
const renewal=row(660,'renew_master_attestation',{
prior_receipt_id:510,master_receipt_id:83,
historical_signatures_reverified:false,new_external_master_attestation_minted:false});
state=await assessFinance697(current,masterPrior,[renewal],signer,now);
assert.equal(state.history_complete,true);
assert.equal(state.master.pending_renewal_review_count,0);
assert.equal(state.master.items[0].renewal_review_recorded,true);
assert.equal(state.master.items[0].renewal_receipt_id,660);
assert.equal(state.master.items[0].new_external_attestation_minted,false);
assert.equal(state.owner_evidence_history[0].state,
'OWNER_MASTER_RENEWAL_CONTINUITY_RECORDED_NO_NEW_EXTERNAL_SIGNATURE');
assert.equal((await assessFinance697(current,masterPrior,[
row(660,'renew_master_attestation',{prior_receipt_id:510,master_receipt_id:84,
historical_signatures_reverified:false,new_external_master_attestation_minted:false})
],signer,now)).history_complete,false);
assert.equal((await assessFinance697({...current,master_fresh:false},
{...masterPrior,master_accepted_now:false},[renewal],signer,now)).history_complete,false);
assert.equal((await assessFinance697(current,masterPrior,[
row(660,'renew_master_attestation',{prior_receipt_id:510,master_receipt_id:83,
historical_signatures_reverified:false,new_external_master_attestation_minted:true})
],signer,now)).history_complete,false);
const server=read('functions/api/admin/social-post-queue.js');
const admin=read('admin/social-publishing/index.html');
const client=read('public/js/admin-social-platform-preflight.js');
const ci=read('.github/workflows/current-application-quality.yml');
for(const pattern of [/export function claim697\(/,/export async function assessFinance697\(/,
 /async function finance697\(/,/async function ownerReview697\(/,
 /FINANCIAL_SOURCE_RECONCILIATION_SIGNER_ID_697/,
 /FINANCIAL_SOURCE_RECONCILIATION_PUBLIC_KEY_697/,
 /FINANCIAL_SOURCE_CORRECTION_SIGNER_ID_696/,
 /FINANCIAL_SOURCE_CORRECTION_CUSTODIAN_PUBLIC_KEY_696/,
 /await verify684\(signer.key,claim697/,
 /finance_owner_review_697/,/financial697:await finance697/,
 /owner_finance_review_697/,/if\(params.get\('export'\)==='financial697'\)/,
 /original_source_repair_verified:false/,/financial_certified:false/])
assert.match(server,pattern);
for(const id of ['dd697-finance','dd697-title','dd697Refresh','dd697Export',
'dd697Status','dd697Stats','dd697Corrections','dd697Aging','dd697Master',
'dd697Form','dd697Decision','dd697Source','dd697Disposition','dd697Signer',
'dd697Nonce','dd697Issued','dd697Prepare','dd697Claim','dd697Signature',
'dd697Note','dd697Reviewed','dd697Submit','dd697Result'])
assert.ok(admin.includes('id="'+id+'"'),id);
for(const pattern of [/function draw697\(d\)/,/function chooseSources697\(\)/,
 /function claimFor697\(\)/,/owner_finance_review_697/,/export=financial697/,
 /draw696\(d\);\s*draw697\(d\)/])assert.match(client,pattern);
assert.match(ci,/build697_independent_reconciliation_aging_resolution_master_renewal_contract\.mjs/);
console.log('BUILD 697: independent second-party Ed25519 reconciliation, owner escalation review and signed Master renewal continuity PASS');
