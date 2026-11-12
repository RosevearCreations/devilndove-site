import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessFinance692} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T15:00:00Z'),fp='a'.repeat(64),
bad='incident-aged-aaaaaaaaaaaa',closed='incident-closed-bbbbbbbbbbbb';
const current={queue_id:42,history_complete:true,master_fresh:true,
fingerprint_sha256:fp,source_revision:'original-source-revision-692',
verified_master_receipt_id:82,expires_at:'2026-11-12T15:08:00Z'};
const base={history_complete:true,master_accepted_now:true,
renewal:{current_verified_receipt_id:82,
historical_source_pin_matches:true,historical_source_receipt_ids:[82,41],
gap_evidence:[{older_receipt_id:41,newer_receipt_id:82,
older_recorded_at:'2026-11-12T12:00:00Z',
newer_recorded_at:'2026-11-12T13:00:00Z',
gap_minutes:60,source_pins_match:true}]},
owner_actions:[
{receipt_id:180,decision:'accept_closure_continuity',case_id:closed,
reference_receipt_id:115,recorded_at:'2026-11-12T14:20:00Z',
state:'OWNER_ACKNOWLEDGMENT_RECORDED_NO_EXTERNAL_CERTIFICATION'},
{receipt_id:150,decision:'escalate_replay_aging',case_id:bad,
reference_receipt_id:50,recorded_at:'2026-11-12T12:30:00Z',
state:'OWNER_ACKNOWLEDGMENT_RECORDED_NO_EXTERNAL_CERTIFICATION'}],
owner_closure_evidence:[{case_id:closed,reference_receipt_id:115,
owner_continuity_accepted:true}]};
const owner=(id,decision,case_id,ref,newer=null,master=null,at='2026-11-12T14:55:00Z')=>({
social_post_attempt_id:id,
attempt_status:({record_sla_followup:'owner_financial_sla_followup_692',
review_master_provenance:'owner_master_provenance_review_692',
reconcile_closure_audit:'owner_financial_closure_audit_reconciled_692'})[decision],
attempted_at:at,
response_json:JSON.stringify({decision,case_id,reference_receipt_id:ref,
newer_receipt_id:newer,master_receipt_id:master,
fingerprint_sha256:fp,source_revision:current.source_revision,
owner_reviewed:true,owner_user_id:9,
resolution_note:'Owner reviewed exact signed source and historical receipt, followup remains conditional.'})});
let x=assessFinance692(current,base,[],now);
assert.equal(x.status,'OWNER_FINANCIAL_SLA_FOLLOWUP_REQUIRED');
assert.equal(x.history_complete,true);
assert.equal(x.advisory_followup_target_minutes,120);
assert.equal(x.sla.followup_count,1);
assert.equal(x.sla.overdue_count,1);
assert.equal(x.sla.unreviewed_overdue_count,1);
assert.equal(x.sla.followups[0].elapsed_minutes,150);
assert.equal(x.sla.followups[0].evidence_repaired,false);
assert.equal(x.provenance.current_exact_master_receipt_id,82);
assert.equal(x.provenance.historical_source_receipt_count,2);
assert.equal(x.provenance.recorded_gap_count,1);
assert.equal(x.provenance.pending_owner_provenance_count,1);
assert.equal(x.provenance.historical_signatures_reverified,false);
assert.equal(x.provenance.runtime_outage_proven,false);
assert.equal(x.closure.record_count,1);
assert.equal(x.closure.pending_owner_reconciliation_count,1);
assert.equal(x.master_accepted_now,true);
assert.equal(x.connection,'HOLD_INDEPENDENT_CONTINUOUS_RUNTIME_TELEMETRY');
assert.equal(x.financial_certified,false);
assert.equal(x.automatic_sla_followup,false);
assert.equal(x.external_master_replay_performed,false);
const actions=[
owner(225,'reconcile_closure_audit',closed,180,null,82,'2026-11-12T14:59:00Z'),
owner(215,'review_master_provenance',null,41,82,null,'2026-11-12T14:57:00Z'),
owner(205,'record_sla_followup',bad,150,null,null,'2026-11-12T14:55:00Z')];
x=assessFinance692(current,base,actions,now);
assert.equal(x.status,'OWNER_CLOSURE_AUDIT_REVIEW_ONLY');
assert.equal(x.history_complete,true);
assert.equal(x.sla.unreviewed_overdue_count,0);
assert.equal(x.provenance.pending_owner_provenance_count,0);
assert.equal(x.closure.pending_owner_reconciliation_count,0);
assert.equal(x.closure.owner_audit_reconciled_count,1);
assert.equal(x.owner_reviews.length,3);
assert.equal(x.owner_reviews[0].state,'OWNER_REVIEW_RECORDED_NO_EXTERNAL_MASTER_CERTIFICATION');
assert.equal(x.master_accepted_now,true);
const dup=assessFinance692(current,base,[owner(226,'record_sla_followup',bad,150),
owner(224,'record_sla_followup',bad,150)],now);
assert.equal(dup.status,'HOLD_OWNER_CONTINUITY_HISTORY');
assert.equal(dup.invalid_owner_review_count,1);
assert.equal(dup.master_accepted_now,false);
const wrongReceipt=assessFinance692(current,base,
[owner(227,'review_master_provenance',null,41,123)],now);
assert.equal(wrongReceipt.invalid_owner_review_count,1);
const foreign=owner(228,'record_sla_followup',bad,150);
foreign.response_json=JSON.stringify({...JSON.parse(foreign.response_json),
source_revision:'foreign-source'});
assert.equal(assessFinance692(current,base,[foreign],now).invalid_owner_review_count,1);
assert.equal(assessFinance692(current,base,
[owner(229,'reconcile_closure_audit',closed,180,null,999)],now).invalid_owner_review_count,1);
const stale={...current,master_fresh:false,expires_at:'2026-11-12T14:30:00Z'};
x=assessFinance692(stale,{...base,master_accepted_now:false},[],now);
assert.equal(x.master_accepted_now,false);
assert.equal(x.provenance.current_signature_verified_independently,false);
assert.equal(x.provenance.current_exact_master_receipt_id,null);
const drift={...base,renewal:{...base.renewal,
historical_source_receipt_ids:[82],historical_source_pin_matches:false}};
x=assessFinance692(current,drift,[],now);
assert.equal(x.status,'HOLD_MASTER_PROVENANCE');
assert.equal(x.provenance.source_provenance_hold_count,1);
assert.equal(x.master_accepted_now,false);
const unknown={...base,owner_actions:[{...base.owner_actions[1],recorded_at:'invalid'}]};
x=assessFinance692(current,unknown,[],now);
assert.equal(x.status,'HOLD_FOLLOWUP_CLOCK');
assert.equal(x.sla.unknown_clock_count,1);
const future=owner(231,'reconcile_closure_audit',closed,180,null,82,
'2026-11-12T14:00:00Z');
assert.equal(assessFinance692(current,base,[future],now).invalid_owner_review_count,1);
const rolled={...current,verified_master_receipt_id:103};
const renewed={...base,renewal:{...base.renewal,
current_verified_receipt_id:103,historical_source_receipt_ids:[103,82,41]}};
x=assessFinance692(rolled,renewed,actions,now);
assert.equal(x.history_complete,true);
assert.equal(x.master_accepted_now,true);
assert.equal(x.provenance.current_exact_master_receipt_id,103);
assert.equal(assessFinance692(current,base,Array(61).fill(actions[0]),now).status,
'HOLD_OWNER_CONTINUITY_HISTORY');
assert.equal(assessFinance692(current,{...base,history_complete:false},[],now).status,
'HOLD_OWNER_CONTINUITY_HISTORY');
assert.equal(assessFinance692({queue_id:0},{history_complete:false},[],now).status,
'HOLD_SELECT_CAMPAIGN');
const server=read('functions/api/admin/social-post-queue.js'),
client=read('public/js/admin-social-platform-preflight.js'),
page=read('admin/social-publishing/index.html'),
ci=read('.github/workflows/current-application-quality.yml');
for(const pat of [/export function assessFinance692/,/async function finance692\(/,
 /async function ownerFollowup692\(/,/finance_owner_followup_692/,
 /owner_financial_sla_followup_692/,/owner_master_provenance_review_692/,
 /owner_financial_closure_audit_reconciled_692/,
 /historical_source_receipt_ids:/,/expected_master_receipt_id/,
 /append684\(db,user,n,'finance_owner_followup_692'/,
 /financial692:await finance692/,/owner_finance_followup_692/,
 /if\(params.get\('export'\)==='financial692'\)/,
 /historical_signatures_reverified:false/,/automatic_sla_followup:false/,
 /external_master_replay_performed:false/])
assert.match(server,pat);
for(const id of ['dd692-finance','dd692-title','dd692Refresh','dd692Export',
'dd692Status','dd692Stats','dd692Followups','dd692Provenance','dd692Pairs',
'dd692Closures','dd692Form','dd692Decision','dd692Source','dd692Note',
'dd692Reviewed','dd692Submit','dd692Result'])
assert.ok(page.includes('id="'+id+'"'),id);
assert.match(client,/function draw692\(data\)/);
assert.match(client,/function chooseSources692\(\)/);
assert.match(client,/owner_finance_followup_692/);
assert.match(client,/export=financial692/);
assert.doesNotMatch(client,/FINANCIAL_MASTER_ACCEPTANCE_TOKEN|PRIVATE_KEY|AI_DATA_MASTER_ACK_PUBLIC_KEY/);
assert.match(ci,/build692_financial_sla_provenance_closure_contract\.mjs/);
console.log('BUILD 692: owner SLA follow-up, historical Master provenance and closure audit continuity PASS');
