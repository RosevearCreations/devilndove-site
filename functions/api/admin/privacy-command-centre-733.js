// Build 733 — original D1 privacy command centre and immutable, independently reviewed metadata.
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const seven=Object.freeze(['devilndove','rosiedazzlers','yardworkers','icamp',
 'rosevear-ai-hub','ai-data-platform','rosevear-comms-hub']);
const three=new Set(['ai-data-platform','rosevear-ai-hub','rosevear-comms-hub']);
function reply(status,code,extra={}){
 return jsonResponse({ok:status===200,build:733,code,...extra,remote_erasure_verified:false,
  old_key_retirement_authorized:false,automatic_external_delivery:false},
  status,{'Cache-Control':'private, no-store'});
}
function source(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env||{});
 return {admin,db,id:Number(admin?.user_id)};
}
export async function onRequestGet(c){
 const {admin,db,id}=source(c);
 if(!admin||!Number.isSafeInteger(id)||id<1)return reply(401,'HOLD_VERIFIED_ADMIN_REQUIRED');
 if(!db)return reply(503,'HOLD_ORIGINAL_D1_UNAVAILABLE');
 try{
  const rows=(await db.prepare(`SELECT w.target_app,COUNT(*) AS total,
   SUM(CASE WHEN a.event_id IS NOT NULL OR b.event_id IS NOT NULL THEN 1 ELSE 0 END) AS original_signed_ack,
   SUM(CASE WHEN r.event_id IS NOT NULL THEN 1 ELSE 0 END) AS approved_local_sla_resolutions
   FROM dnd_withdrawal_outbox_728 w
   LEFT JOIN dnd_withdrawal_acks_728 a ON a.event_id=w.event_id
   LEFT JOIN dnd_withdrawal_auto_acks_730 b ON b.event_id=w.event_id
   LEFT JOIN dnd_privacy_sla_resolutions_733 r ON r.event_id=w.event_id
   GROUP BY w.target_app`).all())?.results||[];
  const tick=await db.prepare(`SELECT tick_id,tick_state,created_at,considered_events,
   signed_ack_count,held_events FROM dnd_privacy_schedule_receipts_730
   ORDER BY created_at DESC,tick_id DESC LIMIT 1`).first();
  const witnesses=Number((await db.prepare(
   'SELECT COUNT(*) AS n FROM dnd_privacy_rotation_witnesses_733').first())?.n||0);
  const latest=String(tick?.created_at||'').replace(' ','T');
  const at=latest?Date.parse(latest+(latest.endsWith('Z')?'':'Z')):NaN;
  const fresh=Number.isFinite(at)&&Date.now()-at>=0&&Date.now()-at<=30*60000;
  const applications=seven.map(app=>{
   const row=rows.find(r=>r.target_app===app);
   return {application:app,
    scope:app==='devilndove'?'ORIGINAL_SOURCE_D1':
     three.has(app)?'LOCAL_OUTBOX_PEER_EVIDENCE':'EXTERNAL_APP_NOT_ATTESTED',
    local_queued:Number(row?.total||0),local_signed_ack:Number(row?.original_signed_ack||0),
    approved_local_sla_resolutions:Number(row?.approved_local_sla_resolutions||0),
    independent_external_compliance_verified:false};
  });
  return reply(200,'ORIGINAL_D1_METADATA_READBACK',{
   seven_application_matrix:applications,
   latest_tick:tick?{tick_id:tick.tick_id,at:tick.created_at,
     tick_state:tick.tick_state,heartbeat_fresh:fresh}:null,
   scheduler_state:fresh&&tick.tick_state==='RUN'?'FRESH_D1_TICK_NOT_CLOUDFLARE_DEPLOYMENT_PROOF':
    'HOLD_ORIGINAL_SCHEDULE_TICK_ABSENT_OR_STALE',
   independent_key_lineage_witness_count:witnesses,
   independent_rotation_plaintext_verification:false,
   remote_master_receipts_validated_by_this_view:false,
   data_source:'ORIGINAL_DEVILNDOVE_D1_ONLY'});
 }catch{return reply(503,'HOLD_BUILD733_ORIGINAL_SCHEMA_OR_READBACK_FAILED');}
}
export async function onRequestPost(c){
 const {admin,db,id}=source(c);
 if(!admin||!Number.isSafeInteger(id)||id<1)return reply(401,'HOLD_VERIFIED_ADMIN_REQUIRED');
 if(!db)return reply(503,'HOLD_ORIGINAL_D1_UNAVAILABLE');
 if(c.request?.headers?.get('Origin')!==new URL(c.request.url).origin&&
  c.request?.headers?.get('Sec-Fetch-Site')!=='same-origin')
  return reply(403,'HOLD_SAME_ORIGIN_REQUIRED');
 let p={};try{p=await c.request.json()}catch{return reply(400,'HOLD_INVALID_JSON')}
 if(JSON.stringify(p).length>1600||p.owner_review_confirmed!==true)return reply(400,'HOLD_EXPLICIT_OWNER_REVIEW');
 const action=String(p.action||''),reason=String(p.reason_code||'');
 if(!/^[A-Z0-9_]{4,80}$/.test(reason))
  return reply(400,'HOLD_REASON_CODE_REQUIRED');
 if(!['review_sla_733','approve_sla_733','witness_key_lineage_733'].includes(action))
  return reply(400,'HOLD_ACTION_NOT_ALLOWED');
 try{
  if(action==='review_sla_733'){
   const event=String(p.event_id||'');
   if(!uuid.test(event))return reply(400,'HOLD_EVENT_ID_INVALID');
   const row=await db.prepare(`SELECT w.target_app,m.consent_status,
    a.ack_envelope_sha256 AS admin_hash,b.ack_envelope_sha256 AS worker_hash
    FROM dnd_withdrawal_outbox_728 w
    JOIN media_consent_records m ON m.consent_record_id=w.consent_record_id
    LEFT JOIN dnd_withdrawal_acks_728 a ON a.event_id=w.event_id
    LEFT JOIN dnd_withdrawal_auto_acks_730 b ON b.event_id=w.event_id WHERE w.event_id=?`)
    .bind(event).first();
   if(!row||!['revoked','blocked'].includes(row.consent_status)||!!row.admin_hash===!!row.worker_hash)
    return reply(409,'HOLD_ORIGINAL_SINGLE_SIGNED_ACK_AND_CONSENT_REQUIRED');
   const source=row.admin_hash?'ADMIN_SIGNED_728':'WORKER_SIGNED_730',digest=row.admin_hash||row.worker_hash;
   const review=crypto.randomUUID();
   await db.prepare(`INSERT INTO dnd_privacy_sla_reviews_733
    (review_id,event_id,receipt_source,signed_receipt_sha256,requested_by_user_id,reason_code)
    VALUES(?,?,?,?,?,?)`).bind(review,event,source,digest,id,reason).run();
   const read=await db.prepare('SELECT review_id FROM dnd_privacy_sla_reviews_733 WHERE review_id=?')
    .bind(review).first();
   if(!read)return reply(409,'HOLD_IMMUTABLE_REVIEW_READBACK');
   return reply(200,'ORIGINAL_SIGNED_ACK_REVIEW_RECORDED',{review_id:review,
    event_id:event,independent_approval_pending:true});
  }
  if(action==='approve_sla_733'){
   const review=String(p.review_id||'');
   if(!uuid.test(review))return reply(400,'HOLD_REVIEW_ID_INVALID');
   const original=await db.prepare(`SELECT review_id,event_id,requested_by_user_id,reason_code
    FROM dnd_privacy_sla_reviews_733 WHERE review_id=?`).bind(review).first();
   if(!original||Number(original.requested_by_user_id)===id||original.reason_code!==reason)
    return reply(409,'HOLD_DISTINCT_ADMIN_AND_ORIGINAL_REVIEW_REQUIRED');
   const resolution=crypto.randomUUID();
   await db.prepare(`INSERT INTO dnd_privacy_sla_resolutions_733
    (resolution_id,review_id,event_id,approved_by_user_id,reason_code)
    VALUES(?,?,?,?,?)`).bind(resolution,review,original.event_id,id,reason).run();
   const read=await db.prepare('SELECT resolution_id FROM dnd_privacy_sla_resolutions_733 WHERE resolution_id=?')
    .bind(resolution).first();
   if(!read)return reply(409,'HOLD_RESOLUTION_D1_READBACK');
   return reply(200,'INDEPENDENT_LOCAL_SLA_RESOLUTION_RECORDED',{
    resolution_id:resolution,event_id:original.event_id,original_review_id:review,
    source_signed_ack_only:true,external_platform_compliance_proven:false});
  }
  const evidence=String(p.evidence_id||''),to=Number(p.target_version);
  if(!uuid.test(evidence)||!Number.isSafeInteger(to)||to<2||to>999)
   return reply(400,'HOLD_EVIDENCE_ID_OR_VERSION_INVALID');
  const row=await db.prepare(`SELECT older.ciphertext_sha256 AS source_hash,
    latest.ciphertext_sha256 AS target_hash,latest.created_by_user_id AS author_id
    FROM dnd_evidence_versions_728 latest
    JOIN dnd_evidence_versions_728 older
      ON older.evidence_id=latest.evidence_id AND older.version=latest.version-1
    WHERE latest.evidence_id=? AND latest.version=?
    AND latest.previous_version_sha256=older.ciphertext_sha256
    AND latest.key_id<>older.key_id
    AND latest.version=(SELECT MAX(x.version) FROM dnd_evidence_versions_728 x
      WHERE x.evidence_id=latest.evidence_id)`).bind(evidence,to).first();
  if(!row||Number(row.author_id)===id)return reply(409,'HOLD_ORIGINAL_DISTINCT_KEY_LINEAGE_WITNESS_REQUIRED');
  const witness=crypto.randomUUID();
  await db.prepare(`INSERT INTO dnd_privacy_rotation_witnesses_733
    (witness_id,evidence_id,source_version,target_version,source_ciphertext_sha256,
     target_ciphertext_sha256,requested_by_user_id,witnessed_by_user_id,reason_code)
    VALUES(?,?,?, ?,?,?,?,?,?)`)
   .bind(witness,evidence,to-1,to,row.source_hash,row.target_hash,Number(row.author_id),id,reason).run();
  const read=await db.prepare('SELECT witness_id FROM dnd_privacy_rotation_witnesses_733 WHERE witness_id=?')
   .bind(witness).first();
  if(!read)return reply(409,'HOLD_KEY_LINEAGE_WITNESS_READBACK');
  return reply(200,'INDEPENDENT_CIPHERTEXT_METADATA_WITNESS_RECORDED',{
   witness_id:witness,evidence_id:evidence,target_version:to,
   plaintext_decryption_proven:false,key_retirement_authorized:false});
 }catch{return reply(409,'HOLD_ORIGINAL_D1_PROOF_DUPLICATE_OR_APPROVAL_FAILED');}
}
