/* Build 624: original-signer approval of saved encrypted Meta credential and
 * exactly ONE original Page-ID GET. No refresh, token upload or publication. */
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {trustedPins614,sha256} from '../_lib/trustAuthority614.js';
import {readOnlyWindow} from './trust-activation-623.js';
import {metaReadOnlyPreflight619} from '../_lib/trustReconcile619.js';
import {scopesFingerprint620,probeMetaPage620,classifyMetaFailure620}
  from '../_lib/trustAuditMeta620.js';
import {decryptOAuthSecret} from '../_lib/oauthSecurity.js';
import {HOLD_624,verifyEnrollment624,verifyRecheckGrant624,verifyWitness624}
  from '../_lib/trustEnrollment624.js';

const reply=(v,s=200)=>jsonResponse(v,s,{'Cache-Control':'no-store'});
const hold={build:624,release_gate:HOLD_624,connected:false,provider_write:false,
  publishing_enabled:false,oauth_scopes_changed:false,token_material_emitted:false,
  provider_get_performed:false,automatic_refresh:false,original_root_enrolled:false,
  d1_migration_performed:false};
const unavailable={ok:false,...hold,error:'Original-authorized proposed D1 0052–0062 not applied, or live evidence unavailable.'};
const HEX=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
async function database(env){const db=getDb(env);if(!db)return null;
  try{for(const t of ['dd624_meta_credential_enrollments','dd624_meta_one_use_grants',
    'dd624_meta_live_attempts','dd624_meta_live_outcomes','dd624_meta_live_failures',
    'dd624_meta_witness_acceptances','dd623_meta_readonly_windows'])
    await db.prepare(`SELECT rowid FROM ${t} LIMIT 1`).all();
    return db;}catch{return null;}
}
const root=(db,id)=>db.prepare(`SELECT a.authority_id,a.role,a.public_key,a.key_sha256,
  CASE WHEN EXISTS(SELECT 1 FROM dd616_key_quarantines q WHERE
    q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)
  THEN 'QUARANTINED' ELSE a.status END AS status
  FROM dd614_authorities a WHERE a.authority_id=? LIMIT 1`).bind(id).first();
const pins=(db,env)=>({roots:id=>root(db,id),pins:trustedPins614(env)});
const ledger=db=>db.prepare(`SELECT event_hash FROM dd614_owner_decisions ORDER BY sequence DESC LIMIT 1`).first();
const meta=db=>db.prepare(`SELECT provider_key,connection_status,remote_subject_id,
  scopes_json,access_expires_at,access_token_ciphertext
  FROM oauth_provider_connections WHERE provider_key='meta' LIMIT 1`).first();
const windowRow=(db,id)=>db.prepare(`SELECT window_sha256,completion_sha256,
  continuity_sha256,meta_closure_sha256,grant_id,test_nonce,page_id,
  scopes_sha256,owner_ledger_head_sha256,expires_at,signed_bundle_json,status
  FROM dd623_meta_readonly_windows WHERE window_sha256=?`).bind(id).first();
const enrollment=(db,id)=>db.prepare(`SELECT * FROM dd624_meta_credential_enrollments
  WHERE enrollment_sha256=?`).bind(id).first();
const grant=(db,id)=>db.prepare(`SELECT * FROM dd624_meta_one_use_grants
  WHERE authorization_id=?`).bind(id).first();
const attempt=(db,nonce)=>db.prepare(`SELECT * FROM dd624_meta_live_attempts WHERE test_nonce=?`).bind(nonce).first();
const outcome=(db,nonce)=>db.prepare(`SELECT * FROM dd624_meta_live_outcomes WHERE test_nonce=?`).bind(nonce).first();
const failure=(db,nonce)=>db.prepare(`SELECT test_nonce FROM dd624_meta_live_failures WHERE test_nonce=?`).bind(nonce).first();
const completion=(db,id)=>db.prepare(`SELECT issuer_authority_id,meta_closure_sha256,
  completion_sha256 FROM dd623_original_meta_completions WHERE completion_sha256=?`).bind(id).first();

