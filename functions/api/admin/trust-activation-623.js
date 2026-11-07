/* Build 623: original owner-supervised signed evidence only. No credential
 * enrollment, OAuth writes, provider request repetition or actual publication. */
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {trustedPins614} from '../_lib/trustAuthority614.js';
import {scopesFingerprint620,verifyMetaGrant620} from '../_lib/trustAuditMeta620.js';
import {metaReadOnlyPreflight619} from '../_lib/trustReconcile619.js';
import {verifyMetaClosure622} from '../_lib/trustArchive622.js';
import {digestFullHistory621} from '../_lib/trustHistory621.js';
import {HOLD_623,verifyOriginalCompletion623,verifyArchiveContinuity623,
  verifyReadOnlyWindow623} from '../_lib/trustActivation623.js';

const reply=(value,status=200)=>jsonResponse(value,status,{'Cache-Control':'no-store'});
const hold={build:623,release_gate:HOLD_623,connected:false,provider_write:false,
  provider_get_performed:false,meta_publishing:false,original_root_enrolled:false,
  d1_migration_performed:false};
const unavailable={ok:false,...hold,error:'Original owner-approved proposed D1 0052–0061 unavailable or not applied.'};
const HEX=/^[a-f0-9]{64}$/;
async function database(env){
  const db=getDb(env);if(!db)return null;
  try{for(const q of [
    'SELECT completion_sha256 FROM dd623_original_meta_completions LIMIT 1',
    'SELECT continuity_sha256 FROM dd623_archive_continuity_witnesses LIMIT 1',
    'SELECT window_sha256 FROM dd623_meta_readonly_windows LIMIT 1',
    'SELECT test_nonce FROM dd622_meta_test_closures LIMIT 1',
    'SELECT test_nonce FROM dd622_archive_readbacks LIMIT 1',
    'SELECT authority_id FROM dd616_key_quarantines LIMIT 1'])await db.prepare(q).all();
    return db;}catch{return null;}
}
const root=(db,id)=>db.prepare(`SELECT a.authority_id,a.role,a.public_key,a.key_sha256,
  CASE WHEN EXISTS(SELECT 1 FROM dd616_key_quarantines q
    WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)
  THEN 'QUARANTINED' ELSE a.status END AS status
  FROM dd614_authorities a WHERE a.authority_id=? LIMIT 1`).bind(id).first();
const ledger=db=>db.prepare(`SELECT event_hash,sequence FROM dd614_owner_decisions
  ORDER BY sequence DESC LIMIT 1`).first();
const meta=db=>db.prepare(`SELECT provider_key,remote_subject_id,connection_status,
  scopes_json,access_expires_at FROM oauth_provider_connections WHERE provider_key='meta' LIMIT 1`).first();
const grant=(db,id)=>db.prepare(`SELECT grant_id,issuer_authority_id,original_source_sha256,
  checkpoint_sha256,expected_page_id,scopes_sha256,test_nonce,approval_sha256,
  signed_bundle_json,status FROM dd620_meta_read_grants WHERE grant_id=?`).bind(id).first();
const closure=(db,hash)=>db.prepare(`SELECT closure_sha256,test_nonce,witness_acceptance_sha256,
  archive_readback_sha256,signed_bundle_json,status
  FROM dd622_meta_test_closures WHERE closure_sha256=?`).bind(hash).first();
const archive=(db,hash)=>db.prepare(`SELECT test_nonce,manifest_sha256,
  archive_readback_sha256,status,created_at FROM dd622_archive_readbacks
  WHERE archive_readback_sha256=? LIMIT 1`).bind(hash).first();
const archiveNonce=(db,nonce)=>db.prepare(`SELECT test_nonce,manifest_sha256,
  archive_readback_sha256,status,created_at FROM dd622_archive_readbacks
  WHERE test_nonce=?`).bind(nonce).first();
const archiveFailure=(db,nonce)=>db.prepare(`SELECT test_nonce FROM dd622_archive_failures
  WHERE test_nonce=?`).bind(nonce).first();
const metaSource=(db,id)=>db.prepare(`SELECT authority_id,original_source_sha256,status
  FROM dd620_meta_original_source_registrations WHERE authority_id=?`).bind(id).first();
