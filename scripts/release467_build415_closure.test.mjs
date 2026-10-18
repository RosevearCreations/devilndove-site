import test from 'node:test';
import assert from 'node:assert/strict';
import {closureDecision,DECISIONS,reconcileOwnerCompletion} from '../functions/api/_lib/providerClosureDecision415.mjs';
const good={
 escalation:{receipt:101,status:'OPEN_OWNER_REVIEW'},
 assignment:{receipt:102,assignee_user_id:3},
 followup:{receipt:103,verified:true},
 completion:{receipt:104,current:true},
 handoff:{status:'NOT_REQUIRED',verified:true},
 governance:{verified:false,receipt:0},
 sourceCurrent:true,assignedActive:true,exceptionReasons:[],
 exceptionRoute:{status:'NOT_ROUTED'}
};
test('fully reconciled local owner follow-up permits only explicit human closure review',()=>{
 const d=closureDecision(good);
 assert.equal(d.decision,DECISIONS.READY);
 assert.equal(d.provider_closure_authorized,false);
 assert.equal(d.automatic_closure_performed,false);
 assert.equal(d.publication_performed,false);
 assert.equal(d.us_shipping_suspended,true);
});
test('missing or stale completion, reassignment and stale source must HOLD',()=>{
 for(const overrides of [
 {completion:{receipt:104,current:false}},
 {assignment:{receipt:102,assignee_user_id:0}},
 {sourceCurrent:false},{assignedActive:false},
 {followup:{receipt:103,verified:false}}
 ]) assert.equal(closureDecision({...good,...overrides}).decision,DECISIONS.HOLD);
});
test('handoff requires verified governance and a durable proof receipt',()=>{
 assert.equal(closureDecision({...good,handoff:{status:'VERIFIED_HANDOFF_CHAIN',verified:true}}).decision,DECISIONS.HOLD);
 assert.equal(closureDecision({...good,handoff:{status:'VERIFIED_HANDOFF_CHAIN',verified:true},governance:{verified:true,receipt:107}}).decision,DECISIONS.READY);
});
test('SLA exception, stale exception route, old evidence, and unopened escalation are holds',()=>{
 for(const overrides of [
 {exceptionReasons:['OWNER_FOLLOWUP_SLA_DUE']},
 {exceptionRoute:{status:'OLDER_ROUTE_REVIEW_DUE'}},
 {olderEvidenceOutsideScan:true},
 {escalation:{receipt:101,status:'CLOSED'}}
 ]) assert.equal(closureDecision({...good,...overrides}).decision,DECISIONS.HOLD);
});
test('recorded closure is never inferred from arbitrary receipt',()=>{
 const unverified={receipt:120,verified:false,escalation_receipt:101,assignment_receipt:102,completion_receipt:104};
 assert.equal(closureDecision({...good,closureReceipt:unverified}).decision,DECISIONS.READY);
 assert.equal(closureDecision({...good,closureReceipt:{...unverified,verified:true,provider_called:false,publication_performed:false}}).decision,DECISIONS.CLOSED);
});
test('missing records fail closed without exceptions',()=>{
 assert.equal(closureDecision().decision,DECISIONS.HOLD);
 assert.equal(reconcileOwnerCompletion().reconciled,false);
});
