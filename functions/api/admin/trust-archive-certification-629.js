/* Build 629: only original-owner-supervised archive HTTPS byte retrieval and
 * separately signed readiness review. No Meta provider connection or writes. */
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {trustedPins614,sha256} from '../_lib/trustAuthority614.js';
import {verifyCustody628} from '../_lib/trustCustodyHandoff628.js';
import {FORMAT_629,APPROVE_629,HOLD_DECISION_629,HOLD_629,
  readExactOriginalArchives629,verifyGoLiveDecision629}
  from '../_lib/trustArchiveCertification629.js';
import {onRequestGet as read626} from './trust-owner-walkthrough-626.js';
import {originalReceipt627,roots627} from './trust-channel-decision-627.js';

const reply=(v,s=200)=>jsonResponse(v,s,{'Cache-Control':'no-store'});
const safe={build:629,release_gate:HOLD_629,connected:false,
  provider_channel_activated:false,publishing_enabled:false,
  provider_get_performed:false,provider_write:false,token_refreshed:false,
  automatic_connection:false,activation_executed:false,
  d1_migration_applied:false};
const HEX=/^[a-f0-9]{64}$/;
async function source(c,db){
  try{const res=await read626(c);
    if(!res.ok)return null;
    return originalReceipt627(db,await res.json());
  }catch{return null;}
}
const proof=(c,db,receipt)=>({receipt,roots:roots627(db),
  pins:trustedPins614(c.env)});
async function loadCustody(db,id){
  if(!HEX.test(id||''))throw Error('Original custody digest missing.');
  const row=await db.prepare(`SELECT custody_sha256,original_decision_sha256,
    original_packet_sha256,witness_sha256,receipt_sha256,page_id,
    primary_custody_ref,secondary_custody_ref,signed_original_decision_json,
    signed_custody_json,status FROM dd628_original_meta_signed_decision_custody
    WHERE custody_sha256=? LIMIT 1`).bind(id).first();
  if(!row||row.status!=='ORIGINAL_META_READONLY_DECISION_CUSTODY_OWNER_REVIEW_ONLY')
    throw Error('Original append-only signed custody missing.');
  return {row,originalBundle:JSON.parse(row.signed_original_decision_json),
    custodyBundle:JSON.parse(row.signed_custody_json)};
}
async function verifySavedCustody(c,db,receipt,id){
  const loaded=await loadCustody(db,id);
  const verified=await verifyCustody628(loaded.custodyBundle,
    {originalBundle:loaded.originalBundle,...proof(c,db,receipt)});
  const p=loaded.custodyBundle.payload,r=loaded.row;
  if(r.custody_sha256!==verified.custody_sha256||
    r.original_decision_sha256!==verified.original_decision_sha256||
    r.original_packet_sha256!==verified.original_packet_sha256||
    r.witness_sha256!==receipt.witness_sha256||
    r.receipt_sha256!==receipt.receipt_sha256||
    r.page_id!==receipt.page_id||
    r.primary_custody_ref!==p.primary_custody_ref||
    r.secondary_custody_ref!==p.secondary_custody_ref)
    throw Error('Original signed custody source row changed.');
  return {...loaded,verified};
}
async function loadReadback(db,id){
  const row=await db.prepare(`SELECT readback_sha256,custody_sha256,
    original_packet_sha256,primary_custody_ref,secondary_custody_ref,
    primary_sha256,secondary_sha256,primary_bytes,secondary_bytes,status,verified_at
    FROM dd629_original_meta_archive_readbacks WHERE custody_sha256=? LIMIT 1`)
    .bind(id).first();
  if(!row||row.status!=='TWO_ORIGINAL_INDEPENDENT_HTTPS_ARCHIVES_BYTE_IDENTICAL')
    throw Error('Two actual independent archive byte receipts not stored.');
  const {custody_sha256,original_packet_sha256,primary_custody_ref,
    secondary_custody_ref,primary_sha256,secondary_sha256,primary_bytes,
    secondary_bytes}=row;
  const exact={custody_sha256,original_packet_sha256,primary_custody_ref,
    secondary_custody_ref,primary_sha256,secondary_sha256,primary_bytes,
    secondary_bytes};
  if(await sha256(JSON.stringify(exact))!==row.readback_sha256)
    throw Error('Immutable original external archive readback digest changed.');
  return {...exact,readback_sha256:row.readback_sha256,
    actual_external_https_get_verified:true,
    both_archived_packets_byte_identical:true};
}
async function verifyRecordedDecision(c,db,receipt,stored,readback){
  const row=await db.prepare(`SELECT decision_sha256,custody_sha256,
    readback_sha256,original_decision_sha256,owner_decision,expires_at,
    signed_bundle_json,status FROM dd629_original_meta_go_live_decisions
    WHERE custody_sha256=? ORDER BY rowid DESC LIMIT 1`)
    .bind(stored.verified.custody_sha256).first();
  if(!row||row.status!=='SIGNED_ORIGINAL_OWNER_READINESS_DECISION_NO_CHANNEL')
    throw Error('No original three-party go-live review decision recorded.');
  const result=await verifyGoLiveDecision629(JSON.parse(row.signed_bundle_json),{
    custodyBundle:stored.custodyBundle,originalBundle:stored.originalBundle,
    readback,...proof(c,db,receipt)});
  if(result.decision_sha256!==row.decision_sha256||
    row.custody_sha256!==stored.verified.custody_sha256||
    row.readback_sha256!==readback.readback_sha256||
    row.original_decision_sha256!==stored.verified.original_decision_sha256||
    row.owner_decision!==result.original_owner_decision||
    row.expires_at!==result.certification_expires_at)
    throw Error('Recorded original owner go-live review decision altered.');
  return result;
}

