/* Build 510 / QL-243 -- independent *local* approval separation audit.
 * Source receipts cannot be relabelled as gateway-signed Ed25519/audit proof.
 */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';
import {nonproductionSettings510} from '../_lib/integrationContract510.mjs';

const respond=(data,status=200)=>jsonResponse({ok:status<400,build:510,
 connection_state:'HOLD',owner_pilot_authorized:false,live_data_approved:false,
 customer_data_enabled:false,events_enabled:false,commands_enabled:false,
 gateway_ed25519_receipt_verified:false,owner_witness_verified:false,
 credentials_returned:false,credentials_provisioned:false,...data},status,{'Cache-Control':'no-store'});
const uuid=x=>/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(String(x||''));
function gate(c){const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 return !admin?{error:respond({error:'Verified independent Admin required.'},401)}:!db?{error:respond({error:'Audit ledger unavailable.'},503)}:{admin,db};}
const parse=x=>{try{return JSON.parse(x||'{}')}catch{return {}}};
export function separationReadiness510(env,records=[],handoff=null,reviewerId=0){
 const conf=nonproductionSettings510(env);
 const accepted=records.filter(row=>{const x=parse(row.details_json);
  return x.source==='ai-data-platform'&&x.destination==='devilndove'&&x.business==='devilndove'&&
   x.environment==='nonproduction'&&x.tenant===null&&x.scope==='health_capabilities_get_only'&&
   x.key_id===conf.keyId&&x.decision==='read_only_accepted';});
 const health=accepted.find(row=>row.request_path==='/api/integration/v1/health');
 const caps=accepted.find(row=>row.request_path==='/api/integration/v1/capabilities');
 const prior=parse(handoff?.details_json);
 const separate=Number(handoff?.actor_user_id)>0&&Number(reviewerId)>0&&Number(handoff.actor_user_id)!==Number(reviewerId);
 const sameEnvironment=prior.environment==='nonproduction'&&prior.application_id==='devilndove'&&
  prior.scope==='read_only_health_and_capabilities_handoff'&&prior.source_side_receipts_only===true&&
  prior.nonproduction_key_id===conf.keyId;
 const blockers=[];
 if(!conf.isolated)blockers.push('Nonproduction deployment class not configured; production cannot run QL-243.');
 if(!conf.keyId||!conf.secret)blockers.push('No distinct 256-bit server-side nonproduction HMAC key/key ID.');
 if(conf.revoked)blockers.push('Current nonproduction key is revoked.');
 if(!health||!caps)blockers.push('Current key/environment lacks both accepted signed GET source nonce receipts.');
 if(!sameEnvironment)blockers.push('Owner security handoff for the exact nonproduction scope is missing.');
 if(!separate)blockers.push('A different verified Admin reviewer is required after the owner security handoff.');
 blockers.push('AI Data Platform gateway Ed25519-signed receipts and durable gateway audit must be externally verified.');
 blockers.push('Owner and independent witness public key pins/identity challenge require out-of-band verification.');
 blockers.push('Owner read-only pilot authorization is NOT GIVEN; Comms Hub QL-181 real communication gates stay HELD.');
 return {application_id:'devilndove',source_system:'devilndove',gateway:'ai-data-platform',
  environment:'nonproduction',business_id:'devilndove',tenant_id:null,contract_version:'rosevear.integration.v1',
  configured:conf.configured,key_id_configured:Boolean(conf.keyId),
  source_health_receipt_id:health?.admin_action_audit_id||null,
  source_capabilities_receipt_id:caps?.admin_action_audit_id||null,
  source_health_accepted:Boolean(health),source_capabilities_accepted:Boolean(caps),
  owner_security_handoff_receipt_id:sameEnvironment?Number(handoff.admin_action_audit_id):null,
  different_reviewer:separate,review_ready:conf.configured&&Boolean(health&&caps)&&sameEnvironment&&separate,
  allowed_paths:['GET /api/integration/v1/health','GET /api/integration/v1/capabilities'],
  product_reference_enabled:false,listing_reference_enabled:false,
  gateway_audit_id:null,independent_gateway_datastore_verified:false,
  gateway_public_spki_pin_verified:false,owner_public_spki_pin_verified:false,witness_public_spki_pin_verified:false,
  owner_identity_attestation_id:null,owner_pilot_authorized:false,connection_state:'HOLD',blockers};
}
async function review(c,db,actor){
 const [rows,handoff]=await Promise.all([
  db.prepare("SELECT admin_action_audit_id,request_path,details_json,created_at FROM admin_action_audit WHERE action_type='rosevear_integration_v1_nonce_510' AND target_type='integration_nonce' ORDER BY admin_action_audit_id DESC LIMIT 60").all(),
  db.prepare("SELECT admin_action_audit_id,actor_user_id,details_json,created_at FROM admin_action_audit WHERE action_type='rosevear_integration_509_security_handoff' AND target_type='integration_gateway' AND target_key='devilndove' ORDER BY admin_action_audit_id DESC LIMIT 1").first()]);
 return separationReadiness510(c.env,rows?.results||[],handoff,actor.user_id);
}
export async function onRequestGet(c){const g=gate(c);if(g.error)return g.error;
 try{return respond({...await review(c,g.db,g.admin),read_only:true});}
 catch{return respond({error:'Gateway separation audit unavailable; no connection permission granted.'},503);}
}
export async function onRequestPost(c){const g=gate(c);if(g.error)return g.error;
 if(c.request.headers.get('Origin')!==new URL(c.request.url).origin)return respond({error:'Same-origin separation review required.'},403);
 let b;try{b=await c.request.json();}catch{return respond({error:'JSON required.'},400);}
 if(b?.action!=='record_nonproduction_separation_review'||!uuid(b?.request_key)||
    b?.confirm_different_reviewer!==true||b?.confirm_nonproduction_only!==true||
    b?.confirm_gateway_external_proof_pending!==true||b?.confirm_owner_pilot_not_authorized!==true)
  return respond({error:'Separate reviewer, nonproduction scope and all unresolved owner/gateway proof acknowledgements are required.'},400);
 try{const state=await review(c,g.db,g.admin);
  if(!state.review_ready||Number(b.owner_handoff_receipt_id)!==state.owner_security_handoff_receipt_id)
   return respond({error:'HOLD — owner handoff, independent reviewer or exact signed nonproduction source receipts are missing or changed.',blockers:state.blockers},409);
  const details={build:510,request_key:b.request_key,application_id:'devilndove',environment:'nonproduction',
   owner_handoff_receipt_id:state.owner_security_handoff_receipt_id,
   source_health_receipt_id:state.source_health_receipt_id,
   source_capabilities_receipt_id:state.source_capabilities_receipt_id,
   separate_reviewer:true,review_scope:'nonproduction_signed_gets_only',
   gateway_signed_receipts_verified:false,owner_identity_witness_verified:false,
   owner_pilot_authorized:false,connection_state:'HOLD',live_dispatch_enabled:false};
  const saved=await g.db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT ?,'rosevear_integration_510_separation_review','integration_gateway','devilndove','POST',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='rosevear_integration_510_separation_review' AND target_type='integration_gateway' AND target_key='devilndove' AND (json_extract(details_json,'$.request_key')=? OR json_extract(details_json,'$.owner_handoff_receipt_id')=?))")
   .bind(g.admin.user_id,new URL(c.request.url).pathname,JSON.stringify(details),b.request_key,state.owner_security_handoff_receipt_id).run();
  if(Number(saved.meta?.changes)!==1)return respond({error:'The same independent reviewer handoff was already recorded; refresh the saved receipt.'},409);
  return respond({separation_review_recorded:true,receipt_id:Number(saved.meta?.last_row_id||0)||null,
   message:'Independent local separation review recorded. Gateway identity and owner pilot remain unapproved; HOLD persists.'});
 }catch{return respond({error:'Separation review on HOLD; signed evidence or source audit unavailable.'},409);}
}
