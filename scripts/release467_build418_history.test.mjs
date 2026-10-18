import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileHistory418,canRequestReopen418,REOPEN_TYPE} from '../functions/api/_lib/providerClosureHistory418.mjs';
import {TYPE} from '../functions/api/_lib/providerClosureApproval417.mjs';
const snapshot={evidence_receipts:{escalation:11},source_signature:'deadbeef',escalation_status:'OPEN_OWNER_REVIEW'};
const row=(id,type=TYPE)=>({admin_action_audit_id:id,actor_user_id:7,action_type:type,details_json:JSON.stringify({expected_receipts:{escalation:11},source_signature:'deadbeef',local_only:true,provider_called:false,publication_performed:false})});
test('safe immutable approval history requires exhaustive scan',()=>{
 const h=reconcileHistory418({rows:[row(20)],snapshot,scanComplete:true});
 assert.equal(h.approvals_for_current,1);assert.equal(h.holds.length,0);assert.equal(h.automatic_reopen,false);
 assert.equal(canRequestReopen418({history:h,viewer:7,assignee:7,note:'Manual owner review due to changed evidence.',confirm:true}),true);
 assert.equal(canRequestReopen418({history:h,viewer:8,assignee:7,note:'Manual owner review due to changed evidence.',confirm:true}),false);
});
test('non-exhaustive, duplicate, corrupt or stale approval holds',()=>{
 for(const options of [{rows:[row(20)],scanComplete:false},{rows:[row(20),row(21)],scanComplete:true},
 {rows:[{...row(20),details_json:'broken'}],scanComplete:true},
 {rows:[{...row(20),details_json:JSON.stringify({expected_receipts:{escalation:11},source_signature:'obsolete',local_only:true,provider_called:false,publication_performed:false})}],scanComplete:true}]){
 assert.ok(reconcileHistory418({...options,snapshot}).holds.length>0);
 }
});
test('reopen-review receipt never reopens an escalation automatically',()=>{
 const h=reconcileHistory418({rows:[row(20),row(30,REOPEN_TYPE)],snapshot,scanComplete:true});
 assert.equal(h.reopen_reviews_for_current,1);assert.equal(h.review_required,true);assert.equal(h.automatic_reopen,false);
});
