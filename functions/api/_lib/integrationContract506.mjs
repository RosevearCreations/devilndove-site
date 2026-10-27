/* Build 506 — fail-closed, server-only Rosevear Integration Contract v1 gate.
 * Only a registered AI Data Platform gateway may call read-only endpoints.
 * No browser token, customer record, provider credential or command is exposed.
 */
import {getDb,jsonResponse} from './adminAudit.js';

const contract='rosevear.integration.v1';
const app='devilndove';
const deny=(message,status=403)=>jsonResponse({ok:false,contract_version:contract,application_id:app,connection_state:'HOLD',error:message},status,{'Cache-Control':'no-store'});
const hexBytes=value=>new Uint8Array(String(value).match(/../g).map(part=>parseInt(part,16)));
export function canonical506({method,path,timestamp,nonce,keyId,source,destination,business,tenant,environment}){
 return [method,path,timestamp,nonce,keyId,source,destination,business,tenant,environment,'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'].join('\n');
}
export async function sign506(secret,message){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(message)))).map(byte=>byte.toString(16).padStart(2,'0')).join('');}
export function validateHeaders506(request,env,now=Date.now()){
 const h=request.headers,url=new URL(request.url),keyId=h.get('x-rosevear-key-id')||'',timestamp=h.get('x-rosevear-timestamp')||'',nonce=h.get('x-rosevear-nonce')||'';
 const source=h.get('x-rosevear-source')||'',destination=h.get('x-rosevear-destination')||'',business=h.get('x-rosevear-business')||'',tenant=h.get('x-rosevear-tenant')||'';
 const environment=h.get('x-rosevear-environment')||'',signature=h.get('x-rosevear-signature')||'';
 const expectedEnv=String(env.ROSEVEAR_INTEGRATION_ENVIRONMENT_V1||'').trim();
 if(request.method!=='GET'||url.search||url.hash)return {error:'Only exact read-only paths are allowed.'};
 if(!/^[a-z][a-z0-9_-]{1,40}$/.test(keyId)||keyId!==String(env.ROSEVEAR_INTEGRATION_KEY_ID_V1||''))return {error:'Unknown or revoked gateway key ID.'};
 if(source!=='ai-data-platform'||destination!==app||business!==app||tenant!=='')return {error:'Source, business or tenant is not authorized.'};
 if(!expectedEnv||environment!==expectedEnv)return {error:'Integration environment mismatch.'};
 if(!/^\d{13}$/.test(timestamp)||Math.abs(now-Number(timestamp))>120000)return {error:'Expired or invalid gateway timestamp.'};
 if(!/^[a-zA-Z0-9_-]{20,96}$/.test(nonce)||!/^([a-f0-9]{64})$/.test(signature))return {error:'Signed nonce or HMAC format invalid.'};
 return {identity:{method:'GET',path:url.pathname,timestamp,nonce,keyId,source,destination,business,tenant,environment},signature};
}
export async function authorizedIntegration506(c,expectedPath){
 const env=c.env||{},url=new URL(c.request.url);
 if(url.pathname!==expectedPath)return {error:deny('Unexpected integration route.',404)};
 if(String(env.ROSEVEAR_INTEGRATION_REVOKED_V1||'').toLowerCase()==='true')return {error:deny('Gateway credential revoked.')};
 if(!env.ROSEVEAR_INTEGRATION_HMAC_SECRET_V1||!env.ROSEVEAR_INTEGRATION_KEY_ID_V1||!env.ROSEVEAR_INTEGRATION_ENVIRONMENT_V1)
   return {error:deny('Gateway credential and environment are not configured.',503)};
 const validation=validateHeaders506(c.request,env);
 if(validation.error)return {error:deny(validation.error)};
 const input=hexBytes(validation.signature),verified=await crypto.subtle.verify('HMAC',await crypto.subtle.importKey('raw',new TextEncoder().encode(String(env.ROSEVEAR_INTEGRATION_HMAC_SECRET_V1)),{name:'HMAC',hash:'SHA-256'},false,['verify']),input,new TextEncoder().encode(canonical506(validation.identity)));
 if(!verified)return {error:deny('Invalid gateway HMAC.')};
 const db=getDb(env);if(!db)return {error:deny('Durable nonce audit unavailable.',503)};
 const nonceKey=`${validation.identity.source}:${validation.identity.keyId}:${validation.identity.environment}:${validation.identity.nonce}`;
 try{
  const receipt=await db.prepare("INSERT INTO admin_action_audit(actor_user_id,action_type,target_type,target_key,request_method,request_path,details_json,created_at) SELECT NULL,'rosevear_integration_v1_nonce_506','integration_nonce',?,'GET',?,?,CURRENT_TIMESTAMP WHERE NOT EXISTS(SELECT 1 FROM admin_action_audit WHERE action_type='rosevear_integration_v1_nonce_506' AND target_type='integration_nonce' AND target_key=?)")
   .bind(nonceKey,url.pathname,JSON.stringify({source:validation.identity.source,business:app,environment:validation.identity.environment,decision:'read_only_accepted',key_id:validation.identity.keyId}),nonceKey).run();
  if(Number(receipt.meta?.changes)!==1)return {error:deny('Gateway nonce replay rejected.',409)};
  return {identity:validation.identity};
 }catch{return {error:deny('Atomic nonce receipt could not be persisted.',503)};}
}
export function integrationResponse506(c,payload){
 return jsonResponse({ok:true,contract_version:contract,application_id:app,application_version:'506',environment:String(c.env.ROSEVEAR_INTEGRATION_ENVIRONMENT_V1),connection_state:'TESTING',
   gateway:'ai-data-platform',business_id:app,tenant_id:null,checked_at:new Date().toISOString(),owner_approved_data_access:false,
   ...payload},200,{'Cache-Control':'no-store'});
}
