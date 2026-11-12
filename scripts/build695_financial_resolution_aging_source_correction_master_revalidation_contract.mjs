import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessFinance695} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T15:00:00Z'),fp='a'.repeat(64);
const current={queue_id:42,fingerprint_sha256:fp,source_revision:'source-695',
master_fresh:true,verified_master_receipt_id:82};
const caseId='incident-owner-aaaaaaaaaaaa';
const pair={older_receipt_id:41,newer_receipt_id:82,source_pins_match:true,
owner_provenance_closure_recorded:true};
const prior={history_complete:true,master_accepted_now:true,
provenance:{current_independent_master_receipt_id:82,pairs:[pair]},
resolution:{items:[{case_id:caseId,recheck_receipt_id:290,
rechecked_at:'2026-11-12T10:30:00Z',owner_resolution_recorded:true}]},
owner_resolution_history:[
{decision:'close_revalidated_provenance',reference_receipt_id:41,newer_receipt_id:82,
receipt_id:330,recorded_at:'2026-11-12T13:00:00Z',
state:'OWNER_RESOLUTION_LEDGER_RECORDED_NOT_EXTERNAL_CERTIFICATION'},
{decision:'record_sla_resolution',reference_receipt_id:290,receipt_id:340,
recorded_at:'2026-11-12T10:40:00Z',
state:'OWNER_RESOLUTION_LEDGER_RECORDED_NOT_EXTERNAL_CERTIFICATION'}]};
const base={fingerprint_sha256:fp,source_revision:current.source_revision,
owner_user_id:9,owner_reviewed:true,
external_source_repair_verified:false,financial_certified:false,
resolution_note:'Original owner reviewed exact independent source receipts with a substantial note.'};
const row=(id,decision,data={},at='2026-11-12T14:59:00Z')=>({
social_post_attempt_id:id,attempted_at:at,
attempt_status:decision==='intake_source_correction'?
'owner_external_correction_intake_695':'owner_master_closure_revalidated_695',
response_json:JSON.stringify({...base,decision,reference_receipt_id:41,newer_receipt_id:82,
...data})});
const correction={external_custodian_id:'custodian.finance1',
external_evidence_reference:'archive/record-2026-11-12',
external_evidence_sha256:'b'.repeat(64),
external_observed_at:'2026-11-12T14:45:00Z',independently_verified:false,
original_source_pins_match:false,master_receipt_id:null};
let a=assessFinance695(current,prior,[],now);
assert.equal(a.status,'OWNER_FINANCIAL_LEDGER_CRITICAL_AGING_REVIEW');
assert.equal(a.aging.review_threshold_minutes,120);
assert.equal(a.aging.critical_threshold_minutes,240);
assert.equal(a.aging.critical_count,1);
assert.equal(a.aging.items[0].age_minutes,260);
assert.equal(a.master_closure.eligible_count,1);
assert.equal(a.master_closure.pending_count,1);
assert.equal(a.source_correction.external_verification_count,0);
assert.equal(a.connection,'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY');
assert.equal(a.financial_certified,false);
assert.equal(a.external_replay_performed,false);
a=assessFinance695(current,prior,[
row(440,'revalidate_master_closure',{prior_owner_closure_receipt_id:330,
master_receipt_id:82,historical_signature_reverified:false})],now);
assert.equal(a.master_closure.items[0].revalidated_for_current_master,true);
assert.equal(a.master_closure.items[0].last_owner_revalidation_receipt_id,440);
assert.equal(a.master_closure.pending_count,0);
assert.equal(a.owner_evidence_history[0].state,
'MASTER_CLOSURE_OWNER_REVALIDATION_RECORDED_NOT_EXTERNAL_REPAIR');
const renewed={...current,verified_master_receipt_id:83};
const renewedPrior={...prior,provenance:{...prior.provenance,
current_independent_master_receipt_id:83}};
a=assessFinance695(renewed,renewedPrior,[
row(440,'revalidate_master_closure',{prior_owner_closure_receipt_id:330,
master_receipt_id:82,historical_signature_reverified:false})],now);
assert.equal(a.history_complete,true);
assert.equal(a.master_closure.pending_count,1);
assert.equal(a.master_closure.items[0].revalidated_for_current_master,false);
const mismatch={...prior,master_accepted_now:false,
provenance:{...prior.provenance,pairs:[{...pair,source_pins_match:false,
owner_provenance_closure_recorded:false}]}};
a=assessFinance695(current,mismatch,[
row(450,'intake_source_correction',correction)],now);
assert.equal(a.status,'HOLD_EXTERNAL_SOURCE_CORRECTION_VERIFICATION');
assert.equal(a.history_complete,true);
assert.equal(a.source_correction.evidence_intake_count,1);
assert.equal(a.source_correction.external_verification_count,0);
assert.equal(a.source_correction.external_source_repair_verified,false);
assert.equal(a.master_closure.eligible_count,0);
assert.equal(a.owner_evidence_history[0].state,'SOURCE_CORRECTION_EVIDENCE_INTAKE_UNVERIFIED');
assert.equal(assessFinance695(current,mismatch,[
row(451,'intake_source_correction',{...correction,independently_verified:true})],now).history_complete,false);
assert.equal(assessFinance695(current,mismatch,[
row(451,'intake_source_correction',{...correction,external_evidence_sha256:'invalid'})],now).invalid_owner_history_count,1);
assert.equal(assessFinance695(current,mismatch,[
row(451,'intake_source_correction',{...correction,source_revision:'foreign'})],now).invalid_owner_history_count,1);
assert.equal(assessFinance695(current,prior,[
row(452,'revalidate_master_closure',{prior_owner_closure_receipt_id:999,
master_receipt_id:82,historical_signature_reverified:false})],now).invalid_owner_history_count,1);
assert.equal(assessFinance695(current,prior,[
row(453,'revalidate_master_closure',{prior_owner_closure_receipt_id:330,
master_receipt_id:82,historical_signature_reverified:true})],now).invalid_owner_history_count,1);
const duplicate=row(454,'intake_source_correction',correction);
assert.equal(assessFinance695(current,mismatch,[duplicate,
row(452,'intake_source_correction',correction,'2026-11-12T14:58:00Z')],now).invalid_owner_history_count,1);
assert.equal(assessFinance695(current,mismatch,Array(61).fill(duplicate),now).history_complete,false);
assert.equal(assessFinance695(current,{...prior,history_complete:false},[],now).status,
'HOLD_FINANCIAL_695_HISTORY_DRIFT');
assert.equal(assessFinance695({queue_id:0},{history_complete:false},[],now).status,
'HOLD_SELECT_CAMPAIGN');
const server=read('functions/api/admin/social-post-queue.js'),
client=read('public/js/admin-social-platform-preflight.js'),
html=read('admin/social-publishing/index.html'),
ci=read('.github/workflows/current-application-quality.yml');
for(const pattern of [/export function assessFinance695/,/async function finance695\(/,
 /async function ownerReview695\(/,/finance_owner_review_695/,
 /owner_external_correction_intake_695/,/owner_master_closure_revalidated_695/,
 /financial695:await finance695/,/owner_finance_review_695/,
 /if\(params.get\('export'\)==='financial695'\)/,
 /external_source_repair_verified:false/,/financial_certified:false/,
 /HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY/])
assert.match(server,pattern);
for(const id of ['dd695-finance','dd695-title','dd695Refresh','dd695Export',
'dd695Status','dd695Stats','dd695Aging','dd695Correction','dd695Master',
'dd695Form','dd695Decision','dd695Source','dd695Custodian','dd695Reference',
'dd695Digest','dd695Observed','dd695Note','dd695Reviewed','dd695Submit',
'dd695Result'])assert.ok(html.includes('id="'+id+'"'),id);
for(const pattern of [/function draw695\(d\)/,/function chooseSources695\(\)/,
 /action:'owner_finance_review_695'/,/export=financial695/,/draw695\(d\)/])
assert.match(client,pattern);
assert.match(ci,/build695_financial_resolution_aging_source_correction_master_revalidation_contract\.mjs/);
console.log('BUILD 695: owner ledger aging, unverified external correction intake and current independent Master closure revalidation PASS');
