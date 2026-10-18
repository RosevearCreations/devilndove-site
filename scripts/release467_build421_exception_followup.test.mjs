import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewExceptionFollowup421} from '../functions/api/_lib/providerExceptionFollowup421.mjs';
import {FOLLOWUP_TYPE} from '../functions/api/_lib/providerFollowup413.mjs';
import {COMPLETION_TYPE} from '../functions/api/_lib/providerCompletion414.mjs';
const snapshot={source_snapshot_current:true,escalation_status:'OPEN_OWNER_REVIEW',
 source_signature:'abcd1234',assigned_user_id:7,
 evidence_receipts:{escalation:101,assignment:102,followup:103,completion:104}};
const continuity={status:'LOCAL_EXCEPTION_ESCALATED',scan_complete:true,holds:[],latest_decision_receipt:202,
 exception_history:[{receipt:202,decision:'ESCALATE_FOR_MANUAL_EXCEPTION',actor_user_id:7}]};
const receipt=(n,type,overrides={})=>({admin_action_audit_id:n,action_type:type,created_at:'2026-10-18T12:00:00Z',
 details_json:JSON.stringify({escalation_receipt:101,assignment_receipt:102,
 source_signature:'abcd1234',provider_called:false,publication_performed:false,
 us_shipping_suspended:true,...overrides})});
const run=(rows,options={})=>reviewExceptionFollowup421({continuity,sourceRows:rows,snapshot,scanComplete:true,...options});
test('a local follow-up recorded BEFORE the exception is not follow-up evidence',()=>{
 const result=run([receipt(103,FOLLOWUP_TYPE)]);
 assert.equal(result.status,'MANUAL_FOLLOWUP_EVIDENCE_PENDING');
 assert.equal(result.exceptions[0].local_followup_receipts.length,0);
 assert.equal(result.exceptions[0].exception_resolved,false);
});
test('later strictly scoped receipts remain evidence for manual review, never auto resolution',()=>{
 const x=run([receipt(208,FOLLOWUP_TYPE),receipt(209,COMPLETION_TYPE)]);
 assert.equal(x.status,'LOCAL_FOLLOWUP_EVIDENCE_FOR_MANUAL_REVIEW');
 assert.deepEqual(x.exceptions[0].local_followup_receipts.map(r=>r.receipt),[208,209]);
 assert.equal(x.exceptions[0].provider_verified,false);
 assert.equal(x.exceptions_auto_resolved,false);
 assert.equal(x.provider_called,false);assert.equal(x.us_shipping_suspended,true);
});
test('partial scan, stale continuity, invalid JSON and mismatched source fail closed',()=>{
 for(const x of [
 run([],{scanComplete:false}),
 run([],{continuity:{...continuity,holds:['OWNER_CHANGED_SINCE_DECISION']}}),
 run([receipt(208,FOLLOWUP_TYPE,{assignment_receipt:222})]),
 run([{...receipt(208,FOLLOWUP_TYPE),details_json:'{invalid'}]),
 run([],{snapshot:{...snapshot,source_snapshot_current:false}})
 ])assert.equal(x.status,'HOLD_FOR_MANUAL_REVIEW');
});
test('no local exception cannot be presented as resolved',()=>{
 const x=run([],{continuity:{...continuity,exception_history:[]}});
 assert.equal(x.status,'NO_LOCAL_EXCEPTION_DECISION');
 assert.equal(x.exceptions_auto_resolved,false);
});

test('read-only Admin endpoint is module-gated, bounded and discoverable in IT Integrations',async()=>{
 const {readFileSync}=await import('node:fs');
 const {moduleKeyForPath,MODULE_KEYS}=await import('../functions/api/_lib/appModuleRoutes.js');
 const api=readFileSync(new URL('../functions/api/admin/provider-exception-followup-421.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
 assert.equal(moduleKeyForPath('/api/admin/provider-exception-followup-421'),MODULE_KEYS.STOREFRONT);
 assert.match(api,/verifiedAdminFromModule/);
 assert.match(api,/LIMIT 101/);
 assert.match(api,/followupRows\.length<101/);
 assert.match(api,/reconcileContinuity420/);
 assert.doesNotMatch(api,/\bonRequestPost\b|\bINSERT INTO\b|\bUPDATE\s+\w+\b|\bDELETE FROM\b|\bfetch\s*\(/);
 assert.match(html,/admin-provider-exception-followup-v421\.js/);
});
