// Build 741: original-D1 privacy retry/dead-letter operator readback only.
// Every count is local source evidence, not receipt of external data deletion.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const three=Object.freeze(['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub']);
const reply=(status,code,extra={})=>jsonResponse({
 ok:status===200,build:741,code,...extra,read_only:true,
 external_delivery_authorized:false,worker_enabled_by_this_route:false,
 independent_receiver_ack_verified:false,external_erasure_proven:false,
 original_owner_activation_recorded:false,customer_data_returned:false
},status,{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'});
const natural=value=>{
 const v=Number(value);return Number.isSafeInteger(v)&&v>=0&&v<=100000000?v:0;
};
export async function onRequestGet(c){
 const admin=verifiedAdminFromModule(c);
 if(!admin)return reply(401,'HOLD_VERIFIED_ADMIN_REQUIRED');
 const db=getDb(c.env||{});
 if(!db)return reply(503,'HOLD_ORIGINAL_D1_UNAVAILABLE');
 try{
  const groups=(await db.prepare(`SELECT w.target_app,COUNT(*) AS total,
  SUM(CASE WHEN a.event_id IS NOT NULL THEN 1 ELSE 0 END) AS manual_ack,
  SUM(CASE WHEN au.event_id IS NOT NULL THEN 1 ELSE 0 END) AS worker_ack,
  SUM(CASE WHEN a.event_id IS NOT NULL AND au.event_id IS NOT NULL THEN 1 ELSE 0 END) AS conflicting_ack,
  SUM(CASE WHEN s.state='DEAD_LETTER' AND a.event_id IS NULL AND au.event_id IS NULL THEN 1 ELSE 0 END) AS dead_letter,
  SUM(CASE WHEN s.state='LEASED' AND s.lease_expires_at<datetime('now')
   AND a.event_id IS NULL AND au.event_id IS NULL THEN 1 ELSE 0 END) AS lease_expired,
  SUM(CASE WHEN s.state='READY' AND s.retry_after<=datetime('now')
   AND a.event_id IS NULL AND au.event_id IS NULL THEN 1 ELSE 0 END) AS retry_due,
  SUM(CASE WHEN s.event_id IS NULL THEN 1 ELSE 0 END) AS not_in_retry_ledger,
  SUM(CASE WHEN m.consent_status NOT IN ('revoked','blocked') THEN 1 ELSE 0 END) AS consent_not_withdrawn,
  SUM(CASE WHEN r.event_id IS NOT NULL THEN 1 ELSE 0 END) AS local_sla_resolution
  FROM dnd_withdrawal_outbox_728 w
  JOIN media_consent_records m ON m.consent_record_id=w.consent_record_id
  LEFT JOIN dnd_withdrawal_retry_state_730 s ON s.event_id=w.event_id
  LEFT JOIN dnd_withdrawal_acks_728 a ON a.event_id=w.event_id
  LEFT JOIN dnd_withdrawal_auto_acks_730 au ON au.event_id=w.event_id
  LEFT JOIN dnd_privacy_sla_resolutions_733 r ON r.event_id=w.event_id
  GROUP BY w.target_app`).all())?.results||[];
  const details=(await db.prepare(`SELECT w.event_id,w.target_app,
   s.state,s.attempt_count,s.retry_cycle,s.retry_after,
   CASE WHEN a.event_id IS NULL THEN 0 ELSE 1 END AS manual_ack,
   CASE WHEN au.event_id IS NULL THEN 0 ELSE 1 END AS worker_ack,
   CASE WHEN m.consent_status IN ('revoked','blocked') THEN 1 ELSE 0 END AS consent_withdrawn,
   (SELECT t.outcome FROM dnd_withdrawal_attempts_730 t WHERE t.event_id=w.event_id
    ORDER BY t.retry_cycle DESC,t.attempt_number DESC LIMIT 1) AS last_outcome
   FROM dnd_withdrawal_outbox_728 w
   JOIN dnd_withdrawal_retry_state_730 s ON s.event_id=w.event_id
   JOIN media_consent_records m ON m.consent_record_id=w.consent_record_id
   LEFT JOIN dnd_withdrawal_acks_728 a ON a.event_id=w.event_id
   LEFT JOIN dnd_withdrawal_auto_acks_730 au ON au.event_id=w.event_id
   WHERE s.state IN ('DEAD_LETTER','LEASED','READY')
   ORDER BY CASE s.state WHEN 'DEAD_LETTER' THEN 0 WHEN 'LEASED' THEN 1 ELSE 2 END,
    s.retry_after ASC,w.event_id ASC LIMIT 25`).all())?.results||[];
  const latest=await db.prepare(`SELECT tick_state,created_at,considered_events,
   signed_ack_count,held_events FROM dnd_privacy_schedule_receipts_730
   ORDER BY created_at DESC,tick_id DESC LIMIT 1`).first();
  const peers=three.map(app=>{
   const g=groups.find(x=>x.target_app===app)||{};
   const stats={total:natural(g.total),original_manual_ack:natural(g.manual_ack),
    original_worker_ack:natural(g.worker_ack),conflicting_ack:natural(g.conflicting_ack),
    dead_letter:natural(g.dead_letter),lease_expired:natural(g.lease_expired),
    retry_due:natural(g.retry_due),not_in_retry_ledger:natural(g.not_in_retry_ledger),
    consent_not_withdrawn:natural(g.consent_not_withdrawn),
    local_sla_resolution:natural(g.local_sla_resolution)};
   return {peer_app:app,...stats,
    needs_operator_attention:stats.dead_letter+stats.lease_expired+stats.conflicting_ack,
    independent_receiver_owner_attested:false,remote_data_removed_verified:false};
  });
  const newest=String(latest?.created_at||'');
  const time=Date.parse(newest.replace(' ','T')+(newest.endsWith('Z')?'':'Z'));
  const fresh=!!newest&&Number.isFinite(time)&&Date.now()-time>=0&&Date.now()-time<=30*60000;
  const cases=details.filter(x=>three.includes(x.target_app)).map(x=>({
   event_id:String(x.event_id||''),peer_app:x.target_app,
   state:String(x.state||''),attempt_count:natural(x.attempt_count),
   retry_cycle:natural(x.retry_cycle),retry_after:String(x.retry_after||''),
   last_original_attempt_outcome:String(x.last_outcome||'NONE'),
   original_manual_ack:natural(x.manual_ack)===1,
   original_worker_ack:natural(x.worker_ack)===1,
   consent_withdrawn:natural(x.consent_withdrawn)===1,
   requeue_eligible_source_only:x.state==='DEAD_LETTER'&&natural(x.attempt_count)===6&&
    natural(x.manual_ack)===0&&natural(x.worker_ack)===0&&natural(x.consent_withdrawn)===1
  }));
  return reply(200,'ORIGINAL_SIGNED_WITHDRAWAL_RETRY_OPERATIONS',{
   peers,cases,case_limit:25,details_are_bounded:true,
   complete_event_population_in_source_counts:groups.every(g=>three.includes(g.target_app)),
   original_d1_observed:true,
   source_schedule_receipt:latest?{state:String(latest.tick_state||''),
    at:latest.created_at,considered:natural(latest.considered_events),
    locally_signed:natural(latest.signed_ack_count),
    held:natural(latest.held_events),recent:fresh}:null,
   scheduler_runtime_verified_by_this_route:false,
   signed_ack_status:'LOCAL_ORIGINAL_D1_RECEIPT_NOT_REMOTE_ERASURE',
   review_flow:'TWO_DISTINCT_ADMIN_APPROVAL_REQUIRED_ORIGINAL_BUILD730',
   external_calls:0,db_mutations:0
  });
 }catch{return reply(503,'HOLD_ORIGINAL_RETRY_ACK_SCHEMA_OR_READ_FAILURE');}
}
