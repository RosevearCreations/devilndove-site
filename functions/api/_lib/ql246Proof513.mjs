/* Build 513: exact QL-246 OFFLINE public source proof inspection.
 * A valid Ed25519 signature does not attest to actual gateway network activity,
 * independent CI/source retrieval, negative-test witnesses or owner approval. */
export const QL246_SOURCE_FIELDS_513=Object.freeze([
 'schema_version','source_system','repository','source_revision',
 'challenge_id','challenge_sha256','business_id','tenant_id',
 'environment','ci_run_url','allowed_methods','allowed_paths',
 'negative_tests','gateway_audit_receipt_id','health_receipt_id',
 'capabilities_receipt_id','registered_key_id','owner_authorization',
 'connection_state','external_gateway_get_verified','durable_audit_verified',
 'owner_identity_verified','issued_at','expires_at']);
export const QL246_NEGATIVES_513=Object.freeze([
 'nonce_replay_denied','stale_request_denied','cross_business_denied',
 'cross_tenant_denied','revoked_key_denied','write_denied','dispatch_denied']);
const paths=['/api/integration/v1/health','/api/integration/v1/capabilities'];
const encoder=new TextEncoder();
const hex=bytes=>[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
const decode=b64=>{try{if(typeof b64!=='string'||!/^([A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b64))return null;
 return Uint8Array.from(atob(b64),c=>c.charCodeAt(0));}catch{return null;}};
const urlBytes=b64=>{if(typeof b64!=='string'||!/^[A-Za-z0-9_-]{86}$/.test(b64))return null;
 return decode(b64.replace(/-/g,'+').replace(/_/g,'/')+'==');};
export const canonicalQl246513=payload=>QL246_SOURCE_FIELDS_513.map(field=>JSON.stringify([field,payload[field]])).join('\n');
export function ql246ShapeIssues513(record,now=Date.now()){
 const p=record?.payload,problems=[];
 if(!record||typeof record!=='object'||Array.isArray(record)||
  JSON.stringify(Object.keys(record))!==JSON.stringify(['publicKeyPem','payload','signature']))
  problems.push('Public record must contain only publicKeyPem, payload, signature in order.');
 if(!p||typeof p!=='object'||Array.isArray(p))return [...problems,'Exact QL-246 payload is absent.'];
 if(JSON.stringify(Object.keys(p))!==JSON.stringify(QL246_SOURCE_FIELDS_513))problems.push('Payload fields/order do not match exact 24-field QL-246 contract.');
 if(p.schema_version!=='rosevear.integration.v1'||p.source_system!=='devilndove'||
   p.repository!=='RosevearCreations/devilndove-site'||p.business_id!=='devilndove'||
   p.tenant_id!==null||p.environment!=='nonproduction')problems.push('Exact Devil n Dove repository, business and null-tenant nonproduction identity required.');
 if(!/^[a-f0-9]{40}$/.test(String(p.source_revision||''))||
  !/^https:\/\/github\.com\/RosevearCreations\/devilndove-site\/actions\/runs\/[1-9]\d{5,19}$/.test(String(p.ci_run_url||'')))
  problems.push('Real immutable source SHA and exact GitHub Actions run URL required.');
 if(!/^np-[A-Za-z0-9._-]{3,96}$/.test(String(p.challenge_id||''))||
   !/^[a-f0-9]{64}$/.test(String(p.challenge_sha256||'')))problems.push('Operator challenge ID and nonce SHA-256 are missing.');
 if(JSON.stringify(p.allowed_methods)!=='["GET"]'||JSON.stringify(p.allowed_paths)!==JSON.stringify(paths))
  problems.push('Only the two exact read-only nonproduction GET paths are permitted.');
 if(!p.negative_tests||Array.isArray(p.negative_tests)||typeof p.negative_tests!=='object'||
   JSON.stringify(Object.keys(p.negative_tests))!==JSON.stringify(QL246_NEGATIVES_513)||
   !QL246_NEGATIVES_513.every(k=>p.negative_tests[k]===true))
  problems.push('All seven independent actual denial observations must be true; fixtures/PENDING are not proof.');
 for(const field of ['gateway_audit_receipt_id','health_receipt_id','capabilities_receipt_id','registered_key_id'])
  if(p[field]!==null&&!/^np-[A-Za-z0-9._-]{3,96}$/.test(String(p[field]||'')))problems.push(field+' must be null or a real nonsecret np- receipt.');
 if(p.owner_authorization!=='NOT_GIVEN'||p.connection_state!=='DISCONNECTED'||
  p.external_gateway_get_verified!==false||p.durable_audit_verified!==false||p.owner_identity_verified!==false)
  problems.push('Source proof must retain explicit no-owner, disconnected, no-external-proof states.');
 if(!Number.isSafeInteger(p.issued_at)||!Number.isSafeInteger(p.expires_at)||
  Math.abs(now-p.issued_at)>300000||p.expires_at<=now||p.expires_at<=p.issued_at||
  p.expires_at-p.issued_at>3600000)problems.push('Issue time must be fresh and expiration within one hour.');
 return problems;
}
export async function inspectQl246513({rawJson,env,now=Date.now()}){
 if(typeof rawJson!=='string'||rawJson.length>24000)return {matched:false,issues:['Public raw JSON must be present and under 24KB.']};
 let record;try{record=JSON.parse(rawJson);}catch{return {matched:false,issues:['Exact JSON record required.']};}
 const issues=ql246ShapeIssues513(record,now),p=record?.payload||{};
 const pin=String(env?.ROSEVEAR_QL246_TRUSTED_DEVILNDOVE_SPKI_SHA256||'').toLowerCase();
 const challenge=String(env?.ROSEVEAR_QL246_CHALLENGE_ID||'');
 const challengeDigest=String(env?.ROSEVEAR_QL246_CHALLENGE_SHA256||'');
 const expectedRevision=String(env?.ROSEVEAR_QL246_EXPECTED_SOURCE_REVISION||'');
 if(!/^[a-f0-9]{64}$/.test(pin))issues.push('Separately sourced public SPKI pin NOT PROVISIONED.');
 if(!challenge||p.challenge_id!==challenge||!challengeDigest||p.challenge_sha256!==challengeDigest)
  issues.push('Independent operator challenge NOT PROVISIONED or mismatched.');
 if(!/^[a-f0-9]{40}$/.test(expectedRevision)||p.source_revision!==expectedRevision)
  issues.push('Independently verified immutable deployed source revision NOT PROVISIONED or mismatched.');
 const pem=String(record?.publicKeyPem||'');
 const match=/^-----BEGIN PUBLIC KEY-----\s+([A-Za-z0-9+/=\s]+)\s+-----END PUBLIC KEY-----\s*$/.exec(pem);
 const der=match?decode(match[1].replace(/\s/g,'')):null,sig=urlBytes(record?.signature);
 if(!der||der.length<40||der.length>128||!sig||sig.length!==64)issues.push('Valid Ed25519 public SPKI PEM and detached base64url signature required.');
 if(issues.length)return {matched:false,issues};
 const fingerprint=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',der)));
 if(fingerprint!==pin)return {matched:false,issues:['Public SPKI fingerprint differs from independently trusted pin.']};
 let good=false;
 try{const key=await crypto.subtle.importKey('spki',der,{name:'Ed25519'},false,['verify']);
  good=await crypto.subtle.verify('Ed25519',key,sig,encoder.encode(canonicalQl246513(p)));}
 catch{return {matched:false,issues:['Ed25519 signature/public key verification unavailable.']};}
 if(!good)return {matched:false,issues:['QL-246 canonical line-pair signature does not match.']};
 const rawDigest=hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(rawJson))));
 return {matched:true,issues:[],raw_public_json_sha256:rawDigest,source_revision:p.source_revision,
  ci_run_url:p.ci_run_url,challenge_id:p.challenge_id,
  independently_observed_network_gets:false,durable_gateway_audit_verified:false,
  six_app_evidence_accepted:false,owner_pilot_authorized:false,connection_state:'DISCONNECTED'};
}
