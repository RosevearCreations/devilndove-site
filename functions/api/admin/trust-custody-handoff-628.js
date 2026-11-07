/* Build 628 original owner-only custody and go-live review handoff.
 * Never connects Meta, calls a provider or declares archived bytes read back. */
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {trustedPins614,sha256} from '../_lib/trustAuthority614.js';
import {verifyDecision627} from '../_lib/trustChannelDecision627.js';
import {FORMAT_628,DECISION_628,HOLD_628,verifyCustody628}
  from '../_lib/trustCustodyHandoff628.js';
import {onRequestGet as read626} from './trust-owner-walkthrough-626.js';
import {originalReceipt627,roots627} from './trust-channel-decision-627.js';

const reply=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const safe={build:628,release_gate:HOLD_628,connected:false,
  provider_channel_activated:false,publishing_enabled:false,
  provider_get_performed:false,provider_write:false,token_refreshed:false,
  external_archive_readback_verified:false,go_live_eligible:false,
  automatic_handoff:false,source_migration_performed:false};
const HEX=/^[a-f0-9]{64}$/;
async function source(c,db){
  try{const result=await read626(c);
    if(!result.ok)return null;
    const current=await result.json();
    return await originalReceipt627(db,current);
  }catch{return null;}
}
const pins=c=>trustedPins614(c.env);
const check=(db,c,receipt)=>({receipt,roots:roots627(db),pins:pins(c)});
async function savedCustody(db,id){
  if(!HEX.test(id||''))return null;
  return db.prepare(`SELECT custody_sha256,original_decision_sha256,
    original_packet_sha256,witness_sha256,receipt_sha256,page_id,
    primary_custody_ref,secondary_custody_ref,signed_original_decision_json,
    signed_custody_json,status,created_at FROM dd628_original_meta_signed_decision_custody
    WHERE custody_sha256=? LIMIT 1`).bind(id).first();
}
export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const db=getDb(c.env);
  if(!db)return reply({ok:false,...safe,error:'Original D1 unavailable.'},503);
  const receipt=await source(c,db);
  let latest=null,tableReady=false;
  try{latest=await db.prepare(`SELECT custody_sha256,original_decision_sha256,
    witness_sha256,page_id,status,created_at
    FROM dd628_original_meta_signed_decision_custody
    ORDER BY created_at DESC,custody_sha256 DESC LIMIT 1`).first();
    tableReady=true;}catch{}
  return reply({ok:true,...safe,
    signed_original_single_get_current:!!receipt,
    owner_custody_schema_present:tableReady,
    source_migration_0063_proposed_only:!tableReady,
    latest_original_owner_custody:latest,
    signed_packet_private_export_required:true,
    independent_external_archive_bytes_not_fetched:true,
    owner_handoff_candidate_only:true,
    next_owner_action:!receipt?
      'Return to Admin 44–48: original issuer, witness and owner must verify current genuine GET and sign the exact 627 decision.':
      !tableReady?'Original operator: separately approve and verify the proposed 0063 D1 migration after 0052–0062.':
      'In Admin 49, obtain three original signatures for the exact custody packet. External archive content must be independently read back before any future go-live decision.'});
}
export async function onRequestPost(c){
  const admin=await getAdminUserFromRequest(c.request,c.env);
  if(!admin)return reply({ok:false,error:'Admin session required.'},401);
  if(c.request.headers.get('origin')!==new URL(c.request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(c.request.headers.get('content-type')||''))
    return reply({ok:false,...safe,error:'Same-origin JSON required.'},403);
  if(Number(c.request.headers.get('content-length')||0)>32000)
    return reply({ok:false,...safe,error:'Original signed evidence exceeds bound.'},413);
  let body;try{body=await c.request.json();}catch{
    return reply({ok:false,...safe,error:'Invalid JSON.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||
    JSON.stringify(body).length>32000||
    !['prepare_custody_template','archive_signed_original_custody',
      'prepare_owner_review_handoff'].includes(body.action))
    return reply({ok:false,...safe,error:'Original owner-only custody action required.'},400);
  const db=getDb(c.env);
  if(!db)return reply({ok:false,...safe,error:'Original D1 unavailable.'},503);
  const receipt=await source(c,db);
  if(!receipt)return reply({ok:false,...safe,
    error:'Current original signed source and genuine Meta GET acceptance missing.'},422);
  const step=await requireAdminStepUp(c.request,c.env,admin,body,
    'original owner Meta signed custody and review-only handoff');
  if(!step.ok)return step.response;
  try{
    if(body.action==='prepare_owner_review_handoff'){
      const row=await savedCustody(db,body.custody_sha256);
      if(!row||row.status!=='ORIGINAL_META_READONLY_DECISION_CUSTODY_OWNER_REVIEW_ONLY')
        throw Error('Saved original custody not found.');
      const originalBundle=JSON.parse(row.signed_original_decision_json),
        custodyBundle=JSON.parse(row.signed_custody_json);
      const verified=await verifyCustody628(custodyBundle,{originalBundle,...check(db,c,receipt)});
      if(verified.custody_sha256!==row.custody_sha256||
        verified.original_decision_sha256!==row.original_decision_sha256||
        verified.original_packet_sha256!==row.original_packet_sha256||
        row.witness_sha256!==receipt.witness_sha256||
        row.page_id!==receipt.page_id||row.receipt_sha256!==receipt.receipt_sha256||
        row.primary_custody_ref!==custodyBundle.payload.primary_custody_ref||
        row.secondary_custody_ref!==custodyBundle.payload.secondary_custody_ref)
        throw Error('Original custody database integrity changed.');
      return reply({ok:true,...safe,...verified,
        immutable_original_custody_readback_verified:true,
        original_owner_signed_review_packet:{
          format:FORMAT_628,decision_sha256:verified.original_decision_sha256,
          custody_sha256:verified.custody_sha256,
          receipt_sha256:receipt.receipt_sha256,
          page_id:receipt.page_id,review_state:'CANDIDATE_ONLY_NO_CHANNEL',
          issuer_witness_owner_signoff_verified:true,
          archive_bytes_independently_read_back:false,
          future_go_live_requires_new_explicit_authority:true},
        not_a_live_channel_activation:true});
    }
    const originalBundle=body.original_signed_decision;
    if(!originalBundle||typeof originalBundle!=='object')
      throw Error('Exact original signed decision required.');
    if(body.action==='prepare_custody_template'){
      const decision=await verifyDecision627(originalBundle,check(db,c,receipt));
      const hash=await sha256(JSON.stringify(originalBundle));
      return reply({ok:true,...safe,
        unsigned_original_custody_template:{format:FORMAT_628,
          original_decision_sha256:decision.decision_sha256,
          original_packet_sha256:hash,witness_sha256:receipt.witness_sha256,
          receipt_sha256:receipt.receipt_sha256,page_id:receipt.page_id,
          primary_custody_ref:'ENTER_FIRST_DISTINCT_HTTPS_ARCHIVE_URL',
          secondary_custody_ref:'ENTER_SECOND_DISTINCT_HTTPS_ARCHIVE_URL',
          primary_packet_sha256:hash,secondary_packet_sha256:hash,
          decision:DECISION_628,nonce:'ENTER_UNIQUE_NONCE_AT_LEAST_20_CHARS',
          issued_at:'ENTER_CURRENT_UTC_TIMESTAMP',
          expires_at:'ENTER_WITHIN_10_MINUTES_AND_BEFORE_627_DECISION_EXPIRY'},
        template_is_not_signed:true});
    }
    const custodyBundle=body.signed_custody;
    const verified=await verifyCustody628(custodyBundle,
      {originalBundle,...check(db,c,receipt)});
    const p=custodyBundle.payload;
    const saved=await db.prepare(`INSERT INTO dd628_original_meta_signed_decision_custody
      (custody_sha256,original_decision_sha256,original_packet_sha256,
       witness_sha256,receipt_sha256,page_id,primary_custody_ref,secondary_custody_ref,
       signed_original_decision_json,signed_custody_json,status,created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,'ORIGINAL_META_READONLY_DECISION_CUSTODY_OWNER_REVIEW_ONLY',?)`).bind(
      verified.custody_sha256,verified.original_decision_sha256,
      verified.original_packet_sha256,p.witness_sha256,p.receipt_sha256,p.page_id,
      p.primary_custody_ref,p.secondary_custody_ref,
      JSON.stringify(originalBundle),JSON.stringify(custodyBundle),admin.user_id).run();
    if(saved.meta?.changes!==1)throw Error('Original custody immutable record not saved.');
    return reply({ok:true,...safe,...verified,
      original_owner_signed_custody_recorded:true,
      original_archive_contents_readback_still_required:true,
      original_go_live_approval_not_issued:true},201);
  }catch{return reply({ok:false,...safe,
    error:'Original identity, signed packet, source window, archive custody or immutable record verification failed. No channel activated.'},422);}
}