export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const db=getDb(c.env);
  if(!db)return reply({ok:false,...safe,error:'Original D1 unavailable.'},503);
  const receipt=await source(c,db);
  let schemaReady=false,latest=null;
  try{latest=await db.prepare(`SELECT custody_sha256,readback_sha256,
    primary_bytes,secondary_bytes,verified_at
    FROM dd629_original_meta_archive_readbacks
    ORDER BY verified_at DESC,readback_sha256 DESC LIMIT 1`).first();
    await db.prepare(`SELECT decision_sha256 FROM dd629_original_meta_go_live_decisions LIMIT 1`).first();
    schemaReady=true;}catch{}
  return reply({ok:true,...safe,
    original_meta_source_window_current:!!receipt,
    original_archive_and_owner_decision_schema_present:schemaReady,
    proposed_0064_migration_not_auto_applied:true,
    latest_original_archive_readback:latest,
    independent_original_archive_readback_verified_in_this_request:false,
    go_live_readiness_certified:false,
    original_owner_handoff_requires_explicit_verification:true,
    next_owner_action:!receipt?
      'Complete original Meta issuer, witness, owner, encrypted credential and genuine single GET in Admin 44–49.':
      !schemaReady?'Original operator must separately approve proposed 0064 migration after 0052–0063 with backups.':
      'With a currently signed immutable custody packet, owner-supervise exact two-host HTTPS archive readback, then obtain a fresh separate three-party readiness decision.'});
}