const history=(db,id)=>db.prepare(`SELECT manifest_sha256,history_sha256,original_source_sha256,
  checkpoint_sha256,signed_bundle_json,status
  FROM dd621_etsy_history_checkpoints WHERE manifest_sha256=?`).bind(id).first();
const originalEtsy=(db,id)=>db.prepare(`SELECT authority_id,original_source_sha256,status
  FROM dd618_original_source_registrations WHERE authority_id=? AND provider='ETSY'`).bind(id).first();
const completion=(db,hash)=>db.prepare(`SELECT completion_sha256,grant_id,test_nonce,
  issuer_authority_id,meta_closure_sha256,archive_readback_sha256,signed_bundle_json,status
  FROM dd623_original_meta_completions WHERE completion_sha256=?`).bind(hash).first();
const continuity=(db,hash)=>db.prepare(`SELECT continuity_sha256,history_manifest_sha256,
  first_archive_nonce,second_archive_nonce,signed_bundle_json,status
  FROM dd623_archive_continuity_witnesses WHERE continuity_sha256=?`).bind(hash).first();
const recent=(db,table,cols)=>db.prepare(`SELECT ${cols} FROM ${table}
  ORDER BY created_at DESC LIMIT 20`).all();
const rootsFor=(db,env)=>({roots:id=>root(db,id),pins:trustedPins614(env)});
async function originalMetaScope(db,env,approved){
  const [connection,source,checkpoint,head]=await Promise.all([
    meta(db),metaSource(db,approved?.issuer_authority_id),
    db.prepare(`SELECT checkpoint_sha256,original_issuer_source_sha256,status
      FROM dd617_external_readbacks WHERE checkpoint_sha256=?`).bind(
      approved?.checkpoint_sha256||'').first(),ledger(db)]);
  if(!approved||!connection||!head||!checkpoint||
    !metaReadOnlyPreflight619(connection).facebook_page_read_candidate||
    connection.remote_subject_id!==approved.expected_page_id)
    throw Error('Original Meta Page ID and verified read-only authority missing.');
  const signed=JSON.parse(approved.signed_bundle_json);
  const verified=await verifyMetaGrant620(signed,{grant:approved,originalSource:source,
    checkpoint,now:signed.payload.issued_at,...rootsFor(db,env)});
  let scopes;try{scopes=JSON.parse(connection.scopes_json);}catch{
    throw Error('Original Meta OAuth permissions unreadable.');}
  const fingerprint=await scopesFingerprint620(scopes);
  if(fingerprint!==approved.scopes_sha256||verified.page_id!==approved.expected_page_id)
    throw Error('Original provider account or approved scopes drifted.');
  return {connection,source,head,scopes_sha256:fingerprint};
}

