import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessFinance688,assessFinance689} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T15:00:00Z');
const fingerprint='a'.repeat(64);
const current={queue_id:42,status:'VERIFIED_CURRENT',history_complete:true,
master_fresh:true,verified_master_receipt_id:82,fingerprint_sha256:fingerprint,
source_revision:'original-exact-source',source_signer_receipt_id:7};
const incident='incident-open-aaaaaaaaaaaaaaaa',closed='incident-closed-aaaaaaaaaaaaaaaa';
const sla={history_complete:true,advisory_target_minutes:120,
owner_followups:[{case_id:incident,issue_code:'HOLD_SOURCE_RECEIPT_DRIFT',
open_receipt_id:12,age_minutes:135,sla_state:'OVERDUE',due_at:'2026-11-12T14:45:00Z'}],
closed_cases:[{case_id:closed,issue_code:'HOLD_SOURCE_RECEIPT_DRIFT',
open_receipt_id:25,closure_receipt_id:30,newer_master_receipt_id:82,
fingerprint_sha256:fingerprint,elapsed_minutes:12,within_advisory_target:true}]};
const receipt=(id,when)=>({social_post_attempt_id:id,attempted_at:when,
response_json:JSON.stringify({signature:'recorded-history-only',
claim:{queue_id:42,fingerprint_sha256:fingerprint,source_revision:'original-exact-source',
source_signer_receipt_id:7,receiver_receipt_id:'receiver-witness-abcdef',
issued_at:new Date(Date.parse(when)-60000).toISOString()}})});
const receipts=[receipt(82,'2026-11-12T14:58:00Z'),
receipt(41,'2026-11-12T14:30:00Z')];
const owner=(id,decision,case_id,evidence)=>({
social_post_attempt_id:id,attempt_status:decision==='escalate_breach'?
'owner_sla_breach_escalated_688':'owner_recovery_signoff_recorded_688',
attempted_at:new Date(Date.parse('2026-11-12T14:55:00Z')-(120-id)*30000).toISOString(),
response_json:JSON.stringify({decision,case_id,evidence_receipt_id:evidence,
fingerprint_sha256:fingerprint,source_revision:'original-exact-source',
independent_master_receipt_id:decision==='signoff_closure'?82:null,
owner_user_id:9,owner_reviewed:true,
resolution_note:'Owner inspected the exact source and independent signed evidence.'})});
const reviews=[owner(110,'signoff_closure',closed,30),
owner(100,'escalate_breach',incident,12)];
const report=assessFinance688(current,sla,receipts,reviews,now);
assert.equal(report.history_complete,true);
assert.equal(report.master_accepted_now,true);
assert.equal(report.owner_reviews.length,2);
const audit=(id,decision,case_id,prior)=>({
social_post_attempt_id:id,attempt_status:({
replay_escalation:'owner_escalation_replay_689',
resolve_renewal_drift:'owner_master_renewal_drift_resolved_689',
accept_owner_audit:'owner_audit_acceptance_689'})[decision],
attempted_at:'2026-11-12T14:59:00Z',
response_json:JSON.stringify({decision,case_id,reference_receipt_id:prior,
fingerprint_sha256:fingerprint,source_revision:'original-exact-source',
current_master_receipt_id:82,owner_reviewed:true,owner_user_id:9,
resolution_note:'Owner independently inspected protected evidence and confirmed exact replay.'})});
let r=assessFinance689(current,report,reviews,[],now);
assert.equal(r.status,'OWNER_REPLAY_READY_FOR_REVIEW');
assert.equal(r.history_complete,true);
assert.equal(r.exact_replay_count,2);
assert.equal(r.invalid_replay_count,0);
assert.equal(r.master_accepted_now,true);
assert.equal(r.renewal.historical_lineage_complete,true);
assert.equal(r.renewal.current_reverified_receipt_id,82);
assert.equal(r.drift_resolution_candidates[0].reference_receipt_id,110);
assert.equal(r.audit_acceptance_candidates[0].reference_receipt_id,110);
assert.equal(r.owner_audit_receipts.length,0);
assert.equal(r.external_replay_performed,false);
assert.equal(r.auto_drift_resolution,false);
assert.equal(r.auto_owner_acceptance,false);
assert.equal(r.profitability_certified,false);
r=assessFinance689(current,report,reviews,[
audit(150,'accept_owner_audit',closed,110),
audit(140,'resolve_renewal_drift',closed,110),
audit(130,'replay_escalation',incident,100)],now);
assert.equal(r.owner_audit_receipt_count,3);
assert.equal(r.drift_resolution_candidates[0].owner_resolution_recorded,true);
assert.equal(r.audit_acceptance_candidates[0].owner_audit_accepted,true);
assert.equal(r.owner_audit_receipts[0].state,
'OWNER_AUDIT_DECISION_RECORDED_NOT_EXTERNAL_MASTER_CERTIFICATION');
const wrong=audit(152,'accept_owner_audit',closed,999);
r=assessFinance689(current,report,reviews,[wrong],now);
assert.equal(r.status,'HOLD_REPLAY_EVIDENCE_MISMATCH');
assert.equal(r.invalid_replay_count,1);
assert.equal(r.master_accepted_now,false);
const duplicate=audit(154,'accept_owner_audit',closed,110);
r=assessFinance689(current,report,reviews,[duplicate,
audit(153,'accept_owner_audit',closed,110)],now);
assert.equal(r.invalid_replay_count,1);
assert.equal(r.history_complete,false);
const tampered={...reviews[0],response_json:JSON.stringify({
...JSON.parse(reviews[0].response_json),source_revision:'untrusted-different-source'})};
r=assessFinance689(current,report,[tampered,reviews[1]],[],now);
assert.equal(r.status,'HOLD_REPLAY_EVIDENCE_MISMATCH');
const stale={...current,master_fresh:false,verified_master_receipt_id:null,
status:'HOLD_EXPIRED_MASTER_RECEIPT'};
const staleReport=assessFinance688(stale,sla,receipts,reviews,now);
r=assessFinance689(stale,staleReport,reviews,[],now);
assert.equal(r.status,'HOLD_MASTER_RENEWAL_REVALIDATION');
assert.equal(r.renewal.current_reverified_receipt_id,null);
assert.equal(r.master_accepted_now,false);
assert.equal(assessFinance689(current,report,Array(31).fill(reviews[0]),[],now).status,
'HOLD_REPLAY_WINDOW_INCOMPLETE');
assert.equal(assessFinance689(current,report,reviews,Array(51).fill(duplicate),now).status,
'HOLD_REPLAY_WINDOW_INCOMPLETE');
assert.equal(assessFinance689({queue_id:0},{history_complete:false},[],[],now).status,
'HOLD_SELECT_CAMPAIGN');
const backend=read('functions/api/admin/social-post-queue.js'),
client=read('public/js/admin-social-platform-preflight.js'),
page=read('admin/social-publishing/index.html'),
ci=read('.github/workflows/current-application-quality.yml');
for(const pattern of [/export function assessFinance689/,
 /async function finance689\(/,/async function ownerAudit689\(/,
 /finance_owner_audit_689/,/owner_escalation_replay_689/,
 /owner_master_renewal_drift_resolved_689/,/owner_audit_acceptance_689/,
 /Number\(p.expected_master_receipt_id\)!==v.verified_master_receipt_id/,
 /await append684\(db,user,n,'finance_owner_audit_689'/,
 /financial689:await finance689/,/owner_finance_audit_689/,
 /if\(params.get\('export'\)==='financial689'\)/,
 /historical_signatures_reverified:false/,/external_replay_performed:false/])
assert.match(backend,pattern);
for(const id of ['dd689-finance','dd689-title','dd689Refresh','dd689Export',
'dd689Status','dd689Renewal','dd689Counters','dd689Replay','dd689Decisions',
'dd689AuditForm','dd689Decision','dd689Source','dd689Note','dd689Reviewed',
'dd689Submit','dd689Result'])
assert.ok(page.includes('id="'+id+'"'),id);
assert.match(client,/function draw689\(d\)/);
assert.match(client,/function chooseAudit689\(\)/);
assert.match(client,/action:'owner_finance_audit_689'/);
assert.match(client,/export=financial689/);
assert.doesNotMatch(client,/FINANCIAL_MASTER_ACCEPTANCE_TOKEN|PRIVATE_KEY|AI_DATA_MASTER_ACK_PUBLIC_KEY/);
assert.match(ci,/build689_financial_replay_renewal_audit_continuity_contract\.mjs/);
console.log('BUILD 689: owner evidence replay, Master renewal drift/closure and owner audit acceptance continuity PASS');
