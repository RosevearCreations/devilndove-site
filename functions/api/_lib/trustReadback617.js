/* Build 617: independently retrieved bytes and signed TEST preflight; no activation. */
import {hex,sha256} from './trustAuthority614.js';
import {canonicalCheckpoint616,verifySigner616} from './trustCheckpoint616.js';

export const HOLD_617='HOLD_ORIGINAL_ISSUER_EXTERNAL_CUSTODY_OWNER_WITNESS_AND_PROVIDER_TEST_AUTHORIZATION';
export const ANCHOR_617='devilndove-independent-original-anchor-617-v1';
export const RECOVERY_617='devilndove-quarantine-recovery-packet-617-v1';
export const PREFLIGHT_617='devilndove-witnessed-provider-test-preflight-617-v1';
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
const HASH=/^[0-9a-f]{64}$/;
const UTC=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
// The external document commits to a nonce, not the checkpoint digest: the latter
// already commits to this document's bytes, so putting it inside would form a hash cycle.
const ANCHOR_FIELDS=['format','checkpoint_nonce','ledger_head_sha256',
  'ledger_sequence','custodian_id','original_issuer_source_sha256',
  'nonce','issued_at','expires_at'];
const RECOVERY_FIELDS=['format','quarantined_authority_id','quarantined_key_sha256',
  'replacement_authority_id','replacement_key_sha256','checkpoint_sha256',
  'original_issuer_source_sha256','nonce','issued_at','expires_at'];
const TEST_FIELDS=['format','case_pin','channel','account_id','product_ref','action',
  'source_sha256','issuer_authority_id','checkpoint_sha256','nonce','issued_at','expires_at'];
