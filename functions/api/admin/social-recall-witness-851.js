// Build 851 — owner-gated, append-only source custody; never call a social provider.
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {CONTRACT_851,verifyDeviceWitness851,verifyMasterAck851,consentGate851,scopedClosure851,latestDeviceWitnesses851} from '../_lib/socialRecall851.mjs';
const reply=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'private, no-store'});
const positive=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):0;
const valid=platform=>['facebook','instagram','pinterest','x'].includes(platform);
const parse=(raw,fallback)=>{try{return JSON.parse(raw||'');}catch{return fallback;}};
const summary=(error)=>({ok:false,error,source:'devilndove',build:851,publication_performed:false,provider_mutation_performed:false,master_events_emitted:0,master_connection:'HOLD'});
async function setup(db){
 await db.prepare(`CREATE TABLE IF NOT EXISTS social_recall_evidence_851 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,queue_id INTEGER NOT NULL,kind TEXT NOT NULL,
  platform TEXT,external_post_id TEXT,device_nonce TEXT,nonce TEXT NOT NULL UNIQUE,
  receipt_sha256 TEXT NOT NULL,revision TEXT NOT NULL,observed_at TEXT NOT NULL,
  verifier_id TEXT NOT NULL,signed_verified INTEGER NOT NULL CHECK(signed_verified=1),
  actor_user_id INTEGER NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
 await db.prepare('CREATE INDEX IF NOT EXISTS idx_social_recall_851_queue ON social_recall_evidence_851(queue_id,kind,platform,id)').run();
 await db.prepare("CREATE TRIGGER IF NOT EXISTS social_recall_851_no_update BEFORE UPDATE ON social_recall_evidence_851 BEGIN SELECT RAISE(ABORT,'Append-only receipts'); END").run();
 await db.prepare("CREATE TRIGGER IF NOT EXISTS social_recall_851_no_delete BEFORE DELETE ON social_recall_evidence_851 BEGIN SELECT RAISE(ABORT,'Append-only receipts'); END").run();
}
async function evidence(db,queueId){
 const post=await db.prepare('SELECT social_post_queue_id,source_type,source_id,target_platforms_json FROM social_post_queue WHERE social_post_queue_id=?').bind(queueId).first();
 if(!post)return null;
 const consents=(await db.prepare('SELECT consent_status,public_use_allowed,social_use_allowed FROM media_consent_records WHERE source_type=? AND source_id=? LIMIT 100').bind(post.source_type||'',post.source_id||'').all()).results||[];
 const platforms=parse(post.target_platforms_json,[]);
 const consent=consentGate851(consents,platforms);
 const receipts=(await db.prepare('SELECT id,kind,platform,device_nonce,nonce,revision,observed_at,signed_verified FROM social_recall_evidence_851 WHERE queue_id=? ORDER BY id DESC LIMIT 100').bind(queueId).all()).results||[];
 const liveRows=(await db.prepare("SELECT platform_key,attempted_at FROM social_post_attempts WHERE social_post_queue_id=? AND attempt_status IN ('api_posted','receipt_verified') ORDER BY social_post_attempt_id DESC LIMIT 101").bind(queueId).all()).results||[];
 const truncated=receipts.length>=100||liveRows.length>=101;
 return {post,platforms,consent,receipts,liveRows,truncated};
}
const safeResult=(o,expectedRevision)=>({ok:true,build:851,queue_id:o.post.social_post_queue_id,consent_gate:o.consent,platform_count:o.platforms.length,receipt_count:o.receipts.length,ledger_truncated:o.truncated,closure:scopedClosure851({consent:o.consent,platforms:o.platforms,deviceReceipts:latestDeviceWitnesses851(o.receipts),ackReceipt:o.receipts.find(r=>r.kind==='receiver_ack'),laterLiveReceipts:o.liveRows,expectedRevision,windowComplete:!o.truncated}),master_connection:'HOLD',publication_performed:false,provider_mutation_performed:false,master_events_emitted:0});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return reply(summary('Method not allowed.'),405);
 const admin=await getAdminUserFromRequest(request,env),db=getDb(env);
 if(!admin?.user_id)return reply(summary('Verified signed-in Devil n Dove admin required.'),401);
 if(!db)return reply(summary('Private D1 evidence ledger unavailable.'),503);
 if(request.method==='POST'&&request.headers.get('Origin')!==new URL(request.url).origin)return reply(summary('Same-origin owner submission required.'),403);
 const body=request.method==='POST'?await request.json().catch(()=>null):null;
 const queueId=positive(request.method==='POST'?body?.queue_id:new URL(request.url).searchParams.get('queue_id'));
 if(!queueId)return reply(summary('Exact original social queue ID required.'),400);
 try{
  await setup(db);
  const snapshot=await evidence(db,queueId);
  if(!snapshot)return reply(summary('Original source post not found.'),404);
  if(request.method==='GET')return reply(safeResult(snapshot,env?.CF_PAGES_COMMIT_SHA));
  if(snapshot.truncated||!snapshot.consent.ok)return reply({...summary('Current source evidence is incomplete or revoked-consent gate failed.'),blockers:snapshot.consent.blockers},409);
  const action=body?.action,record=body?.receipt,signature=body?.signature;
  if(!record||typeof record!=='object'||typeof signature!=='string')return reply(summary('Exact signed receipt required.'),400);
  if(action==='admit_device_witness'){
   const platform=record.platform,externalId=record.external_post_id;
   if(!valid(platform)||!snapshot.platforms.includes(platform))return reply(summary('Witness platform is not in the source platform manifest.'),409);
   const original=await db.prepare("SELECT social_post_attempt_id FROM social_post_attempts WHERE social_post_queue_id=? AND platform_key=? AND external_post_id=? AND attempt_status IN ('api_posted','receipt_verified') ORDER BY social_post_attempt_id DESC LIMIT 1").bind(queueId,platform,externalId).first();
   if(!original)return reply(summary('Original provider-published ID not found in the source ledger.'),409);
   const checked=await verifyDeviceWitness851(env,record,signature,{queueId,platform,externalId,ownerEmail:admin.email});
   if(!checked.ok)return reply(summary(checked.reason),409);
   const result=await db.prepare("INSERT OR IGNORE INTO social_recall_evidence_851 (queue_id,kind,platform,external_post_id,device_nonce,nonce,receipt_sha256,revision,observed_at,verifier_id,signed_verified,actor_user_id) VALUES (?,'device_witness',?,?,NULL,?,?,?,?,?,1,?)")
    .bind(queueId,platform,externalId,record.nonce,checked.sha256,record.revision,record.observed_at,record.verifier_id,admin.user_id).run();
   if(result?.meta?.changes!==1)return reply(summary('Duplicate witness nonce or uncertain durable insert.'),409);
  }else if(action==='admit_master_receiver_ack'){
   const device=snapshot.receipts.find(r=>r.kind==='device_witness'&&r.nonce===record.device_nonce);
   if(!device)return reply(summary('Exact independently verified original-device witness must already be durable.'),409);
   const deviceTime=Date.parse(device.observed_at||'');
   if(device.revision!==env?.CF_PAGES_COMMIT_SHA||!Number.isFinite(deviceTime)||deviceTime>Date.now()+300000||Date.now()-deviceTime>600000)return reply(summary('Original device receipt is stale or belongs to a different deployed revision.'),409);
   const checked=await verifyMasterAck851(env,record,signature,{queueId,deviceNonce:device.nonce,ownerEmail:admin.email});
   if(!checked.ok)return reply(summary(checked.reason),409);
   const result=await db.prepare("INSERT OR IGNORE INTO social_recall_evidence_851 (queue_id,kind,platform,external_post_id,device_nonce,nonce,receipt_sha256,revision,observed_at,verifier_id,signed_verified,actor_user_id) VALUES (?,'receiver_ack',NULL,NULL,?,?,?,?,?,?,1,?)")
    .bind(queueId,device.nonce,record.nonce,checked.sha256,record.revision,record.observed_at,record.verifier_id,admin.user_id).run();
   if(result?.meta?.changes!==1)return reply(summary('Duplicate receiver ACK nonce or uncertain durable insert.'),409);
  }else return reply(summary('Only independent device-witness and receiver-ACK admissions are supported.'),400);
  const after=await evidence(db,queueId);
  return reply({...safeResult(after,env?.CF_PAGES_COMMIT_SHA),receipt_recorded:true,contract:CONTRACT_851});
 }catch{return reply(summary('Private evidence verification failed; no acceptance can be inferred.'),503);}
}
