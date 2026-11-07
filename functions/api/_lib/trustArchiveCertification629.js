/* Build 629: bounded independent HTTPS archive byte readback and original
 * three-party readiness decision. No Meta API, OAuth or publication path. */
import {sha256,hex} from './trustAuthority614.js';
import {verifySigner616} from './trustCheckpoint616.js';
import {verifyCustody628,canonicalCustody628} from './trustCustodyHandoff628.js';

export const FORMAT_629='devilndove-original-meta-go-live-readiness-decision-629-v1';
export const APPROVE_629='CERTIFY_ORIGINAL_META_READ_ONLY_CHANNEL_READINESS_NO_ACTIVATION';
export const HOLD_DECISION_629='HOLD_ORIGINAL_META_CHANNEL_READINESS';
export const HOLD_629='HOLD_ORIGINAL_META_ARCHIVE_READBACK_OR_OWNER_GO_LIVE_DECISION';
const FIELDS=['format','custody_sha256','original_decision_sha256',
  'original_packet_sha256','readback_sha256','witness_sha256','receipt_sha256',
  'page_id','decision','nonce','issued_at','expires_at'];
const HASH=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
const UTC=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
const MAX_BYTES=16000;

function safeOriginalArchiveUrl629(value){
  if(typeof value!=='string'||value.length<15||value.length>220||
    /(?:password|token|secret|bearer|private[_-]?key|api[_-]?key)/i.test(value))
    throw Error('Archive reference malformed or includes credential-like data.');
  const url=new URL(value),host=url.hostname.toLowerCase();
  if(url.href!==value||url.protocol!=='https:'||url.port||url.username||url.password||url.search||
    url.hash||!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(host)||
    /^(?:localhost|localdomain)$/.test(host)||
    /\.(?:localhost|local|internal|test|invalid|onion)$/.test(host)||
    /(^|\.)xn--/.test(host)||host.includes('..')||
    host.split('.').some(label=>label.startsWith('-')||label.endsWith('-')))
    throw Error('Archive URL must be a public DNS HTTPS host without redirects or credentials.');
  return url;
}

async function fetchExact629(value,expected,fetchApi=globalThis.fetch,
  cryptoApi=globalThis.crypto){
  const url=safeOriginalArchiveUrl629(value);
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6000);
  let res;
  try{
    res=await fetchApi(url.href,{method:'GET',redirect:'manual',
      credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',
      signal:controller.signal,headers:{Accept:'application/octet-stream, application/json'}});
    if(res.status!==200||res.redirected||
      (res.url&&new URL(res.url).href!==url.href)||
      /text\/html/i.test(res.headers.get('content-type')||''))
      throw Error('External archive returned an unverified HTTP response.');
    const declared=Number(res.headers.get('content-length'));
    if(res.headers.has('content-length')&&
      (!Number.isSafeInteger(declared)||declared<0||declared>MAX_BYTES))
      throw Error('External archive exceeds readback byte limit.');
    if(!res.body)throw Error('Archive response has no byte stream.');
    const reader=res.body.getReader(),chunks=[];let size=0;
    try{while(true){const {done,value}=await reader.read();if(done)break;
      if(!(value instanceof Uint8Array))throw Error('Invalid external byte chunk.');
      size+=value.byteLength;
      if(size>MAX_BYTES||size>expected.byteLength)
        throw Error('External archive streamed more bytes than the signed packet.');
      chunks.push(value);
    }}finally{await reader.cancel().catch(()=>{});}
    if(size!==expected.byteLength)throw Error('External archive byte length differs.');
    const data=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.byteLength;}
    if(data.some((v,i)=>v!==expected[i]))
      throw Error('External archive bytes differ from original signed decision.');
    const digest=hex(await cryptoApi.subtle.digest('SHA-256',data));
    return {ref:url.href,sha256:digest,byte_count:size,http_status:200};
  }finally{clearTimeout(timer);controller.abort();}
}

export async function readExactOriginalArchives629(custodyBundle,originalBundle,{fetchApi,
  cryptoApi=globalThis.crypto,now=new Date().toISOString()}={}){
  const p=custodyBundle?.payload;
  if(!p||typeof originalBundle!=='object'||!originalBundle||
    !Array.isArray(originalBundle.signatures)||originalBundle.signatures.length!==3)
    throw Error('Original signed custody required for external retrieval.');
  const a=safeOriginalArchiveUrl629(p.primary_custody_ref),
    b=safeOriginalArchiveUrl629(p.secondary_custody_ref);
  if(a.hostname===b.hostname)throw Error('Distinct external archive hosts required.');
  const bytes=new TextEncoder().encode(JSON.stringify(originalBundle));
  if(!bytes.length||bytes.byteLength>MAX_BYTES)
    throw Error('Original signed packet exceeds safe readback byte limit.');
  const digest=hex(await cryptoApi.subtle.digest('SHA-256',bytes));
  if(p.original_packet_sha256!==digest||p.primary_packet_sha256!==digest||
    p.secondary_packet_sha256!==digest)
    throw Error('Signed custody packet hash differs before remote retrieval.');
  // Only the original signed 628 URLs may be read. No caller-provided URL,
  // token, body, redirect or environment credential is sent to archives.
  const [primary,secondary]=await Promise.all([
    fetchExact629(a.href,bytes,fetchApi,cryptoApi),
    fetchExact629(b.href,bytes,fetchApi,cryptoApi)]);
  const receipt={custody_sha256:await sha256(canonicalCustody628(p,now),cryptoApi),
    original_packet_sha256:digest,primary_custody_ref:a.href,
    secondary_custody_ref:b.href,primary_sha256:primary.sha256,
    secondary_sha256:secondary.sha256,primary_bytes:primary.byte_count,
    secondary_bytes:secondary.byte_count};
  return {...receipt,readback_sha256:await sha256(JSON.stringify(receipt),cryptoApi),
    actual_external_https_get_verified:true,both_archived_packets_byte_identical:true,
    no_provider_get_performed:true};
}

