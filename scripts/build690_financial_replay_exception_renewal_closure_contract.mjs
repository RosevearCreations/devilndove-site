import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessFinance690} from '../functions/api/admin/social-post-queue.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const now=Date.parse('2026-11-12T15:00:00Z');
const fp='a'.repeat(64),closed='incident-closed-aaaaaaaaaaaaaaaa',
bad='incident-bad-aaaaaaaaaaaaaaaa';
const current={queue_id:42,source_revision:'original-exact-source',fingerprint_sha256:fp,
source_signer_receipt_id:7,history_complete:true,master_fresh:true,
verified_master_receipt_id:82,expires_at:'2026-11-12T15:08:00Z'};
const clean={history_complete:true,master_accepted_now:true,invalid_replay_count:0,
renewal:{current_reverified_receipt_id:82},
owner_action_history:[{receipt_id:110,case_id:closed,decision:'signoff_closure',
replay_state:'HISTORICAL_OWNER_ACTION_REPLAY_MATCH',recorded_at:'2026-11-12T14:55:00Z'}],
owner_audit_receipts:[{receipt_id:115,decision:'accept_owner_audit',case_id:closed,
reference_receipt_id:110,recorded_at:'2026-11-12T14:57:00Z'}]};
const drift={...clean,history_complete:false,master_accepted_now:false,invalid_replay_count:1,
owner_action_history:[...clean.owner_action_history,{receipt_id:99,case_id:bad,
decision:'escalate_breach',replay_state:'HOLD_OWNER_ACTION_REPLAY_DRIFT',
recorded_at:'2026-11-12T14:50:00Z'}]};
const receipt=(id,when)=>({social_post_attempt_id:id,attempted_at:when,
response_json:JSON.stringify({signature:'historical-signature-opaque',
claim:{queue_id:42,source_revision:'original-exact-source',fingerprint_sha256:fp,
source_signer_receipt_id:7,receiver_receipt_id:'receiver-reference-12345',
issued_at:new Date(Date.parse(when)-60000).toISOString()}})});
const receipts=[receipt(82,'2026-11-12T14:57:00Z'),
receipt(41,'2026-11-12T14:27:00Z')];
const owner=(id,decision,caseId,reference,masterReceipt=null,issue_code=null)=>({
social_post_attempt_id:id,attempt_status:decision==='review_replay_exception'?
'owner_replay_exception_reviewed_690':'owner_financial_closure_reconciled_690',
attempted_at:'2026-11-12T14:59:00Z',
response_json:JSON.stringify({decision,case_id:caseId,reference_receipt_id:reference,
master_receipt_id:masterReceipt,issue_code,source_revision:current.source_revision,
fingerprint_sha256:fp,owner_user_id:9,owner_reviewed:true,
resolution_note:'Exact source reviewed by owner; original evidence remains separately gated.'})});
const base=assessFinance690(current,clean,[],receipts,now);
assert.equal(base.status,'OWNER_CLOSURE_RECONCILIATION_REVIEW_ONLY');
assert.equal(base.history_complete,true);
assert.equal(base.ledger_complete,true);
assert.equal(base.replay_exception_count,0);
assert.equal(base.eligible_closure_count,1);
assert.equal(base.renewal.status,'VERIFIED_CURRENT_ON_REFRESH');
assert.equal(base.renewal.seconds_to_expiry,480);
assert.equal(base.renewal.current_receipt_in_bounded_history,true);
assert.equal(base.renewal.historical_gap_over_20_minutes_count,1);
assert.equal(base.renewal.record_count,2);
assert.equal(base.renewal.historical_signatures_reverified,false);
assert.equal(base.renewal.background_polling,false);
assert.equal(base.master_accepted_now,true);
assert.equal(base.external_replay_performed,false);
assert.equal(base.financial_certified,false);
assert.equal(base.auto_exception_resolution,false);
assert.equal(base.auto_closure,false);
const due=assessFinance690({...current,expires_at:'2026-11-12T15:03:00Z'},clean,[],receipts,now);
assert.equal(due.renewal.status,'RENEWAL_DUE_SOON');
const stale=assessFinance690({...current,master_fresh:false,expires_at:'2026-11-12T14:59:00Z'},clean,[],receipts,now);
assert.equal(stale.status,'HOLD_MASTER_RENEWAL_RECHECK');
assert.equal(stale.renewal.current_independently_reverified_receipt_id,null);
assert.equal(stale.master_accepted_now,false);
const caseRecord=owner(150,'reconcile_owner_closure',closed,115,82);
const reconciled=assessFinance690(current,clean,[caseRecord],receipts,now);
assert.equal(reconciled.reconciled_closure_count,1);
assert.equal(reconciled.eligible_closure_count,0);
assert.equal(reconciled.closure_candidates[0].owner_reconciled,true);
assert.equal(reconciled.owner_history[0].state,
'OWNER_REVIEW_RECORDED_NOT_INDEPENDENT_CERTIFICATION');
const badReference=owner(155,'reconcile_owner_closure',closed,999,82);
const refused=assessFinance690(current,clean,[badReference],receipts,now);
assert.equal(refused.status,'HOLD_OWNER_EVIDENCE_HISTORY');
assert.equal(refused.invalid_owner_history_count,1);
assert.equal(refused.master_accepted_now,false);
const duplicate=assessFinance690(current,clean,[owner(161,'reconcile_owner_closure',closed,115,82),
owner(160,'reconcile_owner_closure',closed,115,82)],receipts,now);
assert.equal(duplicate.invalid_owner_history_count,1);
const investigated=assessFinance690(current,drift,[
owner(140,'review_replay_exception',bad,99,null,'HOLD_OWNER_ACTION_REPLAY_DRIFT')],receipts,now);
assert.equal(investigated.status,'HOLD_REPLAY_EXCEPTIONS');
assert.equal(investigated.replay_exception_count,1);
assert.equal(investigated.unreviewed_replay_exception_count,0);
assert.equal(investigated.replay_exceptions[0].owner_reviewed,true);
assert.equal(investigated.master_accepted_now,false);
const noMaster=assessFinance690({...current,master_fresh:false,expires_at:null},drift,
[owner(140,'review_replay_exception',bad,99,null,'HOLD_OWNER_ACTION_REPLAY_DRIFT')],
receipts,now);
assert.equal(noMaster.history_complete,true);
assert.equal(noMaster.replay_exceptions[0].owner_reviewed,true);
assert.equal(noMaster.master_accepted_now,false);
const noReceipts=assessFinance690(current,clean,[],[],now);
assert.equal(noReceipts.status,'HOLD_HISTORICAL_RENEWAL_LINEAGE');
assert.equal(noReceipts.eligible_closure_count,0);
const tampered=receipt(41,'2026-11-12T14:27:00Z');
tampered.response_json=JSON.stringify({...JSON.parse(tampered.response_json),
claim:{...JSON.parse(tampered.response_json).claim,source_revision:'foreign-source'}});
const invalidChain=assessFinance690(current,clean,[],[receipts[0],tampered],now);
assert.equal(invalidChain.status,'HOLD_HISTORICAL_RENEWAL_LINEAGE');
assert.equal(invalidChain.master_accepted_now,false);
assert.equal(assessFinance690(current,clean,Array(61).fill(caseRecord),receipts,now).status,
'HOLD_OWNER_EVIDENCE_HISTORY');
assert.equal(assessFinance690(current,clean,[],Array(81).fill(receipts[0]),now).status,
'HOLD_OWNER_EVIDENCE_HISTORY');
assert.equal(assessFinance690({queue_id:0},{history_complete:false},[],[],now).status,
'HOLD_SELECT_CAMPAIGN');
const backend=read('functions/api/admin/social-post-queue.js'),
client=read('public/js/admin-social-platform-preflight.js'),
page=read('admin/social-publishing/index.html'),
ci=read('.github/workflows/current-application-quality.yml');
for(const pattern of [/export function assessFinance690/,/async function finance690\(/,
 /async function ownerReconcile690\(/,/finance_owner_reconcile_690/,
 /owner_replay_exception_reviewed_690/,/owner_financial_closure_reconciled_690/,
 /Number\(p.expected_master_receipt_id\)!==v.verified_master_receipt_id/,
 /await append684\(db,user,n,'finance_owner_reconcile_690'/,
 /financial690:await finance690/,/owner_finance_reconcile_690/,
 /if\(params.get\('export'\)==='financial690'\)/,
 /historical_signatures_reverified:false/,/external_replay_performed:false/,
 /auto_exception_resolution:false/])assert.match(backend,pattern);
for(const id of ['dd690-finance','dd690-title','dd690Refresh','dd690Export',
'dd690Status','dd690Renewal','dd690Stats','dd690Exceptions','dd690Closures',
'dd690Form','dd690Decision','dd690Source','dd690Note','dd690Reviewed',
'dd690Submit','dd690Result'])
assert.ok(page.includes('id="'+id+'"'),id);
assert.match(client,/function draw690\(d\)/);
assert.match(client,/function chooseCases690\(\)/);
assert.match(client,/action:'owner_finance_reconcile_690'/);
assert.match(client,/export=financial690/);
assert.doesNotMatch(client,/FINANCIAL_MASTER_ACCEPTANCE_TOKEN|PRIVATE_KEY|AI_DATA_MASTER_ACK_PUBLIC_KEY/);
assert.match(ci,/build690_financial_replay_exception_renewal_closure_contract\.mjs/);
console.log('BUILD 690: replay exception HOLD triage, bounded renewal freshness and signed owner closure reconciliation PASS');
