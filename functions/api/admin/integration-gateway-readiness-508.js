/* Build 508: server-only credential provisioning / gateway receipt review.
 * Never returns or writes an HMAC secret, customer data, product reference,
 * provider token, or an owner connection approval. */
import {getDb,jsonResponse} from '../_lib/adminAudit.js';
import {verifiedAdminFromModule} from '../_lib/verifiedAdmin398.mjs';

const respond=(data,status=200)=>jsonResponse({ok:status<400,build:508,read_only:true,credentials_returned:false,
   connected:false,product_reference_enabled:false,events_enabled:false,commands_enabled:false,...data},status,{'Cache-Control':'no-store'});
function readDetails(raw){try{return JSON.parse(raw||'{}')}catch{return {}}}
export function gatewayReadiness508(env,rows=[]){
 const keyId=String(env?.ROSEVEAR_INTEGRATION_KEY_ID_V1||''),environment=String(env?.ROSEVEAR_INTEGRATION_ENVIRONMENT_V1||'');
 const secret=String(env?.ROSEVEAR_INTEGRATION_HMAC_SECRET_V1||''),revoked=String(env?.ROSEVEAR_INTEGRATION_REVOKED_V1||'').toLowerCase()==='true';
 const configured=Boolean(keyId&&environment&&secret.length>=32)&&!revoked;
 const relevant=rows.filter(row=>{const d=readDetails(row.details_json);return d.source==='ai-data-platform'&&
  d.business==='devilndove'&&d.key_id===keyId&&d.environment===environment&&d.decision==='read_only_accepted';});
 const health=relevant.find(row=>row.request_path==='/api/integration/v1/health');
 const capabilities=relevant.find(row=>row.request_path==='/api/integration/v1/capabilities');
 const missing=[];
 if(!keyId)missing.push('Configure a separate server-only gateway key ID for this environment.');
 if(secret.length<32)missing.push('Provision an independent high-entropy server-only HMAC secret, never a browser value.');
 if(!environment)missing.push('Configure an exact integration environment identifier.');
 if(revoked)missing.push('Gateway credential is revoked; investigate and rotate before a new handshake.');
 if(configured&&!health)missing.push('No accepted signed health GET receipt for this key/environment yet.');
 if(configured&&!capabilities)missing.push('No accepted signed capabilities GET receipt for this key/environment yet.');
 return {contract_version:'rosevear.integration.v1',application_id:'devilndove',gateway:'ai-data-platform',
  environment:environment||null,key_id_configured:Boolean(keyId),secret_configured:secret.length>=32,revoked,
  state:revoked?'REVOKED':!configured?'DISCONNECTED':health&&capabilities?'TESTING':'CONFIGURED',
  accepted_health_receipt:Boolean(health),accepted_capabilities_receipt:Boolean(capabilities),
  last_health_at:health?.created_at||null,last_capabilities_at:capabilities?.created_at||null,
  missing_or_next_steps:missing,owner_data_access_approved:false,connected:false};
}
export async function onRequestGet(c){
 const admin=verifiedAdminFromModule(c),db=getDb(c.env);
 if(!admin)return respond({error:'Verified owner Admin required.'},401);
 if(!db)return respond({error:'Gateway audit database unavailable.'},503);
 try{
  const recent=await db.prepare("SELECT request_path,details_json,created_at FROM admin_action_audit WHERE action_type='rosevear_integration_v1_nonce_506' AND target_type='integration_nonce' ORDER BY admin_action_audit_id DESC LIMIT 40").all();
  return respond(gatewayReadiness508(c.env,recent.results||[]));
 }catch{return respond({error:'Gateway credential/audit readiness cannot be independently checked.'},503);}
}
