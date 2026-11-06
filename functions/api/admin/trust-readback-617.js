import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {trustedPins614} from '../_lib/trustAuthority614.js';
import {auditLedger615} from '../_lib/trustCeremony615.js';
import {HOLD_617,fetchExternalReadback617,verifyRecoveryPacket617,
  verifyTestPreflight617} from '../_lib/trustReadback617.js';

const reply=(value,status=200)=>jsonResponse(value,status,{'Cache-Control':'no-store'});
const hold={build:617,release_gate:HOLD_617,original_issuer_authenticated:false,
  authority_activated:false,provider_test_executed:false,provider_action_authorized:false};
const blocked={ok:false,...hold,
  error:'Proposed 0052–0055 trust tables and independent original authority are not installed.'};
const ledgerQuery=`SELECT sequence,event_hash,previous_hash,proof_summary_json,
  case_pin,channel,account_id,product_ref,exact_action,source_sha256,owner_decision,owner_nonce
  FROM dd614_owner_decisions ORDER BY sequence ASC LIMIT 501`;
async function database(c){
  const db=getDb(c.env);if(!db)return null;
  try{
    for(const q of ['SELECT authority_id FROM dd614_authorities LIMIT 1',
      'SELECT receipt_id FROM dd615_custody_readbacks LIMIT 1',
      'SELECT authority_id FROM dd616_key_quarantines LIMIT 1',
      'SELECT checkpoint_sha256 FROM dd616_checkpoint_receipts LIMIT 1',
      'SELECT custodian_id FROM dd617_anchor_custodians LIMIT 1',
      'SELECT checkpoint_sha256 FROM dd617_external_readbacks LIMIT 1',
      'SELECT recovery_sha256 FROM dd617_quarantine_recovery_packets LIMIT 1',
      'SELECT preflight_sha256 FROM dd617_witnessed_test_preflights LIMIT 1']){
      await db.prepare(q).all();
    }
    return db;
  }catch{return null;}
}
const authority=(db,id)=>db.prepare(`SELECT a.authority_id,a.role,a.public_key,a.key_sha256,
  CASE WHEN EXISTS(SELECT 1 FROM dd616_key_quarantines q
    WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)
  THEN 'QUARANTINED' ELSE a.status END AS status
  FROM dd614_authorities a WHERE a.authority_id=? LIMIT 1`).bind(id).first();
const readback=(db,id)=>db.prepare(`SELECT checkpoint_sha256,readback_sha256,
  ledger_head_sha256,ledger_sequence,custodian_id,original_issuer_source_sha256,status
  FROM dd617_external_readbacks WHERE checkpoint_sha256=? LIMIT 1`).bind(id).first();
