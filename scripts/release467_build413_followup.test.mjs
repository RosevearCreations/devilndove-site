import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {slaStatus,handoffStatus,followupReadiness,canAct,FOLLOWUP_PLANS} from '../functions/api/_lib/providerFollowup413.mjs';
import {moduleKeyForPath,MODULE_KEYS} from '../functions/api/_lib/appModuleRoutes.js';
const f=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const admins=[{user_id:5},{user_id:7}],assigned={receipt:77,assignee_user_id:5},escalationReceipt=64;
const safety={owner_note:'Manual owner follow-up review is required.',no_provider_retry:true,no_publication:true,us_shipping_suspended:true};
test('SLA timestamps are timezone-aware and fail closed for unknown time',()=>{
const first=Date.parse('2026-10-17T10:00:00Z');
assert.equal(slaStatus({escalatedAt:'2026-10-17 10:00:00',now:first+23*3600000}).status,'WITHIN_INTERNAL_TARGET');
assert.equal(slaStatus({escalatedAt:'2026-10-17 10:00:00',now:first+24*3600000}).status,'INITIAL_REVIEW_DUE');
const due=slaStatus({escalatedAt:'2026-10-17 10:00:00',now:first+73*3600000});
assert.equal(due.status,'FOLLOWUP_DUE');assert.equal(due.followup_overdue,true);
assert.equal(slaStatus({escalatedAt:null}).status,'UNKNOWN_ESCALATION_TIME');
assert.equal(slaStatus({escalatedAt:'2026-10-17 10:00:00',now:first+100*3600000,isOpen:false}).status,'CLOSED');
assert.equal(due.contractual,false);assert.equal(due.alerts_scheduled,false);
});
test('handoff is never implicitly effective until Build 412 reassignment and receiver acknowledgement',()=>{
const row={admin_action_audit_id:100,details_json:JSON.stringify({action:'request_handoff',from_user_id:5,target_user_id:7,escalation_receipt:64})};
assert.equal(handoffStatus({latestHandoff:row,assignment:assigned,escalationReceipt}).status,'PENDING_REASSIGNMENT');
const changed={receipt:91,assignee_user_id:7};
const wait=handoffStatus({latestHandoff:row,assignment:changed,escalationReceipt});
assert.equal(wait.status,'AWAITING_RECEIVER_ACK');assert.equal(wait.request_receipt,100);
const ack={admin_action_audit_id:120,details_json:JSON.stringify({action:'ack_handoff',from_user_id:5,target_user_id:7,request_receipt:100,escalation_receipt:64,base_assignment_receipt:91})};
assert.equal(handoffStatus({latestHandoff:ack,assignment:changed,escalationReceipt}).status,'ACKNOWLEDGED');
assert.equal(handoffStatus({latestHandoff:ack,assignment:{...changed,receipt:92},escalationReceipt}).status,'ASSIGNMENT_CHANGED_REVIEW');
assert.equal(handoffStatus({latestHandoff:ack,assignment:changed,escalationReceipt:70}).status,'STALE_ESCALATION');
});
test('only assigned active Admin can request or acknowledge handoff, and acknowledgement needs actual reassignment',()=>{
const params={viewerId:5,assignment:assigned,admins,handoff:{status:'NONE'},readiness:{blockers:[]},
escalationOpen:true,body:{...safety,target_user_id:7}};
assert.equal(canAct({...params,action:'request_handoff'}),true);
assert.equal(canAct({...params,action:'request_handoff',viewerId:7}),false);
assert.equal(canAct({...params,action:'request_handoff',body:{...safety,target_user_id:8}}),false);
assert.equal(canAct({...params,action:'request_handoff',handoff:{status:'PENDING_REASSIGNMENT'}}),false);
const receive={...params,viewerId:7,assignment:{receipt:91,assignee_user_id:7},handoff:{status:'AWAITING_RECEIVER_ACK',target_user_id:7,request_receipt:100},
body:{...safety,expected_request_receipt:100}};
assert.equal(canAct({...receive,action:'ack_handoff'}),true);
assert.equal(canAct({...receive,action:'ack_handoff',body:{...safety,expected_request_receipt:101}}),false);
});
test('follow-up readiness requires current local source, active assignment and completed handoff',()=>{
const params={escalationOpen:true,assignedActive:true,assignment:assigned,handoff:{status:'NONE'},sourceSnapshotCurrent:true,escalationReceipt:64};
const ready=followupReadiness(params);assert.equal(ready.status,'READY_TO_RECORD_OWNER_FOLLOWUP');
assert.equal(canAct({action:'record_followup',viewerId:5,assignment:assigned,admins,readiness:ready,escalationOpen:true,body:{...safety,plan:FOLLOWUP_PLANS[0],confirm_manual_owner_followup:true}}),true);
for(const change of [{assignedActive:false},{sourceSnapshotCurrent:false},{handoff:{status:'PENDING_REASSIGNMENT'}},{escalationOpen:false}]){
assert.equal(followupReadiness({...params,...change}).status,'HOLD_OWNER_FOLLOWUP');}
assert.equal(followupReadiness({...params,latestFollowup:{admin_action_audit_id:77,details_json:'{"assignment_receipt":77,"escalation_receipt":64,"provider_called":false,"publication_performed":false,"plan":"GATHER_LOCAL_EVIDENCE"}'}}).status,'FOLLOWUP_PLAN_RECORDED');
assert.equal(ready.publication_allowed,false);assert.equal(ready.automatic_notifications,false);
});
test('endpoint is bounded Admin-only D1 ledger, no external provider calls or background tasks',()=>{
const api=f('functions/api/admin/provider-followup-413.js'),ui=f('public/js/admin-provider-followup-v413.js'),html=f('admin/it-integrations/index.html');
assert.equal(moduleKeyForPath('/api/admin/provider-followup-413'),MODULE_KEYS.STOREFRONT);
assert.match(api,/verifiedAdminFromModule/);assert.match(api,/LIMIT 100/);assert.match(api,/out.length===20/);
assert.match(api,/NOT EXISTS/);assert.match(api,/expected_assignment_receipt/);assert.match(api,/expected_handoff_receipt/);
assert.doesNotMatch(api,/\bfetch\s*\(|api\.etsy\.com|graph\.facebook\.com|DELETE FROM admin_action_audit|UPDATE marketplace_syndication_drafts/);
assert.match(ui,/addEventListener\('click'/);assert.doesNotMatch(ui,/setInterval|setTimeout/);
assert.match(html,/id="provider413"/);assert.match(html,/admin-provider-followup-v413\.js/);
});
