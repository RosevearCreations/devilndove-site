import {ledgerHash614,hex,sha256} from './trustAuthority614.js';

export const FORMAT_615='devilndove-independent-activation-ceremony-615-v1';
export const HOLD_615='HOLD_ORIGINAL_CUSTODY_INDEPENDENT_SIGNERS_AND_OWNER_ACTIVATION_APPROVAL';
const HASH=/^[0-9a-f]{64}$/;
const ID=/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{3,119}$/;
const UTC=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
const FIELDS=['format','authority_id','key_sha256','custody_receipt_id',
  'original_source_sha256','original_receipt_sha256','challenge_nonce','issued_at','expires_at'];
const B64=/^[a-zA-Z0-9_-]+$/;
const bytes=s=>{
  if(typeof s!=='string'||!B64.test(s)||s.length>200)throw Error('Invalid encoded signature/key.');
  const x=s.replace(/-/g,'+').replace(/_/g,'/');
  return Uint8Array.from(atob(x+'='.repeat((4-x.length%4)%4)),c=>c.charCodeAt(0));
};
const validTime=s=>typeof s==='string'&&UTC.test(s)&&Number.isFinite(Date.parse(s));
const safeRef=x=>typeof x==='string'&&x.length<=220&&x.length>=15&&
  /^https:\/\//.test(x)&&!/(?:access[_-]?token|password|api[_-]?key|client[_-]?secret|bearer|private[_-]?key)/i.test(x)&&
  (()=>{try{const u=new URL(x);return !u.username&&!u.password&&!u.hash&&!u.search;}catch{return false;}})();

export function custodyCandidate615(row,now=new Date().toISOString()){
  const fields=['receipt_id','authority_id','original_source_ref','original_source_sha256',
    'original_receipt_sha256','witness_authority_id','owner_authority_id','observed_at'];
  if(!row||typeof row!=='object'||Array.isArray(row)||
    Object.keys(row).length!==fields.length||fields.some(k=>typeof row[k]!=='string')||
    Object.keys(row).some(k=>!fields.includes(k))||
    !ID.test(row.receipt_id)||!ID.test(row.authority_id)||
    !ID.test(row.witness_authority_id)||!ID.test(row.owner_authority_id)||
    new Set([row.authority_id,row.witness_authority_id,row.owner_authority_id]).size!==3||
    !HASH.test(row.original_source_sha256)||!HASH.test(row.original_receipt_sha256)||
    !safeRef(row.original_source_ref)||!validTime(row.observed_at)||
    Date.parse(row.observed_at)>Date.parse(now)+300000||
    Date.parse(row.observed_at)<Date.parse(now)-90*86400000)
    throw Error('Invalid documentary original custody claim; HOLD.');
  return row;
}
export function canonicalCeremony615(p,now=new Date().toISOString()){
  if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).length!==FIELDS.length||
    Object.keys(p).some(k=>!FIELDS.includes(k))||
    FIELDS.some(k=>typeof p[k]!=='string')||
    p.format!==FORMAT_615||!ID.test(p.authority_id)||
    !ID.test(p.custody_receipt_id)||!HASH.test(p.key_sha256)||
    !HASH.test(p.original_source_sha256)||!HASH.test(p.original_receipt_sha256)||
    !ID.test(p.challenge_nonce)||
    p.challenge_nonce.length<20||!validTime(p.issued_at)||!validTime(p.expires_at)||
    Date.parse(p.issued_at)>Date.parse(now)+300000||
    Date.parse(p.issued_at)<Date.parse(now)-1800000||
    Date.parse(p.expires_at)<=Date.parse(now)||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>1800000)
    throw Error('Invalid, expired or cross-scope activation challenge.');
  return JSON.stringify(Object.fromEntries(FIELDS.map(k=>[k,p[k]])));
}
export async function verifyCeremony615(input,{authority,readback,pins,cryptoApi=globalThis.crypto,
  now=new Date().toISOString()}){
  if(!input||typeof input!=='object'||Array.isArray(input)||
    Object.keys(input).sort().join(',')!=='challenge,signatures'||
    !Array.isArray(input.signatures)||input.signatures.length!==3)
    throw Error('Exact three-party activation ceremony required.');
  const canonical=canonicalCeremony615(input.challenge,now),p=input.challenge;
  const candidate=await authority(p.authority_id),custody=await readback(p.custody_receipt_id);
  if(!candidate||candidate.authority_id!==p.authority_id||
    candidate.status!=='PENDING_EXTERNAL_VERIFICATION'||
    candidate.key_sha256!==p.key_sha256||
    pins[p.authority_id]!==p.key_sha256)
    throw Error('Original authority candidate and independently approved public pin required.');
  if(!custody||custody.receipt_id!==p.custody_receipt_id||
    custody.authority_id!==p.authority_id||
    custody.original_source_sha256!==p.original_source_sha256||
    custody.original_receipt_sha256!==p.original_receipt_sha256||
    custody.status!=='EXTERNALLY_AUTHENTICATED')
    throw Error('Original custody has no independently authenticated external readback.');
  const expected={CANDIDATE:p.authority_id,WITNESS:custody.witness_authority_id,
    OWNER:custody.owner_authority_id};
  if(new Set(Object.values(expected)).size!==3)
    throw Error('Candidate, independent witness and owner must be distinct.');
  const seen=new Set(),fingerprints=new Set();
  for(const proof of input.signatures){
    if(!proof||Object.keys(proof).sort().join(',')!=='authority_id,role,signature'||
      !['CANDIDATE','WITNESS','OWNER'].includes(proof.role)||
      seen.has(proof.role)||proof.authority_id!==expected[proof.role])
      throw Error('Wrong or recycled ceremony signer.');
    seen.add(proof.role);
    const root=proof.role==='CANDIDATE'?candidate:await authority(proof.authority_id);
    if(!root||root.authority_id!==proof.authority_id||
      (proof.role==='WITNESS'&&root.role!=='WITNESS')||
      (proof.role==='OWNER'&&root.role!=='OWNER')||
      (proof.role!=='CANDIDATE'&&root.status!=='ACTIVE_EXTERNAL_VERIFIED'))
      throw Error('Independent witness/owner is not already authenticated.');
    const raw=bytes(root.public_key),sig=bytes(proof.signature);
    if(raw.length!==32||sig.length!==64)throw Error('Bad Ed25519 key or signature length.');
    const fp=hex(await cryptoApi.subtle.digest('SHA-256',raw));
    if(fp!==root.key_sha256||pins[root.authority_id]!==fp||fingerprints.has(fp))
      throw Error('Unpinned, changed or shared ceremony public key.');
    fingerprints.add(fp);
    const key=await cryptoApi.subtle.importKey('raw',raw,'Ed25519',false,['verify']);
    if(!await cryptoApi.subtle.verify('Ed25519',key,sig,new TextEncoder().encode(canonical)))
      throw Error('Independent activation signature invalid.');
  }
  if(seen.size!==3)throw Error('Candidate, witness and owner signature required.');
  return {format:FORMAT_615,authority_id:p.authority_id,custody_receipt_id:p.custody_receipt_id,
    challenge_sha256:await sha256(canonical,cryptoApi),original_source_sha256:p.original_source_sha256,
    original_receipt_sha256:p.original_receipt_sha256,
    signer_ids:expected,crypto_verified:true,original_custody_status:'EXTERNAL_READBACK_RECORDED',
    status:'READY_FOR_SEPARATE_CONTROLLED_ACTIVATION_APPROVAL',
    authority_activated:false,provider_action_authorized:false,release_gate:HOLD_615};
}