export function canonicalGoLive629(p,now=new Date().toISOString()){
  if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).length!==FIELDS.length||
    Object.keys(p).some(k=>!FIELDS.includes(k))||
    FIELDS.some(k=>typeof p[k]!=='string')||p.format!==FORMAT_629||
    ![p.custody_sha256,p.original_decision_sha256,p.original_packet_sha256,
      p.readback_sha256,p.witness_sha256,p.receipt_sha256].every(v=>HASH.test(v))||
    !/^[0-9]{1,25}$/.test(p.page_id)||
    ![APPROVE_629,HOLD_DECISION_629].includes(p.decision)||
    !ID.test(p.nonce)||p.nonce.length<20||
    !UTC.test(p.issued_at)||!UTC.test(p.expires_at)||
    !Number.isFinite(Date.parse(p.issued_at))||!Number.isFinite(Date.parse(p.expires_at))||
    Date.parse(p.issued_at)>Date.parse(now)+300000||
    Date.parse(p.issued_at)<Date.parse(now)-1800000||
    Date.parse(p.expires_at)<=Date.parse(now)||
    Date.parse(p.expires_at)<=Date.parse(p.issued_at)||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>600000)
    throw Error('Original Meta go-live decision expired, malformed or overbroad.');
  return JSON.stringify(Object.fromEntries(FIELDS.map(k=>[k,p[k]])));
}

export async function verifyGoLiveDecision629(signed,{custodyBundle,
  originalBundle,receipt,roots,pins,readback,now=new Date().toISOString(),
  cryptoApi=globalThis.crypto}){
  const message=canonicalGoLive629(signed?.payload,now),p=signed.payload;
  if(!signed||Object.keys(signed).sort().join(',')!=='payload,signatures'||
    !Array.isArray(signed.signatures)||signed.signatures.length!==3)
    throw Error('Three independently authenticated go-live decision signatures required.');
  const previous=await verifyCustody628(custodyBundle,
    {originalBundle,receipt,roots,pins,now,cryptoApi});
  if(!readback?.actual_external_https_get_verified||
    !readback.both_archived_packets_byte_identical||
    readback.custody_sha256!==previous.custody_sha256||
    readback.original_packet_sha256!==previous.original_packet_sha256||
    readback.primary_sha256!==previous.original_packet_sha256||
    readback.secondary_sha256!==previous.original_packet_sha256||
    readback.primary_custody_ref!==custodyBundle.payload.primary_custody_ref||
    readback.secondary_custody_ref!==custodyBundle.payload.secondary_custody_ref||
    !Number.isInteger(readback.primary_bytes)||
    readback.primary_bytes<=0||readback.primary_bytes>MAX_BYTES||
    readback.primary_bytes!==readback.secondary_bytes||
    p.custody_sha256!==previous.custody_sha256||
    p.original_decision_sha256!==previous.original_decision_sha256||
    p.original_packet_sha256!==previous.original_packet_sha256||
    p.readback_sha256!==readback.readback_sha256||
    p.witness_sha256!==receipt.witness_sha256||
    p.receipt_sha256!==receipt.receipt_sha256||p.page_id!==receipt.page_id||
    Date.parse(p.expires_at)>Date.parse(originalBundle.payload.expires_at)||
    Date.parse(p.expires_at)>Date.parse(custodyBundle.payload.expires_at))
    throw Error('Exact independent external bytes, current custody or source window missing.');
  const seen=new Set(),fingerprints=new Set();
  for(const role of ['ISSUER','WITNESS','OWNER']){
    const proof=signed.signatures.find(s=>s?.role===role);
    const original=originalBundle.signatures.find(s=>s?.role===role);
    if(!original||proof?.authority_id!==original.authority_id)
      throw Error('Original independent go-live signer changed.');
    const fp=await verifySigner616(proof,role,message,
      {authority:roots,pins,cryptoApi},seen);
    if(fingerprints.has(fp))throw Error('Go-live signature key reused.');
    fingerprints.add(fp);
  }
  return {decision_sha256:await sha256(message,cryptoApi),
    signed_original_go_live_decision_verified:true,
    independent_external_archive_bytes_verified:true,
    exact_original_custody_and_meta_get_verified:true,
    original_owner_decision:p.decision,
    go_live_readiness_certified:p.decision===APPROVE_629,
    certification_expires_at:p.expires_at,
    provider_channel_connected:false,publishing_enabled:false,
    token_refreshed:false,provider_get_performed:false,
    provider_write:false,automatic_connection:false,
    activation_requires_separate_owner_control:true,
    release_gate:HOLD_629};
}
