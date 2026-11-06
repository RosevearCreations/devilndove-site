import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {requireAdminStepUp} from '../_lib/adminStepUp.js';
import {authorityCandidate614,sha256,verifyProofs614,ledgerHash614,
  trustedPins614,HOLD_614} from '../_lib/trustAuthority614.js';

const reply=(body,status=200)=>jsonResponse(body,status,{'Cache-Control':'no-store'});
const disabled={ok:false,release_gate:HOLD_614,provider_action_authorized:false,
  error:'Build 614 server-side trust registry/ledger not yet provisioned; no provider action.'};
async function database(c) {
  const db=getDb(c.env);
  if (!db) return null;
  try {
    await db.prepare('SELECT authority_id FROM dd614_authorities LIMIT 1').all();
    await db.prepare('SELECT event_hash FROM dd614_owner_decisions LIMIT 1').all();
    // Build 616 deny-list is mandatory; absence denies older signed-proof endpoints too.
    await db.prepare('SELECT authority_id FROM dd616_key_quarantines LIMIT 1').all();
    return db;
  } catch {return null;}
}
const root=(db,id)=>db.prepare(
  `SELECT a.authority_id,a.role,a.public_key,a.key_sha256,
   CASE WHEN EXISTS(SELECT 1 FROM dd616_key_quarantines q
     WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)
   THEN 'QUARANTINED' ELSE a.status END AS status
   FROM dd614_authorities a WHERE a.authority_id=? LIMIT 1`
).bind(id).first();
const safeError=error=>{
  const message=String(error?.message||'');
  return /scope|signature|proof|authority|pin|expired|replay|encoding|key|shape|timestamp|root|decision|source/i
    .test(message)?message:'Verification rejected; external HOLD preserved.';
};
export async function onRequestGet(c) {
  const admin=await getAdminUserFromRequest(c.request,c.env);
  if (!admin) return reply({ok:false,error:'Admin session required.'},401);
  const db=await database(c);
  if (!db) return reply(disabled,503);
  const pins=trustedPins614(c.env);
  const candidates=(await db.prepare(
    `SELECT a.authority_id,a.role,a.key_sha256,a.created_at,
      CASE WHEN EXISTS(SELECT 1 FROM dd616_key_quarantines q
        WHERE q.authority_id=a.authority_id OR q.key_sha256=a.key_sha256)
      THEN 'QUARANTINED' ELSE a.status END AS status
      FROM dd614_authorities a ORDER BY a.created_at DESC LIMIT 50`
  ).all()).results||[];
  const recent=(await db.prepare(
    'SELECT event_hash,previous_hash,case_pin,channel,account_id,product_ref,exact_action,owner_decision,created_at FROM dd614_owner_decisions ORDER BY sequence DESC LIMIT 30'
  ).all()).results||[];
  return reply({ok:true,build:614,authority_candidates:candidates.map(x=>({
    ...x,pin_matches:x.status==='ACTIVE_EXTERNAL_VERIFIED'&&pins[x.authority_id]===x.key_sha256
  })),recent_decisions:recent,release_gate:HOLD_614,
  provider_action_authorized:false,independent_provider_readback_verified:false});
}
export async function onRequestPost(c) {
  const request=c.request;
  const admin=await getAdminUserFromRequest(request,c.env);
  if (!admin) return reply({ok:false,error:'Admin session required.'},401);
  if (request.headers.get('origin')!==new URL(request.url).origin ||
    !/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reply({ok:false,error:'Same-origin JSON request required.'},403);
  const db=await database(c);
  if (!db) return reply(disabled,503);
  if (Number(request.headers.get('content-length')||0)>18000)
    return reply({ok:false,error:'Request too large.'},413);
  let body;
  try {body=await request.json();} catch{return reply({ok:false,error:'Invalid JSON.'},400);}
  if (!body||typeof body!=='object'||Array.isArray(body)||
    JSON.stringify(body).length>18000) return reply({ok:false,error:'Invalid bounded request.'},400);
  const step=await requireAdminStepUp(request,c.env,admin,body,'trusted authority decision');
  if (!step.ok) return step.response;
  try {
    if (body.action==='enroll_pending') {
      const candidate=authorityCandidate614(body.candidate);
      const raw=candidate.public_key.replace(/-/g,'+').replace(/_/g,'/');
      const bytes=Uint8Array.from(atob(raw+'='.repeat((4-raw.length%4)%4)),x=>x.charCodeAt(0));
      const fingerprint=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
        x=>x.toString(16).padStart(2,'0')).join('');
      await db.prepare(`INSERT INTO dd614_authorities
        (authority_id,role,public_key,key_sha256,original_source_ref,independent_review_ref,status,created_by)
        VALUES (?,?,?,?,?,?,'PENDING_EXTERNAL_VERIFICATION',?)`).bind(
        candidate.authority_id,candidate.role,candidate.public_key,fingerprint,
        candidate.original_source_ref,candidate.independent_review_ref,admin.user_id).run();
      return reply({ok:true,authority_id:candidate.authority_id,key_sha256:fingerprint,
        status:'PENDING_EXTERNAL_VERIFICATION',release_gate:HOLD_614,
        trusted:false,provider_action_authorized:false},201);
    }
    if (body.action==='verify_and_record') {
      const pins=trustedPins614(c.env);
      const verified=await verifyProofs614(body.proofs,id=>root(db,id),pins);
      const proofIds=body.proofs.map(x=>x.authority_id);
      const owner=body.proofs.find(x=>x.payload.role==='OWNER');
      const event={...verified.scope,decision:verified.owner_decision,authority_ids:proofIds,
        proof_hashes:verified.proof_hashes,owner_nonce:owner.payload.nonce,
        owner_expires_at:owner.payload.expires_at};
      const previous=(await db.prepare(
        'SELECT event_hash FROM dd614_owner_decisions ORDER BY sequence DESC LIMIT 1'
      ).first())?.event_hash||'0'.repeat(64);
      const eventHash=await ledgerHash614(previous,event);
      await db.prepare(`INSERT INTO dd614_owner_decisions
        (event_hash,previous_hash,case_pin,channel,account_id,product_ref,exact_action,
         source_sha256,owner_decision,owner_nonce,owner_expires_at,proof_summary_json,created_by)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
        eventHash,previous,event.case_pin,event.channel,event.account_id,event.product_ref,
        event.action,event.source_sha256,event.decision,event.owner_nonce,event.owner_expires_at,
        JSON.stringify(event),admin.user_id).run();
      return reply({ok:true,event_hash:eventHash,previous_hash:previous,
        signed_owner_decision_recorded:true,cryptographic_signatures_verified:true,
        provider_action_authorized:false,independent_provider_readback_verified:false,
        release_gate:HOLD_614},201);
    }
    return reply({ok:false,error:'Unknown or unsafe action.'},400);
  } catch(error) {
    if (/UNIQUE constraint|constraint failed/i.test(String(error))) return reply({
      ok:false,error:'Duplicate signature, existing event or concurrent ledger head. Recheck before retry.',
      release_gate:HOLD_614},409);
    return reply({ok:false,error:safeError(error),release_gate:HOLD_614,
      provider_action_authorized:false},422);
  }
}