function canonical(p,fields,format,now){
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==fields.length||
    Object.keys(p).some(k=>!fields.includes(k))||fields.some(k=>typeof p[k]!=='string')||
    p.format!==format||!ID.test(p.nonce)||p.nonce.length<20||
    !UTC.test(p.issued_at)||!UTC.test(p.expires_at)||
    !Number.isFinite(Date.parse(p.issued_at))||!Number.isFinite(Date.parse(p.expires_at))||
    Date.parse(p.issued_at)>Date.parse(now)+300000||
    Date.parse(p.issued_at)<Date.parse(now)-1800000||
    Date.parse(p.expires_at)<=Date.parse(now)||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>1800000)
    throw Error('Invalid, unbounded or expired signed Build 617 scope.');
  return JSON.stringify(Object.fromEntries(fields.map(k=>[k,p[k]])));
}
export function canonicalAnchor617(p,now=new Date().toISOString()){
  const s=canonical(p,ANCHOR_FIELDS,ANCHOR_617,now);
  if(!ID.test(p.checkpoint_nonce)||p.checkpoint_nonce.length<20||
    !HASH.test(p.ledger_head_sha256)||
    !HASH.test(p.original_issuer_source_sha256)||!ID.test(p.custodian_id)||
    !/^[1-9][0-9]{0,8}$/.test(p.ledger_sequence))throw Error('Invalid exact external anchor.');
  return s;
}
export function canonicalRecovery617(p,now=new Date().toISOString()){
  const s=canonical(p,RECOVERY_FIELDS,RECOVERY_617,now);
  if(!ID.test(p.quarantined_authority_id)||!ID.test(p.replacement_authority_id)||
    p.quarantined_authority_id===p.replacement_authority_id||
    !HASH.test(p.quarantined_key_sha256)||!HASH.test(p.replacement_key_sha256)||
    p.quarantined_key_sha256===p.replacement_key_sha256||
    !HASH.test(p.checkpoint_sha256)||!HASH.test(p.original_issuer_source_sha256))
    throw Error('Invalid independent quarantine recovery scope.');
  return s;
}
export function canonicalTest617(p,now=new Date().toISOString()){
  const s=canonical(p,TEST_FIELDS,PREFLIGHT_617,now);
  if(!ID.test(p.case_pin)||!ID.test(p.account_id)||!ID.test(p.product_ref)||
    !ID.test(p.issuer_authority_id)||!HASH.test(p.source_sha256)||
    !HASH.test(p.checkpoint_sha256)||p.action!=='TEST_CONNECTION_READBACK'||
    !['ETSY','FACEBOOK_PAGE','INSTAGRAM'].includes(p.channel))
    throw Error('Invalid exact provider TEST-only scope.');
  return s;
}
export function approvedAnchorUrl617(value,approvedOrigin){
  if(typeof value!=='string'||value.length>220||value.length<15||
    typeof approvedOrigin!=='string')throw Error('Externally approved custody origin missing.');
  let url;try{url=new URL(value);}catch{throw Error('Invalid external custody URL.');}
  if(url.protocol!=='https:'||url.port||url.username||url.password||url.search||url.hash||
    url.href!==value||url.origin!==approvedOrigin||
    !/^[a-z0-9.-]+$/.test(url.hostname)||url.hostname.includes('..')||
    /(^localhost$|\.localhost$|\.local$|\.internal$|\.lan$|\.test$)/.test(url.hostname)||
    /^\d+(?:\.\d+){3}$/.test(url.hostname)||url.hostname.includes(':')||
    !url.pathname.startsWith('/'))throw Error('External custody URL is not independently allowed.');
  return url.href;
}
async function signedTwo(input,canonicalText,{authority,pins,cryptoApi}){
  if(!input||Object.keys(input).sort().join(',')!=='payload,signatures'||
    !Array.isArray(input.signatures)||input.signatures.length!==2)
    throw Error('Exactly two independent signatures required.');
  const seen=new Set(),keys=new Set();
  for(const role of ['WITNESS','OWNER']){
    const proof=input.signatures.find(x=>x?.role===role);
    const fp=await verifySigner616(proof,role,canonicalText,{authority,pins,cryptoApi},seen);
    if(keys.has(fp))throw Error('Shared witness/owner public key.');
    keys.add(fp);
  }
  return [...seen];
}
export async function fetchExternalReadback617({checkpoint,custodian,authority,pins,
  fetchFn=globalThis.fetch,cryptoApi=globalThis.crypto,now=new Date().toISOString()}){
  if(!checkpoint||checkpoint.status!=='SIGNED_PENDING_EXTERNAL_READBACK'||
    !HASH.test(checkpoint.checkpoint_sha256)||
    typeof checkpoint.signed_bundle_json!=='string')throw Error('Immutable signed 616 checkpoint missing.');
  let bundle;try{bundle=JSON.parse(checkpoint.signed_bundle_json);}catch{
    throw Error('Unreadable original 616 signed checkpoint.');}
  const scope=bundle.payload;
  if(!scope)throw Error('Original checkpoint scope missing.');
  const calculated=await sha256(canonicalCheckpoint616(scope,scope.issued_at),cryptoApi);
  if(calculated!==checkpoint.checkpoint_sha256||
    scope.ledger_head_sha256!==checkpoint.ledger_head_sha256||
    Number(scope.ledger_sequence)!==Number(checkpoint.ledger_sequence))
    throw Error('Stored signed checkpoint changed or mismatched.');
  if(!custodian||custodian.status!=='INDEPENDENTLY_APPROVED'||
    !ID.test(custodian.custodian_id)||!HASH.test(custodian.approval_sha256))
    throw Error('Separately approved independent external custodian required.');
  const url=approvedAnchorUrl617(scope.external_custody_ref,custodian.origin);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
  let raw;
  try{
    const response=await fetchFn(url,{method:'GET',redirect:'manual',credentials:'omit',
      cache:'no-store',headers:{Accept:'application/json'},signal:controller.signal});
    if(response.status!==200||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')||'')||
      Number(response.headers.get('content-length')||0)>16384)
      throw Error('Original external custody server unavailable, redirecting or not JSON.');
    const reader=response.body?.getReader();
    if(!reader)throw Error('External receipt stream missing.');
    const chunks=[];let size=0;
    while(true){
      const {done,value}=await reader.read();
      if(done)break;
      size+=value.byteLength;
      if(size>16384){await reader.cancel().catch(()=>{});
        throw Error('External receipt exceeds 16KiB.');}
      chunks.push(value);
    }
    if(size===0)throw Error('Empty external receipt.');
    const bytes=new Uint8Array(size);let offset=0;
    for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}
    raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  }finally{clearTimeout(timer);}
  const bytesDigest=await sha256(raw,cryptoApi);
  if(bytesDigest!==scope.external_receipt_sha256)
    throw Error('Externally retrieved exact bytes differ from precommitted 616 receipt digest.');
  let external;try{external=JSON.parse(raw);}catch{throw Error('External custody JSON invalid.');}
  const signed=canonicalAnchor617(external?.payload,now);
  const p=external.payload;
  if(p.checkpoint_nonce!==scope.nonce||p.ledger_head_sha256!==checkpoint.ledger_head_sha256||
    Number(p.ledger_sequence)!==Number(checkpoint.ledger_sequence)||
    p.custodian_id!==custodian.custodian_id)
    throw Error('Readback does not attest the exact checkpoint and independent custodian.');
  const signers=await signedTwo(external,signed,{authority,pins,cryptoApi});
  return {readback_sha256:bytesDigest,checkpoint_sha256:checkpoint.checkpoint_sha256,
    ledger_head_sha256:p.ledger_head_sha256,ledger_sequence:Number(p.ledger_sequence),
    custodian_id:p.custodian_id,original_issuer_source_sha256:p.original_issuer_source_sha256,
    signer_ids:signers,external_bytes_retrieved:true,independent_signatures_verified:true,
    original_issuer_custody_authenticated:false,
    status:'EXTERNAL_BYTES_AND_WITNESS_SIGNATURES_VERIFIED_ORIGINAL_ISSUER_PENDING',
    authority_activated:false,provider_test_executed:false,
    provider_action_authorized:false,release_gate:HOLD_617};
}
export async function verifyRecoveryPacket617(input,{quarantine,replacement,readback,authority,pins,
  now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const signed=canonicalRecovery617(input?.payload,now),p=input.payload;
  if(!quarantine||quarantine.authority_id!==p.quarantined_authority_id||
    quarantine.key_sha256!==p.quarantined_key_sha256||
    !replacement||replacement.authority_id!==p.replacement_authority_id||
    replacement.key_sha256!==p.replacement_key_sha256||
    replacement.status!=='PENDING_EXTERNAL_VERIFICATION'||
    !readback||readback.checkpoint_sha256!==p.checkpoint_sha256||
    readback.original_issuer_source_sha256!==p.original_issuer_source_sha256||
    readback.status!=='EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING')
    throw Error('Quarantine, pending replacement and external witnessed readback required.');
  const signers=await signedTwo(input,signed,{authority,pins,cryptoApi});
  return {recovery_sha256:await sha256(signed,cryptoApi),
    quarantined_authority_id:p.quarantined_authority_id,
    replacement_authority_id:p.replacement_authority_id,
    checkpoint_sha256:p.checkpoint_sha256,signer_ids:signers,
    status:'PENDING_ORIGINAL_ISSUER_AND_SEPARATE_OWNER_RECOVERY_APPROVAL',
    quarantine_removed:false,replacement_activated:false,provider_action_authorized:false,
    release_gate:HOLD_617};
}
export async function verifyTestPreflight617(input,{issuer,readback,ledgerHead,ledgerSequence,
  originalCustodyAuthenticated,authority,pins,
  now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const signed=canonicalTest617(input?.payload,now),p=input.payload;
  if(!issuer||issuer.authority_id!==p.issuer_authority_id||issuer.role!=='ISSUER'||
    issuer.status!=='ACTIVE_EXTERNAL_VERIFIED'||pins[issuer.authority_id]!==issuer.key_sha256||
    !readback||readback.checkpoint_sha256!==p.checkpoint_sha256||
    readback.status!=='EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING'||
    readback.ledger_head_sha256!==ledgerHead||Number(readback.ledger_sequence)!==ledgerSequence||
    originalCustodyAuthenticated!==true)
    throw Error('Original custody, unrevoked original issuer and current external anchor required.');
  const signers=await signedTwo(input,signed,{authority,pins,cryptoApi});
  return {preflight_sha256:await sha256(signed,cryptoApi),
    checkpoint_sha256:p.checkpoint_sha256,issuer_authority_id:p.issuer_authority_id,
    exact_scope:{case_pin:p.case_pin,channel:p.channel,account_id:p.account_id,
      product_ref:p.product_ref,action:p.action,source_sha256:p.source_sha256},
    signer_ids:signers,status:'READY_FOR_SEPARATELY_AUTHORIZED_WITNESSED_PROVIDER_TEST',
    provider_test_executed:false,provider_action_authorized:false,authority_activated:false,
    release_gate:HOLD_617};
}