export async function auditLedger615(rows,{anchor='',cryptoApi=globalThis.crypto}={}){
  if(!Array.isArray(rows)||rows.length>500)throw Error('Bounded complete ledger readback required.');
  const findings=[],ZERO='0'.repeat(64);
  let previous=ZERO,lastSeq=0;
  for(const r of rows){
    if(!Number.isSafeInteger(r.sequence)||r.sequence<=lastSeq)
      findings.push('NON_MONOTONIC_LEDGER_SEQUENCE');
    if(lastSeq===0&&r.sequence!==1)findings.push('MISSING_LEDGER_ORIGIN');
    if(lastSeq>0&&r.sequence!==lastSeq+1)findings.push('LEDGER_SEQUENCE_GAP');
    lastSeq=r.sequence;
    if(r.previous_hash!==previous) findings.push('BROKEN_PREDECESSOR_CHAIN');
    let event;
    try{event=JSON.parse(r.proof_summary_json);}catch{findings.push('UNREADABLE_SIGNED_EVENT');}
    if(event){
      for(const [field,key] of [['case_pin','case_pin'],['channel','channel'],
        ['account_id','account_id'],['product_ref','product_ref'],
        ['exact_action','action'],['source_sha256','source_sha256'],
        ['owner_decision','decision'],['owner_nonce','owner_nonce']]){
        if(event[key]!==r[field]) findings.push('SIGNED_EVENT_COLUMN_CONFLICT');
      }
      const calculated=await ledgerHash614(r.previous_hash,event,cryptoApi).catch(()=>null);
      if(calculated!==r.event_hash) findings.push('EVENT_HASH_MISMATCH');
    }
    if(!HASH.test(r.event_hash)) findings.push('INVALID_EVENT_HASH');
    previous=r.event_hash;
  }
  if(rows.length===0)findings.push('LEDGER_EMPTY_NO_ORIGINAL_ANCHOR');
  if(anchor && (!HASH.test(anchor)||anchor!==previous))
    findings.push('INDEPENDENT_ANCHOR_MISMATCH');
  if(!anchor)findings.push('NO_INDEPENDENT_EXTERNAL_ANCHOR');
  const unique=[...new Set(findings)];
  return {build:615,rows_reviewed:rows.length,head_hash:previous,
    chain_consistent:!unique.some(x=>/MISMATCH|BROKEN|CONFLICT|UNREADABLE|NON_MONOTONIC|INVALID|MISSING|GAP|EMPTY/.test(x)),
    independently_anchored:false,findings:unique,
    status:unique.length?'HOLD_CHAIN_NOT_INDEPENDENTLY_PROVEN':'CHAIN_MATCHES_CONFIGURED_ANCHOR_BUT_EXTERNAL_CUSTODY_UNVERIFIED',
    provider_action_authorized:false,release_gate:HOLD_615};
}