/* Revalidate a stored signed original Meta closure without repeating its provider GET. */
async function verifiedClosure(db,env,approved,closed){
  if(!closed||!approved)throw Error('Original real Page GET closure absent.');
  const [attempt,receipt,failure,witnessed,archived]=await Promise.all([
    db.prepare(`SELECT test_nonce,grant_id,status FROM dd620_meta_test_attempts
      WHERE test_nonce=?`).bind(closed.test_nonce).first(),
    db.prepare(`SELECT test_nonce,remote_page_id,receipt_sha256,status
      FROM dd620_meta_test_outcomes WHERE test_nonce=?`).bind(closed.test_nonce).first(),
    db.prepare(`SELECT test_nonce FROM dd620_meta_test_failures
      WHERE test_nonce=?`).bind(closed.test_nonce).first(),
    db.prepare(`SELECT acceptance_sha256,test_nonce,grant_id,receipt_sha256,
      history_manifest_sha256,status FROM dd621_meta_get_witness_acceptances
      WHERE test_nonce=?`).bind(closed.test_nonce).first(),
    archive(db,closed.archive_readback_sha256)]);
  const original=await metaSource(db,approved.issuer_authority_id),
    manifest=witnessed?await history(db,witnessed.history_manifest_sha256):null;
  const signed=JSON.parse(closed.signed_bundle_json);
  const checked=await verifyMetaClosure622(signed,{grant:approved,attempt,receipt,failure,
    witnessed,archive:archived,history:manifest,metaSource:original,
    now:signed.payload.issued_at,...rootsFor(db,env)});
  if(checked.closure_sha256!==closed.closure_sha256)
    throw Error('Original signed genuine Meta GET closure altered.');
  return {archived,manifest,checked};
}
async function verifyRecordedContinuity(db,env,row){
  if(!row)throw Error('Independent archive continuity absent.');
  const signed=JSON.parse(row.signed_bundle_json),p=signed.payload;
  const [manifest,first,second,firstFailed,secondFailed]=await Promise.all([
    history(db,row.history_manifest_sha256),archiveNonce(db,row.first_archive_nonce),
    archiveNonce(db,row.second_archive_nonce),archiveFailure(db,row.first_archive_nonce),
    archiveFailure(db,row.second_archive_nonce)]);
  const firstIssuer=manifest?JSON.parse(manifest.signed_bundle_json)
    .signatures.find(x=>x.role==='ISSUER')?.authority_id:null;
  const original=firstIssuer?await originalEtsy(db,firstIssuer):null;
  const verified=await verifyArchiveContinuity623(signed,{history:manifest,
    first,second,firstFailure:firstFailed,secondFailure:secondFailed,
    originalSource:original,now:p.issued_at,...rootsFor(db,env)});
  if(verified.continuity_sha256!==row.continuity_sha256)
    throw Error('Immutable archive continuity digest changed.');
  return {verified,first,second,manifest,original};
}
async function verifyRecordedCompletion(db,env,row){
  if(!row)throw Error('Original owner Meta authority completion absent.');
  const signed=JSON.parse(row.signed_bundle_json),p=signed.payload;
  const [approved,closed,archived,source]=await Promise.all([
    grant(db,row.grant_id),closure(db,row.meta_closure_sha256),
    archive(db,row.archive_readback_sha256),metaSource(db,row.issuer_authority_id)]);
  await originalMetaScope(db,env,approved);
  await verifiedClosure(db,env,approved,closed);
  const verified=await verifyOriginalCompletion623(signed,{grant:approved,closure:closed,
    archive:archived,metaSource:source,now:p.issued_at,...rootsFor(db,env)});
  if(verified.completion_sha256!==row.completion_sha256)
    throw Error('Immutable original owner completion digest changed.');
  return {approved,closed,archived,source};
}
export async function readOnlyWindow(db,env,windowRow){
  if(!windowRow)return {state:'NO_ORIGINAL_WINDOW_ON_HOLD',verified:false};
  try{
    const signed=JSON.parse(windowRow.signed_bundle_json),p=signed.payload;
    const [completed,continued,closed,manifest,approved,head,snapshot]=await Promise.all([
      completion(db,p.completion_sha256),continuity(db,p.continuity_sha256),
      closure(db,p.meta_closure_sha256),history(db,p.history_manifest_sha256),
      grant(db,p.grant_id),ledger(db),digestFullHistory621(db)]);
    await Promise.all([
      verifyRecordedCompletion(db,env,completed),
      verifyRecordedContinuity(db,env,continued)]);
    const scoped=await originalMetaScope(db,env,approved);
    const ready=await verifyReadOnlyWindow623(signed,{completion:completed,
      continuity:{...continued,
        first_readback_sha256:JSON.parse(continued.signed_bundle_json).payload.first_readback_sha256,
        second_readback_sha256:JSON.parse(continued.signed_bundle_json).payload.second_readback_sha256},
      closure:closed,history:manifest,grant:approved,ledger:head,liveHistory:snapshot,
      meta:{provider_key:scoped.connection.provider_key,
        remote_subject_id:scoped.connection.remote_subject_id,
        scopes_sha256:scoped.scopes_sha256,page_read_candidate:true},
      ...rootsFor(db,env)});
    if(ready.window_sha256!==windowRow.window_sha256||
      windowRow.status!=='META_ORIGINAL_READ_ONLY_STORED_PAGE_ID_TEST_WINDOW')
      throw Error('Original stored window was altered.');
    return {state:'VERIFIED_META_PAGE_ID_STORED_RECEIPT_READ_ONLY_TEST_WINDOW',
      verified:true,expires_at:ready.expires_at,window_sha256:ready.window_sha256,
      connected:false,provider_call_performed:false,posting_enabled:false};
  }catch{return {state:'HOLD_WINDOW_EXPIRED_REVOKED_OR_SOURCE_CHANGED',verified:false,
    connected:false,provider_call_performed:false,posting_enabled:false};}
}

