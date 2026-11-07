/* Build 621: independent original signatures can witness real immutable source data;
 * neither endpoint enrolls an authority, contacts providers or authorizes publication. */
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {sha256,trustedPins614} from '../_lib/trustAuthority614.js';
import {verifyMetaGrant620,scopesFingerprint620} from '../_lib/trustAuditMeta620.js';
import {metaReadOnlyPreflight619} from '../_lib/trustReconcile619.js';
import {FULL_ETSY_SQL_620} from './trust-audit-meta-620.js';
import {HOLD_621,digestFullHistory621,verifyHistoryCheckpoint621,
  verifyMetaWitness621} from '../_lib/trustHistory621.js';

const reply=(value,status=200)=>jsonResponse(value,status,{'Cache-Control':'no-store'});
const hold={build:621,release_gate:HOLD_621,connected:false,provider_write:false,
  publication:false,provider_called_by_this_endpoint:false,authority_enrolled_by_this_endpoint:false,
  d1_migration_performed:false,external_archive_readback_verified:false};
const unavailable={ok:false,...hold,error:'Independently reviewed D1 proposals 0052–0059 not available.'};
const HASH=/^[a-f0-9]{64}$/;
async function database(env){
  const db=getDb(env);if(!db)return null;
  try{for(const q of [
    'SELECT manifest_sha256 FROM dd621_etsy_history_checkpoints LIMIT 1',
    'SELECT acceptance_sha256 FROM dd621_meta_get_witness_acceptances LIMIT 1',
    'SELECT test_nonce FROM dd620_meta_test_outcomes LIMIT 1',
    'SELECT test_nonce FROM dd619_etsy_failure_custody LIMIT 1',
    'SELECT authority_id FROM dd616_key_quarantines LIMIT 1'])await db.prepare(q).all();
    return db;}catch{return null;}
}
const roots=(db,id)=>db.prepare(`SELECT a.authority_id,a.role,a.public_key,a.key_sha256,
  CASE WHEN EXISTS(SELECT 1 FROM dd616_key_quarantines q WHERE
    q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)
  THEN 'QUARANTINED' ELSE a.status END AS status
  FROM dd614_authorities a WHERE a.authority_id=? LIMIT 1`).bind(id).first();
const counts=db=>db.prepare(FULL_ETSY_SQL_620).first();
const ledger=db=>db.prepare(`SELECT event_hash,sequence FROM dd614_owner_decisions
  ORDER BY sequence DESC LIMIT 1`).first();
const readback=(db,id)=>db.prepare(`SELECT checkpoint_sha256,readback_sha256,
  ledger_head_sha256,ledger_sequence,custodian_id,original_issuer_source_sha256,status
  FROM dd617_external_readbacks WHERE checkpoint_sha256=?`).bind(id).first();
const metaSource=(db,id)=>db.prepare(`SELECT authority_id,original_source_sha256,status
  FROM dd620_meta_original_source_registrations WHERE authority_id=?`).bind(id).first();

