import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessFinance687} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T08:00:00Z');
const current={queue_id:42,history_complete:true,master_fresh:true,
verified_master_receipt_id:45,expires_at:'2026-11-12T08:09:00Z'};
const opened=(id,time,master=10)=>({
social_post_attempt_id:id,attempt_status:'owner_exception_opened_685',attempted_at:time,
response_json:JSON.stringify({case_id:'incident-'+id+'-aaaaaaaaaaaaaaaa',issue_code:'HOLD_EXPIRED_MASTER_RECEIPT',
opened_acceptance_receipt_id:master,fingerprint_sha256:'a'.repeat(64)})});
const closed={
social_post_attempt_id:31,attempt_status:'owner_exception_evidence_closed_685',
attempted_at:'2026-11-12T06:45:00Z',response_json:JSON.stringify({
case_id:'incident-30-aaaaaaaaaaaaaaaa',fingerprint_sha256:'a'.repeat(64),
opened_acceptance_receipt_id:10,verified_master_acceptance_receipt_id:20})};
const incidents=[opened(33,'2026-11-12T06:30:00Z'),opened(32,'2026-11-12T05:30:00Z'),
closed,opened(30,'2026-11-12T06:00:00Z')];
const acceptance=[{social_post_attempt_id:45,attempted_at:'2026-11-12T07:55:00Z',
response_json:JSON.stringify({signature:'not-reverified-by-report',claim:{issued_at:'2026-11-12T07:54:00Z'}})},
{social_post_attempt_id:20,attempted_at:'2026-11-12T06:44:00Z',
response_json:JSON.stringify({claim:{issued_at:'2026-11-12T06:43:00Z'}})}];
const x=assessFinance687(current,incidents,acceptance,now);
assert.equal(x.status,'OWNER_REVIEW_ANALYTICS_ONLY');
assert.equal(x.history_complete,true);
assert.equal(x.advisory_only,true);
assert.equal(x.advisory_target_minutes,120);
assert.equal(x.open_count,2);
assert.equal(x.due_soon_count,1);
assert.equal(x.overdue_count,1);
assert.equal(x.owner_followups[0].sla_state,'OVERDUE');
assert.equal(x.owner_followups[0].age_minutes,150);
assert.equal(x.closed_count,1);
assert.equal(x.closed_within_target_count,1);
assert.equal(x.mean_recorded_closure_minutes,45);
assert.equal(x.renewal.recorded_receipt_count,2);
assert.equal(x.renewal.recorded_renewal_count,1);
assert.equal(x.renewal.current_verified_receipt_id,45);
assert.equal(x.renewal.receipts[1].state,'RECORDED_HISTORY_NOT_CURRENTLY_REVERIFIED');
assert.equal(x.master_accepted_now,true);
assert.equal(x.profitability_certified,false);
assert.equal(x.automatic_case_closure,false);
assert.equal(x.renewal.background_renewal,false);
const stale=assessFinance687({...current,master_fresh:false,verified_master_receipt_id:null},
incidents,acceptance,now);
assert.equal(stale.renewal.current_verified_receipt_id,null);
assert.equal(stale.master_accepted_now,false);
assert.equal(stale.renewal.current_status,'HOLD_INDEPENDENT_MASTER_RECHECK');
assert.equal(assessFinance687({...current,history_complete:false},incidents,acceptance,now).status,
'HOLD_BOUNDED_HISTORY_INCOMPLETE');
assert.equal(assessFinance687(current,Array(121).fill(opened(1,'2026-11-12T07:00:00Z')),acceptance,now).status,
'HOLD_BOUNDED_HISTORY_INCOMPLETE');
const orphan={...closed,response_json:JSON.stringify({case_id:'incident-missing-aaaaaaaaaaaaaaaa',
fingerprint_sha256:'a'.repeat(64),opened_acceptance_receipt_id:10,verified_master_acceptance_receipt_id:20})};
assert.equal(assessFinance687(current,[orphan],acceptance,now).status,'HOLD_BOUNDED_HISTORY_INCOMPLETE');
const bad={...closed,response_json:JSON.stringify({case_id:'incident-30-aaaaaaaaaaaaaaaa',
fingerprint_sha256:'b'.repeat(64),opened_acceptance_receipt_id:10,verified_master_acceptance_receipt_id:20})};
assert.equal(assessFinance687(current,[bad,opened(30,'2026-11-12T06:00:00Z')],acceptance,now).closed_count,0);
assert.equal(assessFinance687({queue_id:0},[],[],now).status,'HOLD_SELECT_CAMPAIGN');
const server=read('functions/api/admin/social-post-queue.js');
const page=read('admin/social-publishing/index.html');
const client=read('public/js/admin-social-platform-preflight.js');
const ci=read('.github/workflows/current-application-quality.yml');
for(const pat of [/export function assessFinance687/,/async function finance687\(/,
 /finance_exception_685' ORDER BY/,/finance_acceptance_684' ORDER BY/,
 /financial687:await finance687/,/HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY/,
 /automatic_case_closure:false/,/history_complete:complete&&invalid===0/])assert.match(server,pat);
for(const id of ['dd687-finance','dd687-title','dd687Refresh','dd687Status',
'dd687Stats','dd687Renewal','dd687Receipts','dd687Coverage','dd687Followups','dd687Review'])
assert.ok(page.includes('id="'+id+'"'),id);
assert.match(client,/function draw687\(d\)/);
assert.match(client,/v\.renewal\.current_status/);
assert.match(client,/dd687Review/);
assert.doesNotMatch(client,/FINANCIAL_MASTER_ACCEPTANCE_TOKEN|PRIVATE_KEY|AI_DATA_MASTER_ACK_PUBLIC_KEY/);
assert.match(ci,/build687_finance_sla_renewal_closure_contract\.mjs/);
console.log('BUILD 687: SLA monitoring, bounded signed receipt renewal and evidence-gated closure analytics PASS');
