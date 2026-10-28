/* Build 513 / owner QL-246: read current local source nonce/denial audits and
 * inspect a strictly challenged Ed25519 public record. No network GET,
 * private-key provisioning, signed-file publication, pilot or dispatch. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {gatewayReceiptReadiness511} from '../_lib/gatewayReceipt511.mjs';
import {QL246_NEGATIVES_513,inspectQl246513} from '../_lib/ql246Proof513.mjs';

const uuid=x=>/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(String(x||''));
const response=(data,status=200)=>jsonResponse({ok:status<400,build:513,source_system:'devilndove',
 source_business_id:'devilndove',tenant_id:null,environment:'nonproduction',
 connection_state:'DISCONNECTED',owner_pilot_authorized:false,
 product_reference_enabled:false,listing_reference_enabled:false,
 events_enabled:false,commands_enabled:false,live_communications_enabled:false,
 provider_modified:false,private_key_disclosed:false,...data},status,{'Cache-Control':'no-store'});
const gate=c=>{const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:response({error:'Verified Admin required.'},401)}:
  !db?{error:response({error:'Local source audit unavailable.'},503)}:{admin,db};};
const parse=x=>{try{return JSON.parse(x?.details_json||'{}');}catch{return {};}};
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 try{const [nonces,owner,review,denials,ql245,ql246]=await Promise.all([
   g.db.prepare("SELECT admin_action_audit_id,request_path,details_json,created_at FROM admin_action_audit WHERE action_type='rosevear_integration_v1_nonce_510' AND target_type='integration_nonce' ORDER BY admin_action_audit_id DESC LIMIT 60").all(),
   g.db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json FROM admin_action_audit WHERE action_type='rosevear_integration_509_security_handoff' AND target_type='integration_gateway' AND target_key='devilndove' ORDER BY admin_action_audit_id DESC LIMIT 1").first(),
   g.db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json FROM admin_action_audit WHERE action_type='rosevear_integration_510_separation_review' AND target_type='integration_gateway' AND target_key='devilndove' ORDER BY admin_action_audit_id DESC LIMIT 1").first(),
   g.db.prepare("SELECT admin_action_audit_id,request_path,details_json FROM admin_action_audit WHERE action_type='rosevear_integration_v1_denied_510' AND target_type='integration_denial' ORDER BY admin_action_audit_id DESC LIMIT 90").all(),
   g.db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='rosevear_ql245_external_source_signature_intake_512' AND target_type='integration_gateway' AND target_key='devilndove' ORDER BY admin_action_audit_id DESC LIMIT 1").first(),
   g.db.prepare("SELECT admin_action_audit_id,details_json FROM admin_action_audit WHERE action_type='rosevear_ql246_source_public_signature_review_513' AND target_type='integration_gateway' AND target_key='devilndove' ORDER BY admin_action_audit_id DESC LIMIT 1").first()]);
  const source=gatewayReceiptReadiness511(c.env,nonces?.results||[],owner,review);
  const reasons=(denials?.results||[]).map(parse).map(x=>String(x.reason||''));
  const independentDenials=Object.fromEntries(QL246_NEGATIVES_513.map(k=>[k,false]));
  const pending=[
   'Real nonproduction source origin and separately issued HMAC key are not independently confirmed by this local check.',
   'All seven negative-denial original traces must be independently observed; local counts are not proof.',
   'QL-246 requires a new challenge ID + nonce digest, nonproduction source Ed25519 private signing key in a secret manager, out-of-band public SPKI pin and immutable signed public JSON.',
   'Six immutable source files, CI runs, public pins, independent gateway datastore read-after-restart and separate owner identity/rollback witnesses are not verified here.',
   'QL-245 local source-signature receipt is not a QL-246 challenge signature or gateway authorization.'];
  const ql245Details=parse(ql245),ql246Details=parse(ql246);
  return response({read_only:true,
   allowed_methods:['GET'],allowed_paths:['/api/integration/v1/health','/api/integration/v1/capabilities'],
   source_health_nonce_receipt_id:source.health_source_nonce_receipt_id,
   source_capabilities_nonce_receipt_id:source.capabilities_source_nonce_receipt_id,
   source_side_hmac_receipts_current:source.source_receipts_verified,
   source_side_separation_review_current:source.owner_separation_verified,
   local_denial_sample_count:reasons.length,local_denial_reason_sample:[...new Set(reasons)].slice(0,10),
   independently_witnessed_negative_tests:independentDenials,
   prior_ql245_local_signature_receipt_id:ql245?.admin_action_audit_id||null,
   prior_ql245_source_revision:ql245Details.source_revision||null,
   prior_ql246_signature_receipt_id:ql246?.admin_action_audit_id||null,
   prior_ql246_raw_digest:ql246Details.raw_public_json_sha256||null,
   ql246_trusted_pin_provisioned:/^[a-f0-9]{64}$/i.test(String(c.env?.ROSEVEAR_QL246_TRUSTED_DEVILNDOVE_SPKI_SHA256||'')),
   ql246_operator_challenge_provisioned:Boolean(c.env?.ROSEVEAR_QL246_CHALLENGE_ID&&c.env?.ROSEVEAR_QL246_CHALLENGE_SHA256),
   ql246_immutable_source_revision_provisioned:/^[a-f0-9]{40}$/.test(String(c.env?.ROSEVEAR_QL246_EXPECTED_SOURCE_REVISION||'')),
   signed_public_source_file_published:false,six_app_source_records_verified:false,
   independent_gateway_get_verified:false,gateway_audit_restart_proof_verified:false,
   actual_connection_verified:false,owner_identity_verified:false,
   ql246_proof_publication_decision:'PENDING_NOT_AUTHORIZED',remaining_gaps:pending});
 }catch{return response({error:'QL-246 D1 source comparison unavailable; all connections remain HOLD.'},503);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return response({error:'Same-origin required.'},403);
 if(Number(c.request.headers.get('Content-Length')||0)>25000)return response({error:'Public record too large.'},413);
 let b;try{b=await c.request.json();}catch{return response({error:'JSON required.'},400);}
 if(b?.action!=='inspect_ql246_public_source_signature'||!uuid(b.request_key)||
   b.confirm_nonproduction_only!==true||b.confirm_no_private_keys!==true||
   b.confirm_no_gateway_or_owner_approval!==true||typeof b.raw_public_json!=='string')
  return response({error:'Exact public record, UUID and nonproduction/no-approval acknowledgments required.'},400);
 if(JSON.stringify(b).length>25000)return response({error:'Public record too large.'},413);
 try{const proof=await inspectQl246513({rawJson:b.raw_public_json,env:c.env});
  if(!proof.matched)return response({error:'QL-246 public source signature NOT VERIFIED.',issues:proof.issues},409);
  const details={build:513,request_key:b.request_key,
   raw_public_json_sha256:proof.raw_public_json_sha256,
   source_revision:proof.source_revision,ci_run_url:proof.ci_run_url,challenge_id:proof.challenge_id,
   local_signature_match:true,original_gateway_get_independently_witnessed:false,
   six_app_evidence_accepted:false,owner_pilot_authorized:false,
   connection_state:'DISCONNECTED',provider_modified:false};
  const stored=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'rosevear_ql246_source_public_signature_review_513','integration_gateway','devilndove','POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='rosevear_ql246_source_public_signature_review_513' AND target_type='integration_gateway' AND target_key='devilndove' AND (json_extract(details_json,'$.request_key')=? OR json_extract(details_json,'$.raw_public_json_sha256')=?))")
   .bind(g.admin.user_id,new URL(c.request.url).pathname,JSON.stringify(details),b.request_key,proof.raw_public_json_sha256).run();
  if(Number(stored.meta?.changes)!==1)return response({error:'Matching public metadata already locally reviewed.'},409);
  return response({local_receipt_id:Number(stored.meta?.last_row_id)||null,
   raw_public_json_sha256:proof.raw_public_json_sha256,
   status:'LOCAL_SOURCE_SIGNATURE_ONLY_HOLD',
   real_network_connection_confirmed:false,owner_pilot_authorized:false});
 }catch{return response({error:'QL-246 local verification unavailable. No connection authorized.'},503);}
}
export const onRequestPut=()=>response({error:'This QL-246 route never changes connection, customer data or permissions.'},405);
export const onRequestPatch=onRequestPut;
export const onRequestDelete=onRequestPut;
