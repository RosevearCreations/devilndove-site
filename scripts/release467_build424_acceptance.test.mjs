import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewHandoffAcceptance424} from '../functions/api/_lib/providerHandoffAcceptance424.mjs';
function base(){
 const governance={build:423,status:'LOCAL_RECEIPTS_RECONCILED_FOR_MANUAL_REVIEW',holds:[],
  read_only:true,manual_followup_required:true,us_shipping_suspended:true,
  provider_called:false,publication_performed:false,notifications_sent:false,
  automatic_reopen:false,automatic_closure:false,exception_resolved:false,
  owner_reassignment_performed:false,provider_status_verified_now:false,
  latest_handoff_receipt:0,latest_owner_ack_receipt:50,decision_receipt:40,
  handoff_chain:{status:'NOT_REQUIRED',request_receipt:0,ack_receipt:0},
  owner_review_history:[{receipt:50,actor_user_id:7,review_flags:[]}]};
 return {ok:true,build:423,read_only:true,manual_review_only:true,product_id:'120',
  destination:'etsy',governance};
}
test('eligible case presents P2/P3 review but never permits closure',()=>{
 const r=reviewHandoffAcceptance424(base());
 assert.equal(r.handoff_acceptance_review_ready,true);
 assert.deepEqual(r.exception_queue.map(x=>x.priority),['P2','P3']);
 assert.equal(r.manual_closure_safety.closure_allowed_by_this_review,false);
 assert.equal(r.manual_closure_safety.requires_independent_provider_evidence,true);
 for(const key of ['automatic_closure','automatic_reopen','provider_called','publication_performed','notifications_sent'])
  assert.equal(r[key],false);
 assert.equal(r.us_shipping_suspended,true);
});
test('incomplete audit and unacknowledged handoff show ordered P0/P1 holds',()=>{
 const p=base();p.governance.status='HOLD_MANUAL_OWNER_GOVERNANCE';
 p.governance.holds=['HANDOFF_ACKNOWLEDGEMENT_PENDING','HANDOFF_HISTORY_INCOMPLETE'];
 const r=reviewHandoffAcceptance424(p);
 assert.equal(r.handoff_acceptance_review_ready,false);
 assert.deepEqual(r.exception_queue.map(x=>x.priority),['P0','P1']);
});
test('explicit owner handoff choice cannot reassign',()=>{
 const p=base();p.governance.status='HOLD_MANUAL_OWNER_GOVERNANCE';
 p.governance.holds=['OWNER_REQUIRES_MANUAL_HANDOFF'];
 const r=reviewHandoffAcceptance424(p);
 assert.equal(r.exception_queue[0].priority,'P1');
 assert.equal(r.handoff_accepted_automatically,false);
});
test('unsafe, truncated, unknown or tampered reports fail closed',()=>{
 const changes=[
  p=>{p.governance.provider_called=true;},
  p=>{p.governance.holds=['UNKNOWN_FLAG'];p.governance.status='HOLD_MANUAL_OWNER_GOVERNANCE';},
  p=>{p.governance.owner_review_history[0].receipt=49;},
  p=>{p.governance.owner_review_history=Array.from({length:101},(_,i)=>({receipt:i+1,actor_user_id:7,review_flags:[]}));},
  p=>{p.manual_review_only=false;}
 ];
 for(const change of changes){
  const p=base();change(p);
  const r=reviewHandoffAcceptance424(p);
  assert.equal(r.handoff_acceptance_review_ready,false);
  assert.equal(r.exception_queue[0].priority,'P0');
 }
});
test('receiver handoff receipt must have exact chronology',()=>{
 const p=base();p.governance.handoff_chain={status:'LOCAL_REQUEST_ACK_OBSERVED',
  request_receipt:51,ack_receipt:60};
 p.governance.latest_handoff_receipt=60;
 p.governance.latest_owner_ack_receipt=70;
 p.governance.owner_review_history=[{receipt:70,actor_user_id:8,review_flags:[]}];
 assert.equal(reviewHandoffAcceptance424(p).handoff_acceptance_review_ready,true);
 p.governance.handoff_chain.ack_receipt=61;
 assert.equal(reviewHandoffAcceptance424(p).handoff_acceptance_review_ready,false);
});
test('scoped API reuses verified Build 423 and UI is mounted',async()=>{
 const api=readFileSync(new URL('../functions/api/admin/provider-handoff-acceptance-424.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../admin/it-integrations/index.html',import.meta.url),'utf8');
 const {moduleKeyForPath,MODULE_KEYS}=await import('../functions/api/_lib/appModuleRoutes.js');
 assert.equal(moduleKeyForPath('/api/admin/provider-handoff-acceptance-424'),MODULE_KEYS.STOREFRONT);
 assert.match(api,/onRequestGet as read423/);
 assert.doesNotMatch(api,/onRequestPost|INSERT INTO|UPDATE admin_action_audit|DELETE FROM/);
 assert.match(html,/admin-provider-handoff-acceptance-v424/);
});
