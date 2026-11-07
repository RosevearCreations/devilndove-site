import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {trustedPins614} from '../_lib/trustAuthority614.js';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {HOLD_618,verifyIssuerCustody618,verifyBackupWitness618,
  verifyProviderAcceptance618,probeEtsyIdentity618} from '../_lib/trustIssuer618.js';

const reply=(body,status=200)=>jsonResponse(body,status,{'Cache-Control':'no-store'});
const hold={build:618,release_gate:HOLD_618,d1_migration_performed:false,
  authority_activated:false,provider_write:false,provider_action_authorized:false};
const disabled={ok:false,...hold,error:'Separately approved 0052–0056 D1 authority and original custody are not installed.'};
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
async function database(c){
  const db=getDb(c.env);if(!db)return null;
  try{
    for(const query of ['SELECT authority_id FROM dd614_authorities LIMIT 1',
      'SELECT receipt_id FROM dd615_custody_readbacks LIMIT 1',
      'SELECT authority_id FROM dd616_key_quarantines LIMIT 1',
      'SELECT checkpoint_sha256 FROM dd617_external_readbacks LIMIT 1',
      'SELECT authority_id FROM dd618_original_source_registrations LIMIT 1',
      'SELECT attestation_sha256 FROM dd618_original_issuer_attestations LIMIT 1',
      'SELECT backup_witness_sha256 FROM dd618_backup_witness_packets LIMIT 1',
      'SELECT attestation_sha256 FROM dd618_original_custody_decisions LIMIT 1',
      'SELECT backup_witness_sha256 FROM dd618_backup_restore_verifications LIMIT 1',
      'SELECT grant_id FROM dd618_original_test_grants LIMIT 1',
      'SELECT test_nonce FROM dd618_provider_test_attempts LIMIT 1',
      'SELECT test_nonce FROM dd618_provider_test_outcomes LIMIT 1',
      'SELECT acceptance_sha256 FROM dd618_provider_test_acceptances LIMIT 1'])
      await db.prepare(query).all();
    return db;
  }catch{return null;}
}
const authority=(db,id)=>db.prepare(`SELECT a.authority_id,a.role,a.public_key,a.key_sha256,
  CASE WHEN EXISTS (SELECT 1 FROM dd616_key_quarantines q
    WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)
  THEN 'QUARANTINED' ELSE a.status END AS status
  FROM dd614_authorities a WHERE a.authority_id=? LIMIT 1`).bind(id).first();
const readback=(db,hash)=>db.prepare(`SELECT checkpoint_sha256,ledger_head_sha256,
  ledger_sequence,original_issuer_source_sha256,status
  FROM dd617_external_readbacks WHERE checkpoint_sha256=? LIMIT 1`).bind(hash).first();
const grantById=(db,id)=>db.prepare(`SELECT grant_id,preflight_sha256,attestation_sha256,
  backup_witness_sha256,checkpoint_sha256,test_nonce,provider,
  original_approval_sha256,status FROM dd618_original_test_grants
  WHERE grant_id=? LIMIT 1`).bind(id).first();
