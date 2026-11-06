/* Build 616: signed claims, immutable deny-list and simulated recovery; no trust activation. */
import {hex,sha256} from './trustAuthority614.js';
import {auditLedger615} from './trustCeremony615.js';

export const FORMAT_616='devilndove-external-checkpoint-616-v1';
export const ROTATION_616='devilndove-key-rotation-616-v1';
export const HOLD_616='HOLD_INDEPENDENT_EXTERNAL_CHECKPOINT_READBACK_AND_ROTATION_APPROVAL';
const HASH=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
const UTC=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
const B64=/^[A-Za-z0-9_-]+$/;
const FIELDS=['format','ledger_head_sha256','ledger_sequence','external_custody_ref',
  'external_receipt_sha256','nonce','issued_at','expires_at'];
const ROTATION_FIELDS=['format','old_authority_id','new_authority_id','old_key_sha256',
  'new_key_sha256','original_source_sha256','nonce','issued_at','expires_at'];
const timestamp=x=>typeof x==='string'&&UTC.test(x)&&Number.isFinite(Date.parse(x));
const safeRef=x=>typeof x==='string'&&x.length>=15&&x.length<=220&&
  /^https:\/\//.test(x)&&!/(?:token|password|secret|bearer|private[_-]?key|api[_-]?key)/i.test(x)&&
  (()=>{try{const u=new URL(x);return !u.username&&!u.password&&!u.search&&!u.hash;}catch{return false;}})();