export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const db=await database(c.env);if(!db)return reply(unavailable,503);
  try{
    const [completions,continuities,windows]=await Promise.all([
      recent(db,'dd623_original_meta_completions',
        'completion_sha256,test_nonce,issuer_authority_id,status,created_at'),
      recent(db,'dd623_archive_continuity_witnesses',
        'continuity_sha256,history_manifest_sha256,status,created_at'),
      recent(db,'dd623_meta_readonly_windows',
        'window_sha256,completion_sha256,continuity_sha256,expires_at,status,created_at')]);
    const latest=await db.prepare(`SELECT window_sha256,completion_sha256,continuity_sha256,
      meta_closure_sha256,grant_id,test_nonce,page_id,scopes_sha256,owner_ledger_head_sha256,
      expires_at,signed_bundle_json,status
      FROM dd623_meta_readonly_windows ORDER BY created_at DESC LIMIT 1`).first();
    return reply({ok:true,...hold,original_authority_completions:completions.results||[],
      original_archive_continuity:continuities.results||[],
      signed_readonly_windows:windows.results||[],
      derived_readonly_page_identity_window:await readOnlyWindow(db,c.env,latest),
      original_authority_automatically_enrolled:false,
      provider_ever_contacted_by_this_readback:false});
  }catch{return reply({...unavailable,error:'Original authority continuity or Meta TEST state readback unavailable.'},503);}
}

