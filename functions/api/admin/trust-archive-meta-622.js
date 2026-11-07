/* Build 622: original source, independent readback, and actual Meta TEST closure.
 * Source deploy does not authorize D1 migration, original key enrollment or posting. */
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {trustedPins614,sha256} from '../_lib/trustAuthority614.js';
import {verifyMetaGrant620,scopesFingerprint620} from '../_lib/trustAuditMeta620.js';
import {metaReadOnlyPreflight619} from '../_lib/trustReconcile619.js';
import {FULL_ETSY_SQL_620} from './trust-audit-meta-620.js';
import {digestFullHistory621,verifyHistoryCheckpoint621,
  verifyMetaWitness621} from '../_lib/trustHistory621.js';
import {HOLD_622,verifyArchiveGrant622,fetchOriginalArchive622,archiveFailure622,
  verifyMetaClosure622} from '../_lib/trustArchive622.js';

const reply=(value,status=200)=>jsonResponse(value,status,{'Cache-Control':'no-store'});
const hold={build:622,release_gate:HOLD_622,connected:false,
  automatic_retries:false,provider_write:false,publication:false,
  original_authority_enrolled:false,d1_migration_performed:false};
const unavailable={ok:false,...hold,error:'Separate original D1 proposals 0052–0060 are not independently active.'};
const HEX=/^[a-f0-9]{64}$/;
async function database(env){
  const db=getDb(env);if(!db)return null;
  try{for(const query of [
    'SELECT test_nonce FROM dd622_archive_attempts LIMIT 1',
    'SELECT test_nonce FROM dd622_archive_readbacks LIMIT 1',
    'SELECT test_nonce FROM dd622_archive_failures LIMIT 1',
    'SELECT test_nonce FROM dd622_meta_test_closures LIMIT 1',
    'SELECT manifest_sha256 FROM dd621_etsy_history_checkpoints LIMIT 1',
    'SELECT authority_id FROM dd616_key_quarantines LIMIT 1'])await db.prepare(query).all();
    return db;}catch{return null;}
}
const root=(db,id)=>db.prepare(`SELECT a.authority_id,a.role,a.public_key,a.key_sha256,
  CASE WHEN EXISTS(SELECT 1 FROM dd616_key_quarantines q
    WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)
  THEN 'QUARANTINED' ELSE a.status END AS status
  FROM dd614_authorities a WHERE a.authority_id=? LIMIT 1`).bind(id).first();
const ledger=db=>db.prepare(`SELECT event_hash,sequence FROM dd614_owner_decisions
  ORDER BY sequence DESC LIMIT 1`).first();
const readback=(db,hash)=>db.prepare(`SELECT checkpoint_sha256,readback_sha256,
  ledger_head_sha256,ledger_sequence,custodian_id,original_issuer_source_sha256,status
  FROM dd617_external_readbacks WHERE checkpoint_sha256=?`).bind(hash).first();
const custodian=(db,id)=>db.prepare(`SELECT custodian_id,origin,status
  FROM dd617_anchor_custodians WHERE custodian_id=?`).bind(id).first();
const metaSource=(db,id)=>db.prepare(`SELECT authority_id,original_source_sha256,status
  FROM dd620_meta_original_source_registrations WHERE authority_id=?`).bind(id).first();
const history=(db,hash)=>db.prepare(`SELECT manifest_sha256,history_sha256,counts_sha256,
  checkpoint_sha256,original_source_sha256,external_receipt_sha256,
  external_custody_ref,signed_bundle_json,status
  FROM dd621_etsy_history_checkpoints WHERE manifest_sha256=?`).bind(hash).first();
const source=(db,id)=>db.prepare(`SELECT authority_id,original_source_sha256,status
  FROM dd618_original_source_registrations WHERE authority_id=? AND provider='ETSY'`).bind(id).first();
const connection=db=>db.prepare(`SELECT provider_key,remote_subject_id,connection_status,
  scopes_json,access_expires_at FROM oauth_provider_connections
  WHERE provider_key='meta' LIMIT 1`).first();

