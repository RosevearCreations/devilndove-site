// Build 730: independently deployed Cloudflare Scheduled Worker, fail-closed by default.
// No public POST trigger, no customer payload, no automatic purge or key replacement.
import {peerConfig729,digest728,hmacScope728,verifyLiveWithdrawalAck728} from '../functions/api/_lib/appModuleRoutes.js';
const known=Object.freeze(['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub']);
/* Build 740: this source release can NEVER arm the sender by itself.
   The separate Worker operator boundary stays false in Production.
   Config presence is not independent owner/receiver attestation. */
const sourceArm740=env=>env?.DND740_OWNER_ACTIVATION_CONFIRMED==='true'&&
 env?.DND740_APPROVED_SCOPE==='CONSENT_WITHDRAWAL_ONLY'&&
 /^[0-9a-f]{64}$/.test(String(env?.DND740_INDEPENDENT_WITNESS_SHA256||''));
const caps=Object.freeze({per_tick:3,attempts:6,lease_seconds:120,timeout_ms:7000});
const nowSql="datetime('now')";
async function proofCurrent(db,env,target){
 const cfg=peerConfig729(env,target);
 if(!cfg.ready)return null;
 const row=await db.prepare(`SELECT pinned_public_key_sha256,original_enrollment_receipt_sha256,
  signature_verified,observed_live_response,created_at
  FROM dnd_peer_enrollment_proofs_729 WHERE peer_app=? ORDER BY created_at DESC LIMIT 1`)
  .bind(target).first();
 if(!row)return null;
 const pin=await digest728('pinned-key:'+cfg.public_key),receipt=await digest728('enrollment:'+cfg.receipt);
 const age=Date.now()-Date.parse(String(row.created_at).replace(' ','T')+'Z');
 if(Number(row.signature_verified)!==1||Number(row.observed_live_response)!==1||
    pin!==row.pinned_public_key_sha256||receipt!==row.original_enrollment_receipt_sha256||
    !Number.isFinite(age)||age<0||age>7*86400000)return null;
 return cfg;
}
async function attemptDelivery(env,event,cfg){
 const envelope={schema_id:'rosevear.dnd.consent.withdrawal.v1',from_app:'devilndove',
  to_app:event.target_app,event_id:event.event_id,request_nonce:event.request_nonce,
  scope_hmac_sha256:event.scope_hmac_sha256,issued_at:new Date().toISOString(),
  expires_at:new Date(Date.now()+120000).toISOString()};
 const mac=await hmacScope728(cfg.hmac_key,JSON.stringify(envelope));
 let response;
 try{response=await fetch(cfg.url,{method:'POST',redirect:'error',
  headers:{'Content-Type':'application/json','X-DND-HMAC-SHA256':mac,'Cache-Control':'no-store'},
  body:JSON.stringify(envelope),signal:AbortSignal.timeout(caps.timeout_ms)});}
 catch{return {outcome:'UNAVAILABLE'};}
 if(response.status!==200||!String(response.headers.get('content-type')||'').includes('application/json'))
  return {outcome:'INVALID_ACK'};
 let raw;try{raw=await response.text()}catch{return {outcome:'INVALID_ACK'}}
 if(raw.length>4096)return {outcome:'INVALID_ACK'};
 let body;try{body=JSON.parse(raw)}catch{return {outcome:'INVALID_ACK'}}
 const proof=await verifyLiveWithdrawalAck728(body,event,cfg.public_key);
 return proof.verified?{outcome:'SIGNED_ACK_VERIFIED',receipt_sha256:proof.receipt_sha256}:
  {outcome:'INVALID_ACK'};
}
export async function runPrivacyTick730(env){
 const db=env?.DB,serviceId=String(env?.DND730_SERVICE_ID||'');
 if(!db||env?.DND730_AUTOMATION_ENABLED!=='true'||!/^[A-Za-z0-9._:-]{12,80}$/.test(serviceId)||
  !sourceArm740(env))
  return {status:'HOLD_DISABLED_OR_UNPROVISIONED',considered:0,signed:0};
 // All three sources must have fresh, genuine signed proof records before any
 // lease, retry-state write, or external call. Local proofs are still not a
 // substitute for independent external owner acceptance.
 try{
  for(const target of known){
   if(!await proofCurrent(db,env,target))
    return {status:'HOLD_THREE_MASTER_SOURCE_PROOF_INCOMPLETE',considered:0,signed:0};
  }
 }catch{return {status:'HOLD_THREE_MASTER_SOURCE_PROOF_UNAVAILABLE',considered:0,signed:0};}
 const tickId=crypto.randomUUID();let considered=0,signed=0,held=0;
 // D1 0054 must have been applied via the verified Development-first migration gate.
 const initial=await db.prepare(`INSERT OR IGNORE INTO dnd_withdrawal_retry_state_730(event_id)
  SELECT w.event_id FROM dnd_withdrawal_outbox_728 w
  JOIN media_consent_records m ON m.consent_record_id=w.consent_record_id
  LEFT JOIN dnd_withdrawal_acks_728 a ON a.event_id=w.event_id
  LEFT JOIN dnd_withdrawal_auto_acks_730 au ON au.event_id=w.event_id
  WHERE m.consent_status IN ('revoked','blocked') AND a.event_id IS NULL AND au.event_id IS NULL
  ORDER BY w.created_at ASC LIMIT 25`).run();
 void initial;
 const rows=(await db.prepare(`SELECT w.event_id,w.target_app,w.request_nonce,w.scope_hmac_sha256,
    s.attempt_count,s.retry_cycle,s.state,s.retry_after,s.lease_expires_at
    FROM dnd_withdrawal_outbox_728 w
    JOIN media_consent_records m ON m.consent_record_id=w.consent_record_id
    JOIN dnd_withdrawal_retry_state_730 s ON s.event_id=w.event_id
    LEFT JOIN dnd_withdrawal_acks_728 a ON a.event_id=w.event_id
    LEFT JOIN dnd_withdrawal_auto_acks_730 au ON au.event_id=w.event_id
    WHERE m.consent_status IN ('revoked','blocked') AND a.event_id IS NULL AND au.event_id IS NULL
      AND ((s.state='READY' AND s.retry_after<=${nowSql})
       OR (s.state='LEASED' AND s.lease_expires_at<${nowSql}))
    ORDER BY s.retry_after ASC LIMIT ?`).bind(caps.per_tick).all())?.results||[];
 for(const event of rows){
  if(!known.includes(event.target_app))continue;
  const lease=crypto.randomUUID();
  const lock=await db.prepare(`UPDATE dnd_withdrawal_retry_state_730
   SET state='LEASED',lease_token=?,lease_expires_at=datetime('now','+2 minutes'),
    updated_at=CURRENT_TIMESTAMP
   WHERE event_id=? AND attempt_count=? AND retry_cycle=?
    AND ((state='READY' AND retry_after<=datetime('now'))
     OR (state='LEASED' AND lease_expires_at<datetime('now')))
    AND NOT EXISTS(SELECT 1 FROM dnd_withdrawal_acks_728 a WHERE a.event_id=?)
    AND NOT EXISTS(SELECT 1 FROM dnd_withdrawal_auto_acks_730 a WHERE a.event_id=?)`)
   .bind(lease,event.event_id,event.attempt_count,event.retry_cycle,event.event_id,event.event_id).run();
  if(Number(lock?.meta?.changes)!==1)continue;
  considered++;
  let result={outcome:'TRANSPORT_HOLD'};
  try{
   const cfg=await proofCurrent(db,env,event.target_app);
   result=cfg?await attemptDelivery(env,event,cfg):{outcome:'EXPIRED_PEER_PROOF'};
  }catch{result={outcome:'SCHEMA_HOLD'}}
  const attemptNo=Number(event.attempt_count)+1;
  const terminal=attemptNo>=caps.attempts;
  const delay=Math.min(86400,300*2**attemptNo);
  const jitter=Math.floor(delay*(Math.random()*0.2));
  const state=result.outcome==='SIGNED_ACK_VERIFIED'?'ACKED':terminal?'DEAD_LETTER':'READY';
  try{
   const statements=[
    db.prepare(`INSERT INTO dnd_withdrawal_attempts_730
      (attempt_id,event_id,lease_token,attempt_number,retry_cycle,outcome,outcome_sha256)
      VALUES(?,?,?,?,?,?,?)`)
     .bind(crypto.randomUUID(),event.event_id,lease,attemptNo,event.retry_cycle,
      result.outcome,result.receipt_sha256||null)
   ];
   if(result.outcome==='SIGNED_ACK_VERIFIED')
    statements.push(db.prepare(`INSERT OR IGNORE INTO dnd_withdrawal_auto_acks_730
      (event_id,peer_app,ack_envelope_sha256,peer_signature_verified,observed_live_response,service_id)
      VALUES(?,?,?,1,1,?)`)
     .bind(event.event_id,event.target_app,result.receipt_sha256,serviceId));
   statements.push(db.prepare(`UPDATE dnd_withdrawal_retry_state_730
     SET attempt_count=?,state=?,retry_after=datetime('now','+'||?||' seconds'),
      lease_token=NULL,lease_expires_at=NULL,updated_at=CURRENT_TIMESTAMP
     WHERE event_id=? AND state='LEASED' AND lease_token=? AND retry_cycle=?`)
     .bind(attemptNo,state,delay+jitter,event.event_id,lease,event.retry_cycle));
   await db.batch(statements);
   if(result.outcome==='SIGNED_ACK_VERIFIED'){
    const read=await db.prepare('SELECT ack_envelope_sha256 FROM dnd_withdrawal_auto_acks_730 WHERE event_id=?')
     .bind(event.event_id).first();
    if(read?.ack_envelope_sha256===result.receipt_sha256)signed++;else held++;
   }else held++;
  }catch{held++}
 }
 let rotation=0;
 if(env.DND728_ACTIVE_KEY_ID){
  try{
   const x=await db.prepare(`SELECT COUNT(*) AS n FROM dnd_evidence_versions_728 x
     WHERE x.version=(SELECT MAX(v.version) FROM dnd_evidence_versions_728 v
       WHERE v.evidence_id=x.evidence_id) AND x.key_id<>?`)
     .bind(String(env.DND728_ACTIVE_KEY_ID)).first();
   rotation=Math.max(0,Math.min(1000000,Number(x?.n||0)));
  }catch{rotation=0}
 }
 await db.prepare(`INSERT INTO dnd_privacy_schedule_receipts_730
  (tick_id,service_id,tick_state,considered_events,signed_ack_count,held_events,rotation_backlog,reason_code)
  VALUES(?,?,'RUN',?,?,?,?,'SIGNED_ACK_REQUIRED')`)
  .bind(tickId,serviceId,considered,signed,held,rotation).run();
 return {status:'RUN_SOURCE_RECEIPT',considered,signed,held,rotation_backlog:rotation,
  external_platform_recall_verified:false,automatic_key_rotation_performed:false};
}
export default {
 async scheduled(_event,env,ctx){ctx.waitUntil(runPrivacyTick730(env));},
 async fetch(){return new Response('Not Found',{status:404})}
};
