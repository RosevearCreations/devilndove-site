import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {trustedPins614} from '../_lib/trustAuthority614.js';
import {auditLedger615} from '../_lib/trustCeremony615.js';
import {HOLD_616,verifyCheckpoint616,verifyRotation616,quarantineCandidate616,
  recoveryDrill616} from '../_lib/trustCheckpoint616.js';

const reply=(value,status=200)=>jsonResponse(value,status,{'Cache-Control':'no-store'});
const hold={build:616,release_gate:HOLD_616,authority_activated:false,
  external_readback_verified:false,provider_action_authorized:false};
const unavailable={ok:false,...hold,error:'Independently approved 0052-0054 D1 trust tables are not installed.'};
const ledgerQuery=`SELECT sequence,event_hash,previous_hash,proof_summary_json,
  case_pin,channel,account_id,product_ref,exact_action,source_sha256,owner_decision,owner_nonce
  FROM dd614_owner_decisions ORDER BY sequence ASC LIMIT 501`;
async function database(c){
  const db=getDb(c.env);if(!db)return null;
  try{
    await db.prepare('SELECT event_hash FROM dd614_owner_decisions LIMIT 1').all();
    await db.prepare('SELECT authority_id FROM dd614_authorities LIMIT 1').all();
    await db.prepare('SELECT receipt_id FROM dd615_custody_readbacks LIMIT 1').all();
    await db.prepare('SELECT authority_id FROM dd616_key_quarantines LIMIT 1').all();
    await db.prepare('SELECT checkpoint_sha256 FROM dd616_checkpoint_receipts LIMIT 1').all();
    await db.prepare('SELECT rotation_sha256 FROM dd616_rotation_candidates LIMIT 1').all();
    return db;
  }catch{return null;}
}
const authority=(db,id)=>db.prepare(`SELECT a.authority_id,a.role,a.public_key,a.key_sha256,
  CASE WHEN EXISTS(SELECT 1 FROM dd616_key_quarantines q
  WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)
  THEN 'QUARANTINED' ELSE a.status END AS status
  FROM dd614_authorities a WHERE a.authority_id=? LIMIT 1`).bind(id).first();
