import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {trustedPins614} from '../_lib/trustAuthority614.js';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {metaReadOnlyPreflight619} from '../_lib/trustReconcile619.js';
import {HOLD_620,projectFullEtsyHistory620,scopesFingerprint620,
  verifyMetaGrant620,probeMetaPage620,classifyMetaFailure620,
  metaFailureDigest620} from '../_lib/trustAuditMeta620.js';

const reply=(value,status=200)=>jsonResponse(value,status,{'Cache-Control':'no-store'});
const hold={build:620,release_gate:HOLD_620,publishing_enabled:false,
  provider_write:false,automatic_retry:false,d1_migration_performed:false};
const unavailable={ok:false,...hold,error:'Independent original D1 proposals 0052–0058 unavailable or not approved.'};
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
async function database(env){
  const db=getDb(env);if(!db)return null;
  try{for(const query of [
    'SELECT test_nonce FROM dd618_provider_test_attempts LIMIT 1',
    'SELECT test_nonce FROM dd619_etsy_failure_custody LIMIT 1',
    'SELECT grant_id FROM dd620_meta_read_grants LIMIT 1',
    'SELECT test_nonce FROM dd620_meta_test_attempts LIMIT 1',
    'SELECT test_nonce FROM dd620_meta_test_outcomes LIMIT 1',
    'SELECT test_nonce FROM dd620_meta_test_failures LIMIT 1',
    'SELECT authority_id FROM dd616_key_quarantines LIMIT 1'])await db.prepare(query).all();
    return db;}catch{return null;}
}
const root=(db,id)=>db.prepare(`SELECT a.authority_id,a.role,a.public_key,a.key_sha256,
  CASE WHEN EXISTS (SELECT 1 FROM dd616_key_quarantines q
    WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)
  THEN 'QUARANTINED' ELSE a.status END AS status
  FROM dd614_authorities a WHERE a.authority_id=? LIMIT 1`).bind(id).first();

// Every count and anomaly subquery scans the entire immutable source tables; no LIMIT 100
// shortcut is used here. Counts alone are NOT an independently witnessed cryptographic anchor.
export const FULL_ETSY_SQL_620=`SELECT
  (SELECT COUNT(*) FROM dd618_original_test_grants) AS grants,
  (SELECT COUNT(*) FROM dd618_provider_test_attempts) AS attempts,
  (SELECT COUNT(*) FROM dd618_provider_test_outcomes) AS outcomes,
  (SELECT COUNT(*) FROM dd618_provider_test_acceptances) AS acceptances,
  (SELECT COUNT(*) FROM dd619_etsy_failure_custody) AS failures,
  (SELECT COUNT(*) FROM dd619_etsy_failure_dispositions) AS dispositions,
  (SELECT COUNT(*) FROM dd618_provider_test_attempts a
    LEFT JOIN dd618_original_test_grants g ON a.test_nonce=g.test_nonce AND a.grant_id=g.grant_id
    WHERE g.grant_id IS NULL) AS orphan_attempts,
  (SELECT COUNT(*) FROM dd618_provider_test_outcomes o
    LEFT JOIN dd618_provider_test_attempts a ON o.test_nonce=a.test_nonce
    WHERE a.test_nonce IS NULL) AS orphan_outcomes,
  (SELECT COUNT(*) FROM dd618_provider_test_acceptances w
    LEFT JOIN dd618_provider_test_outcomes o ON w.test_nonce=o.test_nonce
    WHERE o.test_nonce IS NULL) AS orphan_acceptances,
  (SELECT COUNT(*) FROM dd619_etsy_failure_custody f
    LEFT JOIN dd618_provider_test_attempts a
      ON f.test_nonce=a.test_nonce AND f.grant_id=a.grant_id
    WHERE a.test_nonce IS NULL) AS orphan_failures,
  (SELECT COUNT(*) FROM dd619_etsy_failure_dispositions d
    LEFT JOIN dd619_etsy_failure_custody f
      ON d.test_nonce=f.test_nonce AND d.failure_sha256=f.failure_sha256
    WHERE f.test_nonce IS NULL) AS orphan_dispositions,
  (SELECT COUNT(*) FROM dd618_provider_test_outcomes o
    INNER JOIN dd619_etsy_failure_custody f ON o.test_nonce=f.test_nonce) AS dual_outcomes,
  (SELECT COUNT(*) FROM dd618_original_test_grants
    WHERE provider!='ETSY' OR status!='INDEPENDENTLY_APPROVED_SINGLE_READ_ONLY_GET') AS invalid_grants,
  (SELECT COUNT(*) FROM dd619_etsy_failure_dispositions
    WHERE status!='WITNESSED_SPENT_NONCE_NO_RETRY') AS invalid_failure_approvals`;