export async function onRequestPost(c){
  const admin=await getAdminUserFromRequest(c.request,c.env);
  if(!admin)return reply({ok:false,error:'Admin session required.'},401);
  if(c.request.headers.get('origin')!==new URL(c.request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(c.request.headers.get('content-type')||''))
    return reply({ok:false,error:'Same-origin JSON required.'},403);
  const db=await database(c.env);if(!db)return reply(unavailable,503);
  if(Number(c.request.headers.get('content-length')||0)>16000)
    return reply({ok:false,...hold,error:'Externally signed exact-scope bundle exceeds safe bound.'},413);
  let body;try{body=await c.request.json();}catch{
    return reply({ok:false,...hold,error:'Invalid signed JSON.'},400);}
  if(!body||Array.isArray(body)||typeof body!=='object'||
    JSON.stringify(body).length>16000||
    !['record_original_meta_completion','witness_two_original_archives',
      'record_one_readonly_meta_test_window'].includes(body.action)||
    !body.signed_bundle||typeof body.signed_bundle!=='object')
    return reply({ok:false,...hold,error:'Original separate signatures required.'},400);
  const step=await requireAdminStepUp(c.request,c.env,admin,body,
    'original issuer/witness/owner Page identity TEST authorization');
  if(!step.ok)return step.response;
  try{
    const signed=body.signed_bundle,p=signed.payload;
    if(body.action==='record_original_meta_completion'){
      if(!HEX.test(p?.meta_closure_sha256)||!HEX.test(p?.archive_readback_sha256))
        throw Error('Original witnessed source receipt missing.');
      const [approved,closed,archived]=await Promise.all([
        grant(db,p.grant_id),closure(db,p.meta_closure_sha256),
        archive(db,p.archive_readback_sha256)]);
      await originalMetaScope(db,c.env,approved);
      await verifiedClosure(db,c.env,approved,closed);
      const source=approved?await metaSource(db,approved.issuer_authority_id):null;
      const verified=await verifyOriginalCompletion623(signed,{grant:approved,
        closure:closed,archive:archived,metaSource:source,...rootsFor(db,c.env)});
      const r=await db.prepare(`INSERT INTO dd623_original_meta_completions
        (completion_sha256,grant_id,test_nonce,issuer_authority_id,
        meta_closure_sha256,archive_readback_sha256,signed_bundle_json,status,created_by)
        VALUES (?,?,?,?,?,?,?,
          'ORIGINAL_META_CUSTODY_SIGNED_PENDING_SEPARATE_ARCHIVE_CONTINUITY',?)`).bind(
        verified.completion_sha256,p.grant_id,p.test_nonce,p.issuer_authority_id,
        p.meta_closure_sha256,p.archive_readback_sha256,
        JSON.stringify(signed),admin.user_id).run();
      if(r.meta?.changes!==1)throw Error('Original authority completion not preserved.');
      return reply({ok:true,...hold,...verified,original_authority_enrolled_by_application:false},201);
    }
    if(body.action==='witness_two_original_archives'){
      if(!HEX.test(p?.history_manifest_sha256))throw Error('Original archive manifest missing.');
      const [manifest,first,second,firstFailed,secondFailed]=await Promise.all([
        history(db,p.history_manifest_sha256),archiveNonce(db,p.first_archive_nonce),
        archiveNonce(db,p.second_archive_nonce),archiveFailure(db,p.first_archive_nonce),
        archiveFailure(db,p.second_archive_nonce)]);
      const issuer=manifest?JSON.parse(manifest.signed_bundle_json)
        .signatures.find(x=>x.role==='ISSUER')?.authority_id:null;
      const original=issuer?await originalEtsy(db,issuer):null;
      const verified=await verifyArchiveContinuity623(signed,{history:manifest,
        first,second,firstFailure:firstFailed,secondFailure:secondFailed,
        originalSource:original,...rootsFor(db,c.env)});
      const r=await db.prepare(`INSERT INTO dd623_archive_continuity_witnesses
        (continuity_sha256,history_manifest_sha256,first_archive_nonce,
        second_archive_nonce,signed_bundle_json,status,created_by)
        VALUES (?,?,?,?,?,'TWO_INDEPENDENT_ORIGINAL_ARCHIVE_READBACKS_SIGNED',?)`).bind(
        verified.continuity_sha256,p.history_manifest_sha256,p.first_archive_nonce,
        p.second_archive_nonce,JSON.stringify(signed),admin.user_id).run();
      if(r.meta?.changes!==1)throw Error('Independent archive continuity not saved.');
      return reply({ok:true,...hold,...verified},201);
    }
    if(!HEX.test(p?.completion_sha256)||!HEX.test(p?.continuity_sha256)||
      !HEX.test(p?.meta_closure_sha256))throw Error('Original trust chain incomplete.');
    const [completed,continued,closed,manifest,approved,head,snapshot]=await Promise.all([
      completion(db,p.completion_sha256),continuity(db,p.continuity_sha256),
      closure(db,p.meta_closure_sha256),history(db,p.history_manifest_sha256),
      grant(db,p.grant_id),ledger(db),digestFullHistory621(db)]);
    await Promise.all([
      verifyRecordedCompletion(db,c.env,completed),
      verifyRecordedContinuity(db,c.env,continued)]);
    const scope=await originalMetaScope(db,c.env,approved);
    const original=JSON.parse(continued.signed_bundle_json).payload;
    const verified=await verifyReadOnlyWindow623(signed,{completion:completed,
      continuity:{...continued,first_readback_sha256:original.first_readback_sha256,
        second_readback_sha256:original.second_readback_sha256},
      closure:closed,history:manifest,grant:approved,ledger:head,liveHistory:snapshot,
      meta:{provider_key:scope.connection.provider_key,
        remote_subject_id:scope.connection.remote_subject_id,
        scopes_sha256:scope.scopes_sha256,page_read_candidate:true},
      ...rootsFor(db,c.env)});
    const r=await db.prepare(`INSERT INTO dd623_meta_readonly_windows
      (window_sha256,completion_sha256,continuity_sha256,meta_closure_sha256,
      grant_id,test_nonce,decision_nonce,page_id,scopes_sha256,
      owner_ledger_head_sha256,expires_at,signed_bundle_json,status,created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,
        'META_ORIGINAL_READ_ONLY_STORED_PAGE_ID_TEST_WINDOW',?)`).bind(
      verified.window_sha256,p.completion_sha256,p.continuity_sha256,
      p.meta_closure_sha256,p.grant_id,p.test_nonce,p.nonce,p.page_id,
      p.scopes_sha256,p.owner_ledger_head_sha256,p.expires_at,
      JSON.stringify(signed),admin.user_id).run();
    if(r.meta?.changes!==1)throw Error('Verified read-only Meta channel window not saved.');
    return reply({ok:true,...hold,...verified,read_only_stored_meta_page_identity_window:true},201);
  }catch(error){
    if(/UNIQUE constraint|constraint failed/i.test(String(error)))
      return reply({ok:false,...hold,error:'Original authority, archive continuity or read-only window evidence already exists.'},409);
    return reply({ok:false,...hold,error:'Original authority signatures, two independent archive receipts, genuine Meta GET, current owner or exact Page permissions not verified.'},422);
  }
}
