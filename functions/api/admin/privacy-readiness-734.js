// Build 734: original source-only independent receiver enrollment and signed ACK readiness.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {BUILD729_PEERS,peerConfig729,digest728} from '../_lib/appModuleRoutes.js';
const reply=(status,data)=>jsonResponse({build:734,...data,external_privacy_sending_authorized:false,
 owner_activation_received:false,remote_deletion_proven:false,
 key_retirement_authorized:false},status,{'Cache-Control':'no-store'});
export async function onRequestGet(c){
 const user=verifiedAdminFromModule(c),db=getDb(c.env||{});
 if(!user||!Number.isSafeInteger(Number(user.user_id))||Number(user.user_id)<1)
  return reply(401,{ok:false,status:'HOLD_VERIFIED_ADMIN_REQUIRED'});
 if(!db)return reply(503,{ok:false,status:'HOLD_ORIGINAL_D1_UNAVAILABLE'});
 const peers=[];
 for(const target of BUILD729_PEERS){
  const cfg=peerConfig729(c.env,target);
  let valid=false,proofId=null,proofAt=null,acks=0,held=0;
  try{
   if(cfg.ready){
    const row=await db.prepare(`SELECT proof_id,created_at,
     pinned_public_key_sha256,original_enrollment_receipt_sha256,
     observed_live_response,signature_verified
     FROM dnd_peer_enrollment_proofs_729
     WHERE peer_app=? ORDER BY created_at DESC LIMIT 1`).bind(target).first();
    const pin=await digest728('pinned-key:'+cfg.public_key);
    const receipt=await digest728('enrollment:'+cfg.receipt);
    const age=row?Date.now()-Date.parse(String(row.created_at).replace(' ','T')+'Z'):Infinity;
    valid=!!row&&Number(row.signature_verified)===1&&Number(row.observed_live_response)===1&&
     row.pinned_public_key_sha256===pin&&row.original_enrollment_receipt_sha256===receipt&&
     age>=0&&age<=7*86400000;
    if(valid){proofId=row.proof_id;proofAt=row.created_at;}
   }
   const counts=await db.prepare(`SELECT
     (SELECT COUNT(*) FROM dnd_withdrawal_acks_728 a
      JOIN dnd_withdrawal_outbox_728 w ON w.event_id=a.event_id
      WHERE a.peer_app=? AND w.target_app=? AND a.peer_signature_verified=1
      AND a.observed_live_response=1) AS manual,
     (SELECT COUNT(*) FROM dnd_withdrawal_auto_acks_730 a
      JOIN dnd_withdrawal_outbox_728 w ON w.event_id=a.event_id
      WHERE a.peer_app=? AND w.target_app=? AND a.peer_signature_verified=1
      AND a.observed_live_response=1) AS automatic,
     (SELECT COUNT(*) FROM dnd_withdrawal_outbox_728 w
      WHERE w.target_app=?) AS queued`).bind(target,target,target,target,target).first();
   acks=Math.max(0,Number(counts?.manual||0)+Number(counts?.automatic||0));
   held=Math.max(0,Number(counts?.queued||0)-acks);
  }catch{valid=false;proofId=null;proofAt=null;}
  peers.push({peer_app:target,configuration_present:cfg.ready,
   state:!cfg.ready?'HOLD_PEER_CONFIG_REQUIRED':!valid?'HOLD_ORIGINAL_FRESH_SIGNED_PEER_PROOF':
    'ORIGINAL_SIGNED_ENROLLMENT_PROOF_CURRENT',
   original_proof_id:proofId,original_proof_at:proofAt,
   original_verified_local_acks:acks,held_original_events:held,
   new_live_probe_performed:false,remote_content_erased_verified:false});
 }
 const allProofs=peers.length===3&&peers.every(p=>p.state==='ORIGINAL_SIGNED_ENROLLMENT_PROOF_CURRENT');
 return reply(200,{ok:true,status:allProofs?'READY_FOR_SEPARATE_OWNER_ACTIVATION_REVIEW':
  'HOLD_PEER_ENROLLMENT_OR_SIGNED_PROOF',
  peers,scheduled_worker_deployed_by_this_read:false,
  sender_env_flag_on_pages_not_worker_authority:true,
  worker_environment_activation_verified:false,
  no_implicit_cross_app_release:true});
}
