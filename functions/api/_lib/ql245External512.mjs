/* QL-245 / Build 512: validate an independently pinned, signed public SOURCE
 * metadata envelope. NOT the six-source + assessor offline verifier, gateway
 * datastore evidence, live connection or owner authorization. */
export const QL245_SOURCE_KEYS_512=Object.freeze([
 'schema_version','source_system','signer_key_id','business_id','tenant_id',
 'environment','source_revision','ci_run_url','key_id','registry_receipt_id',
 'health_receipt_id','capabilities_receipt_id','gateway_audit_id',
 'allowed_paths','scope','negative_tests','source_receipt_id',
 'audit_storage_review','owner_authorization','connection_state','issued_at','expires_at']);
export const QL245_NEGATIVES_512=Object.freeze([
 'nonce_replay','stale_request','wrong_business','wrong_tenant',
 'revoked_key','prohibited_write','prohibited_dispatch']);
const paths=['/api/integration/v1/health','/api/integration/v1/capabilities'];
const scopes=['read_health','read_capabilities'];
const encoded=new TextEncoder();
const hex=bytes=>[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
const decode=x=>{try{if(typeof x!=='string'||!/^([A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(x))return null;
 return Uint8Array.from(atob(x),c=>c.charCodeAt(0));}catch{return null;}};
const decodeUrl=x=>{try{if(typeof x!=='string'||!/^[A-Za-z0-9_-]+$/.test(x))return null;
 const pad='='.repeat((4-x.length%4)%4);return decode(x.replace(/-/g,'+').replace(/_/g,'/')+pad);}catch{return null;}};
export const canonicalSource512=payload=>JSON.stringify(Object.fromEntries(QL245_SOURCE_KEYS_512.map(key=>[key,payload[key]])));
export function checkQL245Source512(payload,now=Date.now()){
 const issues=[];
 if(!payload||typeof payload!=='object'||Array.isArray(payload))return ['Exactly one public metadata object is required.'];
 if(JSON.stringify(Object.keys(payload))!==JSON.stringify(QL245_SOURCE_KEYS_512))issues.push('Signed metadata must contain exactly 22 QL-245 keys in canonical order.');
 if(payload.schema_version!=='rosevear.integration.v1'||payload.source_system!=='devilndove'||
   payload.business_id!=='devilndove'||payload.tenant_id!==null||payload.environment!=='nonproduction')
  issues.push('Exact Devil n Dove, null tenant and nonproduction identity required.');
 if(!/^[0-9a-f]{40}$/.test(payload.source_revision||'')||
   !/^https:\/\/github\.com\/RosevearCreations\/devilndove-site\/actions\/runs\/[1-9]\d{5,19}$/.test(payload.ci_run_url||''))
  issues.push('Exact real 40-character commit SHA and GitHub Actions run URL required.');
 for(const field of ['signer_key_id','key_id','registry_receipt_id','health_receipt_id',
  'capabilities_receipt_id','gateway_audit_id','source_receipt_id'])
  if(!/^np-[A-Za-z0-9._-]{3,96}$/.test(String(payload[field]||'')))issues.push(`Nonsecret nonproduction ${field} required.`);
 if(JSON.stringify(payload.allowed_paths)!==JSON.stringify(paths)||JSON.stringify(payload.scope)!==JSON.stringify(scopes))
  issues.push('Only two exact QL-245 health/capabilities read scopes are permitted.');
 const denials=payload.negative_tests;
 if(!denials||typeof denials!=='object'||Array.isArray(denials)||
   JSON.stringify(Object.keys(denials))!==JSON.stringify(QL245_NEGATIVES_512)||
   !QL245_NEGATIVES_512.every(key=>denials[key]?.outcome==='DENIED'&&
    JSON.stringify(Object.keys(denials[key]))===JSON.stringify(['outcome','audit_receipt_id'])&&
    /^np-[A-Za-z0-9._-]{3,96}$/.test(String(denials[key]?.audit_receipt_id||''))))
  issues.push('All seven individually observed denial outcomes and nonsecret audit IDs must be supplied.');
 if(payload.audit_storage_review!=='INDEPENDENT_RESTART_PROOF_PENDING'||
   payload.owner_authorization!=='NOT_GIVEN'||payload.connection_state!=='DISCONNECTED')
  issues.push('Source metadata must explicitly retain independent audit, owner and connection HOLDs.');
 const issued=payload.issued_at,expires=payload.expires_at;
 if(!Number.isSafeInteger(issued)||!Number.isSafeInteger(expires)||
   Math.abs(now-issued)>300000||expires<=issued||expires-issued>3600000||expires<=now)
  issues.push('Signed Unix-millisecond evidence must be current (±5 minutes) and expire within one hour.');
 return issues;
}
export async function inspectQL245Source512({payload,signature,publicKeySpkiBase64,env,now=Date.now()}){
 const issues=checkQL245Source512(payload,now);
 const expected=String(env?.ROSEVEAR_QL245_TRUSTED_DEVILNDOVE_SPKI_SHA256||'').toLowerCase();
 if(!/^[a-f0-9]{64}$/.test(expected))issues.push('Separately authenticated Devil n Dove SPKI SHA-256 trust pin NOT PROVISIONED.');
 const der=decode(publicKeySpkiBase64),sig=decodeUrl(signature);
 if(!der||der.length<40||der.length>128||!sig||sig.length!==64)issues.push('A valid public Ed25519 SPKI key and 64-byte signature are required.');
 if(issues.length)return {accepted:false,signature_matched:false,issues};
 const fingerprint=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',der)));
 if(fingerprint!==expected)return {accepted:false,signature_matched:false,issues:['Public key fingerprint is not the separately provisioned trust pin.']};
 let valid=false;
 try{const key=await crypto.subtle.importKey('spki',der,{name:'Ed25519'},false,['verify']);
  valid=await crypto.subtle.verify('Ed25519',key,sig,encoded.encode(canonicalSource512(payload)));}
 catch{return {accepted:false,signature_matched:false,issues:['Ed25519 public key/signature could not be verified.']};}
 if(!valid)return {accepted:false,signature_matched:false,issues:['Ed25519 signature does not match exact canonical QL-245 public metadata.']};
 const digest=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoded.encode(canonicalSource512(payload)))));
 return {accepted:true,signature_matched:true,public_source_digest_sha256:digest,
  signer_key_id:payload.signer_key_id,source_revision:payload.source_revision,
  source_receipt_id:payload.source_receipt_id,ci_run_url:payload.ci_run_url,
  seven_independent_source_assessor_signatures_verified:false,
  original_gateway_audit_independently_retrieved:false,independent_owner_witness_verified:false,
  owner_pilot_authorized:false,connection_state:'DISCONNECTED',issues:[]};
}
