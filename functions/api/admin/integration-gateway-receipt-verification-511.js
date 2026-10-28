/* Build 511: source-side receipt verification against durable D1 records.
 * A D1 nonce is NOT a signed Ed25519 gateway receipt; no false connection claim. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {gatewayReceiptReadiness511} from '../_lib/gatewayReceipt511.mjs';
const response=(data,status=200)=>jsonResponse({ok:status<400,build:511,
 connection_state:'HOLD',owner_pilot_authorized:false,provider_modified:false,
 gateway_credential_provisioned:false,private_key_disclosed:false,...data},status,{'Cache-Control':'no-store'});
export async function onRequestGet(c){const actor=verifiedAdminFromModule(c),db=getDb(c.env);
 if(!actor)return response({error:'Verified Admin required.'},401);
 if(!db)return response({error:'Source audit ledger unavailable.'},503);
 try{const [nonce,owner,review,denials]=await Promise.all([
   db.prepare("SELECT admin_action_audit_id,request_path,details_json,created_at FROM admin_action_audit WHERE action_type='rosevear_integration_v1_nonce_510' AND target_type='integration_nonce' ORDER BY admin_action_audit_id DESC LIMIT 60").all(),
   db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json,created_at FROM admin_action_audit WHERE action_type='rosevear_integration_509_security_handoff' AND target_type='integration_gateway' AND target_key='devilndove' ORDER BY admin_action_audit_id DESC LIMIT 1").first(),
   db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json,created_at FROM admin_action_audit WHERE action_type='rosevear_integration_510_separation_review' AND target_type='integration_gateway' AND target_key='devilndove' ORDER BY admin_action_audit_id DESC LIMIT 1").first(),
   db.prepare("SELECT admin_action_audit_id FROM admin_action_audit WHERE action_type='rosevear_integration_v1_denied_510' AND target_type='integration_denial' ORDER BY admin_action_audit_id DESC LIMIT 30").all()]);
  const result=gatewayReceiptReadiness511(c.env,nonce?.results||[],owner,review);
  return response({...result,source_denial_audit_sample_count:(denials?.results||[]).length,
   negative_test_receipt_not_independent_provider_proof:true,read_only:true,
   next_action:'Use the separate authenticated AI Data Platform QL-243 verifier and actual Ed25519/SPKI pins, identity witness, and independently checked durable gateway audit before requesting owner pilot.'});
 }catch{return response({error:'Source-side receipt verification failed; gateway and owner pilot remain HOLD.'},503);}
}
export const onRequestPost=()=>response({error:'Gateway receipt verification is read-only; no activation or packet acceptance endpoint.'},405);
export const onRequestPut=onRequestPost;
export const onRequestPatch=onRequestPost;
export const onRequestDelete=onRequestPost;