async function readAudit(db){
  const rows=(await db.prepare(ledgerQuery).all()).results||[];
  if(rows.length>500)throw Error('Complete ledger exceeds 500-row bounded audit.');
  return {rows,audit:await auditLedger615(rows)};
}
export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const db=await database(c);if(!db)return reply(unavailable,503);
  try{
    const {audit}=await readAudit(db);
    const quarantines=(await db.prepare(`SELECT authority_id,key_sha256,reason,evidence_sha256,
      created_at FROM dd616_key_quarantines ORDER BY created_at DESC LIMIT 50`).all()).results||[];
    const checkpoints=(await db.prepare(`SELECT checkpoint_sha256,ledger_head_sha256,
      ledger_sequence,status,created_at FROM dd616_checkpoint_receipts
      ORDER BY created_at DESC LIMIT 30`).all()).results||[];
    const rotations=(await db.prepare(`SELECT rotation_sha256,old_authority_id,
      new_authority_id,status,created_at FROM dd616_rotation_candidates
      ORDER BY created_at DESC LIMIT 30`).all()).results||[];
    return reply({ok:true,...hold,ledger_audit:audit,quarantines,checkpoints,rotations,
      independently_anchored:false,
      recovery_drill:recoveryDrill616({chain_consistent:audit.chain_consistent,
        checkpoint_verified:false,any_key_quarantined:quarantines.length>0,
        original_custody_verified:false})});
  }catch{return reply({...unavailable,error:'Ledger exceeds bounded verification or full readback failed.'},503);}
}
export async function onRequestPost(c){
  const request=c.request,admin=await getAdminUserFromRequest(request,c.env);
  if(!admin)return reply({ok:false,error:'Admin session required.'},401);
  if(request.headers.get('origin')!==new URL(request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reply({ok:false,error:'Same-origin JSON required.'},403);
  const db=await database(c);if(!db)return reply(unavailable,503);
  if(Number(request.headers.get('content-length')||0)>20000)
    return reply({ok:false,error:'Bounded JSON only.'},413);
  let body;try{body=await request.json();}catch{return reply({ok:false,error:'Invalid JSON.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>20000)
    return reply({ok:false,error:'Invalid bounded input.'},400);
  const step=await requireAdminStepUp(request,c.env,admin,body,'external checkpoint or key custody');
  if(!step.ok)return step.response;
  try{
    if(body.action==='quarantine_key'){
      const row=quarantineCandidate616(body.candidate);
      const existing=await db.prepare(`SELECT authority_id,key_sha256
        FROM dd614_authorities WHERE authority_id=? LIMIT 1`).bind(row.authority_id).first();
      if(!existing||existing.key_sha256!==row.key_sha256)
        return reply({ok:false,...hold,error:'Key identity/fingerprint mismatch.'},422);
      await db.prepare(`INSERT INTO dd616_key_quarantines
        (authority_id,key_sha256,reason,evidence_ref,evidence_sha256,created_by)
        VALUES (?,?,?,?,?,?)`).bind(row.authority_id,row.key_sha256,row.reason,
        row.evidence_ref,row.evidence_sha256,admin.user_id).run();
      return reply({ok:true,...hold,status:'IRREVERSIBLE_PROTECTIVE_KEY_QUARANTINE',
        authority_id:row.authority_id,key_sha256:row.key_sha256,
        independent_rotation_still_required:true},201);
    }
    if(body.action==='record_signed_checkpoint'){
      const {rows}=await readAudit(db);
      const verified=await verifyCheckpoint616(body.checkpoint,{ledgerRows:rows,
        authority:id=>authority(db,id),pins:trustedPins614(c.env)});
      const result=await db.prepare(`INSERT INTO dd616_checkpoint_receipts
        (checkpoint_sha256,ledger_head_sha256,ledger_sequence,signed_bundle_json,status,created_by)
        SELECT ?,?,?,?,'SIGNED_PENDING_EXTERNAL_READBACK',?
        WHERE (SELECT event_hash FROM dd614_owner_decisions ORDER BY sequence DESC LIMIT 1)=?
        AND (SELECT MAX(sequence) FROM dd614_owner_decisions)=?`).bind(
        verified.checkpoint_sha256,verified.ledger_head_sha256,verified.ledger_sequence,
        JSON.stringify(body.checkpoint),admin.user_id,verified.ledger_head_sha256,
        verified.ledger_sequence).run();
      if(result.meta?.changes!==1)throw Error('Ledger head moved; signed checkpoint rejected.');
      return reply({ok:true,...hold,...verified},201);
    }
    if(body.action==='stage_rotation'){
      const verified=await verifyRotation616(body.rotation,{authority:id=>authority(db,id),
        pins:trustedPins614(c.env)});
      const result=await db.prepare(`INSERT INTO dd616_rotation_candidates
        (rotation_sha256,old_authority_id,new_authority_id,original_source_sha256,
        signed_bundle_json,status,created_by)
        SELECT ?,?,?,?,?,'PENDING_INDEPENDENT_ROTATION_APPROVAL',?
        WHERE NOT EXISTS(SELECT 1 FROM dd616_key_quarantines
          WHERE authority_id IN (?,?) OR key_sha256 IN (?,?))`).bind(verified.rotation_sha256,
        verified.old_authority_id,verified.new_authority_id,
        verified.original_source_sha256,JSON.stringify(body.rotation),admin.user_id,
        verified.old_authority_id,verified.new_authority_id,
        body.rotation.payload.old_key_sha256,body.rotation.payload.new_key_sha256).run();
      if(result.meta?.changes!==1)throw Error('Rotation signer quarantined during review.');
      return reply({ok:true,...hold,...verified},201);
    }
    if(body.action==='run_recovery_drill'){
      const {audit}=await readAudit(db);
      const quarantine=(await db.prepare('SELECT authority_id FROM dd616_key_quarantines LIMIT 1').first());
      return reply({ok:true,...hold,drill:recoveryDrill616({
        chain_consistent:audit.chain_consistent,checkpoint_verified:false,
        any_key_quarantined:!!quarantine,original_custody_verified:false})});
    }
    return reply({ok:false,...hold,error:'Unknown or unsafe action.'},400);
  }catch(e){
    if(/UNIQUE constraint|constraint failed/i.test(String(e)))return reply(
      {ok:false,...hold,error:'Duplicate immutable receipt or key quarantine; review before retry.'},409);
    return reply({ok:false,...hold,error:'Key, external signature, ledger or recovery evidence rejected.',
      detail_code:'BUILD616_EXTERNAL_TRUST_HOLD'},422);
  }
}
