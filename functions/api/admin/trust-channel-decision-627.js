/* Build 627: owner-supervised, non-persistent signed evaluation of the
 * EXISTING authentic single GET receipt. Never sets a Meta connected state. */
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {trustedPins614} from '../_lib/trustAuthority614.js';
import {FORMAT_627,DECISION_627,HOLD_627,verifyDecision627}
  from '../_lib/trustChannelDecision627.js';
import {onRequestGet as readOwnerWalkthrough626} from './trust-owner-walkthrough-626.js';

const reply=(value,status=200)=>jsonResponse(value,status,{'Cache-Control':'no-store'});
const safe={build:627,release_gate:HOLD_627,connected:false,
  provider_channel_activated:false,provider_get_performed:false,
  publishing_enabled:false,token_refreshed:false,d1_mutation:false,
  original_root_enrolled:false,decision_persisted:false};

async function originalReceipt627(db,current){
  if(current?.walkthrough?.accepted_for_readonly_test_only!==true||
    current?.walkthrough?.renewal?.source_window?.state==='EXPIRED')return null;
  try{
    const saved=await db.prepare(`SELECT w.witness_sha256,w.authorization_id,
      w.test_nonce,w.enrollment_sha256,w.signed_bundle_json,
      g.window_sha256,e.owner_ledger_head_sha256
      FROM dd624_meta_witness_acceptances w
      JOIN dd624_meta_one_use_grants g ON g.authorization_id=w.authorization_id
      JOIN dd624_meta_credential_enrollments e ON e.enrollment_sha256=w.enrollment_sha256
      ORDER BY w.created_at DESC LIMIT 1`).first();
    if(!saved)return null;
    const bundle=JSON.parse(saved.signed_bundle_json),p=bundle.payload;
    if(!current.walkthrough.readback_witness_sha256||
      saved.witness_sha256!==current.walkthrough.readback_witness_sha256)return null;
    if(p.authorization_id!==saved.authorization_id||p.test_nonce!==saved.test_nonce||
      p.enrollment_sha256!==saved.enrollment_sha256||
      !Array.isArray(bundle.signatures)||bundle.signatures.length!==3||
      !['ISSUER','WITNESS','OWNER'].every(role=>bundle.signatures.some(s=>s.role===role)))return null;
    return {witness_sha256:saved.witness_sha256,
      authorization_id:saved.authorization_id,
      enrollment_sha256:saved.enrollment_sha256,
      test_nonce:saved.test_nonce,page_id:p.page_id,
      receipt_sha256:p.receipt_sha256,window_sha256:saved.window_sha256,
      owner_ledger_head_sha256:saved.owner_ledger_head_sha256,
      original_signers:bundle.signatures.map(s=>({role:s.role,authority_id:s.authority_id})),
      window_expires_at:current.walkthrough.renewal.source_window.expires_at,
      original_source_verified:true,actual_meta_get_verified:true};
  }catch{return null;}
}
const roots=db=>id=>db.prepare(`SELECT a.authority_id,a.role,a.public_key,a.key_sha256,
  CASE WHEN EXISTS(SELECT 1 FROM dd616_key_quarantines q
    WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)
  THEN 'QUARANTINED' ELSE a.status END AS status
  FROM dd614_authorities a WHERE a.authority_id=? LIMIT 1`).bind(id).first();

export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const db=getDb(c.env);
  if(!db)return reply({ok:false,...safe,error:'Original D1 database unavailable.'},503);
  let previous;
  try{const r=await readOwnerWalkthrough626(c);if(r.ok)previous=await r.json();}catch{}
  const receipt=await originalReceipt627(db,previous);
  return reply({ok:true,...safe,ceremony_ready:!!receipt,
    original_evidence_pending:previous?.walkthrough?.pending_steps||['original_database'],
    next_owner_step:previous?.walkthrough?.next_action||'Complete original source D1, independently witnessed Meta Page ID GET and owner signatures in Admin 44–47.',
    unsigned_original_ceremony_template:receipt?{
      format:FORMAT_627,witness_sha256:receipt.witness_sha256,
      authorization_id:receipt.authorization_id,
      enrollment_sha256:receipt.enrollment_sha256,
      test_nonce:receipt.test_nonce,page_id:receipt.page_id,
      receipt_sha256:receipt.receipt_sha256,
      window_sha256:receipt.window_sha256,
      owner_ledger_head_sha256:receipt.owner_ledger_head_sha256,
      decision:DECISION_627,nonce:'ENTER_NEW_RANDOM_NONCE_AT_LEAST_20_CHARS',
      issued_at:'ENTER_CURRENT_UTC_TIMESTAMP',
      expires_at:'ENTER_UTC_WITHIN_10_MINUTES_AND_BEFORE_WINDOW_END'}:null,
    owner_signature_roles:['ISSUER','WITNESS','OWNER'],
    evaluation_only_no_external_call:true,
    no_operational_connection_without_separate_owner_go_live:true});
}

export async function onRequestPost(c){
  const admin=await getAdminUserFromRequest(c.request,c.env);
  if(!admin)return reply({ok:false,error:'Admin session required.'},401);
  if(c.request.headers.get('origin')!==new URL(c.request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(c.request.headers.get('content-type')||''))
    return reply({ok:false,...safe,error:'Same-origin JSON required.'},403);
  if(Number(c.request.headers.get('content-length')||0)>16000)
    return reply({ok:false,...safe,error:'Signed ceremony exceeds bound.'},413);
  let body;try{body=await c.request.json();}catch{
    return reply({ok:false,...safe,error:'Invalid signed JSON.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||
    JSON.stringify(body).length>16000||
    body.action!=='evaluate_original_read_only_decision'||
    !body.signed_bundle||typeof body.signed_bundle!=='object')
    return reply({ok:false,...safe,error:'Original three-party signed read-only decision required.'},400);
  const db=getDb(c.env);if(!db)return reply({ok:false,...safe,error:'Original D1 unavailable.'},503);
  let current;try{const r=await readOwnerWalkthrough626(c);
    if(r.ok)current=await r.json();}catch{}
  const receipt=await originalReceipt627(db,current);
  if(!receipt)return reply({ok:false,...safe,error:'Current actual original Meta GET witness and source window missing.'},422);
  const step=await requireAdminStepUp(c.request,c.env,admin,body,
    'original owner-supervised read-only Meta evidence-only decision');
  if(!step.ok)return step.response;
  try{
    const verified=await verifyDecision627(body.signed_bundle,{receipt,
      roots:roots(db),pins:trustedPins614(c.env)});
    return reply({ok:true,...safe,...verified,
      original_owner_signed_decision_verified:true,
      approved_for_one_historical_readonly_test_only:true,
      original_signed_packet_must_be_retained_by_owners:true,
      operational_channel_connection_requires_separate_authorization:true});
  }catch{return reply({ok:false,...safe,
    error:'Original issuer, separate witness, owner, exact GET receipt or expiring evidence failed independent verification.'},422);}
}