export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const db=await database(c);if(!db)return reply(disabled,503);
  try{
    const [sources,attestations,backups,custodyDecisions,backupRestores,
      grants,attempts,outcomes,accepted]=await Promise.all([
      db.prepare(`SELECT authority_id,provider,original_source_sha256,status,approved_at
        FROM dd618_original_source_registrations LIMIT 30`).all(),
      db.prepare(`SELECT attestation_sha256,authority_id,checkpoint_sha256,status,created_at
        FROM dd618_original_issuer_attestations ORDER BY created_at DESC LIMIT 30`).all(),
      db.prepare(`SELECT backup_witness_sha256,backup_id,backup_sha256,status,created_at
        FROM dd618_backup_witness_packets ORDER BY created_at DESC LIMIT 30`).all(),
      db.prepare(`SELECT attestation_sha256,original_decision_sha256,status,approved_at
        FROM dd618_original_custody_decisions LIMIT 30`).all(),
      db.prepare(`SELECT backup_witness_sha256,restored_backup_sha256,status,approved_at
        FROM dd618_backup_restore_verifications LIMIT 30`).all(),
      db.prepare(`SELECT grant_id,preflight_sha256,test_nonce,provider,status,approved_at
        FROM dd618_original_test_grants LIMIT 30`).all(),
      db.prepare(`SELECT grant_id,test_nonce,status,created_at
        FROM dd618_provider_test_attempts ORDER BY created_at DESC LIMIT 30`).all(),
      db.prepare(`SELECT test_nonce,provider_receipt_sha256,remote_subject_id,status,created_at
        FROM dd618_provider_test_outcomes ORDER BY created_at DESC LIMIT 30`).all(),
      db.prepare(`SELECT acceptance_sha256,test_nonce,status,created_at
        FROM dd618_provider_test_acceptances ORDER BY created_at DESC LIMIT 30`).all()]);
    return reply({ok:true,...hold,original_source_registrations:sources.results||[],
      issuer_attestations:attestations.results||[],witnessed_backup_packets:backups.results||[],
      original_custody_operator_decisions:custodyDecisions.results||[],
      independent_backup_restore_proofs:backupRestores.results||[],
      independent_test_grants:grants.results||[],one_use_attempts:attempts.results||[],
      genuine_etsy_get_outcomes:outcomes.results||[],witnessed_acceptances:accepted.results||[],
      actual_etsy_get_performed_by_this_read:false,
      unverified_original_authority_remains_hold:true});
  }catch{return reply({...disabled,error:'Original source/test ledger readback failed.'},503);}
}
async function existingEtsyConnection(db,env){
  const [conn,shop]=await Promise.all([
    db.prepare(`SELECT remote_subject_id,connection_status,scopes_json,
      access_expires_at,access_token_ciphertext FROM oauth_provider_connections
      WHERE provider_key='etsy' LIMIT 1`).first(),
    db.prepare(`SELECT shop_id,owner_user_id,acceptance_status
      FROM etsy_oauth_shop_connections WHERE provider_key='etsy' LIMIT 1`).first()]);
  let scopes=[];try{scopes=JSON.parse(conn?.scopes_json||'[]');}catch{}
  const expiry=Date.parse(String(conn?.access_expires_at||''));
  if(!conn||conn.connection_status!=='connected'||
    !shop||shop.acceptance_status!=='connected_verified'||
    !Array.isArray(scopes)||!scopes.includes('shops_r')||
    !Number.isFinite(expiry)||expiry<=Date.now()+120000||
    !/^[0-9]{1,20}$/.test(String(conn.remote_subject_id||''))||
    String(conn.remote_subject_id)!==String(shop.owner_user_id)||
    !/^[0-9]{1,20}$/.test(String(shop.shop_id||''))||
    !String(env.ETSY_API_KEYSTRING||'').trim()||
    !String(env.ETSY_SHARED_SECRET||'').trim())
    throw Error('Original Etsy OAuth connection not currently verified for read-only GET.');
  const token=await decryptOAuthSecret(env,conn.access_token_ciphertext,'oauth-token|etsy|access');
  if(!token)throw Error('Existing Etsy OAuth token could not be decrypted.');
  return {token,subject:String(conn.remote_subject_id),shopId:String(shop.shop_id)};
}
export async function onRequestPost(c){
  const request=c.request,admin=await getAdminUserFromRequest(request,c.env);
  if(!admin)return reply({ok:false,error:'Admin session required.'},401);
  if(request.headers.get('origin')!==new URL(request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reply({ok:false,error:'Same-origin JSON required.'},403);
  const db=await database(c);if(!db)return reply(disabled,503);
  if(Number(request.headers.get('content-length')||0)>20000)
    return reply({ok:false,error:'Bounded JSON required.'},413);
  let body;try{body=await request.json();}catch{return reply({ok:false,error:'Invalid JSON.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>20000)
    return reply({ok:false,error:'Invalid bounded JSON.'},400);
  const step=await requireAdminStepUp(request,c.env,admin,body,'original issuer / witnessed backup / one-use Etsy TEST');
  if(!step.ok)return step.response;
  try{
    if(body.action==='attest_original_issuer'){
      const p=body.attestation?.payload;
      if(!p||!ID.test(p.authority_id)||!ID.test(p.custody_receipt_id))
        throw Error('Original issuer challenge missing.');
      const [candidate,custody,registry,read]=await Promise.all([
        authority(db,p.authority_id),
        db.prepare(`SELECT receipt_id,authority_id,original_source_sha256,
          original_receipt_sha256,status FROM dd615_custody_readbacks
          WHERE receipt_id=?`).bind(p.custody_receipt_id).first(),
        db.prepare(`SELECT authority_id,provider,original_source_sha256,status
          FROM dd618_original_source_registrations WHERE authority_id=?`).bind(p.authority_id).first(),
        readback(db,p.checkpoint_sha256)]);
      const verified=await verifyIssuerCustody618(body.attestation,{candidate,custody,registry,
        readback:read,authority:id=>authority(db,id),pins:trustedPins614(c.env)});
      await db.prepare(`INSERT INTO dd618_original_issuer_attestations
        (attestation_sha256,authority_id,custody_receipt_id,checkpoint_sha256,
        original_source_sha256,signed_bundle_json,status,created_by)
        VALUES (?,?,?,?,?,?,'CRYPTO_ATTESTED_PENDING_SEPARATE_ORIGINAL_CUSTODY_DECISION',?)`).bind(
        verified.attestation_sha256,verified.authority_id,p.custody_receipt_id,
        verified.checkpoint_sha256,verified.source_sha256,
        JSON.stringify(body.attestation),admin.user_id).run();
      return reply({ok:true,...hold,...verified},201);
    }
    if(body.action==='witness_backup_migration'){
      const p=body.packet?.payload;
      if(!p||typeof p.checkpoint_sha256!=='string')throw Error('Backup scope missing.');
      const verified=await verifyBackupWitness618(body.packet,{readback:await readback(db,p.checkpoint_sha256),
        authority:id=>authority(db,id),pins:trustedPins614(c.env)});
      await db.prepare(`INSERT INTO dd618_backup_witness_packets
        (backup_witness_sha256,backup_id,backup_sha256,migration_manifest_sha256,
        checkpoint_sha256,signed_bundle_json,status,created_by)
        VALUES (?,?,?,?,?,?,'SIGNED_BACKUP_PENDING_INDEPENDENT_RESTORE_REVIEW',?)`).bind(
        verified.backup_witness_sha256,verified.backup_id,verified.backup_sha256,
        verified.migration_manifest_sha256,verified.checkpoint_sha256,
        JSON.stringify(body.packet),admin.user_id).run();
      return reply({ok:true,...hold,...verified},201);
    }
    if(body.action==='execute_single_etsy_identity_get'){
      if(!ID.test(body.grant_id||''))return reply({ok:false,...hold,error:'Exact grant ID required.'},400);
      const grant=await grantById(db,body.grant_id);
      if(!grant||grant.provider!=='ETSY'||grant.status!=='INDEPENDENTLY_APPROVED_SINGLE_READ_ONLY_GET'||
        !/^[0-9a-f]{64}$/.test(grant.original_approval_sha256)||
        !ID.test(grant.test_nonce)||grant.test_nonce.length<20)
        throw Error('External original issuer and owner single-use TEST grant missing.');
      const [attestation,backup,preflight,anchor,originalDecision,restoredBackup]=await Promise.all([
        db.prepare(`SELECT attestation_sha256,authority_id,checkpoint_sha256,original_source_sha256,
          status FROM dd618_original_issuer_attestations WHERE attestation_sha256=?`).bind(
          grant.attestation_sha256).first(),
        db.prepare(`SELECT backup_witness_sha256,backup_sha256,checkpoint_sha256,status
          FROM dd618_backup_witness_packets WHERE backup_witness_sha256=?`).bind(
          grant.backup_witness_sha256).first(),
        db.prepare(`SELECT preflight_sha256,issuer_authority_id,checkpoint_sha256,
          exact_scope_json,signed_bundle_json,status FROM dd617_witnessed_test_preflights
          WHERE preflight_sha256=?`).bind(grant.preflight_sha256).first(),
        readback(db,grant.checkpoint_sha256),
        db.prepare(`SELECT attestation_sha256,original_decision_sha256,status
          FROM dd618_original_custody_decisions WHERE attestation_sha256=?`).bind(
          grant.attestation_sha256).first(),
        db.prepare(`SELECT backup_witness_sha256,restored_backup_sha256,status
          FROM dd618_backup_restore_verifications WHERE backup_witness_sha256=?`).bind(
          grant.backup_witness_sha256).first()]);
      let scope,signed;try{scope=JSON.parse(preflight?.exact_scope_json||'');
        signed=JSON.parse(preflight?.signed_bundle_json||'');}catch{throw Error('Original signed preflight unreadable.');}
      if(!attestation||attestation.status!=='CRYPTO_ATTESTED_PENDING_SEPARATE_ORIGINAL_CUSTODY_DECISION'||
        !backup||backup.status!=='SIGNED_BACKUP_PENDING_INDEPENDENT_RESTORE_REVIEW'||
        !originalDecision||
        originalDecision.status!=='INDEPENDENT_ORIGINAL_CUSTODY_APPROVED_FOR_ONE_TEST'||
        !/^[0-9a-f]{64}$/.test(originalDecision.original_decision_sha256)||
        !restoredBackup||restoredBackup.status!=='INDEPENDENTLY_RESTORED_AND_WITNESSED'||
        restoredBackup.restored_backup_sha256!==backup.backup_sha256||
        !preflight||preflight.status!=='PENDING_FINAL_OWNER_SUPERVISED_TEST_APPROVAL'||
        !anchor||anchor.status!=='EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING'||
        ![attestation.checkpoint_sha256,backup.checkpoint_sha256,preflight.checkpoint_sha256]
          .every(x=>x===grant.checkpoint_sha256)||
        preflight.issuer_authority_id!==attestation.authority_id||
        anchor.original_issuer_source_sha256!==attestation.original_source_sha256||
        scope.action!=='TEST_CONNECTION_READBACK'||scope.channel!=='ETSY'||
        scope.source_sha256!==attestation.original_source_sha256||
        signed?.payload?.nonce!==grant.test_nonce)
        throw Error('Original issuer/owner and signed exact TEST scope not independently approved.');
      const original=await authority(db,attestation.authority_id);
      if(!original||original.status!=='PENDING_EXTERNAL_VERIFICATION'||
        trustedPins614(c.env)[original.authority_id]!==original.key_sha256)
        throw Error('Original issuer public pin missing or quarantined.');
      const auth=await existingEtsyConnection(db,c.env);
      if(scope.account_id!==auth.shopId)throw Error('Exact signed shop ID differs from verified Etsy OAuth shop.');
      const head=await db.prepare(`SELECT event_hash,sequence FROM dd614_owner_decisions
        ORDER BY sequence DESC LIMIT 1`).first();
      if(!head||head.event_hash!==anchor.ledger_head_sha256||
        head.sequence!==anchor.ledger_sequence)
        throw Error('Current ledger head differs from witnessed provider TEST checkpoint.');
      // Durable one-shot claim happens BEFORE external GET. No automatic retries on failure.
      const result=await db.prepare(`INSERT INTO dd618_provider_test_attempts
        (test_nonce,grant_id,status,created_by)
        SELECT ?,?,'CLAIMED_EXACTLY_ONE_GET',?
        WHERE EXISTS (SELECT 1 FROM dd618_original_test_grants
          WHERE grant_id=? AND test_nonce=? AND status='INDEPENDENTLY_APPROVED_SINGLE_READ_ONLY_GET')
        AND NOT EXISTS (SELECT 1 FROM dd618_provider_test_attempts WHERE test_nonce=?)
        AND NOT EXISTS (SELECT 1 FROM dd616_key_quarantines
          WHERE authority_id=? OR key_sha256=?)`).bind(
        grant.test_nonce,grant.grant_id,admin.user_id,grant.grant_id,grant.test_nonce,
        grant.test_nonce,original.authority_id,original.key_sha256).run();
      if(result.meta?.changes!==1)throw Error('Original single-use test grant already consumed.');
      let observed;
      try{observed=await probeEtsyIdentity618({apiKey:c.env.ETSY_API_KEYSTRING,
        secret:c.env.ETSY_SHARED_SECRET,token:auth.token,expectedUserId:auth.subject});}
      catch{return reply({ok:false,...hold,grant_id:grant.grant_id,
        test_nonce:grant.test_nonce,attempt_spent:true,
        error:'One-use Etsy GET failed; no retry until separate new owner grant.'},422);}
      await db.prepare(`INSERT INTO dd618_provider_test_outcomes
        (test_nonce,provider_receipt_sha256,remote_subject_id,endpoint,status)
        VALUES (?,?,?,'GET /v3/application/users/me',
          'ETSY_IDENTITY_GET_VERIFIED_PENDING_WITNESS_ACCEPTANCE')`).bind(
        grant.test_nonce,observed.provider_receipt_sha256,observed.remote_subject_id).run();
      return reply({ok:true,...hold,...observed,grant_id:grant.grant_id,
        test_nonce:grant.test_nonce,attempt_spent:true,
        witness_acceptance_pending:true},201);
    }
    if(body.action==='accept_witnessed_etsy_receipt'){
      const p=body.acceptance?.payload;
      if(!p||!ID.test(p.grant_id)||!ID.test(p.test_nonce))
        throw Error('Exact provider acceptance scope missing.');
      const [attempt,outcome,grant]=await Promise.all([
        db.prepare(`SELECT test_nonce,grant_id FROM dd618_provider_test_attempts
          WHERE test_nonce=?`).bind(p.test_nonce).first(),
        db.prepare(`SELECT test_nonce,provider_receipt_sha256,remote_subject_id,status
          FROM dd618_provider_test_outcomes WHERE test_nonce=?`).bind(p.test_nonce).first(),
        grantById(db,p.grant_id)]);
      const verified=await verifyProviderAcceptance618(body.acceptance,{attempt,outcome,grant,
        authority:id=>authority(db,id),pins:trustedPins614(c.env)});
      await db.prepare(`INSERT INTO dd618_provider_test_acceptances
        (acceptance_sha256,test_nonce,signed_bundle_json,status,created_by)
        VALUES (?,?,?,'EXACT_GENUINE_ETSY_GET_WITNESSED_NO_PUBLICATION',?)`).bind(
        verified.acceptance_sha256,verified.test_nonce,
        JSON.stringify(body.acceptance),admin.user_id).run();
      return reply({ok:true,...hold,...verified},201);
    }
    return reply({ok:false,...hold,error:'Unknown or unsafe original authority action.'},400);
  }catch(e){
    if(/UNIQUE constraint|constraint failed/i.test(String(e)))return reply({ok:false,...hold,
      error:'Immutable original authority or single-use TEST receipt already exists.'},409);
    return reply({ok:false,...hold,
      error:'Original issuer, backup, independent grant, or genuine provider proof not verified.',
      detail_code:'BUILD618_ORIGINAL_AUTHORITY_TEST_HOLD'},422);
  }
}
