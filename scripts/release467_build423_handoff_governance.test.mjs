import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileHandoffGovernance423} from '../functions/api/_lib/providerHandoffGovernance423.mjs';
import {HANDOFF_TYPE} from '../functions/api/_lib/providerFollowup413.mjs';
import {ACK_TYPE} from '../functions/api/_lib/providerExceptionAck422.mjs';
const receipts={escalation:10,assignment:20,handoff:0,followup:30,completion:31,route:0,governance:0};
const snapshot={evidence_receipts:receipts,source_signature:'abc12345',
 source_snapshot_current:true,escalation_status:'OPEN_OWNER_REVIEW',
 assigned_user_id:7,admins:[{user_id:7}],handoff:{status:'NOT_REQUIRED',verified:true,receipt:0,ack_receipt:0}};
const continuity={holds:[],scan_complete:true,latest_decision_receipt:40};
const followup={holds:[],scan_complete:true};
const ownerReview={holds:[],review_ready:true,latest_ack_receipt:50};
const row=(id,type,data,actor=7)=>({admin_action_audit_id:id,action_type:type,actor_user_id:actor,
 created_at:'2026-10-18 12:00:00',details_json:JSON.stringify({provider_called:false,publication_performed:false,...data})});
const ack=(id=50,choice='EVIDENCE_REVIEWED_FOLLOWUP_PENDING')=>
 row(id,ACK_TYPE,{action:'ack_exception_followup',choice,actor_user_id:7,local_only:true,
 notifications_sent:false,us_shipping_suspended:true,expected_receipts:receipts,
 exception_decision_receipt:40,source_signature:'abc12345'});
const review=(overrides={})=>reconcileHandoffGovernance423({snapshot,continuity,followup,ownerReview,
 handoffRows:[],ackRows:[ack()],handoffScanComplete:true,ackScanComplete:true,...overrides});
test('no handoff required: exact local acknowledgement is advisory only',()=>{
 const x=review();
 assert.equal(x.status,'LOCAL_RECEIPTS_RECONCILED_FOR_MANUAL_REVIEW');
 assert.deepEqual(x.holds,[]);assert.equal(x.owner_review_history.length,1);
 assert.equal(x.exception_resolved,false);assert.equal(x.provider_called,false);
 assert.equal(x.us_shipping_suspended,true);
});
test('operator-recorded handoff request without receiver acknowledgement fails closed',()=>{
 const request=row(60,HANDOFF_TYPE,{action:'request_handoff',from_user_id:7,target_user_id:8,
  escalation_receipt:10,source_signature:'abc12345'});
 const x=review({handoffRows:[request],snapshot:{...snapshot,evidence_receipts:{...receipts,handoff:60},
  handoff:{status:'AWAITING_RECEIVER_ACK',verified:false,receipt:60}}});
 assert.ok(x.holds.includes('HANDOFF_ACKNOWLEDGEMENT_PENDING'));
 assert.ok(x.holds.includes('HANDOFF_REQUEST_ACK_CHAIN_HOLD'));
});
test('verified receiver acknowledgement must link exactly to prior request and current assignment',()=>{
 const nextReceipts={...receipts,assignment:61,handoff:62};
 const request=row(59,HANDOFF_TYPE,{action:'request_handoff',from_user_id:7,target_user_id:8,
  escalation_receipt:10,source_signature:'abc12345'},7);
 const received=row(62,HANDOFF_TYPE,{action:'ack_handoff',from_user_id:7,target_user_id:8,
  request_receipt:59,base_assignment_receipt:61,escalation_receipt:10,
  source_signature:'abc12345'},8);
 const nextSnap={...snapshot,assigned_user_id:8,admins:[{user_id:8}],evidence_receipts:nextReceipts,
  handoff:{status:'VERIFIED_HANDOFF_CHAIN',verified:true,receipt:62,ack_receipt:62,request_receipt:59}};
 const ackAfter=row(70,ACK_TYPE,{action:'ack_exception_followup',choice:'EVIDENCE_REVIEWED_FOLLOWUP_PENDING',
  actor_user_id:8,local_only:true,notifications_sent:false,us_shipping_suspended:true,
  expected_receipts:nextReceipts,exception_decision_receipt:40,source_signature:'abc12345'},8);
 const x=review({snapshot:nextSnap,handoffRows:[received,request],ackRows:[ackAfter],
  ownerReview:{...ownerReview,latest_ack_receipt:70}});
 assert.equal(x.handoff_chain.status,'LOCAL_REQUEST_ACK_OBSERVED');
 assert.equal(x.status,'LOCAL_RECEIPTS_RECONCILED_FOR_MANUAL_REVIEW');
 const invalid=review({snapshot:nextSnap,handoffRows:[{...received,details_json:received.details_json.replace('"request_receipt":59','"request_receipt":999')},request],
  ackRows:[ackAfter],ownerReview:{...ownerReview,latest_ack_receipt:70}});
 assert.ok(invalid.holds.includes('HANDOFF_REQUEST_ACK_CHAIN_HOLD'));
});
test('owner change, acknowledgement before latest handoff and truncated scans HOLD',()=>{
 const x=review({ackRows:[ack(50)],ackScanComplete:false});
 assert.ok(x.holds.includes('OWNER_ACK_HISTORY_INCOMPLETE'));
 const old=review({snapshot:{...snapshot,assigned_user_id:8,admins:[{user_id:8}]}});
 assert.ok(old.holds.includes('ACKNOWLEDGEMENT_CONTINUITY_REVIEW_HOLD'));
 const manual=review({ackRows:[ack(50,'EXCEPTION_HANDOFF_REQUIRED')]});
 assert.ok(manual.holds.includes('OWNER_REQUIRES_MANUAL_HANDOFF'));
});