async function source(db,env,windowId){
  const [prior,connection,head]=await Promise.all([windowRow(db,windowId),meta(db),ledger(db)]);
  const window=await readOnlyWindow(db,env,prior);
  if(!window.verified||!prior||!connection||!head||!connection.access_token_ciphertext)
    throw Error('Original signed read-only window and credential unavailable.');
  const candidate=metaReadOnlyPreflight619(connection);
  if(!candidate.facebook_page_read_candidate||prior.page_id!==connection.remote_subject_id)
    throw Error('Original Meta Page identity/scopes changed.');
  let scopes;try{scopes=JSON.parse(connection.scopes_json);}catch{throw Error('Meta scopes unreadable.');}
  const fingerprint=await scopesFingerprint620(scopes);
  if(fingerprint!==prior.scopes_sha256||prior.owner_ledger_head_sha256!==head.event_hash)
    throw Error('Original Meta owner ledger or permissions changed.');
  const original=await completion(db,prior.completion_sha256);
  if(!original)throw Error('Original Meta completion not present.');
  return {window,prior,original,connection,ledger:head,meta:{
    page_id:connection.remote_subject_id,scopes_sha256:fingerprint,
    encrypted_credential_sha256:await sha256(connection.access_token_ciphertext),
    access_expires_at:connection.access_expires_at,
    page_read_candidate:true,token_present:true}};
}
async function verifySavedEnrollment(db,env,row){
  if(!row)throw Error('Original encrypted credential attestation missing.');
  const signed=JSON.parse(row.signed_bundle_json),p=signed.payload;
  const scope=await source(db,env,row.window_sha256);
  const verified=await verifyEnrollment624(signed,{window:scope.window,
    meta:scope.meta,ledger:scope.ledger,issuer:{...scope.original,
      page_id:scope.meta.page_id},now:p.issued_at,...pins(db,env)});
  if(verified.enrollment_sha256!==row.enrollment_sha256||
    row.status!=='ORIGINAL_META_EXISTING_ENCRYPTED_READ_CREDENTIAL_ATTESTED'||
    row.page_id!==p.page_id||row.scopes_sha256!==p.scopes_sha256||
    row.encrypted_credential_sha256!==p.encrypted_credential_sha256||
    row.owner_ledger_head_sha256!==p.owner_ledger_head_sha256)
    throw Error('Recorded original Meta credential enrollment altered.');
  return {scope,verified,p};
}
async function verifySavedGrant(db,env,row){
  if(!row)throw Error('Single-use Meta original signed grant missing.');
  const signed=JSON.parse(row.signed_bundle_json),p=signed.payload;
  const enrolled=await enrollment(db,row.enrollment_sha256);
  const verifiedEnrollment=await verifySavedEnrollment(db,env,enrolled);
  const scope=verifiedEnrollment.scope;
  if(Date.parse(verifiedEnrollment.p.expires_at)<=Date.now())
    throw Error('Original encrypted enrollment authorization expired.');
  const verified=await verifyRecheckGrant624(signed,{enrollment:enrolled,
    window:scope.window,meta:scope.meta,ledger:scope.ledger,
    issuer:scope.original,now:p.issued_at,...pins(db,env)});
  if(verified.authorization_sha256!==row.authorization_sha256||
    row.authorization_id!==p.authorization_id||row.test_nonce!==p.test_nonce||
    row.page_id!==p.page_id||row.status!=='ORIGINAL_META_ONE_USE_LIVE_PAGE_ID_RECHECK_APPROVED')
    throw Error('Recorded original Meta single-use authorization altered.');
  return {scope,enrolled,verified,p};
}
async function recent(db,table,columns){return (await db.prepare(`SELECT ${columns}
  FROM ${table} ORDER BY created_at DESC LIMIT 12`).all()).results||[];}

