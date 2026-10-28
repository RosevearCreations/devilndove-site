/* Build 510 / QL-243 -- server-only nonproduction HMAC verification.
 * This is Devil n Dove's *source* response to AI Data Platform, NOT the
 * Comms Hub -> gateway packet. QL-243 gateway Ed25519 receipt signing and
 * owner identity witness verification belong to the gateway/test harness.
 */
import {getDb,jsonResponse} from './adminAudit.js';

const app='devilndove',contract='rosevear.integration.v1',emptySha='e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const permitted=new Set(['/api/integration/v1/health','/api/integration/v1/capabilities']);
const encoded=new TextEncoder();
const responder=(data,status=200)=>jsonResponse({ok:status<400,application_id:app,
 contract_version:contract,environment:'nonproduction',connection_status:'HOLD',
 owner_pilot_authorized:false,customer_records_exposed:false,credentials_returned:false,
 product_reference_enabled:false,listing_reference_enabled:false,events_enabled:false,commands_enabled:false,
 provider_modified:false,...data},status,{'Cache-Control':'no-store'});
const deny=(code,status=403)=>responder({error:code,authenticated_read_only:false},status);
const base64bytes=value=>{try{
 if(typeof value!=='string'||!/^([A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
 const bin=atob(value),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return bytes.length===32?bytes:null;
}catch{return null;}};
const b64url=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const urlBytes=value=>{try{if(!/^[A-Za-z0-9_-]{43}$/.test(value))return null;
 const bin=atob(value.replace(/-/g,'+').replace(/_/g,'/')+'=');return bin.length===32?Uint8Array.from(bin,c=>c.charCodeAt(0)):null;
}catch{return null;}};

export function canonical510({path,timestamp,nonce,source,destination,business,tenant,keyId}){
 return [contract,'GET',path,String(timestamp),nonce,source,destination,business,tenant,'nonproduction',emptySha,keyId].join('\n');
}
export async function sign510(secretBytes,canonical){
 if(!(secretBytes instanceof Uint8Array)||secretBytes.length!==32)throw Error('A 256-bit nonproduction HMAC key is required.');
 const key=await crypto.subtle.importKey('raw',secretBytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return b64url(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoded.encode(canonical))));
}
export function nonproductionSettings510(env){
 const secret=base64bytes(env?.ROSEVEAR_QL243_NONPROD_HMAC_KEY_B64);
 const candidate=String(env?.ROSEVEAR_QL243_NONPROD_KEY_ID||'');
 const keyId=/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(candidate)?candidate:'';
 const isolated=env?.ROSEVEAR_QL243_DEPLOYMENT_CLASS==='nonproduction';
 const revoked=String(env?.ROSEVEAR_QL243_NONPROD_REVOKED||'').toLowerCase()==='true';
 return {secret,keyId,isolated,revoked,configured:Boolean(secret&&keyId&&isolated&&!revoked)};
}
export function validateQL243Headers510(request,keyId,now=Date.now()){
 const url=new URL(request.url),h=request.headers;
 const identity={method:request.method,path:url.pathname,timestamp:h.get('x-rosevear-timestamp')||'',
  nonce:h.get('x-rosevear-nonce')||'',source:h.get('x-rosevear-source')||'',
  destination:h.get('x-rosevear-destination')||'',business:h.get('x-rosevear-business')||'',
  tenant:h.get('x-rosevear-tenant')||'',keyId:h.get('x-rosevear-key-id')||'',
  environment:h.get('x-rosevear-environment')||'',contract:h.get('x-rosevear-contract')||''};
 const signature=h.get('x-rosevear-signature')||'';
 if(identity.method!=='GET'||url.search||url.hash||!permitted.has(identity.path)||request.body!==null)return {error:'method_path_or_body_denied'};
 if(h.get('accept')?.trim().toLowerCase()!=='application/json')return {error:'json_accept_required'};
 if(identity.contract!==contract||identity.environment!=='nonproduction')return {error:'contract_or_environment_denied'};
 if(identity.source!=='ai-data-platform'||identity.destination!==app||identity.business!==app||identity.tenant!=='-')return {error:'source_business_or_tenant_denied'};
 if(!keyId||identity.keyId!==keyId)return {error:'unknown_key_id'};
 if(!/^\d{13}$/.test(identity.timestamp)||Math.abs(now-Number(identity.timestamp))>300000)return {error:'stale_timestamp'};
 if(!/^np-[a-f0-9]{32}$/.test(identity.nonce)||!urlBytes(signature))return {error:'nonce_or_signature_format_denied'};
 return {identity,signature};
}
async function denial510(db,url,code){
 if(!db)return;
 try{await db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) VALUES (NULL,'rosevear_integration_v1_denied_510','integration_denial','devilndove:nonproduction',?,?,?,CURRENT_TIMESTAMP)")
  .bind('GET',url.pathname,JSON.stringify({build:510,reason:code,decision:'DENIED',provider_modified:false})).run();}catch{}
}
export async function authorizedQL243Get510(c,expectedPath){
 const url=new URL(c.request.url),env=c.env||{},db=getDb(env),settings=nonproductionSettings510(env);
 const reject=async(code,status=403)=>{await denial510(db,url,code);return {error:deny(code,status)};};
 if(!permitted.has(expectedPath)||url.pathname!==expectedPath)return reject('unregistered_path',404);
 if(!settings.isolated)return reject('nonproduction_deployment_only',403);
 if(settings.revoked)return reject('nonproduction_key_revoked',403);
 if(!settings.configured)return reject('nonproduction_credential_not_provisioned',503);
 const validation=validateQL243Headers510(c.request,settings.keyId);
 if(validation.error)return reject(validation.error);
 const signatureBytes=urlBytes(validation.signature);
 const key=await crypto.subtle.importKey('raw',settings.secret,{name:'HMAC',hash:'SHA-256'},false,['verify']);
 const valid=await crypto.subtle.verify('HMAC',key,signatureBytes,encoded.encode(canonical510(validation.identity)));
 if(!valid)return reject('hmac_signature_denied');
 if(!db)return {error:deny('durable_nonce_ledger_unavailable',503)};
 const id=validation.identity;
 const nonceKey=[id.source,id.business,'-',id.keyId,id.environment,id.nonce].join(':');
 try{
  const receipt=await db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT NULL,'rosevear_integration_v1_nonce_510','integration_nonce',?,'GET',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM admin_action_audit WHERE action_type='rosevear_integration_v1_nonce_510' AND target_type='integration_nonce' AND target_key=?)")
   .bind(nonceKey,id.path,JSON.stringify({source:id.source,destination:id.destination,business:id.business,tenant:null,
    environment:id.environment,key_id:id.keyId,contract_version:contract,scope:'health_capabilities_get_only',
    decision:'read_only_accepted',publication_performed:false,provider_modified:false}),nonceKey).run();
  if(Number(receipt.meta?.changes)!==1)return reject('nonce_replay_denied',409);
  return {identity:id,receipt_id:Number(receipt.meta?.last_row_id||0)||null};
 }catch{return reject('atomic_nonce_receipt_unavailable',503);}
}
export function responseQL243Get510(c,authorized,body){
 return responder({source_system:app,business_id:app,tenant_id:null,status:'HOLD',
  gateway:'ai-data-platform',connection_state:'HOLD',key_id_configured:true,
  source_nonce_receipt_id:authorized.receipt_id,
  gateway_ed25519_receipt:false,gateway_audit_id:null,independent_owner_identity_witness:false,
  source_response_only:true,...body});
}
export async function rejectQL243Write510(c){
 const db=getDb(c.env||{}),url=new URL(c.request.url);
 await denial510(db,url,'method_or_write_denied');
 return deny('method_or_write_denied',405);
}