export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const db=await database(c.env);if(!db)return reply(unavailable,503);
  try{
    const [counts,meta,grants,attempts,receipts,failures]=await Promise.all([
      db.prepare(FULL_ETSY_SQL_620).first(),
      db.prepare(`SELECT provider_key,connection_status,scopes_json,access_expires_at,
        remote_subject_id FROM oauth_provider_connections WHERE provider_key='meta' LIMIT 1`).first(),
      db.prepare(`SELECT grant_id,test_nonce,expected_page_id,status,approved_at
        FROM dd620_meta_read_grants ORDER BY approved_at DESC LIMIT 30`).all(),
      db.prepare(`SELECT grant_id,test_nonce,status,created_at
        FROM dd620_meta_test_attempts ORDER BY created_at DESC LIMIT 30`).all(),
      db.prepare(`SELECT test_nonce,remote_page_id,receipt_sha256,status,created_at
        FROM dd620_meta_test_outcomes ORDER BY created_at DESC LIMIT 30`).all(),
      db.prepare(`SELECT test_nonce,failure_sha256,failure_code,status,created_at
        FROM dd620_meta_test_failures ORDER BY created_at DESC LIMIT 30`).all()]);
    return reply({ok:true,...hold,etsy:projectFullEtsyHistory620(counts),
      meta_local_capability:metaReadOnlyPreflight619(meta),
      meta_original_grants:grants.results||[],
      meta_spent_attempts:attempts.results||[],
      meta_real_get_receipts:receipts.results||[],meta_failed_attempts:failures.results||[],
      full_history_cryptographic_external_witness:false,
      provider_contacted_by_this_readback:false,
      external_original_issuer_owner_approval_still_required:true});
  }catch{return reply({...unavailable,error:'Full source receipt or Meta identity ledger readback failed.'},503);}
}
export async function onRequestPost(c){
  const request=c.request,admin=await getAdminUserFromRequest(request,c.env);
  if(!admin)return reply({ok:false,error:'Admin session required.'},401);
  if(request.headers.get('origin')!==new URL(request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reply({ok:false,error:'Same-origin JSON required.'},403);
  const db=await database(c.env);if(!db)return reply(unavailable,503);
  if(Number(request.headers.get('content-length')||0)>1500)
    return reply({ok:false,error:'Only an exact bounded grant reference is allowed.'},413);
  let body;try{body=await request.json();}catch{return reply({ok:false,error:'Invalid JSON.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>1500)
    return reply({ok:false,error:'Invalid bounded JSON.'},400);
  if(body.action!=='execute_one_meta_page_id_get'||!ID.test(body.grant_id||''))
    return reply({ok:false,...hold,error:'Exact separately approved read grant required.'},400);
  const step=await requireAdminStepUp(request,c.env,admin,body,
    'one original issuer authorized Meta Page identity GET');
  if(!step.ok)return step.response;
  try{
    const grant=await db.prepare(`SELECT grant_id,issuer_authority_id,original_source_sha256,
      checkpoint_sha256,expected_page_id,scopes_sha256,test_nonce,approval_sha256,
      signed_bundle_json,status FROM dd620_meta_read_grants WHERE grant_id=?`).bind(body.grant_id).first();
    if(!grant||grant.status!=='INDEPENDENTLY_APPROVED_ONE_META_PAGE_READ')
      throw Error('Original independent Meta TEST grant missing.');
    let signed;try{signed=JSON.parse(grant.signed_bundle_json);}catch{
      throw Error('Original Meta proof could not be decoded.');}
    const [source,checkpoint,connection,head]=await Promise.all([
      db.prepare(`SELECT authority_id,original_source_sha256,status
        FROM dd620_meta_original_source_registrations WHERE authority_id=?`).bind(
        grant.issuer_authority_id).first(),
      db.prepare(`SELECT checkpoint_sha256,original_issuer_source_sha256,
        ledger_head_sha256,ledger_sequence,status
        FROM dd617_external_readbacks WHERE checkpoint_sha256=?`).bind(
        grant.checkpoint_sha256).first(),
      db.prepare(`SELECT provider_key,remote_subject_id,connection_status,scopes_json,
        access_expires_at,access_token_ciphertext
        FROM oauth_provider_connections WHERE provider_key='meta' LIMIT 1`).first(),
      db.prepare(`SELECT event_hash,sequence FROM dd614_owner_decisions
        ORDER BY sequence DESC LIMIT 1`).first()]);
    const verified=await verifyMetaGrant620(signed,{grant,originalSource:source,
      checkpoint,roots:id=>root(db,id),pins:trustedPins614(c.env)});
    if(!head||head.event_hash!==checkpoint.ledger_head_sha256||
      head.sequence!==checkpoint.ledger_sequence)
      throw Error('Current owner-ledger head differs from original external checkpoint.');
    const candidate=metaReadOnlyPreflight619(connection);
    if(!candidate.facebook_page_read_candidate||
      connection.remote_subject_id!==grant.expected_page_id)
      throw Error('Meta Page account or saved read-only OAuth authority differs from exact grant.');
    let scopes;try{scopes=JSON.parse(connection.scopes_json);}catch{
      throw Error('Invalid saved Meta scopes.');}
    if(await scopesFingerprint620(scopes)!==grant.scopes_sha256)
      throw Error('Meta OAuth consent scopes changed since independent owner decision.');
    const token=await decryptOAuthSecret(c.env,connection.access_token_ciphertext,'oauth-token|meta|access');
    if(!token)throw Error('Original Meta access token could not be decrypted.');
    // Consume the exact approved nonce before any network attempt. No retry even on timeout.
    const reserved=await db.prepare(`INSERT INTO dd620_meta_test_attempts
      (test_nonce,grant_id,status,created_by)
      SELECT ?,?,'CLAIMED_EXACTLY_ONE_META_PAGE_GET',?
      WHERE EXISTS(SELECT 1 FROM dd620_meta_read_grants WHERE grant_id=?
        AND test_nonce=? AND status='INDEPENDENTLY_APPROVED_ONE_META_PAGE_READ')
      AND NOT EXISTS(SELECT 1 FROM dd620_meta_test_attempts WHERE test_nonce=?)
      AND NOT EXISTS(SELECT 1 FROM dd616_key_quarantines q
        JOIN dd614_authorities a ON a.authority_id IN (?,?,?)
        WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)`).bind(
      grant.test_nonce,grant.grant_id,admin.user_id,grant.grant_id,grant.test_nonce,
      grant.test_nonce,...verified.signers).run();
    if(reserved.meta?.changes!==1)throw Error('Original Meta one-use nonce already spent.');
    const preserve=async code=>{
      const hash=await metaFailureDigest620({grant_id:grant.grant_id,
        test_nonce:grant.test_nonce,code});
      try{const r=await db.prepare(`INSERT INTO dd620_meta_test_failures
        (test_nonce,grant_id,failure_sha256,failure_code,status)
        VALUES (?,?,?,?,'SPENT_META_NONCE_NO_RETRY')`).bind(
        grant.test_nonce,grant.grant_id,hash,code).run();return r.meta?.changes===1;
      }catch{return false;}
    };
    let observed;
    try{observed=await probeMetaPage620({token,expectedPageId:verified.page_id});}
    catch(error){const recorded=await preserve(classifyMetaFailure620(error));
      return reply({ok:false,...hold,test_nonce:grant.test_nonce,attempt_spent:true,
        failure_recorded:recorded,
        error:'Exact Meta Page GET failed or was not verified. This nonce is spent; never retry.'},422);}
    try{const r=await db.prepare(`INSERT INTO dd620_meta_test_outcomes
      (test_nonce,remote_page_id,receipt_sha256,endpoint,status)
      VALUES (?,?,?,'GET /v26.0/{page_id}?fields=id',
        'META_PAGE_ID_GET_RECEIPT_PENDING_INDEPENDENT_WITNESS')`).bind(
        grant.test_nonce,verified.page_id,observed.receipt_sha256).run();
      if(r.meta?.changes!==1)throw Error('Source receipt not persisted.');
    }catch{const recorded=await preserve('RECEIPT_WRITE_FAILED');
      return reply({ok:false,...hold,test_nonce:grant.test_nonce,
        attempt_spent:true,failure_recorded:recorded,
        error:'Meta GET returned, but its immutable receipt could not be saved. Spent nonce; review required.'},503);}
    return reply({ok:true,...hold,...observed,grant_id:grant.grant_id,
      test_nonce:grant.test_nonce,attempt_spent:true,
      independent_final_witness_acceptance_pending:true},201);
  }catch(error){
    if(/UNIQUE constraint|constraint failed/i.test(String(error)))
      return reply({ok:false,...hold,error:'Exact original Meta TEST nonce already consumed.'},409);
    return reply({ok:false,...hold,error:'Independent original Meta issuer, witness, owner and exact OAuth Page identity not verified.'},422);
  }
}
