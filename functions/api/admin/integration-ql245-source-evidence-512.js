/* Build 512: independently pinned QL-245 source-only public signature intake.
 * Never interprets a cryptographic packet as real world witness or pilot approval. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {inspectQL245Source512} from '../_lib/ql245External512.mjs';

const response=(data,status=200)=>jsonResponse({ok:status<400,build:512,source_system:'devilndove',
 gateway:'ai-data-platform',connection_state:'DISCONNECTED',environment:'nonproduction',
 product_reference_enabled:false,listing_reference_enabled:false,commands_enabled:false,
 live_messages_enabled:false,owner_pilot_authorized:false,source_signature_is_gateway_proof:false,...data},
 status,{'Cache-Control':'no-store'});
const uuid=x=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(String(x||''));
const gate=c=>{const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:response({error:'Verified Admin required.'},401)}:
  !db?{error:response({error:'D1 local evidence ledger unavailable.'},503)}:{admin,db};};
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 try{const prior=await g.db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json,created_at FROM admin_action_audit WHERE action_type='rosevear_ql245_external_source_signature_intake_512' AND target_type='integration_gateway' AND target_key='devilndove' ORDER BY admin_action_audit_id DESC LIMIT 1").first();
  let details={};try{details=JSON.parse(prior?.details_json||'{}');}catch{}
  return response({read_only:true,independently_sourced_spki_pin_configured:/^[a-f\d]{64}$/.test(String(c.env?.ROSEVEAR_QL245_TRUSTED_DEVILNDOVE_SPKI_SHA256||'')),
   prior_local_signature_receipt_id:prior?.admin_action_audit_id||null,
   prior_source_revision:details.source_revision||null,
   prior_signature_digest:details.public_source_digest_sha256||null,
   actual_nonproduction_signed_gets_independently_witnessed:false,
   six_source_signatures_verified:false,assessor_signature_verified:false,
   separate_gateway_audit_durability_verified:false,owner_identity_verified:false,
   connection_state:'DISCONNECTED',issues:[
    'QL-245 requires all six independently pinned Ed25519 source signatures and a seventh assessor signature.',
    'A locally matched public source signature is not an independently retrieved HMAC GET or durable gateway audit.',
    'All seven observed negative denials, independent reviewer, separate owner authorization and kill-switch demonstration remain external HOLDs.']});
 }catch{return response({error:'Source evidence readiness unavailable.'},503);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return response({error:'Same-origin required.'},403);
 if(Number(c.request.headers.get('Content-Length')||0)>24000)return response({error:'Public evidence packet exceeds the 24KB limit.'},413);
 let b;try{b=await c.request.json();}catch{return response({error:'JSON required.'},400);}
 if(b?.action!=='inspect_signed_source_metadata'||!uuid(b.request_key)||b.confirm_nonproduction_only!==true||
    b.confirm_no_owner_pilot!==true||b.confirm_no_secrets!==true)
  return response({error:'Nonproduction, no-secrets, no-owner-pilot and unique request key acknowledgments required.'},400);
 if(JSON.stringify(b).length>24000)return response({error:'Public metadata packet must be at most 24KB.'},413);
 try{const proof=await inspectQL245Source512({payload:b.payload,signature:b.signature,
   publicKeySpkiBase64:b.public_key_spki_base64,env:c.env});
  if(!proof.accepted)return response({error:'Public source signature not accepted; HOLD.',issues:proof.issues,
   independent_gateway_proof_verified:false},409);
  const details={build:512,request_key:b.request_key,source_system:'devilndove',
   signer_key_id:proof.signer_key_id,source_revision:proof.source_revision,
   ci_run_url:proof.ci_run_url,source_receipt_id:proof.source_receipt_id,
   public_source_digest_sha256:proof.public_source_digest_sha256,
   signature_check:'exact_source_signature_matches_separately_pinned_key',
   original_gateway_records_independently_confirmed:false,
   assessor_signature_verified:false,six_source_signatures_verified:false,
   owner_pilot_authorized:false,connection_state:'DISCONNECTED',provider_modified:false};
  // Do not store a private key, HMAC secret or client-controlled trust pin.
  const saved=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'rosevear_ql245_external_source_signature_intake_512','integration_gateway','devilndove','POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='rosevear_ql245_external_source_signature_intake_512' AND target_type='integration_gateway' AND target_key='devilndove' AND (json_extract(details_json,'$.request_key')=? OR json_extract(details_json,'$.public_source_digest_sha256')=?))")
   .bind(g.admin.user_id,new URL(c.request.url).pathname,JSON.stringify(details),b.request_key,
     proof.public_source_digest_sha256).run();
  if(Number(saved.meta?.changes)!==1)return response({error:'Identical signed source metadata already reviewed. Refresh before recording more evidence.'},409);
  return response({local_receipt_id:Number(saved.meta?.last_row_id)||null,
   source_signature_matched:true,source_sha256:proof.public_source_digest_sha256,
   six_source_signatures_verified:false,assessor_signature_verified:false,
   actual_gateway_connection_verified:false,decision:'LOCAL_PUBLIC_SIGNATURE_ONLY_HOLD'});
 }catch{return response({error:'Cannot independently verify or save source signature metadata; HOLD.'},503);}
}
export const onRequestPut=()=>response({error:'No provider/gateway change is permitted.'},405);
export const onRequestPatch=onRequestPut;
export const onRequestDelete=onRequestPut;