const bytes=s=>{
  if(typeof s!=='string'||!B64.test(s)||s.length>200)throw Error('Invalid encoded public signature or key.');
  const p=s.replace(/-/g,'+').replace(/_/g,'/');
  return Uint8Array.from(atob(p+'='.repeat((4-p.length%4)%4)),c=>c.charCodeAt(0));
};
function canonical(p,fields,format,now){
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==fields.length||
    Object.keys(p).some(k=>!fields.includes(k))||fields.some(k=>typeof p[k]!=='string')||
    p.format!==format||!ID.test(p.nonce)||p.nonce.length<20||
    !timestamp(p.issued_at)||!timestamp(p.expires_at)||
    Date.parse(p.issued_at)>Date.parse(now)+300000||
    Date.parse(p.issued_at)<Date.parse(now)-1800000||
    Date.parse(p.expires_at)<=Date.parse(now)||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>1800000)
    throw Error('Expired, replayable or malformed exact signed checkpoint scope.');
  return JSON.stringify(Object.fromEntries(fields.map(k=>[k,p[k]])));
}
export function canonicalCheckpoint616(p,now=new Date().toISOString()){
  const s=canonical(p,FIELDS,FORMAT_616,now);
  if(!HASH.test(p.ledger_head_sha256)||!HASH.test(p.external_receipt_sha256)||
    !/^[1-9][0-9]{0,8}$/.test(p.ledger_sequence)||!safeRef(p.external_custody_ref))
    throw Error('Invalid external checkpoint claim.');
  return s;
}
export function canonicalRotation616(p,now=new Date().toISOString()){
  const s=canonical(p,ROTATION_FIELDS,ROTATION_616,now);
  if(!ID.test(p.old_authority_id)||!ID.test(p.new_authority_id)||
    p.old_authority_id===p.new_authority_id||!HASH.test(p.old_key_sha256)||
    !HASH.test(p.new_key_sha256)||p.old_key_sha256===p.new_key_sha256||
    !HASH.test(p.original_source_sha256)) throw Error('Invalid or self-rotation evidence.');
  return s;
}
export async function verifySigner616(proof,role,canonicalText,{authority,pins,cryptoApi},seen){
  if(!proof||Object.keys(proof).sort().join(',')!=='authority_id,role,signature'||
    proof.role!==role||!ID.test(proof.authority_id)||seen.has(proof.authority_id))
    throw Error('Missing or reused independent signer.');
  seen.add(proof.authority_id);
  const root=await authority(proof.authority_id);
  if(!root||root.role!==role||root.authority_id!==proof.authority_id||
    root.status!=='ACTIVE_EXTERNAL_VERIFIED')throw Error('Signer revoked or not externally authenticated.');
  const raw=bytes(root.public_key),signature=bytes(proof.signature);
  if(raw.length!==32||signature.length!==64)throw Error('Invalid Ed25519 evidence.');
  const fp=hex(await cryptoApi.subtle.digest('SHA-256',raw));
  if(fp!==root.key_sha256||pins[root.authority_id]!==fp)throw Error('Changed or unpinned signer.');
  const key=await cryptoApi.subtle.importKey('raw',raw,'Ed25519',false,['verify']);
  if(!await cryptoApi.subtle.verify('Ed25519',key,signature,new TextEncoder().encode(canonicalText)))
    throw Error('Invalid external signature.');
  return fp;
}
export async function verifyCheckpoint616(input,{ledgerRows,authority,pins,
  now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  if(!input||Object.keys(input).sort().join(',')!=='payload,signatures'||
    !Array.isArray(input.signatures)||input.signatures.length!==2)
    throw Error('Two separately signed checkpoint witnesses required.');
  const signed=canonicalCheckpoint616(input.payload,now);
  const ledger=await auditLedger615(ledgerRows,{cryptoApi});
  if(!ledger.chain_consistent||Number(input.payload.ledger_sequence)!==ledger.rows_reviewed||
    input.payload.ledger_head_sha256!==ledger.head_hash)
    throw Error('Complete current ledger does not match signed external checkpoint.');
  const seen=new Set(),fingerprints=new Set();
  for(const role of ['WITNESS','OWNER']){
    const proof=input.signatures.find(x=>x?.role===role);
    const fp=await verifySigner616(proof,role,signed,{authority,pins,cryptoApi},seen);
    if(fingerprints.has(fp))throw Error('Shared checkpoint signer key.');
    fingerprints.add(fp);
  }
  return {checkpoint_sha256:await sha256(signed,cryptoApi),
    ledger_head_sha256:ledger.head_hash,ledger_sequence:ledger.rows_reviewed,
    signed_by:[...seen],crypto_verified:true,external_readback_verified:false,
    independently_anchored:false,status:'SIGNED_CHECKPOINT_PENDING_EXTERNAL_READBACK',
    authority_activated:false,provider_action_authorized:false,release_gate:HOLD_616};
}
export async function verifyRotation616(input,{authority,pins,now=new Date().toISOString(),
  cryptoApi=globalThis.crypto}){
  if(!input||Object.keys(input).sort().join(',')!=='payload,signatures'||
    !Array.isArray(input.signatures)||input.signatures.length!==4)
    throw Error('Four distinct rotation signatures required.');
  const signed=canonicalRotation616(input.payload,now),p=input.payload;
  const old=await authority(p.old_authority_id),replacement=await authority(p.new_authority_id);
  if(!old||old.role!=='ISSUER'||old.status!=='ACTIVE_EXTERNAL_VERIFIED'||
    old.key_sha256!==p.old_key_sha256||pins[old.authority_id]!==old.key_sha256||
    !replacement||replacement.role!=='ISSUER'||
    replacement.status!=='PENDING_EXTERNAL_VERIFICATION'||
    replacement.key_sha256!==p.new_key_sha256)
    throw Error('Original issuer must be active; replacement must remain pending.');
  const seen=new Set(),fingerprints=new Set();
  for(const [role,id] of [['ISSUER_OLD',p.old_authority_id],
    ['ISSUER_NEW',p.new_authority_id],['WITNESS',null],['OWNER',null]]){
    const proof=input.signatures.find(x=>x?.role===role);
    if(!proof||Object.keys(proof).sort().join(',')!=='authority_id,role,signature'||
      !ID.test(proof.authority_id)||seen.has(proof.authority_id)||
      (id&&id!==proof.authority_id))throw Error('Missing or repeated rotation signer.');
    seen.add(proof.authority_id);
    const signer=id? (role==='ISSUER_OLD'?old:replacement):await authority(proof.authority_id);
    if(!signer||signer.authority_id!==proof.authority_id||
      (id?signer.role!=='ISSUER':signer.role!==role)||
      (role==='ISSUER_OLD'&&signer.status!=='ACTIVE_EXTERNAL_VERIFIED')||
      (role==='ISSUER_NEW'&&signer.status!=='PENDING_EXTERNAL_VERIFICATION')||
      (!id&&signer.status!=='ACTIVE_EXTERNAL_VERIFIED'))throw Error('Unapproved rotation signer.');
    if(role!=='ISSUER_NEW'&&pins[signer.authority_id]!==signer.key_sha256)
      throw Error('Independent existing signer pin absent.');
    const raw=bytes(signer.public_key),signature=bytes(proof.signature);
    const fp=hex(await cryptoApi.subtle.digest('SHA-256',raw));
    if(raw.length!==32||signature.length!==64||fp!==signer.key_sha256||fingerprints.has(fp))
      throw Error('Rotation key changed or shared.');
    fingerprints.add(fp);
    const key=await cryptoApi.subtle.importKey('raw',raw,'Ed25519',false,['verify']);
    if(!await cryptoApi.subtle.verify('Ed25519',key,signature,new TextEncoder().encode(signed)))
      throw Error('Invalid rotation signature.');
  }
  return {rotation_sha256:await sha256(signed,cryptoApi),
    old_authority_id:p.old_authority_id,new_authority_id:p.new_authority_id,
    original_source_sha256:p.original_source_sha256,
    status:'ROTATION_PENDING_INDEPENDENT_EXTERNAL_APPROVAL',
    new_key_activated:false,old_key_revoked:false,provider_action_authorized:false,release_gate:HOLD_616};
}
export function quarantineCandidate616(row){
  const keys=['authority_id','key_sha256','reason','evidence_ref','evidence_sha256'];
  if(!row||Object.keys(row).length!==keys.length||
    keys.some(k=>typeof row[k]!=='string')||Object.keys(row).some(k=>!keys.includes(k))||
    !ID.test(row.authority_id)||!HASH.test(row.key_sha256)||
    !['KEY_COMPROMISE','OWNER_REVOKED','CUSTODY_DISPUTE','SIGNATURE_CONFLICT'].includes(row.reason)||
    !safeRef(row.evidence_ref)||!HASH.test(row.evidence_sha256))
    throw Error('Invalid protective key quarantine record.');
  return row;
}
export function recoveryDrill616({chain_consistent,checkpoint_verified,
  any_key_quarantined,original_custody_verified}){
  const EXPECTED='EXPECTED_DENY_NOT_EXECUTED_LIVE';
  const scenarios={revoked_key_denied:EXPECTED,missing_anchor_denied:EXPECTED,
    altered_ledger_denied:EXPECTED,expired_signature_denied:EXPECTED,
    unapproved_rotation_denied:EXPECTED,provider_writes_denied:EXPECTED};
  return {build:616,mode:'OFFLINE_READ_ONLY_SIMULATION',scenarios,
    live_activation_attempted:false,live_recovery_attempted:false,
    observed_chain_consistent:chain_consistent===true,
    observed_checkpoint_verified:checkpoint_verified===true,
    observed_quarantine:any_key_quarantined===true,
    observed_original_custody_verified:original_custody_verified===true,
    status:'SIMULATED_FAIL_CLOSED_RECOVERY_ONLY',
    authority_activated:false,provider_action_authorized:false,release_gate:HOLD_616};
}
