import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessFinance688} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T13:00:00Z');
const fingerprint='a'.repeat(64);
const current={queue_id:42,history_complete:true,master_fresh:true,
verified_master_receipt_id:82,fingerprint_sha256:fingerprint,
source_revision:'signed-source-123',source_signer_receipt_id:7};
const breach={case_id:'incident-open-aaaaaaaaaaaaaaaa',issue_code:'HOLD_SOURCE_RECEIPT_DRIFT',
open_receipt_id:12,age_minutes:155,sla_state:'OVERDUE',due_at:'2026-11-12T12:25:00Z'};
const closed={case_id:'incident-closed-aaaaaaaaaaaaaaaa',issue_code:'HOLD_EXPIRED_MASTER_RECEIPT',
open_receipt_id:23,closure_receipt_id:30,newer_master_receipt_id:82,fingerprint_sha256:fingerprint,
elapsed_minutes:32,within_advisory_target:true};
const sla={history_complete:true,advisory_target_minutes:120,owner_followups:[breach,
{case_id:'incident-soon-aaaaaaaaaaaaaaaa',issue_code:'HOLD_MASTER_RECEIVER',
open_receipt_id:25,age_minutes:95,sla_state:'DUE_SOON'}],closed_cases:[closed]};
const signed=(id,at)=>({social_post_attempt_id:id,attempted_at:at,
response_json:JSON.stringify({signature:'historically-accepted-signature-opaque',
claim:{queue_id:42,fingerprint_sha256:fingerprint,source_revision:'signed-source-123',
source_signer_receipt_id:7,receiver_receipt_id:'receiver-reference-12345',
issued_at:new Date(Date.parse(at)-60000).toISOString()}})});
const receipts=[signed(82,'2026-11-12T12:58:00Z'),
signed(51,'2026-11-12T12:15:00Z')];
const review=(id,decision,case_id,evidence,at='2026-11-12T12:58:00Z')=>({
social_post_attempt_id:id,attempt_status:decision==='escalate_breach'?
'owner_sla_breach_escalated_688':'owner_recovery_signoff_recorded_688',attempted_at:at,
response_json:JSON.stringify({decision,case_id,evidence_receipt_id:evidence,
fingerprint_sha256:fingerprint,owner_user_id:2,owner_reviewed:true,
resolution_note:'Owner inspected exact protected evidence; follow up is required.'})});
let s=assessFinance688(current,sla,receipts,[],now);
assert.equal(s.status,'OWNER_SLA_BREACH_REVIEW_REQUIRED');
assert.equal(s.history_complete,true);
assert.equal(s.breach_count,1);
assert.equal(s.unreviewed_breach_count,1);
assert.equal(s.due_soon_count,1);
assert.equal(s.breaches[0].severity,'CRITICAL');
assert.equal(s.pending_closure_signoff_count,1);
assert.equal(s.renewal_audit.lineage_complete,true);
assert.equal(s.renewal_audit.historical_renewal_count,1);
assert.equal(s.renewal_audit.current_independently_reverified_receipt_id,82);
assert.equal(s.renewal_audit.records[1].currently_reverified,false);
assert.equal(s.master_accepted_now,true);
assert.equal(s.connection,'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY');
assert.equal(s.financial_certified,false);
assert.equal(s.auto_escalation,false);
assert.equal(s.auto_signoff,false);
s=assessFinance688(current,sla,receipts,[
review(110,'escalate_breach',breach.case_id,12),
review(111,'signoff_closure',closed.case_id,30)],now);
assert.equal(s.unreviewed_breach_count,0);
assert.equal(s.signoff_count,1);
assert.equal(s.pending_closure_signoff_count,0);
assert.equal(s.owner_reviews.length,2);
assert.equal(s.breaches[0].owner_reviewed,true);
assert.equal(s.closed_cases[0].owner_signed_off,true);
assert.equal(s.owner_reviews[1].state,'OWNER_REVIEW_RECORDED_NOT_EXTERNAL_MASTER_ACCEPTANCE');
s=assessFinance688({...current,master_fresh:false,verified_master_receipt_id:null},sla,receipts,[],now);
assert.equal(s.master_accepted_now,false);
assert.equal(s.renewal_audit.current_independently_reverified_receipt_id,null);
s=assessFinance688(current,sla,[],[],now);
assert.equal(s.status,'HOLD_RECEIPT_RENEWAL_LINEAGE');
assert.equal(s.breach_count,1);
s=assessFinance688(current,sla,[signed(82,'2026-11-12T12:58:00Z'),
{...signed(51,'2026-11-12T12:15:00Z'),response_json:JSON.stringify({
signature:'historical',claim:{queue_id:42,fingerprint_sha256:'b'.repeat(64),
source_revision:'signed-source-123',source_signer_receipt_id:7,
receiver_receipt_id:'receiver-reference-12345',issued_at:'2026-11-12T12:14:00Z'}})}],[],now);
assert.equal(s.renewal_audit.lineage_complete,false);
assert.equal(s.master_accepted_now,false);
const forged=review(112,'signoff_closure',closed.case_id,999);
s=assessFinance688(current,sla,receipts,[forged],now);
assert.equal(s.status,'HOLD_REVIEW_HISTORY_INCOMPLETE');
assert.equal(s.history_complete,false);
assert.equal(s.invalid_or_stale_review_count,1);
assert.equal(assessFinance688(current,{...sla,history_complete:false},receipts,[],now).status,
'HOLD_REVIEW_HISTORY_INCOMPLETE');
assert.equal(assessFinance688(current,sla,receipts,Array(81).fill(forged),now).status,
'HOLD_REVIEW_HISTORY_INCOMPLETE');
assert.equal(assessFinance688({queue_id:0},sla,receipts,[],now).status,'HOLD_SELECT_CAMPAIGN');
const server=read('functions/api/admin/social-post-queue.js'),
client=read('public/js/admin-social-platform-preflight.js'),
html=read('admin/social-publishing/index.html'),
ci=read('.github/workflows/current-application-quality.yml');
for(const pat of [/export function assessFinance688/,/async function finance688\(/,
/async function ownerReview688\(/,/finance_owner_review_688/,
/owner_sla_breach_escalated_688/,/owner_recovery_signoff_recorded_688/,
/expected_evidence_receipt_id/,/await append684\(db,user,n/,
/if\(params.get\('export'\)==='financial688'\)/,
/financial688:await finance688/,/owner_finance_review_688/,
/historical_acceptance_is_not_current_proof:true/])assert.match(server,pat);
for(const id of ['dd688-finance','dd688-title','dd688Refresh','dd688Export',
'dd688Status','dd688Renewal','dd688Metrics','dd688Breaches','dd688Signoffs',
'dd688OwnerReview','dd688Decision','dd688Case','dd688Note','dd688Reviewed',
'dd688Submit','dd688Result'])assert.ok(html.includes('id="'+id+'"'),id);
assert.match(client,/function draw688\(d\)/);
assert.match(client,/function chooseCases688\(\)/);
assert.match(client,/owner_finance_review_688/);
assert.match(client,/export=financial688/);
assert.doesNotMatch(client,/FINANCIAL_MASTER_ACCEPTANCE_TOKEN|PRIVATE_KEY|AI_DATA_MASTER_ACK_PUBLIC_KEY/);
assert.match(ci,/build688_financial_breach_renewal_signoff_contract\.mjs/);
console.log('BUILD 688: owner-gated breach escalation, audit continuity, exact receipt signoff and protected reporting PASS');