export async function onRequestPost(c){
  const admin=await getAdminUserFromRequest(c.request,c.env);
  if(!admin)return reply({ok:false,error:'Admin session required.'},401);
  if(c.request.headers.get('origin')!==new URL(c.request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(c.request.headers.get('content-type')||''))
    return reply({ok:false,...safe,error:'Same-origin JSON required.'},403);
  if(Number(c.request.headers.get('content-length')||0)>16000)
    return reply({ok:false,...safe,error:'Original signed decision exceeds bound.'},413);
  let body;try{body=await c.request.json();}catch{
    return reply({ok:false,...safe,error:'Invalid signed JSON.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||
    JSON.stringify(body).length>16000||!HEX.test(body.custody_sha256||'')||
    !['read_back_two_original_archives','prepare_go_live_readiness_decision',
      'record_signed_go_live_readiness','verify_original_go_live_readiness'].includes(body.action))
    return reply({ok:false,...safe,error:'Exact original custody and owner decision action required.'},400);
  const db=getDb(c.env);
  if(!db)return reply({ok:false,...safe,error:'Original D1 unavailable.'},503);
  const receipt=await source(c,db);
  if(!receipt)return reply({ok:false,...safe,error:'Current original Meta GET, source authority or signed window unavailable.'},422);
  const step=await requireAdminStepUp(c.request,c.env,admin,body,
    'original owner archive byte readback and Meta readiness review');
  if(!step.ok)return step.response;
  try{
    const stored=await verifySavedCustody(c,db,receipt,body.custody_sha256);
    if(body.action==='read_back_two_original_archives'){
      const existing=await db.prepare(`SELECT readback_sha256 FROM dd629_original_meta_archive_readbacks
        WHERE custody_sha256=? LIMIT 1`).bind(body.custody_sha256).first();
      if(existing)throw Error('Original archive byte readback already recorded; no second fetch.');
      const observed=await readExactOriginalArchives629(stored.custodyBundle,
        stored.originalBundle,{fetchApi:globalThis.fetch});
      // Source authority must still be valid AFTER both network reads and
      // before a one-time immutable receipt is recorded.
      const fresh=await source(c,db);
      if(!fresh)throw Error('Original source window expired during independent retrieval.');
      await verifySavedCustody(c,db,fresh,body.custody_sha256);
      const r=await db.prepare(`INSERT INTO dd629_original_meta_archive_readbacks
        (readback_sha256,custody_sha256,original_packet_sha256,
         primary_custody_ref,secondary_custody_ref,primary_sha256,secondary_sha256,
         primary_bytes,secondary_bytes,status,verified_by)
        VALUES (?,?,?,?,?,?,?,?,?,
          'TWO_ORIGINAL_INDEPENDENT_HTTPS_ARCHIVES_BYTE_IDENTICAL',?)`).bind(
        observed.readback_sha256,observed.custody_sha256,
        observed.original_packet_sha256,observed.primary_custody_ref,
        observed.secondary_custody_ref,observed.primary_sha256,
        observed.secondary_sha256,observed.primary_bytes,observed.secondary_bytes,
        admin.user_id).run();
      if(r.meta?.changes!==1)throw Error('Immutable two-archive byte witness not saved.');
      return reply({ok:true,...safe,readback_sha256:observed.readback_sha256,
        custody_sha256:observed.custody_sha256,
        actual_independent_two_host_https_get_verified:true,
        both_archive_byte_streams_exact_original_packet:true,
        original_archive_readback_recorded:true,
        go_live_readiness_certified:false,
        no_meta_provider_request_or_connection:true},201);
    }
    const readback=await loadReadback(db,body.custody_sha256);
    if(readback.original_packet_sha256!==stored.verified.original_packet_sha256||
      readback.primary_custody_ref!==stored.custodyBundle.payload.primary_custody_ref||
      readback.secondary_custody_ref!==stored.custodyBundle.payload.secondary_custody_ref)
      throw Error('External archived bytes are not for the current original custody.');
    if(body.action==='prepare_go_live_readiness_decision'){
      return reply({ok:true,...safe,
        actual_saved_archive_byte_readback_hash_verified:true,
        unsigned_original_owner_readiness_template:{format:FORMAT_629,
          custody_sha256:stored.verified.custody_sha256,
          original_decision_sha256:stored.verified.original_decision_sha256,
          original_packet_sha256:stored.verified.original_packet_sha256,
          readback_sha256:readback.readback_sha256,
          witness_sha256:receipt.witness_sha256,
          receipt_sha256:receipt.receipt_sha256,page_id:receipt.page_id,
          decision:APPROVE_629,nonce:'ENTER_NEW_INDEPENDENT_NONCE_AT_LEAST_20_CHARS',
          issued_at:'ENTER_CURRENT_UTC_TIMESTAMP',
          expires_at:'ENTER_BEFORE_627_AND_628_EXPIRIES_MAX_10_MINUTES'},
        original_signer_roles:['ISSUER','WITNESS','OWNER'],
        template_not_authorization:true,go_live_readiness_certified:false});
    }
    if(body.action==='record_signed_go_live_readiness'){
      const signed=body.signed_bundle;
      const verified=await verifyGoLiveDecision629(signed,{
        custodyBundle:stored.custodyBundle,originalBundle:stored.originalBundle,
        readback,...proof(c,db,receipt)});
      const p=signed.payload;
      const r=await db.prepare(`INSERT INTO dd629_original_meta_go_live_decisions
        (decision_sha256,custody_sha256,readback_sha256,
         original_decision_sha256,owner_decision,expires_at,signed_bundle_json,
         status,recorded_by) VALUES (?,?,?,?,?,?,?,
         'SIGNED_ORIGINAL_OWNER_READINESS_DECISION_NO_CHANNEL',?)`).bind(
        verified.decision_sha256,p.custody_sha256,p.readback_sha256,
        p.original_decision_sha256,p.decision,p.expires_at,
        JSON.stringify(signed),admin.user_id).run();
      if(r.meta?.changes!==1)throw Error('Signed original owner readiness not saved.');
      return reply({ok:true,...safe,...verified,
        immutable_original_owner_readiness_decision_recorded:true,
        original_owner_activation_not_authorized_by_this_endpoint:true},201);
    }
    const verified=await verifyRecordedDecision(c,db,receipt,stored,readback);
    return reply({ok:true,...safe,...verified,
      original_owner_readiness_source_reverified:true,
      operational_activation_requires_new_scope_and_action:true});
  }catch{return reply({ok:false,...safe,
    error:'Original archive bytes, signed custody, current owner identity or immutable readiness decision failed. No Meta action performed.'},422);}
}