export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const db=await database(c.env);if(!db)return reply(unavailable,503);
  try{
    const [registrations,connection,history,acceptances,receipts,failures]=await Promise.all([
      db.prepare(`SELECT authority_id,original_source_sha256,status,approved_at
        FROM dd620_meta_original_source_registrations ORDER BY approved_at DESC LIMIT 20`).all(),
      db.prepare(`SELECT provider_key,remote_subject_id,connection_status,scopes_json,
        access_expires_at FROM oauth_provider_connections WHERE provider_key='meta' LIMIT 1`).first(),
      db.prepare(`SELECT manifest_sha256,history_sha256,counts_sha256,checkpoint_sha256,
        status,created_at FROM dd621_etsy_history_checkpoints
        ORDER BY created_at DESC LIMIT 20`).all(),
      db.prepare(`SELECT acceptance_sha256,test_nonce,grant_id,receipt_sha256,
        history_manifest_sha256,status,created_at FROM dd621_meta_get_witness_acceptances
        ORDER BY created_at DESC LIMIT 20`).all(),
      db.prepare(`SELECT o.test_nonce,o.remote_page_id,o.receipt_sha256,o.status,
        a.grant_id,g.issuer_authority_id,g.checkpoint_sha256
        FROM dd620_meta_test_outcomes o
        JOIN dd620_meta_test_attempts a ON a.test_nonce=o.test_nonce
        JOIN dd620_meta_read_grants g ON g.grant_id=a.grant_id
        ORDER BY o.created_at DESC LIMIT 20`).all(),
      db.prepare(`SELECT test_nonce,failure_code,status FROM dd620_meta_test_failures
        ORDER BY created_at DESC LIMIT 20`).all()]);
    const result={ok:true,...hold,
      meta_original_enrollment_handoff:{read_only:true,
        original_sources:registrations.results||[],
        saved_meta_capability:metaReadOnlyPreflight619(connection),
        verified_page_id:connection?.remote_subject_id||null,
        next_operator_action:'Independent original Meta issuer verifies external pins and source custody; separate owner and witness authorize a single fixed Page GET.'},
      signed_history_checkpoints:history.results||[],
      actual_meta_get_receipts:receipts.results||[],
      spent_or_failed_meta_attempts:failures.results||[],
      independently_witnessed_meta_receipts:acceptances.results||[],
      source_history_scanned_by_this_get:false,
      signed_history_requires_original_issuer_witness_owner:true,
      meta_receipt_requires_existing_real_get:true};
    if(new URL(c.request.url).searchParams.get('full_history')==='1'){
      const [snapshot,fullCounts,head]=await Promise.all([
        digestFullHistory621(db),counts(db),ledger(db)]);
      result.full_source_snapshot={...snapshot,counts_sha256:
        await sha256(JSON.stringify(fullCounts)),
        counts:fullCounts,ledger_head_sha256:head?.event_hash||null,
        ledger_sequence:head?.sequence??null,
        externally_signed:false,externally_archived:false};
    }
    return reply(result);
  }catch{return reply({...unavailable,error:'Exact complete history or original Meta authority readback failed; HOLD.'},503);}
}
export async function onRequestPost(c){
  const admin=await getAdminUserFromRequest(c.request,c.env);
  if(!admin)return reply({ok:false,error:'Admin session required.'},401);
  if(c.request.headers.get('origin')!==new URL(c.request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(c.request.headers.get('content-type')||''))
    return reply({ok:false,error:'Same-origin JSON required.'},403);
  const db=await database(c.env);if(!db)return reply(unavailable,503);
  if(Number(c.request.headers.get('content-length')||0)>14000)
    return reply({ok:false,...hold,error:'Signed bundle exceeds safe bound.'},413);
  let body;try{body=await c.request.json();}catch{
    return reply({ok:false,...hold,error:'Invalid JSON.'},400);}
  if(!body||Array.isArray(body)||typeof body!=='object'||
    JSON.stringify(body).length>14000||
    !['witness_complete_etsy_history','accept_actual_meta_page_get'].includes(body.action)||
    !body.signed_bundle||typeof body.signed_bundle!=='object')
    return reply({ok:false,...hold,error:'External signed exact-scope evidence required.'},400);
  const step=await requireAdminStepUp(c.request,c.env,admin,body,
    'independently signed immutable evidence intake');
  if(!step.ok)return step.response;
  try{
    const signed=body.signed_bundle,p=signed.payload;
    if(body.action==='witness_complete_etsy_history'){
      if(!HASH.test(p?.checkpoint_sha256))throw Error('Missing real external checkpoint.');
      const issuer=signed.signatures?.find(s=>s?.role==='ISSUER')?.authority_id;
      if(typeof issuer!=='string')throw Error('Missing external original issuer.');
      const [snapshot,fullCounts,head,checkpoint,source]=await Promise.all([
        digestFullHistory621(db),counts(db),ledger(db),
        readback(db,p.checkpoint_sha256),
        db.prepare(`SELECT authority_id,original_source_sha256,status
          FROM dd618_original_source_registrations WHERE authority_id=? AND provider='ETSY'`).bind(issuer).first()]);
      const custodian=checkpoint?await db.prepare(`SELECT custodian_id,origin,status
        FROM dd617_anchor_custodians WHERE custodian_id=?`).bind(checkpoint.custodian_id).first():null;
      const proven=await verifyHistoryCheckpoint621(signed,{snapshot,counts:fullCounts,
        ledger:head,checkpoint,custodian,originalSource:source,
        roots:id=>roots(db,id),pins:trustedPins614(c.env)});
      const r=await db.prepare(`INSERT INTO dd621_etsy_history_checkpoints
        (manifest_sha256,history_sha256,counts_sha256,checkpoint_sha256,
        original_source_sha256,external_receipt_sha256,external_custody_ref,
        signed_bundle_json,status,created_by)
        VALUES (?,?,?,?,?,?,?,?,'ORIGINAL_HISTORY_SIGNED_EXTERNAL_ARCHIVE_READBACK_PENDING',?)`).bind(
        proven.manifest_sha256,p.history_sha256,p.counts_sha256,p.checkpoint_sha256,
        p.original_source_sha256,p.external_receipt_sha256,p.external_custody_ref,
        JSON.stringify(signed),admin.user_id).run();
      if(r.meta?.changes!==1)throw Error('History signature not saved.');
      return reply({ok:true,...hold,...proven,all_history_rows_hashed:true,
        original_external_receipt_bound:true},201);
    }
    if(!HASH.test(p?.checkpoint_sha256)||!HASH.test(p?.etsy_history_sha256))
      throw Error('Missing separately witnessed original Meta TEST evidence.');
    const [grant,attempt,receipt,failure,history,connection,head,checkpoint]=await Promise.all([
      db.prepare(`SELECT grant_id,issuer_authority_id,original_source_sha256,
        checkpoint_sha256,expected_page_id,scopes_sha256,test_nonce,approval_sha256,
        signed_bundle_json,status FROM dd620_meta_read_grants WHERE grant_id=?`).bind(p.grant_id).first(),
      db.prepare(`SELECT test_nonce,grant_id,status FROM dd620_meta_test_attempts
        WHERE test_nonce=?`).bind(p.test_nonce).first(),
      db.prepare(`SELECT test_nonce,remote_page_id,receipt_sha256,status FROM dd620_meta_test_outcomes
        WHERE test_nonce=?`).bind(p.test_nonce).first(),
      db.prepare(`SELECT test_nonce FROM dd620_meta_test_failures WHERE test_nonce=?`).bind(p.test_nonce).first(),
      db.prepare(`SELECT manifest_sha256,history_sha256,checkpoint_sha256,status FROM dd621_etsy_history_checkpoints
        WHERE history_sha256=? ORDER BY created_at DESC LIMIT 1`).bind(p.etsy_history_sha256).first(),
      db.prepare(`SELECT provider_key,remote_subject_id,connection_status,scopes_json,access_expires_at
        FROM oauth_provider_connections WHERE provider_key='meta' LIMIT 1`).first(),
      ledger(db),readback(db,p.checkpoint_sha256)]);
    if(!grant||!checkpoint||!head||head.event_hash!==checkpoint.ledger_head_sha256||
      head.sequence!==checkpoint.ledger_sequence||
      !metaReadOnlyPreflight619(connection).facebook_page_read_candidate||
      connection.remote_subject_id!==p.expected_page_id)
      throw Error('Original approved active Meta connection changed.');
    const source=await metaSource(db,grant.issuer_authority_id);
    const grantBundle=JSON.parse(grant.signed_bundle_json);
    const providerProof=await verifyMetaGrant620(grantBundle,{grant,originalSource:source,
      checkpoint,roots:id=>roots(db,id),pins:trustedPins614(c.env),
      now:grantBundle.payload.issued_at});
    let scopes;try{scopes=JSON.parse(connection.scopes_json);}catch{
      throw Error('Original approved Meta scopes not decodable.');}
    if(await scopesFingerprint620(scopes)!==grant.scopes_sha256||
      providerProof.page_id!==p.expected_page_id)
      throw Error('Meta scopes or Page identity changed.');
    const currentHistory=await digestFullHistory621(db);
    if(currentHistory.history_sha256!==p.etsy_history_sha256)
      throw Error('Signed all-row Etsy history is stale.');
    const proven=await verifyMetaWitness621(signed,{grant,attempt,receipt,failure,
      history,metaSource:source,roots:id=>roots(db,id),pins:trustedPins614(c.env)});
    const r=await db.prepare(`INSERT INTO dd621_meta_get_witness_acceptances
      (acceptance_sha256,test_nonce,grant_id,receipt_sha256,history_manifest_sha256,
      signed_bundle_json,status,created_by)
      VALUES (?,?,?,?,?,?,'WITNESSED_ONE_META_PAGE_ID_GET_NO_CONNECTED_CLAIM',?)`).bind(
      proven.acceptance_sha256,p.test_nonce,p.grant_id,p.receipt_sha256,
      history.manifest_sha256,JSON.stringify(signed),admin.user_id).run();
    if(r.meta?.changes!==1)throw Error('Original Meta witness not saved.');
    return reply({ok:true,...hold,...proven,real_saved_receipt_required:true},201);
  }catch(error){
    if(/UNIQUE constraint|constraint failed/i.test(String(error)))
      return reply({ok:false,...hold,error:'An immutable exact checkpoint or Meta witness receipt is already recorded.'},409);
    return reply({ok:false,...hold,error:'Original issuer, independent witness, owner, full source history or genuine provider TEST evidence missing or mismatched.'},422);
  }
}
