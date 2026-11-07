/* Build 630: original bound D1 readback and owner-supervised reuse of 629's
 * strictly authorized, one-time independent archive GET and signed decision.
 * No DDL, Meta OAuth, provider GET, connection or publication. */
import {getAdminUserFromRequest,getDb,jsonResponse} from '../_lib/adminAudit.js';
import {readOriginalMigration630,HOLD_630} from '../_lib/trustOriginalMigration630.js';
import {onRequestPost as owner629} from './trust-archive-certification-629.js';

const reply=(data,status=200)=>jsonResponse(data,status,{'Cache-Control':'no-store'});
const hold={build:630,release_gate:HOLD_630,connected:false,
  provider_channel_connected:false,publishing_enabled:false,
  provider_get_performed:false,provider_write:false,
  original_host_automatically_accessed:false,
  migration_auto_applied:false,go_live_automatically_authorized:false};
const HASH=/^[0-9a-f]{64}$/;

export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,...hold,error:'Admin session required.'},401);
  const report=await readOriginalMigration630(getDb(c.env));
  return reply({ok:true,...hold,...report,
    first_genuine_archive_byte_readback_observed_by_this_request:false,
    original_owner_signed_decision_reconciled_by_this_request:false,
    next_owner_action:!report.live_migration_readback_verified?
      'Original operator: verify original D1 identity, back up, apply 0052–0064 in authorized order through Wrangler, then re-read the live schema and migration ledger.':
      'Use original signer/source evidence from sections 44–50; supervise the two pre-signed archive GETs and independently sign then reconcile the current owner decision.'});
}

export async function onRequestPost(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,...hold,error:'Admin session required.'},401);
  if(c.request.headers.get('origin')!==new URL(c.request.url).origin||
    !/^application\/json(?:\s*;|$)/i.test(c.request.headers.get('content-type')||''))
    return reply({ok:false,...hold,error:'Same-origin JSON required.'},403);
  if(Number(c.request.headers.get('content-length')||0)>4096)
    return reply({ok:false,...hold,error:'Original owner request too large.'},413);
  let body;try{body=await c.request.json();}catch{
    return reply({ok:false,...hold,error:'Invalid original-owner request.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body)||
    JSON.stringify(body).length>4096||!HASH.test(body.custody_sha256||'')||
    !['owner_supervised_first_archive_readback',
      'reconcile_original_signed_readiness'].includes(body.action)||
    typeof body.confirm_password!=='string'||!body.confirm_password)
    return reply({ok:false,...hold,error:'Original signed custody and owner step-up required.'},400);
  if(body.action==='owner_supervised_first_archive_readback'&&
    body.explicit_two_external_https_get_authorization!==true)
    return reply({ok:false,...hold,error:'Separate original owner authorization for two archive GETs required.'},403);
  const report=await readOriginalMigration630(getDb(c.env));
  if(!report.live_migration_readback_verified)
    return reply({ok:false,...hold,...report,
      error:'Original bound D1 migration or ledger not verified. No external fetch performed.'},422);
  const action=body.action==='owner_supervised_first_archive_readback'?
    'read_back_two_original_archives':'verify_original_go_live_readiness';
  // Delegate to 629's original issuer/witness/owner and step-up verification.
  // No independent 630 path may sign, fabricate, or bypass a 629 receipt.
  const headers=new Headers(c.request.headers);
  headers.delete('content-length');
  const forwarded=new Request(c.request.url,{method:'POST',headers,
    body:JSON.stringify({action,custody_sha256:body.custody_sha256,
      confirm_password:body.confirm_password})});
  const original=await owner629({...c,request:forwarded});
  let result;try{result=await original.json();}catch{
    return reply({ok:false,...hold,error:'Original 629 verifier response unavailable.'},502);}
  if(!original.ok)return reply({ok:false,...hold,...report,
    error:result?.error||'Original issuer, archive or owner decision incomplete.'},original.status);
  const reconciled=action==='verify_original_go_live_readiness'&&
    result.signed_original_go_live_decision_verified===true&&
    result.independent_external_archive_bytes_verified===true;
  const certified=reconciled&&result.go_live_readiness_certified===true;
  return reply({ok:true,...hold,...report,
    original_archive_get_saved_and_verified:action==='read_back_two_original_archives'&&
      result.actual_independent_two_host_https_get_verified===true,
    original_owner_signed_decision_reconciled:reconciled,
    original_meta_read_only_readiness_certified:certified,
    original_custody_sha256:body.custody_sha256,
    archive_readback_sha256:result.readback_sha256||null,
    original_signed_decision_sha256:result.decision_sha256||null,
    original_owner_decision:result.original_owner_decision||null,
    certification_expires_at:result.certification_expires_at||null,
    first_genuine_archive_gets_only_if_original_owner_explicitly_authorized:true,
    requires_separate_operational_meta_connection_authorization:true});
}
