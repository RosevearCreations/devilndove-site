import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {HOLD_615,custodyCandidate615,verifyCeremony615,auditLedger615}
  from '../_lib/trustCeremony615.js';
import {trustedPins614} from '../_lib/trustAuthority614.js';

const response=(payload,status=200)=>jsonResponse(payload,status,{'Cache-Control':'no-store'});
const blocked={ok:false,build:615,release_gate:HOLD_615,
  error:'Separately approved authority/custody schema and original evidence are not installed.',
  authority_activated:false,provider_action_authorized:false};
const authority=(db,id)=>db.prepare(
  `SELECT a.authority_id,a.role,a.public_key,a.key_sha256,
   CASE WHEN EXISTS(SELECT 1 FROM dd616_key_quarantines q
     WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)
   THEN 'QUARANTINED' ELSE a.status END AS status
   FROM dd614_authorities a WHERE a.authority_id=?`
).bind(id).first();
const custody=(db,id)=>db.prepare(
  'SELECT receipt_id,authority_id,original_source_sha256,original_receipt_sha256,witness_authority_id,owner_authority_id,status FROM dd615_custody_readbacks WHERE receipt_id=?'
).bind(id).first();
async function database(c){
  const db=getDb(c.env);if(!db)return null;
  try{
    await db.prepare('SELECT authority_id FROM dd614_authorities LIMIT 1').all();
    await db.prepare('SELECT event_hash FROM dd614_owner_decisions LIMIT 1').all();
    await db.prepare('SELECT receipt_id FROM dd615_custody_readbacks LIMIT 1').all();
    await db.prepare('SELECT ceremony_hash FROM dd615_activation_ceremonies LIMIT 1').all();
    await db.prepare('SELECT authority_id FROM dd616_key_quarantines LIMIT 1').all();
    return db;
  }catch{return null;}
}
const readLedger=db=>db.prepare(
  'SELECT sequence,event_hash,previous_hash,proof_summary_json,case_pin,channel,account_id,product_ref,exact_action,source_sha256,owner_decision,owner_nonce FROM dd614_owner_decisions ORDER BY sequence ASC LIMIT 501'
).all();
export async function onRequestGet(c){
  const admin=await getAdminUserFromRequest(c.request,c.env);
  if(!admin)return response({ok:false,error:'Admin session required.'},401);
  const db=await database(c);
  if(!db)return response(blocked,503);
  try{
    const rows=(await readLedger(db)).results||[];
    if(rows.length>500)return response({...blocked,
      error:'More than 500 ledger events: complete paginated audit required before any decision.'},503);
    const anchor=String(c.env.DND_615_LEDGER_EXTERNAL_ANCHOR||'');
    const ledger=await auditLedger615(rows,{anchor});
    const custodyRows=(await db.prepare(
      'SELECT receipt_id,authority_id,original_source_sha256,original_receipt_sha256,witness_authority_id,owner_authority_id,status,observed_at,created_at FROM dd615_custody_readbacks ORDER BY created_at DESC LIMIT 30'
    ).all()).results||[];
    const ceremonies=(await db.prepare(
      'SELECT ceremony_hash,authority_id,custody_receipt_id,status,created_at FROM dd615_activation_ceremonies ORDER BY created_at DESC LIMIT 30'
    ).all()).results||[];
    return response({ok:true,build:615,ledger_audit:ledger,custody_readbacks:custodyRows,
      activation_ceremonies:ceremonies,authority_activated:false,
      original_provider_live_readback_performed:false,provider_action_authorized:false,
      release_gate:HOLD_615});
  }catch{return response({...blocked,error:'Independent ledger readback incomplete or unavailable.'},503);}
}
export async function onRequestPost(c){
  const request=c.request;
  const admin=await getAdminUserFromRequest(request,c.env);
  if(!admin)return response({ok:false,error:'Admin session required.'},401);
  if(request.headers.get('origin')!==new URL(request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return response({ok:false,error:'Same-origin JSON request required.'},403);
  const db=await database(c);
  if(!db)return response(blocked,503);
  if(Number(request.headers.get('content-length')||0)>18000)
    return response({ok:false,error:'Request too large.'},413);
  let body;
  try{body=await request.json();}catch{return response({ok:false,error:'Invalid JSON.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||
    JSON.stringify(body).length>18000)return response({ok:false,error:'Invalid bounded request.'},400);
  const step=await requireAdminStepUp(request,c.env,admin,body,'external authority ceremony');
  if(!step.ok)return step.response;
  try{
    if(body.action==='stage_original_custody'){
      const row=custodyCandidate615(body.candidate);
      const candidate=await authority(db,row.authority_id);
      if(!candidate||candidate.status!=='PENDING_EXTERNAL_VERIFICATION')
        return response({...blocked,error:'Existing pending original authority candidate required.'},422);
      await db.prepare(`INSERT INTO dd615_custody_readbacks
        (receipt_id,authority_id,original_source_ref,original_source_sha256,
        original_receipt_sha256,witness_authority_id,owner_authority_id,
        observed_at,status,created_by)
        VALUES (?,?,?,?,?,?,?,?,'PENDING_EXTERNAL_AUTHENTICATION',?)`).bind(
        row.receipt_id,row.authority_id,row.original_source_ref,row.original_source_sha256,
        row.original_receipt_sha256,row.witness_authority_id,row.owner_authority_id,
        row.observed_at,admin.user_id).run();
      return response({ok:true,receipt_id:row.receipt_id,
        status:'PENDING_EXTERNAL_AUTHENTICATION',original_custody_authenticated:false,
        authority_activated:false,provider_action_authorized:false,release_gate:HOLD_615},201);
    }
    if(body.action==='verify_activation_ceremony'){
      const pins=trustedPins614(c.env);
      const proof=await verifyCeremony615(body.ceremony,{
        authority:id=>authority(db,id),readback:id=>custody(db,id),pins});
      const ceremonyHash=proof.challenge_sha256;
      await db.prepare(`INSERT INTO dd615_activation_ceremonies
        (ceremony_hash,authority_id,custody_receipt_id,original_source_sha256,
        proof_bundle_json,status,created_by)
        VALUES (?,?,?,?,?,'READY_FOR_SEPARATE_CONTROLLED_APPROVAL',?)`).bind(
        ceremonyHash,proof.authority_id,proof.custody_receipt_id,
        proof.original_source_sha256,JSON.stringify(body.ceremony),admin.user_id).run();
      return response({ok:true,...proof,ceremony_hash:ceremonyHash,
        authority_activated:false,provider_action_authorized:false},201);
    }
    return response({ok:false,error:'Unknown or unsafe ceremony action.'},400);
  }catch(e){
    if(/UNIQUE constraint|constraint failed/i.test(String(e)))return response(
      {ok:false,error:'Duplicate original receipt or activation ceremony; review before retry.',
      release_gate:HOLD_615},409);
    return response({ok:false,error:'Original issuer, independent custody or signature verification failed.',
      detail_code:'CEREMONY_NOT_INDEPENDENTLY_VERIFIED',release_gate:HOLD_615,
      authority_activated:false,provider_action_authorized:false},422);
  }
}
