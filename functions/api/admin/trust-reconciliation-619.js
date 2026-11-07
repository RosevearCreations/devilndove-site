import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {trustedPins614} from '../_lib/trustAuthority614.js';
import {HOLD_619,reconcileEtsy619,metaReadOnlyPreflight619,
  verifyFailureDisposition619} from '../_lib/trustReconcile619.js';

const reply=(value,status=200)=>jsonResponse(value,status,{'Cache-Control':'no-store'});
const hold={build:619,release_gate:HOLD_619,provider_api_contacted:false,
  auto_retry:false,publishing_enabled:false,d1_migration_performed:false};
const unavailable={ok:false,...hold,
  error:'Proposed D1 0052–0057 not independently approved and available.'};
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
async function database(env){
  const db=getDb(env);if(!db)return null;
  try{
    for(const query of ['SELECT grant_id FROM dd618_original_test_grants LIMIT 1',
      'SELECT test_nonce FROM dd618_provider_test_attempts LIMIT 1',
      'SELECT test_nonce FROM dd618_provider_test_outcomes LIMIT 1',
      'SELECT test_nonce FROM dd618_provider_test_acceptances LIMIT 1',
      'SELECT test_nonce FROM dd619_etsy_failure_custody LIMIT 1',
      'SELECT test_nonce FROM dd619_etsy_failure_dispositions LIMIT 1',
      'SELECT authority_id FROM dd614_authorities LIMIT 1',
      'SELECT authority_id FROM dd616_key_quarantines LIMIT 1'])await db.prepare(query).all();
    return db;
  }catch{return null;}
}
const root=(db,id)=>db.prepare(`SELECT a.authority_id,a.role,a.public_key,a.key_sha256,
  CASE WHEN EXISTS (SELECT 1 FROM dd616_key_quarantines q
    WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)
  THEN 'QUARANTINED' ELSE a.status END AS status
  FROM dd614_authorities a WHERE a.authority_id=? LIMIT 1`).bind(id).first();

export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const db=await database(c.env);if(!db)return reply(unavailable,503);
  try{
    const [g,a,o,w,f,d,m]=await Promise.all([
      db.prepare(`SELECT grant_id,test_nonce,provider,status FROM dd618_original_test_grants
        ORDER BY approved_at DESC LIMIT 100`).all(),
      db.prepare(`SELECT grant_id,test_nonce,status FROM dd618_provider_test_attempts
        ORDER BY created_at DESC LIMIT 100`).all(),
      db.prepare(`SELECT test_nonce,provider_receipt_sha256,remote_subject_id,endpoint,status
        FROM dd618_provider_test_outcomes ORDER BY created_at DESC LIMIT 100`).all(),
      db.prepare(`SELECT acceptance_sha256,test_nonce,status FROM dd618_provider_test_acceptances
        ORDER BY created_at DESC LIMIT 100`).all(),
      db.prepare(`SELECT test_nonce,grant_id,failure_sha256,failure_code,status
        FROM dd619_etsy_failure_custody ORDER BY created_at DESC LIMIT 100`).all(),
      db.prepare(`SELECT test_nonce,failure_sha256,status FROM dd619_etsy_failure_dispositions
        ORDER BY created_at DESC LIMIT 100`).all(),
      db.prepare(`SELECT provider_key,connection_status,scopes_json,access_expires_at,
        remote_subject_id FROM oauth_provider_connections WHERE provider_key='meta' LIMIT 1`).first()]);
    const values=[g,a,o,w,f,d].map(x=>x.results||[]);
    const receipts=reconcileEtsy619({grants:values[0],attempts:values[1],
      outcomes:values[2],acceptances:values[3],failures:values[4],dispositions:values[5]});
    return reply({ok:true,...hold,etsy:receipts,
      meta:metaReadOnlyPreflight619(m),
      source:'immutable D1 rows only; provider never contacted by readback',
      readback_window_max_per_table:100,
      full_history_audit_claim:false,
      actual_live_get_observed:receipts.witnessed_get_count>0&&receipts.integrity_ok,
      no_test_attempt_is_not_connection:true});
  }catch{return reply({...unavailable,error:'Immutable receipt or Meta local readback failed.'},503);}
}

export async function onRequestPost(c){
  const request=c.request,admin=await getAdminUserFromRequest(request,c.env);
  if(!admin)return reply({ok:false,error:'Admin session required.'},401);
  if(request.headers.get('origin')!==new URL(request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reply({ok:false,error:'Same-origin JSON required.'},403);
  const db=await database(c.env);if(!db)return reply(unavailable,503);
  if(Number(request.headers.get('content-length')||0)>12000)
    return reply({ok:false,error:'Bounded JSON required.'},413);
  let body;try{body=await request.json();}catch{return reply({ok:false,error:'Invalid JSON.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>12000)
    return reply({ok:false,error:'Invalid bounded JSON.'},400);
  const step=await requireAdminStepUp(request,c.env,admin,body,
    'Build 619 independent one-use Etsy failure no-retry disposition');
  if(!step.ok)return step.response;
  if(body.action!=='witness_spent_etsy_failure')
    return reply({ok:false,...hold,error:'Unsafe or unsupported receipt action.'},400);
  try{
    const p=body.disposition?.payload;
    if(!p||!ID.test(p.test_nonce)||!ID.test(p.grant_id))
      throw Error('Missing exact failure scope.');
    const [failure,attempt]=await Promise.all([
      db.prepare(`SELECT test_nonce,grant_id,failure_sha256,status
        FROM dd619_etsy_failure_custody WHERE test_nonce=?`).bind(p.test_nonce).first(),
      db.prepare(`SELECT test_nonce,grant_id FROM dd618_provider_test_attempts
        WHERE test_nonce=?`).bind(p.test_nonce).first()]);
    if(failure?.grant_id!==p.grant_id)throw Error('Failure grant mismatch.');
    const verified=await verifyFailureDisposition619(body.disposition,{failure,attempt,
      authority:id=>root(db,id),pins:trustedPins614(c.env)});
    await db.prepare(`INSERT INTO dd619_etsy_failure_dispositions
      (disposition_sha256,test_nonce,failure_sha256,signed_bundle_json,status,created_by)
      VALUES (?,?,?,?,'WITNESSED_SPENT_NONCE_NO_RETRY',?)`).bind(
      verified.disposition_sha256,verified.test_nonce,verified.failure_sha256,
      JSON.stringify(body.disposition),admin.user_id).run();
    return reply({ok:true,...hold,...verified},201);
  }catch(error){
    if(/UNIQUE constraint|constraint failed/i.test(String(error)))
      return reply({ok:false,...hold,error:'Immutable failure disposition already exists.'},409);
    return reply({ok:false,...hold,
      error:'Independent exact failure witnesses not authenticated or source nonce not spent.'},422);
  }
}
