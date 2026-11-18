// Build 734: original source-only independent receiver enrollment and signed ACK readiness.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {providerReady734} from '../auth/recovery-734.js';
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
 if(new URL(c.request.url).searchParams.get('review')==='recovery735'){
  try{
   // No email addresses, tokens, fingerprints, provider IDs, customer IDs or source secrets.
   const metrics=await db.prepare(`SELECT
     COUNT(*) AS recent_reset_requests,
     COALESCE(SUM(CASE WHEN sent_at IS NOT NULL THEN 1 ELSE 0 END),0) AS provider_accepted,
     COALESCE(SUM(CASE WHEN sent_at IS NULL AND consumed_at IS NULL THEN 1 ELSE 0 END),0) AS unconfirmed_unsent,
     COALESCE(SUM(CASE WHEN sent_at IS NOT NULL AND consumed_at IS NULL
       AND expires_at>datetime('now') THEN 1 ELSE 0 END),0) AS active_unused,
     COALESCE(SUM(CASE WHEN consumed_at IS NOT NULL THEN 1 ELSE 0 END),0) AS claimed_or_invalidated,
     COALESCE(SUM(CASE WHEN consumed_at IS NULL AND
       expires_at<=datetime('now') THEN 1 ELSE 0 END),0) AS expired_without_claim
     FROM dnd_password_reset_tokens_734
     WHERE created_at>=datetime('now','-1 day')`).first();
   const rate=await db.prepare(`SELECT
     COUNT(*) AS attempts_24h,
     COALESCE(SUM(CASE WHEN action='reset_request' THEN 1 ELSE 0 END),0) AS reset_requests,
     COALESCE(SUM(CASE WHEN action='account_reminder' THEN 1 ELSE 0 END),0) AS account_reminders,
     COALESCE(SUM(CASE WHEN action='reset_redeem' THEN 1 ELSE 0 END),0) AS reset_redemptions_attempted
     FROM dnd_auth_recovery_attempts_734
     WHERE created_at>=datetime('now','-1 day')`).first();
   const configured=providerReady734(c.env||{});
   return reply(200,{ok:true,build:735,
    status:configured?'READY_FOR_SUPERVISED_REAL_INBOX_PILOT':
       'HOLD_RESEND_PROVIDER_CONFIGURATION',
    original_d1_schema_verified:true,provider_configuration_present:configured,
    original_provider_acceptances_not_inbox_deliveries:Number(metrics?.provider_accepted||0),
    original_reset_requests_last_24h:Number(metrics?.recent_reset_requests||0),
    original_pending_unused_reset_links:Number(metrics?.active_unused||0),
    original_unconfirmed_unsent_reset_tokens:Number(metrics?.unconfirmed_unsent||0),
    original_claimed_or_invalidated_tokens:Number(metrics?.claimed_or_invalidated||0),
    original_expired_without_claim:Number(metrics?.expired_without_claim||0),
    original_abuse_attempts_last_24h:Number(rate?.attempts_24h||0),
    original_request_attempts_last_24h:Number(rate?.reset_requests||0),
    original_account_reminder_attempts_last_24h:Number(rate?.account_reminders||0),
    original_redeem_attempts_last_24h:Number(rate?.reset_redemptions_attempted||0),
    actual_external_inbox_delivery_verified:false,
    actual_independent_user_password_change_verified:false,
    genuine_owner_consented_inbox_pilot_pending:true,
    no_mail_sent_by_status_check:true,read_only:true,
    customer_identifiers_exposed:false,secret_values_exposed:false});
  }catch{
   return reply(503,{ok:false,build:735,status:'HOLD_ORIGINAL_RECOVERY_D1_SCHEMA_OR_READ_FAILURE',
    actual_external_inbox_delivery_verified:false,no_mail_sent_by_status_check:true,
    customer_identifiers_exposed:false,secret_values_exposed:false});
  }
 }

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
