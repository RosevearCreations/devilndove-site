/* Build 626: authenticated READ-ONLY operator walkthrough. Uses original
 * 623/624 signature validators; may never perform a Meta request or writes. */
import {getAdminUserFromRequest,jsonResponse} from '../_lib/adminAudit.js';
import {HOLD_626,deriveWalkthrough626} from '../_lib/trustOwnerWalkthrough626.js';
import {onRequestGet as readSchemaAndSource625} from './trust-activation-assistant-625.js';
import {onRequestGet as readOriginalWindow623} from './trust-activation-623.js';
import {onRequestGet as readOriginalWitness624} from './trust-meta-live-624.js';

const reply=(value,status=200)=>jsonResponse(value,status,{'Cache-Control':'no-store'});
const hold={build:626,release_gate:HOLD_626,connected:false,provider_write:false,
  publishing_enabled:false,provider_request_performed:false,
  signed_approval_created:false,token_refreshed:false,d1_migration_applied:false};

async function verifiedReadback(handler,ctx){
  try{const response=await handler(ctx);
    if(!response.ok)return null;
    const data=await response.json();return data?.ok===true?data:null;
  }catch{return null;}
}

export async function onRequestGet(c){
  if(!await getAdminUserFromRequest(c.request,c.env))
    return reply({ok:false,error:'Admin session required.'},401);
  const source=await verifiedReadback(readSchemaAndSource625,c);
  if(!source)return reply({ok:false,...hold,
    error:'Original owner-controlled D1 readback unavailable; no live Meta proof is inferred.'},503);
  const [window,provider]=await Promise.all([
    verifiedReadback(readOriginalWindow623,c),
    verifiedReadback(readOriginalWitness624,c)]);
  const walkthrough=deriveWalkthrough626({source,window,provider,
    grant:provider?.grants?.[0]||null,
    attempts:provider?.attempts||[],outcomes:provider?.outcomes||[],
    failures:provider?.failures||[],witnesses:provider?.witnesses||[]});
  return reply({ok:true,...hold,release_gate:walkthrough.release_gate,
    walkthrough,original_schema_readback_available:true,
    original_signed_window_reverified:window?.derived_readonly_page_identity_window?.verified===true,
    independent_actual_meta_get_reverified:walkthrough.accepted_for_readonly_test_only,
    future_provider_requests_automatic:false,
    original_enrollment_and_renewal_operator_supervised:true});
}

export function onRequestPost(){
  return reply({ok:false,...hold,error:'No automatic activation, migration, token renewal or provider POST. Complete original signed actions in Admin 44–45.'},405);
}
