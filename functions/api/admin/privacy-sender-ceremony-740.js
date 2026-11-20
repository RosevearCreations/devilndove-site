// Build 740 — verified Admin-only privacy sender ceremony PRE-FLIGHT.
// Never sends, arms a Worker, enrolls a Master, or manufactures an owner receipt.
import {jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {onRequestGet as peer739Read} from './privacy-readiness-734.js';
const three=['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub'];
const reply=(status,code,extra={})=>jsonResponse({
 ok:status===200,build:740,code,read_only:true,
 sender_activation_authorized:false,worker_switch_changed:false,
 customer_or_privacy_message_sent:false,original_owner_activation_recorded:false,
 independent_receiver_owner_attested:false,external_signed_receiver_ack_verified:false,
 original_windows_host_reboot_verified:false,remote_erasure_verified:false,
 ...extra
},status,{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'});
async function source(c){
 const admin=verifiedAdminFromModule(c);
 if(!admin)return {response:reply(401,'HOLD_VERIFIED_ADMIN_REQUIRED')};
 const url=new URL(c.request.url);
 const upstream=new Request(url.origin+'/api/admin/privacy-readiness-734?review=peer739',
  {method:'GET',headers:{'Cache-Control':'no-store'}});
 const result=await peer739Read({...c,request:upstream});
 if(result.status!==200)return {response:reply(503,'HOLD_ORIGINAL_D1_SOURCE_UNAVAILABLE')};
 const j=await result.json().catch(()=>null);
 if(!j?.ok||j.build!==739||!Array.isArray(j.peers)||j.peers.length!==3||
    !three.every((peer,i)=>j.peers[i]?.peer_app===peer))
  return {response:reply(503,'HOLD_ORIGINAL_THREE_MASTER_SOURCE_INCOMPLETE')};
 const peers=j.peers.map(p=>({
   peer_app:p.peer_app,
   configuration_present:p.configuration_present===true,
   local_signed_proof_current:p.state==='ORIGINAL_SIGNED_ENROLLMENT_PROOF_CURRENT',
   original_local_ack_count:Number(p.original_verified_local_acks||0),
   source_state:p.state,
   independent_receiver_owner_attested:false,
   original_remote_ack_accepted:false
 }));
 const local=peers.every(p=>p.configuration_present&&p.local_signed_proof_current);
 return {peers,local,required:[
  {gate:'SOURCE_THREE_MASTER_SIGNED_PROOFS',verified:local,
   scope:'ORIGINAL_DEVILNDOVE_D1_NOT_REMOTE_AUTHORITY'},
  {gate:'INDEPENDENT_RECEIVER_OWNER_ATTESTATIONS',verified:false},
  {gate:'SIGNED_ORIGINAL_REMOTE_ACK_AND_REPLAY_PROOF',verified:false},
  {gate:'DISTINCT_OWNER_AND_WITNESS_ACTIVATION_AUTHORITY',verified:false},
  {gate:'CLOUDFLARE_WORKER_LIVE_FLAG_AND_RELEASE_READBACK',verified:false},
  {gate:'CONSENTED_SINGLE_EVENT_DELIVERY_PILOT',verified:false}
 ]};
}
export async function onRequestGet(c){
 const state=await source(c);
 if(state.response)return state.response;
 return reply(200,'HOLD_OWNER_GATED_ACTIVATION_EVIDENCE',{
  status:'HOLD_EXTERNAL_INDEPENDENT_PROOF',
  peers:state.peers,required_gates:state.required,local_source_proofs_complete:state.local,
  ready_to_dispatch:false,worker_deployed_default_off:true,
  production_worker_environment_observed_by_this_route:false,
  original_activation_approval_pending:true,source_revision_attested_by_external_owner:false,
  next_step:state.local?'OBTAIN_DISTINCT_EXTERNAL_RECEIVER_OWNER_AND_WITNESS_PROOFS':
   'RENEW_ALL_THREE_ORIGINAL_SIGNED_PEER_CHALLENGES',
  external_calls:0,db_mutations:0,personal_data_returned:false
 });
}
export async function onRequestPost(c){
 const admin=verifiedAdminFromModule(c);
 if(!admin)return reply(401,'HOLD_VERIFIED_ADMIN_REQUIRED');
 const request=c.request,origin=new URL(request.url).origin;
 if(request.headers.get('Origin')!==origin||
  !['same-origin','none'].includes(request.headers.get('Sec-Fetch-Site')||'same-origin'))
  return reply(403,'HOLD_SAME_ORIGIN_REQUIRED');
 if(Number(request.headers.get('Content-Length')||0)>1200)return reply(413,'HOLD_BODY_TOO_LARGE');
 let body;try{body=await request.json()}catch{return reply(400,'HOLD_INVALID_JSON');}
 if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>1100)
  return reply(400,'HOLD_INVALID_BODY');
 // A client assertion, public URL, receipt hash or checked box is NOT independent authority.
 // This endpoint can only prepare a non-binding owner review packet.
 if(body.action!=='prepare_owner_review_740'||body.owner_review_confirmed!==true||
   body.scope!=='CONSENT_WITHDRAWAL_ONLY'||
   !/^[A-Z][A-Z0-9_]{7,63}$/.test(String(body.reason_code||'')))
  return reply(409,'HOLD_NO_IMPLICIT_ACTIVATION_OR_UNVERIFIED_OWNER_INTENT');
 const state=await source(c);
 if(state.response)return state.response;
 return reply(200,'OWNER_REVIEW_PACKET_PREPARED_NOT_ACTIVATED',{
  status:'HOLD_ORIGINAL_INDEPENDENT_CEREMONY',
  peers:state.peers,required_gates:state.required,
  review_reason_code:body.reason_code,owner_review_requested:true,
  approval_record_saved:false,
  reviewer_must_be_independent:true,all_live_transport_disallowed:true,
  next_step:'RECONCILE_DISTINCT_ORIGINAL_OWNER_WITNESS_AND_LIVE_RECEIVER_ACK_OUTSIDE_THIS_UI',
  external_calls:0,db_mutations:0,personal_data_returned:false
 });
}
