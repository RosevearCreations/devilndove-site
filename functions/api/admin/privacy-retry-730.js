// Build 730: exact-event, two-distinct-Admin dead-letter recovery. No external send.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const result=(status,code,extra={})=>jsonResponse({ok:status===200,build:730,code,
 ...extra,external_delivery:false,signed_peer_ack_claimed:false},status,{'Cache-Control':'private, no-store'});
export async function onRequestPost(c){
 const admin=verifiedAdminFromModule(c),env=c.env||{},db=getDb(env);
 if(!admin||!Number.isSafeInteger(Number(admin.user_id))||Number(admin.user_id)<1)
  return result(401,'HOLD_ACTIVE_ADMIN_REQUIRED');
 if(!db)return result(503,'HOLD_ORIGINAL_D1_UNAVAILABLE');
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin&&
  c.request.headers.get('Sec-Fetch-Site')!=='same-origin')
  return result(403,'HOLD_SAME_ORIGIN_REQUIRED');
 let p={};try{p=await c.request.json()}catch{return result(400,'HOLD_INVALID_REQUEST')}
 if(JSON.stringify(p).length>1700||p.owner_review_confirmed!==true)
  return result(400,'HOLD_EXPLICIT_REVIEW_REQUIRED');
 const id=String(p.event_id||''),reason=String(p.reason_code||'');
 if(!uuid.test(id)||!/^[A-Z0-9_]{4,80}$/.test(reason))return result(400,'HOLD_EVENT_OR_REASON');
 if(!['review_dead_letter_730','approve_dead_letter_730'].includes(p.action))
  return result(400,'HOLD_ACTION_NOT_ALLOWED');
 try{
  const current=await db.prepare(`SELECT s.state,s.retry_cycle,s.attempt_count,w.event_id,
   m.consent_status,(SELECT COUNT(*) FROM dnd_withdrawal_acks_728 a WHERE a.event_id=w.event_id) AS ack_count
   FROM dnd_withdrawal_outbox_728 w
   JOIN dnd_withdrawal_retry_state_730 s ON s.event_id=w.event_id
   JOIN media_consent_records m ON m.consent_record_id=w.consent_record_id
   WHERE w.event_id=?`).bind(id).first();
  if(!current||current.state!=='DEAD_LETTER'||Number(current.attempt_count)!==6||
   !['revoked','blocked'].includes(String(current.consent_status||'').toLowerCase())||
   Number(current.ack_count)!==0)
   return result(409,'HOLD_ORIGINAL_DEAD_LETTER_AND_WITHDRAWAL_REQUIRED');
  const cycle=Number(current.retry_cycle)+1;
  if(cycle>99)return result(409,'HOLD_MAX_RECOVERY_CYCLES');
  if(p.action==='review_dead_letter_730'){
   const reviewId=crypto.randomUUID();
   await db.prepare(`INSERT INTO dnd_dead_letter_recovery_730
    (recovery_id,event_id,decision,target_cycle,requested_by_user_id,reason_code)
    VALUES(?,?,'REVIEW_HOLD',?,?,?)`).bind(reviewId,id,cycle,Number(admin.user_id),reason).run();
   const read=await db.prepare('SELECT recovery_id FROM dnd_dead_letter_recovery_730 WHERE recovery_id=? AND decision=?')
    .bind(reviewId,'REVIEW_HOLD').first();
   if(!read)return result(409,'HOLD_REVIEW_READBACK');
   return result(200,'ORIGINAL_REVIEW_RECORDED_APPROVAL_PENDING',{review_id:reviewId,event_id:id,target_cycle:cycle});
  }
  const reviewId=String(p.review_id||'');
  if(!uuid.test(reviewId))return result(400,'HOLD_REVIEW_ID');
  const review=await db.prepare(`SELECT recovery_id,requested_by_user_id,target_cycle,reason_code
    FROM dnd_dead_letter_recovery_730
    WHERE recovery_id=? AND event_id=? AND decision='REVIEW_HOLD'`)
    .bind(reviewId,id).first();
  if(!review||Number(review.target_cycle)!==cycle||
     Number(review.requested_by_user_id)===Number(admin.user_id)||review.reason_code!==reason)
    return result(409,'HOLD_DISTINCT_ORIGINAL_REVIEW_REQUIRED');
  const approvalId=crypto.randomUUID();
  await db.batch([
   db.prepare(`INSERT INTO dnd_dead_letter_recovery_730
    (recovery_id,event_id,decision,target_cycle,original_review_id,requested_by_user_id,approved_by_user_id,reason_code)
    VALUES(?,?,'REQUEUE_REQUESTED',?,?,?,?,?)`)
    .bind(approvalId,id,cycle,reviewId,Number(review.requested_by_user_id),Number(admin.user_id),reason),
   db.prepare(`UPDATE dnd_withdrawal_retry_state_730 SET
     state='READY',retry_cycle=?,attempt_count=0,retry_after=datetime('now','+5 minutes'),
     lease_token=NULL,lease_expires_at=NULL,updated_at=CURRENT_TIMESTAMP
     WHERE event_id=? AND state='DEAD_LETTER' AND retry_cycle=? AND attempt_count=6
     AND NOT EXISTS (SELECT 1 FROM dnd_withdrawal_acks_728 a WHERE a.event_id=?)`)
    .bind(cycle,id,cycle-1,id)
  ]);
  const after=await db.prepare('SELECT state,retry_cycle FROM dnd_withdrawal_retry_state_730 WHERE event_id=?')
   .bind(id).first();
  if(after?.state!=='READY'||Number(after.retry_cycle)!==cycle)
   return result(409,'HOLD_RECOVERY_READBACK');
  return result(200,'TWO_ADMIN_RECOVERY_REQUEUED_NO_SEND',{event_id:id,target_cycle:cycle,approval_id:approvalId});
 }catch{return result(409,'HOLD_SCHEMA_APPROVAL_OR_CONCURRENT_RECOVERY_FAILURE');}
}
