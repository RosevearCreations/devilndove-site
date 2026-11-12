import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessFinance693} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T15:00:00Z'),fp='a'.repeat(64),
caseId='incident-followup-aaaaaaaaaaaa',closure='incident-closure-bbbbbbbbbbbb';
const current={queue_id:42,master_fresh:true,verified_master_receipt_id:82,
expires_at:'2026-11-12T15:08:00Z',fingerprint_sha256:fp,
source_revision:'original-source-693'};
const base={history_complete:true,master_accepted_now:true,
provenance:{current_exact_master_receipt_id:82,
current_signature_verified_independently:true,
bounded_historical_receipt_ids:[82,41],
historical_receipt_pairs:[{older_receipt_id:41,newer_receipt_id:82,
older_recorded_at:'2026-11-12T12:00:00Z',
newer_recorded_at:'2026-11-12T13:00:00Z',
gap_minutes:60,provenance_state:'HISTORICAL_SOURCE_RECEIPT_PINS_MATCH_NOT_SIGNATURE_REVERIFIED',
owner_provenance_reviewed:true}]},
owner_reviews:[
{receipt_id:220,decision:'reconcile_closure_audit',case_id:closure,
reference_receipt_id:180,recorded_at:'2026-11-12T14:00:00Z',owner_user_id:9,
state:'OWNER_REVIEW_RECORDED_NO_EXTERNAL_MASTER_CERTIFICATION'},
{receipt_id:210,decision:'review_master_provenance',case_id:null,
reference_receipt_id:41,newer_receipt_id:82,recorded_at:'2026-11-12T13:30:00Z',
owner_user_id:9,state:'OWNER_REVIEW_RECORDED_NO_EXTERNAL_MASTER_CERTIFICATION'},
{receipt_id:200,decision:'record_sla_followup',case_id:caseId,
reference_receipt_id:150,recorded_at:'2026-11-12T12:30:00Z',owner_user_id:9,
state:'OWNER_REVIEW_RECORDED_NO_EXTERNAL_MASTER_CERTIFICATION'}]};
const entry=(id,decision,caseName,ref,newer=null,master=null,
recorded='2026-11-12T14:59:00Z',prior=null)=>({
social_post_attempt_id:id,
attempt_status:({repeat_sla_followup:'owner_followup_aging_reviewed_693',
review_provenance_exception:'owner_provenance_exception_reviewed_693',
revalidate_master_provenance:'owner_master_provenance_revalidated_693',
accept_owner_audit_history:'owner_audit_acceptance_recorded_693'})[decision],
attempted_at:recorded,response_json:JSON.stringify({decision,case_id:caseName,
reference_receipt_id:ref,newer_receipt_id:newer,master_receipt_id:master,
prior_owner_review_receipt_id:prior,fingerprint_sha256:fp,
source_revision:current.source_revision,owner_user_id:9,owner_reviewed:true,
resolution_note:'Owner independently reviewed the original source and complete protected receipt history.'})});
let a=assessFinance693(current,base,[],now);
assert.equal(a.status,'OWNER_SLA_AGING_RECHECK_REQUIRED');
assert.equal(a.history_complete,true);
assert.equal(a.followups.advisory_target_minutes,120);
assert.equal(a.followups.record_count,1);
assert.equal(a.followups.overdue_count,1);
assert.equal(a.followups.pending_overdue_count,1);
assert.equal(a.followups.items[0].age_minutes,150);
assert.equal(a.followups.items[0].source_exception_repaired,false);
assert.equal(a.provenance.current_master_receipt_id,82);
assert.equal(a.provenance.current_master_independently_reverified,true);
assert.equal(a.provenance.historical_pair_count,1);
assert.equal(a.provenance.pending_owner_revalidation_count,1);
assert.equal(a.provenance.pairs[0].previous_owner_receipt_id,210);
assert.equal(a.provenance.historical_signatures_reverified,false);
assert.equal(a.audit.prior_acceptance_count,1);
assert.equal(a.audit.pending_owner_acceptance_count,1);
assert.equal(a.master_accepted_now,true);
assert.equal(a.connection,'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY');
assert.equal(a.financial_certified,false);
assert.equal(a.auto_sla_followup,false);
assert.equal(a.auto_source_repair,false);
assert.equal(a.auto_owner_acceptance,false);
const records=[
entry(310,'accept_owner_audit_history',closure,220,null,82,'2026-11-12T14:59:00Z'),
entry(300,'revalidate_master_provenance',null,41,82,82,'2026-11-12T14:58:00Z',210),
entry(290,'repeat_sla_followup',caseId,200,null,null,'2026-11-12T14:57:00Z')];
a=assessFinance693(current,base,records,now);
assert.equal(a.status,'OWNER_AUDIT_ACCEPTANCE_REVIEW_ONLY');
assert.equal(a.followups.pending_overdue_count,0);
assert.equal(a.provenance.pending_owner_revalidation_count,0);
assert.equal(a.audit.pending_owner_acceptance_count,0);
assert.equal(a.audit.owner_accepted_count,1);
assert.equal(a.owner_history.length,3);
assert.equal(a.owner_history[0].state,
'OWNER_REVIEW_RECORDED_HISTORICAL_NOT_EXTERNAL_CERTIFICATION');
assert.equal(a.master_accepted_now,true);
let dupe=assessFinance693(current,base,[
entry(320,'repeat_sla_followup',caseId,200),
entry(319,'repeat_sla_followup',caseId,200)],now);
assert.equal(dupe.status,'HOLD_OWNER_AUDIT_HISTORY');
assert.equal(dupe.invalid_owner_history_count,1);
assert.equal(dupe.master_accepted_now,false);
const bogusMaster=assessFinance693(current,base,
[entry(321,'accept_owner_audit_history',closure,220,null,999)],now);
assert.equal(bogusMaster.invalid_owner_history_count,1);
const bogusPrevious=assessFinance693(current,base,[
entry(322,'revalidate_master_provenance',null,41,82,82,'2026-11-12T14:59:00Z',999)],now);
assert.equal(bogusPrevious.invalid_owner_history_count,1);
const foreign=entry(323,'repeat_sla_followup',caseId,200);
foreign.response_json=JSON.stringify({...JSON.parse(foreign.response_json),
source_revision:'foreign-source'});
assert.equal(assessFinance693(current,base,[foreign],now).invalid_owner_history_count,1);
const before=assessFinance693(current,base,[entry(324,'accept_owner_audit_history',
closure,220,null,82,'2026-11-12T13:00:00Z')],now);
assert.equal(before.invalid_owner_history_count,1);
const staleCurrent={...current,master_fresh:false,expires_at:'2026-11-12T14:00:00Z'};
a=assessFinance693(staleCurrent,{...base,master_accepted_now:false},[],now);
assert.equal(a.master_accepted_now,false);
assert.equal(a.provenance.current_master_receipt_id,null);
const mismatch={...base,owner_reviews:base.owner_reviews.filter(x=>x.decision!=='record_sla_followup'),
provenance:{...base.provenance,
historical_receipt_pairs:[{...base.provenance.historical_receipt_pairs[0],
provenance_state:'HOLD_SOURCE_PROVENANCE'}]}};
a=assessFinance693(current,mismatch,[],now);
assert.equal(a.status,'HOLD_PROVENANCE_EXCEPTION_OWNER_REVIEW');
assert.equal(a.provenance.source_exception_count,1);
assert.equal(a.provenance.pairs[0].revalidation_state,'HOLD_SOURCE_RECEIPT_EXCEPTION');
assert.equal(a.master_accepted_now,false);
a=assessFinance693(current,mismatch,[
entry(330,'review_provenance_exception',null,41,82)],now);
assert.equal(a.status,'HOLD_PROVENANCE_SOURCE_REVALIDATION');
assert.equal(a.provenance.pairs[0].exception_review_recorded,true);
assert.equal(a.provenance.pairs[0].revalidation_recorded,false);
assert.equal(a.master_accepted_now,false);
const agedUnknown={...base,owner_reviews:base.owner_reviews.map(x=>x.receipt_id===200?
{...x,recorded_at:'not-a-time'}:x)};
a=assessFinance693(current,agedUnknown,[],now);
assert.equal(a.status,'HOLD_FOLLOWUP_AGE_UNVERIFIABLE');
assert.equal(a.followups.unknown_age_count,1);
const renewed={...current,verified_master_receipt_id:103};
const newPrior={...base,provenance:{...base.provenance,
current_exact_master_receipt_id:103,bounded_historical_receipt_ids:[103,82,41]}};
a=assessFinance693(renewed,newPrior,records,now);
assert.equal(a.history_complete,true);
assert.equal(a.master_accepted_now,true);
assert.equal(a.audit.owner_accepted_count,1);
assert.equal(a.provenance.current_master_receipt_id,103);
assert.equal(assessFinance693(current,base,Array(61).fill(records[0]),now).status,
'HOLD_OWNER_AUDIT_HISTORY');
assert.equal(assessFinance693(current,{...base,history_complete:false},[],now).status,
'HOLD_OWNER_AUDIT_HISTORY');
assert.equal(assessFinance693({queue_id:0},{history_complete:false},[],now).status,
'HOLD_SELECT_CAMPAIGN');
const server=read('functions/api/admin/social-post-queue.js'),
client=read('public/js/admin-social-platform-preflight.js'),
page=read('admin/social-publishing/index.html'),
ci=read('.github/workflows/current-application-quality.yml');
for(const pat of [/export function assessFinance693/,/async function finance693\(/,
 /async function ownerAudit693\(/,/finance_owner_audit_693/,
 /owner_followup_aging_reviewed_693/,/owner_provenance_exception_reviewed_693/,
 /owner_master_provenance_revalidated_693/,/owner_audit_acceptance_recorded_693/,
 /bounded_historical_receipt_ids/,/expected_master_receipt_id/,
 /append684\(db,user,n,'finance_owner_audit_693'/,
 /financial693:await finance693/,/owner_finance_audit_693/,
 /if\(params.get\('export'\)==='financial693'\)/,
 /historical_signatures_reverified:false/,/auto_source_repair:false/,
 /external_master_replay_performed:false/])
assert.match(server,pat);
for(const id of ['dd693-finance','dd693-title','dd693Refresh','dd693Export',
'dd693Status','dd693Stats','dd693Followups','dd693Provenance','dd693Pairs',
'dd693Acceptance','dd693Form','dd693Decision','dd693Source','dd693Note',
'dd693Reviewed','dd693Submit','dd693Result'])assert.ok(page.includes('id="'+id+'"'),id);
assert.match(client,/function draw693\(d\)/);
assert.match(client,/function chooseSources693\(\)/);
assert.match(client,/owner_finance_audit_693/);
assert.match(client,/export=financial693/);
assert.doesNotMatch(client,/FINANCIAL_MASTER_ACCEPTANCE_TOKEN|PRIVATE_KEY|AI_DATA_MASTER_ACK_PUBLIC_KEY/);
assert.match(ci,/build693_financial_sla_aging_provenance_owner_history_contract\.mjs/);
console.log('BUILD 693: owner SLA aging, signed Master provenance revalidation and acceptance history PASS');