export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const db=await database(c.env);if(!db)return reply(unavailable,503);
  try{
    const [sources,meta,archive,failures,witnesses,grants]=await Promise.all([
      db.prepare(`SELECT authority_id,original_source_sha256,status,approved_at
        FROM dd620_meta_original_source_registrations ORDER BY approved_at DESC LIMIT 20`).all(),
      connection(db),
      db.prepare(`SELECT r.manifest_sha256,r.archive_readback_sha256,r.status,r.created_at
        FROM dd622_archive_readbacks r ORDER BY r.created_at DESC LIMIT 30`).all(),
      db.prepare(`SELECT test_nonce,failure_code,status,created_at
        FROM dd622_archive_failures ORDER BY created_at DESC LIMIT 30`).all(),
      db.prepare(`SELECT test_nonce,closure_sha256,status,created_at
        FROM dd622_meta_test_closures ORDER BY created_at DESC LIMIT 30`).all(),
      db.prepare(`SELECT grant_id,test_nonce,issuer_authority_id,expected_page_id,status,
        original_source_sha256,scopes_sha256
        FROM dd620_meta_read_grants ORDER BY approved_at DESC LIMIT 20`).all()]);
    const originals=sources.results||[],approved=grants.results||[];
    let scopeFingerprint=null;
    try{scopeFingerprint=await scopesFingerprint620(JSON.parse(meta?.scopes_json||''));}
    catch{/* Incomplete Meta OAuth permissions remain HOLD. */}
    let pins={};try{pins=trustedPins614(c.env);}catch{/* No original pins: HOLD. */}
    const candidateChecks=await Promise.all(approved.map(async grant=>{
      const authority=await root(db,grant.issuer_authority_id);
      const registration=originals.find(x=>x.authority_id===grant.issuer_authority_id);
      return {grant_id:grant.grant_id,test_nonce:grant.test_nonce,
        independently_pinned_original_issuer_candidate:!!authority&&
          authority.status==='ACTIVE_EXTERNAL_VERIFIED'&&
          pins[grant.issuer_authority_id]===authority.key_sha256,
        original_source_registration_matches:!!registration&&
          registration.status==='INDEPENDENTLY_APPROVED_ORIGINAL_META_SOURCE'&&
          registration.original_source_sha256===grant.original_source_sha256,
        meta_page_id_matches_saved:grant.expected_page_id===meta?.remote_subject_id,
        exact_oauth_scopes_match:!!scopeFingerprint&&scopeFingerprint===grant.scopes_sha256,
        original_provider_grant_signatures_checked_by_get:false,
        status:'PRELIMINARY_RECONCILIATION_NOT_AUTHORITY'};
    }));
    return reply({ok:true,...hold,
      meta_original_authority_reconciliation:{
        originals,saved_capability:metaReadOnlyPreflight619(meta),
        saved_original_page_id:meta?.remote_subject_id||null,
        grants:approved,grant_checks:candidateChecks,provider_contacted_by_readback:false,
        active_original_issuer_verified_by_readback:false,
        next_action:'Verify independently pinned original Meta issuer, current signed grant, actual spent GET, original witness and exact Page ID before any closure.'},
      verified_external_archive_readbacks:archive.results||[],
      spent_archive_failures:failures.results||[],
      witnessed_meta_test_closures:witnesses.results||[],
      external_archive_get_executed_by_this_get:false,
      genuine_meta_test_executed_by_this_get:false});
  }catch{return reply({...unavailable,error:'Original archive or Meta reconciliation readback failed.'},503);}
}

