import test from 'node:test';
import assert from 'node:assert/strict';
import {DECISIONS,DECISION_TYPE,validateManualReopen419,immutableDecision419} from '../functions/api/_lib/providerReopenDecision419.mjs';
import {TYPE} from '../functions/api/_lib/providerClosureApproval417.mjs';
const receipts={escalation:51,assignment:52,handoff:0,followup:53,completion:54,route:0,governance:0};
const snapshot={product_id:1,destination:'facebook',evidence_receipts:receipts,escalation_status:'OPEN_OWNER_REVIEW',
 assigned_user_id:7,admins:[{user_id:7}],source_signature:'abc12345',source_snapshot_current:true};
const history={holds:[],history:[{action_type:TYPE,receipt:61,escalation_receipt:51,safe_local_only:true,source_signature:'abc12345'}]};
const body={action:'record_manual_reopen_decision',decision:DECISIONS[0],request_key:'build419-test-key-00001',
 owner_note:'I reviewed the local evidence and request manual review.',expected_receipts:receipts,
 expected_source_signature:'abc12345',expected_approval_receipt:61,
 confirm_manual_review:true,confirm_local_only:true,confirm_no_provider_action:true,
 confirm_no_publication:true,confirm_us_shipping_suspended:true};
const check=o=>validateManualReopen419({snapshot,history,viewer:7,body,...o});
test('explicit assigned owner request stays local and cannot reopen provider or escalation',()=>{
 assert.equal(check().allowed,true);
 const r=immutableDecision419({snapshot,body,actorId:7,approvalReceipt:61});
 assert.equal(r.provider_called,false);assert.equal(r.automatic_reopen,false);
 assert.equal(r.publication_performed,false);assert.equal(r.us_shipping_suspended,true);
 assert.equal(DECISION_TYPE,'provider_escalation_419_reopen_decision');
});
test('fail closed for reassignment, stale receipts, wrong approval, missing acknowledgements and changed source',()=>{
 for(const o of [{viewer:8},{snapshot:{...snapshot,assigned_user_id:8}},
 {body:{...body,expected_receipts:{...receipts,completion:22}}},
 {body:{...body,expected_approval_receipt:60}},
 {body:{...body,confirm_no_provider_action:false}},
 {body:{...body,expected_source_signature:'obsolete'}}])assert.equal(check(o).allowed,false);
});
test('reopen request cannot pass history holds; explicit exception HOLD can remain local',()=>{
 const held={...history,holds:['APPROVAL_SOURCE_STALE']};
 assert.equal(check({history:held}).allowed,false);
 assert.equal(check({history:held,body:{...body,decision:'HOLD_FOR_EVIDENCE_RECONCILIATION'}}).allowed,true);
 assert.equal(check({history:{...history,holds:['BOUNDED_AUDIT_HISTORY_NOT_EXHAUSTIVE']},body:{...body,decision:'ESCALATE_FOR_MANUAL_EXCEPTION'}}).allowed,false);
});
test('no approval, absent open escalation and malformed request all fail closed',()=>{
 assert.equal(check({history:{...history,history:[]}}).allowed,false);
 assert.equal(check({snapshot:{...snapshot,escalation_status:'CLOSED'}}).allowed,false);
 assert.equal(check({body:{...body,request_key:'bad'}}).allowed,false);
});

test('Admin-only endpoint preserves immutable audit CAS, no provider calls or draft mutation',async()=>{
 const {readFileSync}=await import('node:fs');
 const {moduleKeyForPath,MODULE_KEYS}=await import('../functions/api/_lib/appModuleRoutes.js');
 const api=readFileSync(new URL('../functions/api/admin/provider-reopen-decision-419.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
 assert.equal(moduleKeyForPath('/api/admin/provider-reopen-decision-419'),MODULE_KEYS.STOREFRONT);
 assert.match(api,/verifiedAdminFromModule/);
 assert.match(api,/LIMIT 101/);
 assert.match(api,/NOT EXISTS/);
 assert.match(api,/expected_previous_decision_receipt/);
 assert.match(api,/admin_action_audit/);
 assert.doesNotMatch(api,/\bfetch\s*\(|UPDATE marketplace_syndication_drafts|UPDATE provider_evidence|DELETE FROM admin_action_audit|api\.etsy\.com|graph\.facebook\.com/);
 assert.match(html,/admin-provider-reopen-decision-v419\.js/);
});