async function ledger(db){
  const rows=(await db.prepare(ledgerQuery).all()).results||[];
  if(rows.length>500)throw Error('Ledger exceeds bounded complete audit; independent paging required.');
  const audit=await auditLedger615(rows);
  if(!audit.chain_consistent)throw Error('Decision ledger integrity is not proven.');
  return {rows,audit};
}
export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const db=await database(c);if(!db)return reply(blocked,503);
  try{
    const {audit}=await ledger(db);
    const custodians=(await db.prepare(`SELECT custodian_id,origin,approval_sha256,status,
      approved_at FROM dd617_anchor_custodians ORDER BY approved_at DESC LIMIT 30`).all()).results||[];
    const anchors=(await db.prepare(`SELECT checkpoint_sha256,readback_sha256,
      ledger_head_sha256,ledger_sequence,custodian_id,status,created_at
      FROM dd617_external_readbacks ORDER BY created_at DESC LIMIT 30`).all()).results||[];
    const recovery=(await db.prepare(`SELECT recovery_sha256,quarantined_authority_id,
      replacement_authority_id,checkpoint_sha256,status,created_at
      FROM dd617_quarantine_recovery_packets ORDER BY created_at DESC LIMIT 30`).all()).results||[];
    const preflights=(await db.prepare(`SELECT preflight_sha256,issuer_authority_id,
      checkpoint_sha256,status,created_at FROM dd617_witnessed_test_preflights
      ORDER BY created_at DESC LIMIT 30`).all()).results||[];
    return reply({ok:true,...hold,ledger_audit:audit,approved_custodians:custodians,
      external_readbacks:anchors,recovery_packets:recovery,test_preflights:preflights,
      current_ledger_external_bytes_witnessed:anchors.some(x=>
        x.ledger_head_sha256===audit.head_hash&&x.ledger_sequence===audit.rows_reviewed),
      all_provider_tests_still_require_separate_original_custody:true});
  }catch{return reply({...blocked,error:'Full local decision ledger audit failed.'},503);}
}
export async function onRequestPost(c){
  const request=c.request,admin=await getAdminUserFromRequest(request,c.env);
  if(!admin)return reply({ok:false,error:'Admin session required.'},401);
  if(request.headers.get('origin')!==new URL(request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reply({ok:false,error:'Same-origin JSON required.'},403);
  const db=await database(c);if(!db)return reply(blocked,503);
  if(Number(request.headers.get('content-length')||0)>20000)
    return reply({ok:false,error:'Bounded JSON required.'},413);
  let body;try{body=await request.json();}catch{return reply({ok:false,error:'Invalid JSON.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>20000)
    return reply({ok:false,error:'Invalid bounded JSON.'},400);
  const step=await requireAdminStepUp(request,c.env,admin,body,'external custody readback or witnessed TEST preflight');
  if(!step.ok)return step.response;
  try{
    if(body.action==='read_external_anchor'){
      if(typeof body.checkpoint_sha256!=='string'||!/^[0-9a-f]{64}$/.test(body.checkpoint_sha256))
        return reply({ok:false,...hold,error:'Exact checkpoint SHA-256 required.'},400);
      const checkpoint=await db.prepare(`SELECT checkpoint_sha256,ledger_head_sha256,
        ledger_sequence,signed_bundle_json,status FROM dd616_checkpoint_receipts
        WHERE checkpoint_sha256=? LIMIT 1`).bind(body.checkpoint_sha256).first();
      if(!checkpoint)throw Error('No signed checkpoint to read back.');
      const original=JSON.parse(checkpoint.signed_bundle_json);
      const origin=new URL(original.payload.external_custody_ref).origin;
      const custodian=await db.prepare(`SELECT custodian_id,origin,approval_sha256,status
        FROM dd617_anchor_custodians WHERE origin=? AND status='INDEPENDENTLY_APPROVED'
        LIMIT 1`).bind(origin).first();
      const {rows}=await ledger(db);
      const prefix=rows.slice(0,Number(checkpoint.ledger_sequence));
      if(prefix.length!==Number(checkpoint.ledger_sequence)||
        !(await auditLedger615(prefix)).chain_consistent||
        prefix.at(-1)?.event_hash!==checkpoint.ledger_head_sha256)
        throw Error('Original signed ledger prefix no longer matches checkpoint.');
      const verified=await fetchExternalReadback617({checkpoint,custodian,
        authority:id=>authority(db,id),pins:trustedPins614(c.env)});
      const result=await db.prepare(`INSERT INTO dd617_external_readbacks
        (checkpoint_sha256,readback_sha256,ledger_head_sha256,ledger_sequence,
        custodian_id,original_issuer_source_sha256,signer_ids_json,status,created_by)
        SELECT ?,?,?,?,?,?,?,'EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING',?
        WHERE (SELECT event_hash FROM dd614_owner_decisions WHERE sequence=?)=?`).bind(
        verified.checkpoint_sha256,verified.readback_sha256,verified.ledger_head_sha256,
        verified.ledger_sequence,verified.custodian_id,
        verified.original_issuer_source_sha256,JSON.stringify(verified.signer_ids),
        admin.user_id,verified.ledger_sequence,verified.ledger_head_sha256).run();
      if(result.meta?.changes!==1)throw Error('Original ledger anchor changed during readback.');
      return reply({ok:true,...hold,...verified},201);
    }
    if(body.action==='stage_recovery_packet'){
      const p=body.packet?.payload;
      if(!p||typeof p.quarantined_authority_id!=='string'||
        typeof p.replacement_authority_id!=='string'||typeof p.checkpoint_sha256!=='string')
        throw Error('Exact recovery scope required.');
      const quarantine=await db.prepare(`SELECT authority_id,key_sha256
        FROM dd616_key_quarantines WHERE authority_id=? LIMIT 1`).bind(p.quarantined_authority_id).first();
      const replacement=await authority(db,p.replacement_authority_id);
      const verified=await verifyRecoveryPacket617(body.packet,{quarantine,replacement,
        readback:await readback(db,p.checkpoint_sha256),
        authority:id=>authority(db,id),pins:trustedPins614(c.env)});
      const result=await db.prepare(`INSERT INTO dd617_quarantine_recovery_packets
        (recovery_sha256,quarantined_authority_id,replacement_authority_id,
        checkpoint_sha256,signed_bundle_json,status,created_by)
        SELECT ?,?,?,?,?,'PENDING_ORIGINAL_ISSUER_AND_OWNER_RECOVERY_APPROVAL',?
        WHERE EXISTS(SELECT 1 FROM dd616_key_quarantines WHERE authority_id=? AND key_sha256=?)
        AND NOT EXISTS(SELECT 1 FROM dd616_key_quarantines
          WHERE authority_id=? OR key_sha256=?)`).bind(verified.recovery_sha256,
        verified.quarantined_authority_id,verified.replacement_authority_id,
        verified.checkpoint_sha256,JSON.stringify(body.packet),admin.user_id,
        p.quarantined_authority_id,p.quarantined_key_sha256,
        p.replacement_authority_id,p.replacement_key_sha256).run();
      if(result.meta?.changes!==1)throw Error('Quarantine/rotation review changed.');
      return reply({ok:true,...hold,...verified},201);
    }
    if(body.action==='preflight_witnessed_test'){
      const p=body.preflight?.payload;
      if(!p||typeof p.checkpoint_sha256!=='string'||typeof p.issuer_authority_id!=='string')
        throw Error('Exact provider TEST scope required.');
      const {audit}=await ledger(db),read=await readback(db,p.checkpoint_sha256);
      const issuer=await authority(db,p.issuer_authority_id);
      const custody=await db.prepare(`SELECT receipt_id FROM dd615_custody_readbacks
        WHERE authority_id=? AND original_source_sha256=?
        AND status='EXTERNALLY_AUTHENTICATED' LIMIT 1`).bind(
        p.issuer_authority_id,read?.original_issuer_source_sha256||'').first();
      const verified=await verifyTestPreflight617(body.preflight,{issuer,readback:read,
        ledgerHead:audit.head_hash,ledgerSequence:audit.rows_reviewed,
        originalCustodyAuthenticated:!!custody,authority:id=>authority(db,id),
        pins:trustedPins614(c.env)});
      const result=await db.prepare(`INSERT INTO dd617_witnessed_test_preflights
        (preflight_sha256,issuer_authority_id,checkpoint_sha256,
        exact_scope_json,signed_bundle_json,status,created_by)
        SELECT ?,?,?,?,?,'PENDING_FINAL_OWNER_SUPERVISED_TEST_APPROVAL',?
        WHERE (SELECT event_hash FROM dd614_owner_decisions ORDER BY sequence DESC LIMIT 1)=?
        AND (SELECT MAX(sequence) FROM dd614_owner_decisions)=?
        AND NOT EXISTS(SELECT 1 FROM dd616_key_quarantines
          WHERE authority_id=? OR key_sha256=?)`).bind(
        verified.preflight_sha256,verified.issuer_authority_id,verified.checkpoint_sha256,
        JSON.stringify(verified.exact_scope),JSON.stringify(body.preflight),admin.user_id,
        audit.head_hash,audit.rows_reviewed,issuer.authority_id,issuer.key_sha256).run();
      if(result.meta?.changes!==1)throw Error('Ledger or original issuer changed during preflight.');
      return reply({ok:true,...hold,...verified},201);
    }
    return reply({ok:false,...hold,error:'Unknown or unsafe external custody action.'},400);
  }catch(e){
    if(/UNIQUE constraint|constraint failed/i.test(String(e)))return reply({ok:false,...hold,
      error:'Duplicate immutable custody/TEST receipt; independently inspect before retry.'},409);
    return reply({ok:false,...hold,
      error:'Independent source, ledger, signed custody or scoped owner/witness proof not verified.',
      detail_code:'BUILD617_EXTERNAL_ORIGINAL_TRUST_HOLD'},422);
  }
}