export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const db=await database(c.env);if(!db)return reply(unavailable,503);
  try{
    const [enrollments,grants,attempts,outcomes,failures,witnesses]=await Promise.all([
      recent(db,'dd624_meta_credential_enrollments','enrollment_sha256,window_sha256,page_id,status,created_at'),
      recent(db,'dd624_meta_one_use_grants','authorization_id,test_nonce,expires_at,status,created_at'),
      recent(db,'dd624_meta_live_attempts','test_nonce,authorization_id,status,created_at'),
      recent(db,'dd624_meta_live_outcomes','test_nonce,remote_page_id,receipt_sha256,status,created_at'),
      recent(db,'dd624_meta_live_failures','test_nonce,failure_code,status,created_at'),
      recent(db,'dd624_meta_witness_acceptances','witness_sha256,test_nonce,status,created_at')]);
    // The latest witnessed event is only claimed as original live proof if its
    // stored real GET and original signatures still validate. Never connected.
    let latestWitness='NO_ORIGINAL_LIVE_GET_WITNESS_ON_HOLD';
    if(witnesses.length){try{
      const saved=await db.prepare(`SELECT * FROM dd624_meta_witness_acceptances
        ORDER BY created_at DESC LIMIT 1`).first();
      const g=await grant(db,saved.authorization_id),e=await enrollment(db,saved.enrollment_sha256),
        a=await attempt(db,saved.test_nonce),o=await outcome(db,saved.test_nonce),
        f=await failure(db,saved.test_nonce);
      const verified=await verifySavedGrant(db,c.env,g),signed=JSON.parse(saved.signed_bundle_json);
      const witnessed=await verifyWitness624(signed,{grant:g,enrollment:e,attempt:a,
        outcome:o,failure:f,issuer:verified.scope.original,
        now:signed.payload.issued_at,...pins(db,c.env)});
      if(witnessed.witness_sha256===saved.witness_sha256)
        latestWitness='ORIGINAL_ONE_GENUINE_META_GET_WITNESSED_READ_ONLY_NO_CONNECTION';
    }catch{latestWitness='HOLD_WITNESS_REVOKED_EXPIRED_OR_SOURCE_CHANGED';}}
    return reply({ok:true,...hold,enrollments,grants,attempts,outcomes,failures,witnesses,
      latest_verified_original_get:latestWitness,
      original_meta_connection_automatically_activated:false});
  }catch{return reply({...unavailable,error:'Original encrypted Meta readback unavailable.'},503);}
}

