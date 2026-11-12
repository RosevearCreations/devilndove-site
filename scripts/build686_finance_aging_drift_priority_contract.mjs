import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prioritizeFinance686} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T07:00:00.000Z');
const base={queue_id:42,status:'VERIFIED_CURRENT',master_fresh:true,
expires_at:'2026-11-12T07:04:00.000Z',open_cases:[]};
let s=prioritizeFinance686(base,now);
assert.equal(s.level,'WARNING');
assert.equal(s.alerts[0].code,'MASTER_RECEIPT_EXPIRING');
assert.equal(s.seconds_to_expiry,240);
assert.equal(s.connection,'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY');
assert.equal(s.automated_master_polling,false);
assert.equal(s.profitability_certified,false);
s=prioritizeFinance686({...base,expires_at:'2026-11-12T07:15:00.000Z'},now);
assert.equal(s.level,'CURRENT');
s=prioritizeFinance686({...base,master_fresh:false,status:'HOLD_SOURCE_RECEIPT_DRIFT',
open_cases:[{case_id:'incident-test-high',issue_code:'HOLD_EXPIRED_MASTER_RECEIPT',receipt_id:11,recorded_at:'2026-11-12T06:00:00.000Z'},
{case_id:'incident-test-critical',issue_code:'HOLD_SOURCE_RECEIPT_DRIFT',receipt_id:12,recorded_at:'2026-11-12T06:50:00.000Z'}]},now);
assert.equal(s.level,'CRITICAL');
assert.equal(s.source_drift,true);
assert.equal(s.recovery_queue[0].case_id,'incident-test-critical');
assert.equal(s.recovery_queue[0].priority,'CRITICAL');
assert.equal(s.recovery_queue[1].age_minutes,60);
assert.equal(s.master_accepted_now,false);
assert.equal(prioritizeFinance686({...base,status:'HOLD_MISSING_MASTER_RECEIPT',master_fresh:false},now).level,'HIGH');
assert.equal(prioritizeFinance686({...base,status:'HOLD_INVALID_RECEIPT_CLOCK',master_fresh:false},now).level,'CRITICAL');
assert.equal(prioritizeFinance686({queue_id:0,status:'HOLD_SELECT_CAMPAIGN',master_fresh:false},now).level,'HIGH');
const backend=read('functions/api/admin/social-post-queue.js'),
client=read('public/js/admin-social-platform-preflight.js'),
html=read('admin/social-publishing/index.html'),
ci=read('.github/workflows/current-application-quality.yml');
for(const pat of [/export function prioritizeFinance686/,/async function globalFinanceQueue686/,
 /ORDER BY a.social_post_attempt_id DESC LIMIT 121/,/history_complete:recent.length<=120/,
 /OWNER_RECHECK_REQUIRED/,/financialRecoveryQueue686:await globalFinanceQueue686/,
 /alerts686:prioritizeFinance686\(current\)/, /finance_exception_685/,
 /owner_finance_recovery_685/])assert.match(backend,pat);
for(const id of ['dd686-finance','dd686-title','dd686Refresh','dd686Status','dd686Alerts',
 'dd686Coverage','dd686Queue','dd686Escalate','dd686Result'])assert.ok(html.includes('id="'+id+'"'),id);
assert.match(client,/function draw686\(d\)/);
assert.match(client,/\.textContent=item\.priority/);
assert.match(client,/\$\('dd686Escalate'\)\.addEventListener/);
assert.match(client,/send\('owner_finance_recovery_685'/);
assert.doesNotMatch(client,/FINANCIAL_MASTER_ACCEPTANCE_TOKEN|PRIVATE_KEY|AI_DATA_MASTER_ACK_PUBLIC_KEY/);
assert.match(ci,/build686_finance_aging_drift_priority_contract\.mjs/);
console.log('BUILD 686: server-clock aging alerts, fail-closed drift, owner escalation and priority queue: PASS');