export async function onRequestPost(c){
  const admin=await getAdminUserFromRequest(c.request,c.env);
  if(!admin)return reply({ok:false,error:'Admin session required.'},401);
  if(c.request.headers.get('origin')!==new URL(c.request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(c.request.headers.get('content-type')||''))
    return reply({ok:false,error:'Same-origin JSON required.'},403);
  const db=await database(c.env);if(!db)return reply(unavailable,503);
  if(Number(c.request.headers.get('content-length')||0)>16000)
    return reply({ok:false,...hold,error:'Only bounded public signatures are accepted.'},413);
  let body;try{body=await c.request.json();}catch{
    return reply({ok:false,...hold,error:'Invalid JSON.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||
    JSON.stringify(body).length>16000||
    !['one_exact_original_archive_readback','close_one_witnessed_meta_page_get'].includes(body.action)||
    !body.signed_bundle||typeof body.signed_bundle!=='object')
    return reply({ok:false,...hold,error:'Original signed external evidence required.'},400);
  const step=await requireAdminStepUp(c.request,c.env,admin,body,
    'separately approved original external readback or witnessed Meta TEST closure');
  if(!step.ok)return step.response;
  try{
    const bundle=body.signed_bundle,p=bundle.payload;
    if(body.action==='one_exact_original_archive_readback'){
      if(!HEX.test(p?.manifest_sha256)||!HEX.test(p?.checkpoint_sha256))
        throw Error('Original history manifest missing.');
      const [manifest,checkpoint,head,snapshot,allCounts]=await Promise.all([
        history(db,p.manifest_sha256),readback(db,p.checkpoint_sha256),
        ledger(db),digestFullHistory621(db),db.prepare(FULL_ETSY_SQL_620).first()]);
      const [approvedCustodian,historySource]=await Promise.all([
        checkpoint?custodian(db,checkpoint.custodian_id):null,
        manifest?source(db,JSON.parse(manifest.signed_bundle_json).signatures.find(
          x=>x.role==='ISSUER')?.authority_id):null]);
      const pins=trustedPins614(c.env),roots=id=>root(db,id);
      const validated=await verifyHistoryCheckpoint621(
        JSON.parse(manifest.signed_bundle_json),{snapshot,counts:allCounts,ledger:head,
          checkpoint,custodian:approvedCustodian,originalSource:historySource,
          roots,pins,now:JSON.parse(manifest.signed_bundle_json).payload.issued_at});
      if(validated.manifest_sha256!==p.manifest_sha256)
        throw Error('Stored original history signatures do not match manifest.');
      const grant=await verifyArchiveGrant622(bundle,{history:manifest,
        custodian:approvedCustodian,checkpoint,ledger:head,currentHistory:snapshot,
        source:historySource,roots,pins});
      // Consume exactly one independently signed nonce before contacting external archive.
      const r=await db.prepare(`INSERT INTO dd622_archive_attempts
        (test_nonce,manifest_sha256,archive_grant_sha256,signed_bundle_json,status,created_by)
        SELECT ?,?,?,?,'SINGLE_ORIGINAL_ARCHIVE_GET_NONCE_SPENT',?
        WHERE NOT EXISTS(SELECT 1 FROM dd622_archive_attempts WHERE test_nonce=?)
        AND NOT EXISTS(SELECT 1 FROM dd616_key_quarantines q
          JOIN dd614_authorities a ON a.authority_id IN (?,?,?)
          WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)`).bind(
        p.test_nonce,p.manifest_sha256,grant.archive_grant_sha256,
        JSON.stringify(bundle),admin.user_id,p.test_nonce,...grant.signers).run();
      if(r.meta?.changes!==1)throw Error('Original archive nonce already spent.');
      const preserve=async code=>{
        const digest=await sha256(JSON.stringify({build:622,test_nonce:p.test_nonce,
          manifest_sha256:p.manifest_sha256,code}));
        try{const result=await db.prepare(`INSERT INTO dd622_archive_failures
          (test_nonce,failure_sha256,failure_code,status)
          VALUES (?,?,?,'SPENT_ARCHIVE_NONCE_NO_RETRY')`).bind(
          p.test_nonce,digest,code).run();return result.meta?.changes===1;
        }catch{return false;}
      };
      let observed;
      try{
        const original=JSON.parse(manifest.signed_bundle_json).payload;
        observed=await fetchOriginalArchive622({url:p.archive_url,
          origin:approvedCustodian.origin,history:{...manifest,
            ledger_head_sha256:original.ledger_head_sha256,
            ledger_sequence:original.ledger_sequence,signed_at:original.issued_at}});
      }catch(error){const recorded=await preserve(archiveFailure622(error));
        return reply({ok:false,...hold,original_archive_nonce_spent:true,
          failure_recorded:recorded,error:'Exact independent archive GET not verified; nonce spent. Never retry.'},422);}
      try{const result=await db.prepare(`INSERT INTO dd622_archive_readbacks
        (test_nonce,manifest_sha256,archive_readback_sha256,status)
        VALUES (?,?,?,'EXTERNAL_ARCHIVE_GET_MATCHED_COMPLETE_HISTORY_NO_PROVIDER_AUTHORITY')`).bind(
        p.test_nonce,p.manifest_sha256,observed.archive_readback_sha256).run();
        if(result.meta?.changes!==1)throw Error('Immutable archive receipt not saved.');
      }catch{const recorded=await preserve('RECEIPT_STORE_FAILED');
        return reply({ok:false,...hold,original_archive_nonce_spent:true,
          failure_recorded:recorded,error:'Archive GET returned but immutable evidence could not be preserved; no retry.'},503);}
      return reply({ok:true,...hold,...observed,original_archive_nonce_spent:true,
        original_signed_issuer_witness_owner_verified:true},201);
    }
    if(!HEX.test(p?.history_manifest_sha256)||!HEX.test(p?.checkpoint_sha256))
      throw Error('Original source history or Meta TEST closure missing.');
    const [grant,attempt,receipt,failure,witnessed,manifest,archive,archiveFailure,meta,head,checkpoint]=await Promise.all([
      db.prepare(`SELECT grant_id,issuer_authority_id,original_source_sha256,
        checkpoint_sha256,expected_page_id,scopes_sha256,test_nonce,approval_sha256,
        signed_bundle_json,status FROM dd620_meta_read_grants WHERE grant_id=?`).bind(p.grant_id).first(),
      db.prepare(`SELECT test_nonce,grant_id,status FROM dd620_meta_test_attempts WHERE test_nonce=?`).bind(p.test_nonce).first(),
      db.prepare(`SELECT test_nonce,receipt_sha256,remote_page_id,status FROM dd620_meta_test_outcomes WHERE test_nonce=?`).bind(p.test_nonce).first(),
      db.prepare(`SELECT test_nonce FROM dd620_meta_test_failures WHERE test_nonce=?`).bind(p.test_nonce).first(),
      db.prepare(`SELECT acceptance_sha256,test_nonce,grant_id,receipt_sha256,
        history_manifest_sha256,signed_bundle_json,status
        FROM dd621_meta_get_witness_acceptances WHERE test_nonce=?`).bind(p.test_nonce).first(),
      history(db,p.history_manifest_sha256),
      db.prepare(`SELECT r.test_nonce,r.manifest_sha256,r.archive_readback_sha256,r.status
        FROM dd622_archive_readbacks r WHERE r.archive_readback_sha256=?
        AND r.manifest_sha256=? LIMIT 1`).bind(
        p.archive_readback_sha256,p.history_manifest_sha256).first(),
      db.prepare(`SELECT f.test_nonce FROM dd622_archive_failures f
        JOIN dd622_archive_readbacks r ON r.test_nonce=f.test_nonce
        WHERE r.archive_readback_sha256=? AND r.manifest_sha256=? LIMIT 1`).bind(
        p.archive_readback_sha256,p.history_manifest_sha256).first(),
      connection(db),ledger(db),readback(db,p.checkpoint_sha256)]);
    if(!grant||!manifest||!checkpoint||!head||archiveFailure||
      head.event_hash!==checkpoint.ledger_head_sha256||
      head.sequence!==checkpoint.ledger_sequence||
      !metaReadOnlyPreflight619(meta).facebook_page_read_candidate||
      meta.remote_subject_id!==p.expected_page_id)
      throw Error('Original Meta provider identity or current owner ledger changed.');
    const pins=trustedPins614(c.env),roots=id=>root(db,id);
    const originalSource=await metaSource(db,grant.issuer_authority_id);
    const approvedGrant=JSON.parse(grant.signed_bundle_json);
    const verified=await verifyMetaGrant620(approvedGrant,{grant,
      originalSource,checkpoint,roots,pins,now:approvedGrant.payload.issued_at});
    let scopes;try{scopes=JSON.parse(meta.scopes_json);}catch{throw Error('Invalid Meta read scope.');}
    if(await scopesFingerprint620(scopes)!==grant.scopes_sha256||
      verified.page_id!==p.expected_page_id)
      throw Error('Original Meta scopes or verified Page ID changed.');
    if(!witnessed)throw Error('No actual original Meta witness receipt.');
    const witnessedBundle=JSON.parse(witnessed.signed_bundle_json);
    const exactWitness=await verifyMetaWitness621(witnessedBundle,{grant,attempt,
      receipt,failure,history:manifest,metaSource:originalSource,roots,pins,
      now:witnessedBundle.payload.issued_at});
    if(exactWitness.acceptance_sha256!==witnessed.acceptance_sha256)
      throw Error('Original Meta witness changed.');
    const snapshot=await digestFullHistory621(db);
    if(snapshot.history_sha256!==manifest.history_sha256)
      throw Error('Original Etsy full-history hash changed since archive readback.');
    const closure=await verifyMetaClosure622(bundle,{grant,attempt,receipt,failure,
      witnessed,archive,history:manifest,metaSource:originalSource,roots,pins});
    const r=await db.prepare(`INSERT INTO dd622_meta_test_closures
      (closure_sha256,test_nonce,witness_acceptance_sha256,archive_readback_sha256,
      signed_bundle_json,status,created_by)
      VALUES (?,?,?,?,?,'ORIGINAL_META_SINGLE_GET_WITNESSED_READ_ONLY_NO_CONNECTION',?)`).bind(
      closure.closure_sha256,p.test_nonce,p.witness_acceptance_sha256,
      p.archive_readback_sha256,JSON.stringify(bundle),admin.user_id).run();
    if(r.meta?.changes!==1)throw Error('Actual Meta closure receipt not persisted.');
    return reply({ok:true,...hold,...closure,only_single_read_only_provider_test_closed:true},201);
  }catch(error){
    if(/UNIQUE constraint|constraint failed/i.test(String(error)))
      return reply({ok:false,...hold,error:'One original archive nonce or Meta TEST closure already consumed.'},409);
    return reply({ok:false,...hold,error:'Independent external archive, original signer pins, current Meta identity, witnessed real GET or owner authority missing/mismatched.'},422);
  }
}
