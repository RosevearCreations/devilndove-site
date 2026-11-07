/* Build 618. Actual provider GET is one-use, read-only and original-authority-gated. */
import {hex,sha256} from './trustAuthority614.js';
import {verifySigner616} from './trustCheckpoint616.js';

export const HOLD_618='HOLD_INDEPENDENT_ORIGINAL_ISSUER_BACKUP_RESTORE_AND_FINAL_TEST_AUTHORIZATION';
export const ISSUER_618='devilndove-original-issuer-custody-attestation-618-v1';
export const BACKUP_618='devilndove-witnessed-migration-backup-618-v1';
export const ACCEPT_618='devilndove-genuine-etsy-test-acceptance-618-v1';
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
const HASH=/^[0-9a-f]{64}$/;
const UTC=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
const B64=/^[A-Za-z0-9_-]+$/;
const ISSUER_FIELDS=['format','provider','authority_id','custody_receipt_id',
  'checkpoint_sha256','original_source_sha256','original_receipt_sha256',
  'nonce','issued_at','expires_at'];
const BACKUP_FIELDS=['format','backup_id','backup_sha256','migration_manifest_sha256',
  'source_database_id','checkpoint_sha256','owner_decision',
  'nonce','issued_at','expires_at'];
const ACCEPT_FIELDS=['format','grant_id','test_nonce','preflight_sha256','checkpoint_sha256',
  'provider_receipt_sha256','remote_subject_id','owner_decision',
  'nonce','issued_at','expires_at'];
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
    throw Error('Wrong or expired exact signed authority scope.');
  return JSON.stringify(Object.fromEntries(fields.map(k=>[k,p[k]])));
}
export function canonicalIssuer618(p,now=new Date().toISOString()){
  const signed=canonical(p,ISSUER_FIELDS,ISSUER_618,now);
  if(p.provider!=='ETSY'||!ID.test(p.authority_id)||!ID.test(p.custody_receipt_id)||
    !HASH.test(p.checkpoint_sha256)||!HASH.test(p.original_source_sha256)||
    !HASH.test(p.original_receipt_sha256))throw Error('Invalid original issuer documentary scope.');
  return signed;
}
export function canonicalBackup618(p,now=new Date().toISOString()){
  const signed=canonical(p,BACKUP_FIELDS,BACKUP_618,now);
  if(!ID.test(p.backup_id)||!ID.test(p.source_database_id)||
    !HASH.test(p.backup_sha256)||!HASH.test(p.migration_manifest_sha256)||
    !HASH.test(p.checkpoint_sha256)||p.owner_decision!=='AUTHORIZE_INDEPENDENT_REVIEW_ONLY')
    throw Error('Invalid exact reviewed backup/migration packet.');
  return signed;
}
export function canonicalAcceptance618(p,now=new Date().toISOString()){
  const signed=canonical(p,ACCEPT_FIELDS,ACCEPT_618,now);
  if(!ID.test(p.grant_id)||!ID.test(p.test_nonce)||p.test_nonce.length<20||
    !HASH.test(p.preflight_sha256)||!HASH.test(p.checkpoint_sha256)||
    !HASH.test(p.provider_receipt_sha256)||!/^[0-9]{1,20}$/.test(p.remote_subject_id)||
    p.owner_decision!=='ACCEPT_EXACT_ETSY_READ_ONLY_TEST_RECEIPT')
    throw Error('Invalid original provider TEST receipt decision.');
  return signed;
}
const decode=s=>{
  if(typeof s!=='string'||!B64.test(s)||s.length>200)throw Error('Invalid public signature.');
  const p=s.replace(/-/g,'+').replace(/_/g,'/');
  return Uint8Array.from(atob(p+'='.repeat((4-p.length%4)%4)),x=>x.charCodeAt(0));
};
async function verifyCandidate(proof,canonicalText,candidate,pins,cryptoApi){
  if(!proof||Object.keys(proof).sort().join(',')!=='authority_id,role,signature'||
    proof.role!=='CANDIDATE'||proof.authority_id!==candidate?.authority_id||
    candidate.status!=='PENDING_EXTERNAL_VERIFICATION'||candidate.role!=='ISSUER')
    throw Error('Original pending issuer candidate is not independently identified.');
  const keyRaw=decode(candidate.public_key),signature=decode(proof.signature);
  if(keyRaw.length!==32||signature.length!==64)throw Error('Invalid original issuer signature.');
  const fp=hex(await cryptoApi.subtle.digest('SHA-256',keyRaw));
  if(fp!==candidate.key_sha256||pins[candidate.authority_id]!==fp)
    throw Error('Original issuer public key not independently pinned.');
  const key=await cryptoApi.subtle.importKey('raw',keyRaw,'Ed25519',false,['verify']);
  if(!await cryptoApi.subtle.verify('Ed25519',key,signature,new TextEncoder().encode(canonicalText)))
    throw Error('Original issuer candidate signature failed.');
  return fp;
}
async function verifyIndependent(input,signed,{authority,pins,cryptoApi},exclude=[],excludeKeys=[]){
  if(!input||!Array.isArray(input.signatures)||
    input.signatures.length!==2+exclude.length||
    Object.keys(input).sort().join(',')!=='payload,signatures')
    throw Error('Exact independently signed source wrapper required.');
  const seen=new Set(exclude),fingerprints=new Set(excludeKeys);
  for(const role of ['WITNESS','OWNER']){
    const signature=input.signatures.find(x=>x?.role===role);
    const fp=await verifySigner616(signature,role,signed,
      {authority,pins,cryptoApi},seen);
    if(fingerprints.has(fp))throw Error('Shared or recycled witness and owner key.');
    fingerprints.add(fp);
  }
  return [...seen];
}
export async function verifyIssuerCustody618(input,{candidate,custody,readback,registry,
  authority,pins,now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const signed=canonicalIssuer618(input?.payload,now),p=input.payload;
  if(!custody||custody.receipt_id!==p.custody_receipt_id||
    custody.authority_id!==p.authority_id||
    custody.original_source_sha256!==p.original_source_sha256||
    custody.original_receipt_sha256!==p.original_receipt_sha256||
    !['PENDING_EXTERNAL_AUTHENTICATION','EXTERNALLY_AUTHENTICATED'].includes(custody.status)||
    !readback||readback.checkpoint_sha256!==p.checkpoint_sha256||
    readback.original_issuer_source_sha256!==p.original_source_sha256||
    readback.status!=='EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING'||
    !registry||registry.provider!=='ETSY'||registry.authority_id!==p.authority_id||
    registry.original_source_sha256!==p.original_source_sha256||
    registry.status!=='INDEPENDENTLY_APPROVED_ORIGINAL_SOURCE')
    throw Error('External original custody/source is not independently registered.');
  if(!input||!Array.isArray(input.signatures)||input.signatures.length!==3)
    throw Error('Original issuer, independent witness and owner signatures required.');
  const candidateProof=input.signatures.find(x=>x?.role==='CANDIDATE');
  const candidateFingerprint=await verifyCandidate(candidateProof,signed,candidate,pins,cryptoApi);
  const signerIds=await verifyIndependent(input,signed,{authority,pins,cryptoApi},
    [candidate.authority_id],[candidateFingerprint]);
  return {attestation_sha256:await sha256(signed,cryptoApi),authority_id:p.authority_id,
    checkpoint_sha256:p.checkpoint_sha256,source_sha256:p.original_source_sha256,
    signer_ids:signerIds,status:'CRYPTO_ATTESTED_PENDING_SEPARATE_ORIGINAL_CUSTODY_DECISION',
    original_issuer_activated:false,provider_test_executed:false,
    provider_action_authorized:false,release_gate:HOLD_618};
}
export async function verifyBackupWitness618(input,{readback,authority,pins,
  now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const signed=canonicalBackup618(input?.payload,now),p=input.payload;
  if(!readback||readback.checkpoint_sha256!==p.checkpoint_sha256||
    readback.status!=='EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING')
    throw Error('Original external checkpoint required for witnessed backup.');
  const signers=await verifyIndependent(input,signed,{authority,pins,cryptoApi});
  return {backup_witness_sha256:await sha256(signed,cryptoApi),backup_id:p.backup_id,
    backup_sha256:p.backup_sha256,migration_manifest_sha256:p.migration_manifest_sha256,
    checkpoint_sha256:p.checkpoint_sha256,signer_ids:signers,
    status:'SIGNED_BACKUP_PACKET_PENDING_INDEPENDENT_RESTORE_AND_MIGRATION_REVIEW',
    backup_restored_verified:false,d1_migration_authorized:false,
    d1_migration_performed:false,provider_action_authorized:false,release_gate:HOLD_618};
}
export async function verifyProviderAcceptance618(input,{attempt,outcome,grant,authority,pins,
  now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const signed=canonicalAcceptance618(input?.payload,now),p=input.payload;
  if(!attempt||attempt.grant_id!==p.grant_id||attempt.test_nonce!==p.test_nonce||
    !outcome||outcome.test_nonce!==p.test_nonce||
    outcome.status!=='ETSY_IDENTITY_GET_VERIFIED_PENDING_WITNESS_ACCEPTANCE'||
    outcome.provider_receipt_sha256!==p.provider_receipt_sha256||
    outcome.remote_subject_id!==p.remote_subject_id||
    !grant||grant.grant_id!==p.grant_id||
    grant.preflight_sha256!==p.preflight_sha256||
    grant.checkpoint_sha256!==p.checkpoint_sha256)
    throw Error('No genuine prior Etsy GET receipt linked to exact single-use TEST grant.');
  const signers=await verifyIndependent(input,signed,{authority,pins,cryptoApi});
  return {acceptance_sha256:await sha256(signed,cryptoApi),
    grant_id:p.grant_id,test_nonce:p.test_nonce,
    provider_receipt_sha256:p.provider_receipt_sha256,signer_ids:signers,
    status:'EXACT_GENUINE_ETSY_GET_RECEIPT_WITNESSED_NO_PUBLICATION',
    provider_get_verified:true,provider_write:false,authority_activated:false,
    provider_action_authorized:false,release_gate:HOLD_618};
}

export async function probeEtsyIdentity618({apiKey,secret,token,expectedUserId,
  fetchFn=globalThis.fetch,cryptoApi=globalThis.crypto}){
  if(!apiKey||!secret||!token||!/^[0-9]{1,20}$/.test(String(expectedUserId||'')))
    throw Error('Verified existing Etsy OAuth identity and credentials required.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
    const response=await fetchFn('https://api.etsy.com/v3/application/users/me',{
      method:'GET',redirect:'manual',credentials:'omit',cache:'no-store',signal:controller.signal,
      headers:{Accept:'application/json','x-api-key':`${apiKey}:${secret}`,
        Authorization:`Bearer ${token}`}});
    if(response.status!==200||!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')||'')||
      Number(response.headers.get('content-length')||0)>8192)
      throw Error('Etsy read-only identity challenge was not successful.');
    const reader=response.body?.getReader();if(!reader)throw Error('Missing Etsy response.');
    const chunks=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;
      size+=value.byteLength;if(size>8192){await reader.cancel().catch(()=>{});
        throw Error('Etsy identity response exceeded bound.');}chunks.push(value);}
    if(!size)throw Error('Empty Etsy response.');
    const bytes=new Uint8Array(size);let offset=0;
    for(const part of chunks){bytes.set(part,offset);offset+=part.byteLength;}
    const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    let parsed;try{parsed=JSON.parse(raw);}catch{throw Error('Invalid Etsy identity response.');}
    if(String(parsed?.user_id)!==String(expectedUserId))
      throw Error('Original Etsy owner user ID mismatch.');
    return {provider:'ETSY',endpoint:'GET /v3/application/users/me',http_status:200,
      remote_subject_id:String(expectedUserId),
      provider_receipt_sha256:await sha256(raw,cryptoApi),
      status:'ETSY_IDENTITY_GET_VERIFIED_PENDING_WITNESS_ACCEPTANCE',
      provider_write:false,provider_action_authorized:false,release_gate:HOLD_618};
  }finally{clearTimeout(timer);}
}
