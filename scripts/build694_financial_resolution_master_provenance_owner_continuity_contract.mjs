import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessFinance694} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T15:00:00Z'),fp='a'.repeat(64),
caseId='incident-owner-aaaaaaaaaaaa';
const current={queue_id:42,fingerprint_sha256:fp,
source_revision:'exact-financial-source-694',master_fresh:true,
verified_master_receipt_id:82,expires_at:'2026-11-12T15:08:00Z'};
const prior={history_complete:true,master_accepted_now:true,
followups:{items:[{case_id:caseId,followup_receipt_id:200,
original_escalation_receipt_id:150,repeat_followup_recorded:true}]},
provenance:{current_master_receipt_id:82,
current_master_independently_reverified:true,
historical_source_receipt_ids:[82,41],source_exception_count:0,
pairs:[{older_receipt_id:41,newer_receipt_id:82,
recorded_gap_minutes:31,older_recorded_at:'2026-11-12T12:00:00Z',
newer_recorded_at:'2026-11-12T13:00:00Z',
source_pins_match:true,revalidation_recorded:true,exception_review_recorded:false}]},
audit:{history:[{case_id:caseId,prior_owner_audit_receipt_id:220,
owner_acceptance_recorded:true}]},
owner_history:[
{receipt_id:310,decision:'accept_owner_audit_history',case_id:caseId,
reference_receipt_id:220,recorded_at:'2026-11-12T14:35:00Z',
state:'OWNER_REVIEW_RECORDED_HISTORICAL_NOT_EXTERNAL_CERTIFICATION'},
{receipt_id:300,decision:'revalidate_master_provenance',case_id:null,
reference_receipt_id:41,newer_receipt_id:82,recorded_at:'2026-11-12T14:30:00Z',
state:'OWNER_REVIEW_RECORDED_HISTORICAL_NOT_EXTERNAL_CERTIFICATION'},
{receipt_id:290,decision:'repeat_sla_followup',case_id:caseId,
reference_receipt_id:200,recorded_at:'2026-11-12T14:25:00Z',
state:'OWNER_REVIEW_RECORDED_HISTORICAL_NOT_EXTERNAL_CERTIFICATION'}]};
const row=(id,decision,caseName,ref,newer=null,master=82,
time='2026-11-12T14:59:00Z',extra={})=>({
social_post_attempt_id:id,
attempt_status:({record_sla_resolution:'owner_sla_resolution_recorded_694',
close_revalidated_provenance:'owner_master_provenance_closure_recorded_694',
accept_owner_continuity:'owner_acceptance_continuity_recorded_694'})[decision],
attempted_at:time,
response_json:JSON.stringify({decision,case_id:caseName,
reference_receipt_id:ref,newer_receipt_id:newer,
master_receipt_id:master,
linked_owner_acceptance_receipt_id:decision==='record_sla_resolution'?310:null,
prior_revalidation_receipt_id:decision==='close_revalidated_provenance'?300:null,
prior_owner_audit_receipt_id:decision==='accept_owner_continuity'?220:null,
fingerprint_sha256:fp,source_revision:current.source_revision,
owner_user_id:9,owner_reviewed:true,resolution_note:
'The owner inspected original signed receipt identity and case continuity without certifying external repair.',...extra})});
let a=assessFinance694(current,prior,[],now);
assert.equal(a.status,'OWNER_FINANCIAL_SLA_RESOLUTION_REVIEW_REQUIRED');
assert.equal(a.history_complete,true);
assert.equal(a.resolution.record_count,1);
assert.equal(a.resolution.pending_owner_resolution_count,1);
assert.equal(a.resolution.items[0].recheck_receipt_id,290);
assert.equal(a.resolution.items[0].linked_owner_acceptance_receipt_id,310);
assert.equal(a.resolution.items[0].eligible_for_owner_resolution,true);
assert.equal(a.resolution.items[0].source_incident_repaired,false);
assert.equal(a.provenance.source_exception_hold_count,0);
assert.equal(a.provenance.eligible_owner_closure_count,1);
assert.equal(a.provenance.pending_owner_closure_count,1);
assert.equal(a.provenance.pairs[0].review_receipt_id,300);
assert.equal(a.provenance.historical_signatures_reverified,false);
assert.equal(a.provenance.external_source_correction_proven,false);
assert.equal(a.owner_audit.historical_acceptance_count,1);
assert.equal(a.owner_audit.pending_continuity_count,1);
assert.equal(a.master_accepted_now,true);
assert.equal(a.connection,'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY');
assert.equal(a.financial_certified,false);
assert.equal(a.auto_sla_resolution,false);
assert.equal(a.external_master_replay_performed,false);
const rows=[
row(440,'record_sla_resolution',caseId,290,null,82,'2026-11-12T14:59:00Z'),
row(430,'close_revalidated_provenance',null,41,82,82,'2026-11-12T14:58:00Z'),
row(420,'accept_owner_continuity',caseId,310,null,82,'2026-11-12T14:57:00Z')];
a=assessFinance694(current,prior,rows,now);
assert.equal(a.status,'OWNER_RESOLUTION_LEDGER_REVIEW_ONLY');
assert.equal(a.resolution.pending_owner_resolution_count,0);
assert.equal(a.resolution.owner_resolved_count,1);
assert.equal(a.provenance.pending_owner_closure_count,0);
assert.equal(a.owner_audit.pending_continuity_count,0);
assert.equal(a.owner_audit.owner_continuity_recorded_count,1);
assert.equal(a.owner_resolution_history.length,3);
assert.equal(a.owner_resolution_history[0].state,
'OWNER_RESOLUTION_LEDGER_RECORDED_NOT_EXTERNAL_CERTIFICATION');
assert.equal(a.master_accepted_now,true);
const duplicate=assessFinance694(current,prior,[
row(451,'record_sla_resolution',caseId,290),
row(450,'record_sla_resolution',caseId,290)],now);
assert.equal(duplicate.status,'HOLD_OWNER_RESOLUTION_LEDGER_HISTORY');
assert.equal(duplicate.invalid_owner_history_count,1);
assert.equal(duplicate.master_accepted_now,false);
const wrongOwner=row(460,'record_sla_resolution',caseId,290,null,82,
'2026-11-12T14:59:00Z',{linked_owner_acceptance_receipt_id:999});
assert.equal(assessFinance694(current,prior,[wrongOwner],now).invalid_owner_history_count,1);
const wrongProof=row(461,'close_revalidated_provenance',null,41,82,82,
'2026-11-12T14:59:00Z',{prior_revalidation_receipt_id:999});
assert.equal(assessFinance694(current,prior,[wrongProof],now).invalid_owner_history_count,1);
assert.equal(assessFinance694(current,prior,[
row(462,'accept_owner_continuity',caseId,310,null,999)],now).invalid_owner_history_count,1);
const foreign=row(463,'record_sla_resolution',caseId,290,null,82,
'2026-11-12T14:59:00Z',{source_revision:'foreign-source'});
assert.equal(assessFinance694(current,prior,[foreign],now).invalid_owner_history_count,1);
assert.equal(assessFinance694(current,prior,[
row(464,'accept_owner_continuity',caseId,310,null,82,'2026-11-12T14:00:00Z')
],now).invalid_owner_history_count,1);
const mismatched={...prior,provenance:{...prior.provenance,
source_exception_count:1,pairs:[{...prior.provenance.pairs[0],
source_pins_match:false,exception_review_recorded:true,revalidation_recorded:false}]}};
a=assessFinance694(current,mismatched,[],now);
assert.equal(a.status,'HOLD_INDEPENDENT_PROVENANCE_EXCEPTION_CORRECTION');
assert.equal(a.provenance.source_exception_hold_count,1);
assert.equal(a.provenance.pairs[0].eligible_for_owner_provenance_closure,false);
assert.equal(a.master_accepted_now,false);
assert.equal(a.provenance.pairs[0].original_exception_repaired,false);
const stale={...current,master_fresh:false,expires_at:'2026-11-12T14:40:00Z'};
a=assessFinance694(stale,{...prior,master_accepted_now:false},[],now);
assert.equal(a.status,'HOLD_FRESH_INDEPENDENT_MASTER_ACCEPTANCE');
assert.equal(a.master_accepted_now,false);
const unaccepted={...prior,audit:{history:[{...prior.audit.history[0],
owner_acceptance_recorded:false}]}};
a=assessFinance694(current,unaccepted,[],now);
assert.equal(a.resolution.items[0].eligible_for_owner_resolution,false);
assert.equal(a.resolution.items[0].linked_owner_acceptance_receipt_id,null);
assert.equal(a.owner_audit.historical_acceptance_count,0);
const noReval={...prior,provenance:{...prior.provenance,
pairs:[{...prior.provenance.pairs[0],revalidation_recorded:false}]}};
a=assessFinance694(current,noReval,[],now);
assert.equal(a.provenance.pairs[0].eligible_for_owner_provenance_closure,false);
const changedMaster={...current,verified_master_receipt_id:103};
const renewed={...prior,provenance:{...prior.provenance,
current_master_receipt_id:103,historical_source_receipt_ids:[103,82,41]}};
a=assessFinance694(changedMaster,renewed,rows,now);
assert.equal(a.history_complete,true);
assert.equal(a.master_accepted_now,true);
assert.equal(a.resolution.owner_resolved_count,1);
assert.equal(a.provenance.current_independent_master_receipt_id,103);
assert.equal(assessFinance694(current,prior,Array(61).fill(rows[0]),now).status,
'HOLD_OWNER_RESOLUTION_LEDGER_HISTORY');
assert.equal(assessFinance694(current,{...prior,history_complete:false},[],now).status,
'HOLD_OWNER_RESOLUTION_LEDGER_HISTORY');
assert.equal(assessFinance694({queue_id:0},{history_complete:false},[],now).status,
'HOLD_SELECT_CAMPAIGN');
const server=read('functions/api/admin/social-post-queue.js'),
client=read('public/js/admin-social-platform-preflight.js'),
page=read('admin/social-publishing/index.html'),
ci=read('.github/workflows/current-application-quality.yml');
for(const pattern of [/export function assessFinance694/,/async function finance694\(/,
 /async function ownerResolution694\(/,/finance_owner_resolution_694/,
 /owner_sla_resolution_recorded_694/,/owner_master_provenance_closure_recorded_694/,
 /owner_acceptance_continuity_recorded_694/,/historical_source_receipt_ids:/,
 /expected_master_receipt_id/,/await append684\(db,user,n,'finance_owner_resolution_694'/,
 /financial694:await finance694/,/owner_finance_resolution_694/,
 /if\(params.get\('export'\)==='financial694'\)/,
 /historical_signatures_reverified:false/,/auto_master_provenance_closure:false/,
 /external_master_replay_performed:false/])assert.match(server,pattern);
for(const id of ['dd694-finance','dd694-title','dd694Refresh','dd694Export',
'dd694Status','dd694Stats','dd694Resolution','dd694Provenance','dd694Pairs',
'dd694Acceptance','dd694Form','dd694Decision','dd694Source','dd694Note',
'dd694Reviewed','dd694Submit','dd694Result'])assert.ok(page.includes('id="'+id+'"'),id);
assert.match(client,/function draw694\(d\)/);
assert.match(client,/function chooseSources694\(\)/);
assert.match(client,/owner_finance_resolution_694/);
assert.match(client,/export=financial694/);
assert.doesNotMatch(client,/FINANCIAL_MASTER_ACCEPTANCE_TOKEN|PRIVATE_KEY|AI_DATA_MASTER_ACK_PUBLIC_KEY/);
assert.match(ci,/build694_financial_resolution_master_provenance_owner_continuity_contract\.mjs/);
console.log('BUILD 694: owner SLA resolution ledger, exact Master provenance closure and owner continuity PASS');
