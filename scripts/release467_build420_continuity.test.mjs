import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileContinuity420} from '../functions/api/_lib/providerReopenContinuity420.mjs';
import {TYPE} from '../functions/api/_lib/providerClosureApproval417.mjs';
import {DECISION_TYPE} from '../functions/api/_lib/providerReopenDecision419.mjs';
const r={escalation:101,assignment:102,handoff:0,followup:103,completion:104,route:0,governance:0};
const s={evidence_receipts:r,escalation_status:'OPEN_OWNER_REVIEW',source_snapshot_current:true,
 source_signature:'abcd1234',assigned_user_id:7,admins:[{user_id:7}]};
const row=(n,type,data,actor=7)=>({admin_action_audit_id:n,action_type:type,actor_user_id:actor,
 created_at:'2026-10-18T00:00:00Z',details_json:JSON.stringify({expected_receipts:r,source_signature:'abcd1234',
 local_only:true,provider_called:false,publication_performed:false,...data})});
const approved=row(201,TYPE,{action:'approve_local_closure'});
const first=row(202,DECISION_TYPE,{decision:'REQUEST_MANUAL_REOPEN_REVIEW',approval_receipt:201,previous_review_receipt:0,automatic_reopen:false,notifications_sent:false});
const second=row(203,DECISION_TYPE,{decision:'ESCALATE_FOR_MANUAL_EXCEPTION',approval_receipt:201,previous_review_receipt:202,automatic_reopen:false,notifications_sent:false});
const run=(rows,options={})=>reconcileContinuity420({rows,snapshot:s,scanComplete:true,...options});
test('links immutable owner decision chain and exception history without external side effects',()=>{
 const x=run([second,approved,first]);
 assert.equal(x.status,'LOCAL_EXCEPTION_ESCALATED');
 assert.deepEqual(x.holds,[]);assert.equal(x.decision_count,2);assert.equal(x.exception_history.length,1);
 assert.equal(x.latest_decision_receipt,203);assert.equal(x.automatic_reopen,false);
 assert.equal(x.provider_called,false);assert.equal(x.us_shipping_suspended,true);
});
test('missing decision is not mistaken for automatic closure',()=>{
 const x=run([approved]);assert.equal(x.status,'AWAITING_MANUAL_OWNER_DECISION');
 assert.equal(x.latest_decision_receipt,0);assert.equal(x.automatic_closure,false);
});
test('stale chain, owner reassignment, approval mismatch and limited history fail closed',()=>{
 for(const x of [
 run([approved,{...second,admin_action_audit_id:203}]),
 run([approved,first],{snapshot:{...s,assigned_user_id:8,admins:[{user_id:8}]}}),
 run([approved,{...first,details_json:JSON.stringify({expected_receipts:r,source_signature:'abcd1234',local_only:true,provider_called:false,publication_performed:false,approval_receipt:999,decision:'REQUEST_MANUAL_REOPEN_REVIEW'})}]),
 run([approved,first],{scanComplete:false}),
 run([approved,first],{snapshot:{...s,source_signature:'ffffffff'}}),
 run([approved,first],{snapshot:{...s,source_snapshot_current:false}})
 ])assert.equal(x.status,'HOLD_FOR_MANUAL_RECONCILIATION');
});
test('invalid audit records and duplicate approvals hold',()=>{
 assert.ok(run([approved,{...approved,admin_action_audit_id:208}]).holds.includes('EXACT_ONE_CURRENT_APPROVAL_REQUIRED'));
 assert.ok(run([approved,{...first,details_json:'{invalid'}]).holds.includes('INVALID_OR_NONLOCAL_AUDIT_RECORD'));
});

test('new Admin continuity endpoint is Storefront gated and read only',async()=>{
 const {readFileSync}=await import('node:fs');
 const {moduleKeyForPath,MODULE_KEYS}=await import('../functions/api/_lib/appModuleRoutes.js');
 const api=readFileSync(new URL('../functions/api/admin/provider-reopen-continuity-420.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
 assert.equal(moduleKeyForPath('/api/admin/provider-reopen-continuity-420'),MODULE_KEYS.STOREFRONT);
 assert.match(api,/verifiedAdminFromModule/);
 assert.match(api,/LIMIT 101/);
 assert.match(api,/scanComplete:records.length<101/);
 assert.doesNotMatch(api,/\bfetch\s*\(|\bonRequestPost\b|\bINSERT\s+INTO\b|\bUPDATE\s+\w+\b|api\.etsy\.com|graph\.facebook\.com/);
 assert.match(html,/admin-provider-reopen-continuity-v420\.js/);
});
