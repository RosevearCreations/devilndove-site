/* Build 620: complete local Etsy ledger counts and one original-authorized Meta Page GET. */
import {sha256} from './trustAuthority614.js';
import {verifySigner616} from './trustCheckpoint616.js';

export const HOLD_620='HOLD_INDEPENDENT_META_SOURCE_OWNER_AND_GENUINE_PROVIDER_TEST';
export const META_620='devilndove-original-meta-page-read-620-v1';
export const META_ENDPOINT_620='GET /v26.0/{page_id}?fields=id';
const HASH=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
const PAGE=/^[0-9]{1,25}$/;
const UTC=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
const FIELDS=['format','provider','grant_id','issuer_authority_id','original_source_sha256',
  'checkpoint_sha256','expected_page_id','scopes_sha256','test_nonce','endpoint',
  'owner_decision','issued_at','expires_at'];
const CODES=['TIMEOUT','NETWORK_ERROR','PROVIDER_UNVERIFIED','RECEIPT_WRITE_FAILED'];

export function canonicalMetaGrant620(p,now=new Date().toISOString()){
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==FIELDS.length||
    Object.keys(p).some(k=>!FIELDS.includes(k))||
    FIELDS.some(k=>typeof p[k]!=='string')||p.format!==META_620||p.provider!=='META'||
    !ID.test(p.grant_id)||!ID.test(p.issuer_authority_id)||
    !HASH.test(p.original_source_sha256)||!HASH.test(p.checkpoint_sha256)||
    !HASH.test(p.scopes_sha256)||!PAGE.test(p.expected_page_id)||
    !ID.test(p.test_nonce)||p.test_nonce.length<20||
    p.endpoint!==META_ENDPOINT_620||p.owner_decision!=='ONE_EXACT_META_PAGE_ID_READ_ONLY'||
    !UTC.test(p.issued_at)||!UTC.test(p.expires_at)||
    Date.parse(p.issued_at)>Date.parse(now)+300000||
    Date.parse(p.issued_at)<Date.parse(now)-1800000||
    Date.parse(p.expires_at)<=Date.parse(now)||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>1800000)
    throw Error('Expired or altered original Meta one-use authority.');
  return JSON.stringify(Object.fromEntries(FIELDS.map(k=>[k,p[k]])));
}
export async function scopesFingerprint620(scopes,cryptoApi=globalThis.crypto){
  if(!Array.isArray(scopes)||scopes.some(x=>typeof x!=='string'||!/^[a-z_]{2,80}$/.test(x))||
    new Set(scopes).size!==scopes.length)throw Error('Invalid exact Meta scopes.');
  return sha256(JSON.stringify([...scopes].sort()),cryptoApi);
}
export async function verifyMetaGrant620(input,{grant,originalSource,checkpoint,roots,pins,
  now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const signed=canonicalMetaGrant620(input?.payload,now),p=input.payload;
  if(!grant||grant.grant_id!==p.grant_id||grant.issuer_authority_id!==p.issuer_authority_id||
    grant.original_source_sha256!==p.original_source_sha256||
    grant.checkpoint_sha256!==p.checkpoint_sha256||
    grant.expected_page_id!==p.expected_page_id||grant.scopes_sha256!==p.scopes_sha256||
    grant.test_nonce!==p.test_nonce||
    grant.status!=='INDEPENDENTLY_APPROVED_ONE_META_PAGE_READ'||
    !originalSource||originalSource.authority_id!==p.issuer_authority_id||
    originalSource.original_source_sha256!==p.original_source_sha256||
    originalSource.status!=='INDEPENDENTLY_APPROVED_ORIGINAL_META_SOURCE'||
    !checkpoint||checkpoint.checkpoint_sha256!==p.checkpoint_sha256||
    checkpoint.original_issuer_source_sha256!==p.original_source_sha256||
    checkpoint.status!=='EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING'||
    !Array.isArray(input.signatures)||input.signatures.length!==3||
    Object.keys(input).sort().join(',')!=='payload,signatures')
    throw Error('Independently approved exact Meta original source and grant missing.');
  const digest=await sha256(signed,cryptoApi);
  if(grant.approval_sha256!==digest)throw Error('Signed original Meta approval digest mismatch.');
  const ids=new Set(),fps=new Set();
  for(const role of ['ISSUER','WITNESS','OWNER']){
    const signer=input.signatures.find(x=>x?.role===role);
    if(role==='ISSUER'&&signer?.authority_id!==p.issuer_authority_id)
      throw Error('Different original Meta issuer.');
    const fp=await verifySigner616(signer,role,signed,{authority:roots,pins,cryptoApi},ids);
    if(fps.has(fp))throw Error('Shared original issuer/witness/owner key.');fps.add(fp);
  }
  return {approval_sha256:digest,grant_id:p.grant_id,test_nonce:p.test_nonce,
    page_id:p.expected_page_id,signers:[...ids],provider_request_performed:false,
    provider_write:false,provider_action_authorized:false,release_gate:HOLD_620};
}
export async function probeMetaPage620({token,expectedPageId,fetchFn=globalThis.fetch,
  cryptoApi=globalThis.crypto}){
  if(typeof token!=='string'||token.length<12||token.length>5000||!PAGE.test(expectedPageId))
    throw Error('Exact verified Meta Page identity and token required.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
    const response=await fetchFn(`https://graph.facebook.com/v26.0/${expectedPageId}?fields=id`,{
      method:'GET',redirect:'manual',credentials:'omit',cache:'no-store',signal:controller.signal,
      headers:{Accept:'application/json',Authorization:`Bearer ${token}`}});
    if(response.status!==200||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')||'')||
      Number(response.headers.get('content-length')||0)>4096)
      throw Error('Meta read-only Page challenge did not return verified JSON.');
    const reader=response.body?.getReader();if(!reader)throw Error('Meta response unavailable.');
    let size=0;const chunks=[];
    while(true){const {done,value}=await reader.read();if(done)break;
      size+=value.byteLength;if(size>4096){await reader.cancel().catch(()=>{});
        throw Error('Meta Page identity exceeded safe size.');}chunks.push(value);}
    if(!size)throw Error('Missing Meta response.');
    const bytes=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    let parsed;try{parsed=JSON.parse(raw);}catch{throw Error('Meta identity JSON malformed.');}
    if(!parsed||Object.keys(parsed).length!==1||String(parsed.id)!==expectedPageId)
      throw Error('Meta Page identity did not match exact independently approved Page ID.');
    return {provider:'META',endpoint:META_ENDPOINT_620,expected_page_id:expectedPageId,
      receipt_sha256:await sha256(raw,cryptoApi),http_status:200,
      status:'META_PAGE_ID_GET_RECEIPT_PENDING_INDEPENDENT_WITNESS',provider_write:false,
      publication:false,provider_action_authorized:false,release_gate:HOLD_620};
  }finally{clearTimeout(timer);}
}
export function classifyMetaFailure620(error){
  if(error?.name==='AbortError')return 'TIMEOUT';
  if(error instanceof TypeError)return 'NETWORK_ERROR';
  return 'PROVIDER_UNVERIFIED';
}
export async function metaFailureDigest620({grant_id,test_nonce,code},cryptoApi=globalThis.crypto){
  if(!ID.test(grant_id)||!ID.test(test_nonce)||!CODES.includes(code))
    throw Error('Unsafe Meta failure code or exact nonce.');
  return sha256(JSON.stringify({build:620,provider:'META',grant_id,test_nonce,
    endpoint:META_ENDPOINT_620,code}),cryptoApi);
}
export function projectFullEtsyHistory620(counts){
  const keys=['grants','attempts','outcomes','acceptances','failures','dispositions',
    'orphan_attempts','orphan_outcomes','orphan_acceptances','orphan_failures',
    'orphan_dispositions','dual_outcomes','invalid_grants','invalid_failure_approvals'];
  if(!counts||keys.some(k=>!Number.isSafeInteger(counts[k])||counts[k]<0))
    throw Error('Full source receipt counts incomplete.');
  const anomaly=keys.slice(6).reduce((sum,k)=>sum+counts[k],0);
  const consistent=anomaly===0&&counts.attempts<=counts.grants&&
    counts.outcomes+counts.failures<=counts.attempts&&
    counts.acceptances<=counts.outcomes&&counts.dispositions<=counts.failures;
  return {full_history_sql_counts:counts,sql_rows_scanned_without_record_limit:true,
    anomaly_count:anomaly,source_record_consistent:consistent,
    externally_witnessed_complete_history:false,
    provider_api_contacted:false,provider_write:false,
    globally_accepted:false,release_gate:HOLD_620};
}
