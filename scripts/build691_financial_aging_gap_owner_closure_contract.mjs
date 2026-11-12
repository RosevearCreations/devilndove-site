import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessFinance691} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T15:00:00Z');
const fp='a'.repeat(64),bad='incident-bad-aaaaaaaaaaaaaaaa',
closed='incident-closed-aaaaaaaaaaaaaaaa';
const current={queue_id:42,fingerprint_sha256:fp,source_revision:'source-exact-v691',
master_fresh:true,verified_master_receipt_id:82};
const original={history_complete:true,ledger_complete:true,master_accepted_now:true,
replay_exceptions:[{case_id:bad,reference_receipt_id:50,
issue_code:'HOLD_OWNER_ACTION_REPLAY_DRIFT',recorded_at:'2026-11-12T12:00:00Z',
owner_reviewed:false}],
renewal:{status:'VERIFIED_CURRENT_ON_REFRESH',
historical_chain_pin_matches:true,current_receipt_in_bounded_history:true,
source_pinned_receipt_ids:[82,41],observed_at:'2026-11-12T14:59:00Z',
expires_at:'2026-11-12T15:08:00Z',seconds_to_expiry:480,
renewal_gap_evidence:[{older_receipt_id:41,newer_receipt_id:82,
older_recorded_at:'2026-11-12T12:00:00Z',newer_recorded_at:'2026-11-12T12:31:00Z',
gap_minutes:31,source_pins_match:true}]},
closure_candidates:[{case_id:closed,receipt_id:115,
recorded_at:'2026-11-12T12:55:00Z',owner_reconciled:true}]};
const review=(id,decision,case_id,ref,newer=null,master=null,time='2026-11-12T14:59:00Z')=>({
social_post_attempt_id:id,attempted_at:time,
attempt_status:({escalate_replay_aging:'owner_replay_aging_escalated_691',
escalate_renewal_gap:'owner_master_gap_escalated_691',
accept_closure_continuity:'owner_closure_continuity_accepted_691'})[decision],
response_json:JSON.stringify({decision,case_id,reference_receipt_id:ref,
newer_receipt_id:newer,verified_master_receipt_id:master,
fingerprint_sha256:fp,source_revision:'source-exact-v691',
owner_user_id:9,owner_reviewed:true,resolution_note:
'The owner reviewed the exact source and original proof with a manual followup.'})});
let a=assessFinance691(current,original,[],now);
assert.equal(a.status,'OWNER_REPLAY_AGING_ESCALATION_REQUIRED');
assert.equal(a.history_complete,true);
assert.equal(a.replay_exception_count,1);
assert.equal(a.overdue_count,1);
assert.equal(a.critical_aged_count,0);
assert.equal(a.unreviewed_overdue_count,1);
assert.equal(a.replay_exception_aging[0].age_minutes,180);
assert.equal(a.replay_exception_aging[0].evidence_repaired,false);
assert.equal(a.renewal.gap_count,1);
assert.equal(a.renewal.unreviewed_gap_count,1);
assert.equal(a.renewal.gap_evidence[0].older_receipt_id,41);
assert.equal(a.renewal.gap_evidence[0].newer_receipt_id,82);
assert.equal(a.renewal.gap_evidence[0].gap_is_proof_of_outage,undefined);
assert.equal(a.renewal.gap_is_proof_of_outage,false);
assert.equal(a.closure_count,1);
assert.equal(a.pending_owner_closure_acceptance,1);
assert.equal(a.master_accepted_now,true);
assert.equal(a.connection,'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY');
assert.equal(a.financial_certified,false);
assert.equal(a.automatic_escalation,false);
assert.equal(a.external_replay_performed,false);
const actions=[
review(170,'accept_closure_continuity',closed,115,null,82),
review(160,'escalate_renewal_gap',null,41,82,null,'2026-11-12T14:55:00Z'),
review(155,'escalate_replay_aging',bad,50,null,null,'2026-11-12T14:45:00Z')];
a=assessFinance691(current,original,actions,now);
assert.equal(a.status,'OWNER_CLOSURE_EVIDENCE_REVIEW_ONLY');
assert.equal(a.unreviewed_overdue_count,0);
assert.equal(a.renewal.unreviewed_gap_count,0);
assert.equal(a.pending_owner_closure_acceptance,0);
assert.equal(a.owner_actions.length,3);
assert.equal(a.owner_actions[0].state,'OWNER_ACKNOWLEDGMENT_RECORDED_NO_EXTERNAL_CERTIFICATION');
assert.equal(a.owner_closure_evidence[0].owner_continuity_accepted,true);
assert.equal(a.master_accepted_now,true);
assert.equal(a.renewal.historical_signatures_reverified,false);
assert.equal(a.renewal.background_polling,false);
const duplicate=assessFinance691(current,original,[
review(171,'accept_closure_continuity',closed,115,null,82),
...actions],now);
assert.equal(duplicate.status,'HOLD_FINANCIAL_CONTINUITY_HISTORY');
assert.equal(duplicate.invalid_owner_receipts,1);
assert.equal(duplicate.master_accepted_now,false);
const altered=review(172,'escalate_renewal_gap',null,41,999);
assert.equal(assessFinance691(current,original,[altered],now).invalid_owner_receipts,1);
const backdated=review(174,'accept_closure_continuity',closed,115,null,82,
'2026-11-12T12:00:00Z');
assert.equal(assessFinance691(current,original,[backdated],now).invalid_owner_receipts,1);
const foreign=review(175,'escalate_replay_aging',bad,50);
foreign.response_json=JSON.stringify({...JSON.parse(foreign.response_json),
source_revision:'foreign-source'});
assert.equal(assessFinance691(current,original,[foreign],now).invalid_owner_receipts,1);
const historyLimit=assessFinance691(current,original,Array(61).fill(actions[0]),now);
assert.equal(historyLimit.status,'HOLD_FINANCIAL_CONTINUITY_HISTORY');
const noClock={...original,replay_exceptions:[{...original.replay_exceptions[0],
recorded_at:'invalid-time'}]};
a=assessFinance691(current,noClock,[],now);
assert.equal(a.status,'HOLD_REPLAY_AGE_UNVERIFIABLE');
assert.equal(a.unverifiable_age_count,1);
assert.equal(a.replay_exception_aging[0].age_status,'HOLD_UNKNOWN_AGE');
const critical={...original,replay_exceptions:[{...original.replay_exceptions[0],
recorded_at:'2026-11-12T10:00:00Z'}]};
a=assessFinance691(current,critical,[],now);
assert.equal(a.critical_aged_count,1);
assert.equal(a.replay_exception_aging[0].age_status,'CRITICAL_AGED');
a=assessFinance691({...current,master_fresh:false,verified_master_receipt_id:null},
{...original,master_accepted_now:false},[],now);
assert.equal(a.master_accepted_now,false);
assert.equal(a.renewal.current_verified_receipt_id,null);
const gapDrift={...original,renewal:{...original.renewal,
historical_chain_pin_matches:false}};
assert.equal(assessFinance691(current,gapDrift,[],now).status,'HOLD_RENEWAL_SOURCE_PIN');
assert.equal(assessFinance691(current,{...original,history_complete:false},[],now).status,
'HOLD_FINANCIAL_CONTINUITY_HISTORY');
assert.equal(assessFinance691({queue_id:0},{history_complete:false},[],now).status,
'HOLD_SELECT_CAMPAIGN');
const server=read('functions/api/admin/social-post-queue.js'),
client=read('public/js/admin-social-platform-preflight.js'),
page=read('admin/social-publishing/index.html'),
ci=read('.github/workflows/current-application-quality.yml');
for(const pat of [/export function assessFinance691/,/async function finance691\(/,
 /async function ownerContinuity691\(/,/finance_owner_continuity_691/,
 /owner_replay_aging_escalated_691/,/owner_master_gap_escalated_691/,
 /owner_closure_continuity_accepted_691/,/renewal_gap_evidence:/,
 /expected_master_receipt_id/,/await append684\(db,user,id,'finance_owner_continuity_691'/,
 /financial691:await finance691/,/owner_finance_continuity_691/,
 /if\(params.get\('export'\)==='financial691'\)/,
 /background_polling:false/,/historical_signatures_reverified:false/,
 /automatic_owner_closure:false/,/external_replay_performed:false/])
assert.match(server,pat);
for(const id of ['dd691-finance','dd691-title','dd691Refresh','dd691Export',
'dd691Status','dd691Stats','dd691Renewal','dd691Exceptions','dd691Gaps',
'dd691Closures','dd691Form','dd691Decision','dd691Source','dd691Note',
'dd691Reviewed','dd691Submit','dd691Result'])
assert.ok(page.includes('id="'+id+'"'),id);
assert.match(client,/function draw691\(data\)/);
assert.match(client,/function chooseSources691\(\)/);
assert.match(client,/owner_finance_continuity_691/);
assert.match(client,/export=financial691/);
assert.doesNotMatch(client,/FINANCIAL_MASTER_ACCEPTANCE_TOKEN|PRIVATE_KEY|AI_DATA_MASTER_ACK_PUBLIC_KEY/);
assert.match(ci,/build691_financial_aging_gap_owner_closure_contract\.mjs/);
console.log('BUILD 691: replay aging, signed Master receipt gap escalation and owner closure custody PASS');