export async function onRequestPost(c){
  const admin=await getAdminUserFromRequest(c.request,c.env);
  if(!admin)return reply({ok:false,error:'Admin session required.'},401);
  if(c.request.headers.get('origin')!==new URL(c.request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(c.request.headers.get('content-type')||''))
    return reply({ok:false,error:'Same-origin JSON required.'},403);
  const db=await database(c.env);if(!db)return reply(unavailable,503);
  if(Number(c.request.headers.get('content-length')||0)>16000)
    return reply({ok:false,...hold,error:'Signed original-source evidence exceeds safe bound.'},413);
  let body;try{body=await c.request.json();}catch{
    return reply({ok:false,...hold,error:'Invalid signed JSON.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||
    JSON.stringify(body).length>16000||
    !['enroll_existing_encrypted_credential','approve_one_live_meta_recheck',
      'execute_one_live_meta_recheck','accept_one_genuine_meta_receipt'].includes(body.action)||
    (body.action==='execute_one_live_meta_recheck'?!ID.test(body.authorization_id||''):
      !body.signed_bundle||typeof body.signed_bundle!=='object'))
    return reply({ok:false,...hold,error:'Exact original signed proof or grant reference required.'},400);
  const step=await requireAdminStepUp(c.request,c.env,admin,body,
    'original separately signed Meta single-use read-only action');
  if(!step.ok)return step.response;
  try{
    const signed=body.signed_bundle,p=signed?.payload;
    if(body.action==='enroll_existing_encrypted_credential'){
      if(!HEX.test(p?.window_sha256))throw Error('Original stored receipt window missing.');
      const s=await source(db,c.env,p.window_sha256);
      const verified=await verifyEnrollment624(signed,{window:s.window,meta:s.meta,
        ledger:s.ledger,issuer:{...s.original,page_id:s.meta.page_id},...pins(db,c.env)});
      const r=await db.prepare(`INSERT INTO dd624_meta_credential_enrollments
        (enrollment_sha256,window_sha256,original_completion_sha256,page_id,scopes_sha256,
        encrypted_credential_sha256,owner_ledger_head_sha256,signed_bundle_json,status,created_by)
        VALUES (?,?,?,?,?,?,?,?,'ORIGINAL_META_EXISTING_ENCRYPTED_READ_CREDENTIAL_ATTESTED',?)`).bind(
        verified.enrollment_sha256,p.window_sha256,s.original.completion_sha256,p.page_id,
        p.scopes_sha256,p.encrypted_credential_sha256,p.owner_ledger_head_sha256,
        JSON.stringify(signed),admin.user_id).run();
      if(r.meta?.changes!==1)throw Error('Original encrypted Meta enrollment not saved.');
      return reply({ok:true,...hold,...verified},201);
    }
    if(body.action==='approve_one_live_meta_recheck'){
      if(!HEX.test(p?.enrollment_sha256))throw Error('Original enrollment absent.');
      const e=await enrollment(db,p.enrollment_sha256),verified=await verifySavedEnrollment(db,c.env,e);
      if(Date.parse(verified.p.expires_at)<=Date.now())throw Error('Enrollment expired.');
      const v=await verifyRecheckGrant624(signed,{enrollment:e,
        window:verified.scope.window,meta:verified.scope.meta,ledger:verified.scope.ledger,
        issuer:verified.scope.original,...pins(db,c.env)});
      const r=await db.prepare(`INSERT INTO dd624_meta_one_use_grants
        (authorization_id,authorization_sha256,enrollment_sha256,window_sha256,
        test_nonce,page_id,expires_at,signed_bundle_json,status,created_by)
        VALUES (?,?,?,?,?,?,?,?,'ORIGINAL_META_ONE_USE_LIVE_PAGE_ID_RECHECK_APPROVED',?)`).bind(
        p.authorization_id,v.authorization_sha256,p.enrollment_sha256,p.window_sha256,
        p.test_nonce,p.page_id,p.expires_at,JSON.stringify(signed),admin.user_id).run();
      if(r.meta?.changes!==1)throw Error('Original one-use grant not saved.');
      return reply({ok:true,...hold,...v,expires_at:p.expires_at},201);
    }
    if(body.action==='execute_one_live_meta_recheck'){
      const row=await grant(db,body.authorization_id),verified=await verifySavedGrant(db,c.env,row);
      if(Date.parse(verified.p.expires_at)<=Date.now())throw Error('Original signed GET authorization expired.');
      // COMMIT nonce claim first. A failed token decryption, provider request or
      // receipt write cannot make this same approval reusable.
      const claimed=await db.prepare(`INSERT INTO dd624_meta_live_attempts
        (test_nonce,authorization_id,status,created_by)
        SELECT ?,?,'CLAIMED_ONE_ORIGINAL_META_PAGE_ID_GET_NO_RETRY',?
        WHERE NOT EXISTS(SELECT 1 FROM dd624_meta_live_attempts WHERE test_nonce=?)
          AND NOT EXISTS(SELECT 1 FROM dd616_key_quarantines q
            JOIN dd614_authorities a ON a.authority_id IN (?,?,?)
            WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)`).bind(
        row.test_nonce,row.authorization_id,admin.user_id,row.test_nonce,
        ...verified.verified.signers).run();
      if(claimed.meta?.changes!==1)throw Error('Original Meta GET nonce already spent.');
      const fail=async code=>{try{const r=await db.prepare(`INSERT INTO dd624_meta_live_failures
        (test_nonce,failure_code,status) VALUES (?,?,'SPENT_ORIGINAL_META_NONCE_NO_RETRY')`).bind(
        row.test_nonce,code).run();return r.meta?.changes===1;}catch{return false;}};
      let observed;
      try{const token=await decryptOAuthSecret(c.env,verified.scope.connection.access_token_ciphertext,
        'oauth-token|meta|access');
        if(!token)throw Error('Original saved encrypted token unavailable.');
        observed=await probeMetaPage620({token,expectedPageId:verified.p.page_id});
      }catch(error){const code=/oauth|token|ciphertext|decryption/i.test(String(error?.message||''))?
        'PROVIDER_UNVERIFIED':classifyMetaFailure620(error);
        return reply({ok:false,...hold,test_nonce:row.test_nonce,attempt_spent:true,
          failure_recorded:await fail(code),error:'Original one-use live GET failed or token unavailable; nonce spent.'},422);}
      try{const r=await db.prepare(`INSERT INTO dd624_meta_live_outcomes
        (test_nonce,remote_page_id,receipt_sha256,status) VALUES (?,?,?,
        'GENUINE_META_PAGE_ID_GET_PENDING_INDEPENDENT_WITNESS')`).bind(
        row.test_nonce,verified.p.page_id,observed.receipt_sha256).run();
        if(r.meta?.changes!==1)throw Error('Receipt not saved.');
      }catch{return reply({ok:false,...hold,test_nonce:row.test_nonce,
        attempt_spent:true,failure_recorded:await fail('RECEIPT_WRITE_FAILED'),
        error:'Original single GET response returned, but immutable receipt write failed.'},503);}
      return reply({ok:true,...hold,test_nonce:row.test_nonce,attempt_spent:true,
        actual_provider_get_performed:true,provider_write:false,
        remote_page_id:verified.p.page_id,receipt_sha256:observed.receipt_sha256,
        independent_original_witness_pending:true},201);
    }
    if(!ID.test(p?.authorization_id||'')||!HEX.test(p?.enrollment_sha256))
      throw Error('Original live GET witness source absent.');
    const g=await grant(db,p.authorization_id),v=await verifySavedGrant(db,c.env,g);
    const [a,o,f]=await Promise.all([attempt(db,p.test_nonce),outcome(db,p.test_nonce),
      failure(db,p.test_nonce)]);
    const witnessed=await verifyWitness624(signed,{grant:g,enrollment:v.enrolled,
      attempt:a,outcome:o,failure:f,issuer:v.scope.original,...pins(db,c.env)});
    const r=await db.prepare(`INSERT INTO dd624_meta_witness_acceptances
      (witness_sha256,authorization_id,test_nonce,enrollment_sha256,signed_bundle_json,status,created_by)
      VALUES (?,?,?,?,?,'ORIGINAL_META_ONE_GENUINE_PAGE_GET_INDEPENDENTLY_WITNESSED',?)`).bind(
      witnessed.witness_sha256,p.authorization_id,p.test_nonce,p.enrollment_sha256,
      JSON.stringify(signed),admin.user_id).run();
    if(r.meta?.changes!==1)throw Error('Independent original Meta GET witness not saved.');
    return reply({ok:true,...hold,...witnessed},201);
  }catch(error){
    if(/UNIQUE constraint|constraint failed/i.test(String(error)))
      return reply({ok:false,...hold,error:'Original signed Meta approval or one-use nonce already recorded.'},409);
    return reply({ok:false,...hold,error:'Original credential, unexpired pinned signatures, matching Page/scopes, one-use GET or witness unavailable.'},422);
  }
}
