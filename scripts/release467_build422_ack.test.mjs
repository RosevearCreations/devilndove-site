import test from 'node:test';
import assert from 'node:assert/strict';
import {review422,canAck422,ACK_TYPE} from '../functions/api/_lib/providerExceptionAck422.mjs';
const receipts={escalation:10,assignment:11,handoff:0,followup:12,completion:13,route:0,governance:0};
const snapshot={evidence_receipts:receipts,assigned_user_id:7,admins:[{user_id:7}],handoff:{status:'NOT_REQUIRED',verified:true},
 source_snapshot_current:true,escalation_status:'OPEN_OWNER_REVIEW',source_signature:'1234abcd'};
const continuity={holds:[],scan_complete:true,latest_decision_receipt:30};
const review={holds:[],scan_complete:true,exception_count:1,unresolved_evidence_count:0};
const body={action:'ack_exception_followup',choice:'EVIDENCE_REVIEWED_FOLLOWUP_PENDING',
 request_key:'safe-ack-422-123456789',owner_note:'I reviewed the local evidence and retain manual control.',
 confirm_local_only:true,confirm_no_provider_action:true,confirm_no_publication:true,
 confirm_no_auto_resolution:true,confirm_us_shipping_suspended:true,
 expected_source_signature:'1234abcd',expected_receipts:receipts,
 expected_exception_decision_receipt:30,expected_previous_ack_receipt:0};
test('verified owner can only acknowledge local review',()=>{
 const state=review422({snapshot,continuity,review,ackRows:[],complete:true});
 assert.equal(state.review_ready,true);
 assert.equal(canAck422({snapshot,continuity,review,state,body,viewer:7}).allowed,true);
 assert.equal(state.exception_resolved,false);assert.equal(state.owner_handoff_performed,false);
 assert.equal(ACK_TYPE,'provider_escalation_422_owner_followup_ack');
});
test('handoff, assignment, stale receipt, consent and missing source block',()=>{
 for(const variation of [
  {snapshot:{...snapshot,handoff:{status:'HANDOFF_NOT_ACKNOWLEDGED',verified:false}}},
  {snapshot:{...snapshot,assigned_user_id:8}},
  {body:{...body,expected_receipts:{...receipts,followup:999}}},
  {body:{...body,confirm_no_provider_action:false}},
  {body:{...body,expected_previous_ack_receipt:44}}
 ]){
  const s=variation.snapshot||snapshot,st=review422({snapshot:s,continuity,review,ackRows:[],complete:true});
  assert.equal(canAck422({snapshot:s,continuity,review,state:st,body:variation.body||body,viewer:7}).allowed,false);
 }
});
test('ack history becomes HOLD if owner changed or scan truncated',()=>{
 const row={admin_action_audit_id:40,actor_user_id:7,created_at:'2026-10-18T00:00:00Z',details_json:JSON.stringify({
  action:'ack_exception_followup',choice:body.choice,local_only:true,provider_called:false,
  publication_performed:false,notifications_sent:false,us_shipping_suspended:true,
  expected_receipts:receipts,exception_decision_receipt:30,source_signature:'1234abcd'})};
 assert.equal(review422({snapshot,continuity,review,ackRows:[row],complete:true}).status,'LOCAL_OWNER_ACKNOWLEDGED');
 assert.equal(review422({snapshot,continuity,review,ackRows:[row],complete:false}).status,'HOLD_FOR_HUMAN_REVIEW');
 assert.equal(review422({snapshot:{...snapshot,assigned_user_id:8,admins:[{user_id:8}]},continuity,review,ackRows:[row],complete:true}).status,'HOLD_FOR_HUMAN_REVIEW');
});
