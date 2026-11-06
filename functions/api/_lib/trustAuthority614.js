/* Build 614: server-side proof only. Neither a proof nor this ledger authorizes a provider write. */
export const FORMAT_614 = 'devilndove-exact-trust-proof-614-v1';
export const HOLD_614 = 'HOLD_EXTERNAL_ROOTS_ORIGINAL_CUSTODY_INDEPENDENT_WITNESS_OWNER_DECISION';
const SCOPE = ['format','role','case_pin','channel','account_id','product_ref','action',
  'source_sha256','decision','owner_proof_sha256','issued_at','expires_at','nonce'];
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{3,119}$/;
const HASH = /^[a-f0-9]{64}$/;
const B64 = /^[A-Za-z0-9_-]+$/;
const ACTIONS = ['CREATE_DRAFT','UPDATE_DRAFT','IMAGE_READBACK','CONNECTION_READBACK',
  'PUBLISH','OWNER_FOLLOWUP'];
const ROLES = ['ISSUER','WITNESS','OWNER'];
const toBytes = s => {
  if (typeof s !== 'string' || !B64.test(s) || s.length > 200) throw Error('Invalid encoding.');
  const pad = s.replace(/-/g,'+').replace(/_/g,'/');
  return Uint8Array.from(atob(pad+'='.repeat((4-pad.length%4)%4)), c=>c.charCodeAt(0));
};
export const hex = bytes => Array.from(new Uint8Array(bytes), b=>b.toString(16).padStart(2,'0')).join('');
export async function sha256(s, cryptoApi=globalThis.crypto) {
  return hex(await cryptoApi.subtle.digest('SHA-256',new TextEncoder().encode(s)));
}
export function canonical614(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
    Object.keys(payload).length !== SCOPE.length ||
    Object.keys(payload).some(k=>!SCOPE.includes(k)) ||
    SCOPE.some(k=>typeof payload[k] !== 'string')) throw Error('Invalid exact proof shape.');
  const p=payload;
  if (p.format!==FORMAT_614 || !ROLES.includes(p.role) || !ID.test(p.case_pin) ||
    !ID.test(p.account_id) || !ID.test(p.product_ref) ||
    !['ETSY','FACEBOOK_PAGE','INSTAGRAM'].includes(p.channel) ||
    !ACTIONS.includes(p.action) || !HASH.test(p.source_sha256) ||
    (p.role==='OWNER'?!['APPROVE','DECLINE','REVOKE'].includes(p.decision):
      p.decision!=='ATTEST') ||
    (p.role==='WITNESS'?!HASH.test(p.owner_proof_sha256):p.owner_proof_sha256!=='') ||
    !ID.test(p.nonce) || p.nonce.length<20 ||
    !Number.isFinite(Date.parse(p.issued_at)) ||
    !Number.isFinite(Date.parse(p.expires_at)) ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(p.issued_at) ||
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(p.expires_at) ||
    Date.parse(p.expires_at)<=Date.parse(p.issued_at) ||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>30*86400000)
    throw Error('Invalid signed scope.');
  return JSON.stringify(Object.fromEntries(SCOPE.map(k=>[k,p[k]])));
}
export function authorityCandidate614(row) {
  const keys=['authority_id','role','public_key','original_source_ref',
    'independent_review_ref'];
  if (!row || typeof row!=='object' || Array.isArray(row) ||
    Object.keys(row).length!==keys.length || keys.some(k=>typeof row[k]!=='string') ||
    Object.keys(row).some(k=>!keys.includes(k)) ||
    !ID.test(row.authority_id) || !ROLES.includes(row.role) ||
    toBytes(row.public_key).length!==32 ||
    !/^https:\/\/[^\s]{10,220}$/.test(row.original_source_ref) ||
    /(?:access[_-]?token|api[_-]?key|password|secret|private[_-]?key|bearer)/i
      .test(row.original_source_ref) ||
    !ID.test(row.independent_review_ref) ||
    row.independent_review_ref===row.authority_id) throw Error('Invalid pending authority.');
  return row;
}
export function trustedPins614(env) {
  /* The externally verified pins must be independently provisioned; no enrollment API sets them. */
  let roots;
  try { roots=JSON.parse(env?.DND_614_VERIFIED_PUBLIC_KEY_PINS || '{}'); }
  catch { throw Error('Invalid externally provisioned verification pins.'); }
  if (!roots || Array.isArray(roots) || typeof roots!=='object' ||
    Object.entries(roots).some(([id,v])=>!ID.test(id)||typeof v!=='string'||!HASH.test(v)))
    throw Error('Invalid externally provisioned verification pins.');
  return roots;
}
export async function verifyProofs614(proofs, authorityLookup, pins, now=new Date().toISOString(),
  cryptoApi=globalThis.crypto) {
  if (!Array.isArray(proofs) || proofs.length!==3 || !Number.isFinite(Date.parse(now)))
    throw Error('Three separately signed proofs required.');
  const roles=new Set(), identities=new Set(), keys=new Set(), nonces=new Set();
  let scope=null, ownerDecision=null;
  const ownerProof=proofs.find(x=>x?.payload?.role==='OWNER');
  if (!ownerProof || typeof ownerProof.signature!=='string')
    throw Error('Original signed owner decision required.');
  const ownerProofHash=await sha256(canonical614(ownerProof.payload)+'.'+ownerProof.signature,cryptoApi);
  for (const proof of proofs) {
    if (!proof || Object.keys(proof).sort().join(',')!=='authority_id,payload,signature' ||
      !ID.test(proof.authority_id)) throw Error('Invalid signed proof wrapper.');
    const canonical=canonical614(proof.payload), p=proof.payload;
    if (roles.has(p.role) || identities.has(proof.authority_id) || nonces.has(p.nonce))
      throw Error('Self-witness or replayed proof.');
    roles.add(p.role); identities.add(proof.authority_id); nonces.add(p.nonce);
    const body={case_pin:p.case_pin,channel:p.channel,account_id:p.account_id,
      product_ref:p.product_ref,action:p.action,source_sha256:p.source_sha256};
    if (scope && JSON.stringify(scope)!==JSON.stringify(body)) throw Error('Cross-scope signature.');
    scope=body;
    if (p.role==='WITNESS' && p.owner_proof_sha256!==ownerProofHash)
      throw Error('Independent witness did not attest this exact owner signature.');
    if (Date.parse(p.issued_at)>Date.parse(now)+300000 ||
      Date.parse(p.issued_at)<Date.parse(now)-90*86400000 ||
      Date.parse(p.expires_at)<=Date.parse(now)) throw Error('Stale or expired proof.');
    const root=await authorityLookup(proof.authority_id);
    if (!root || root.role!==p.role || root.status!=='ACTIVE_EXTERNAL_VERIFIED' ||
      root.authority_id!==proof.authority_id || !root.public_key)
      throw Error('Externally authenticated authority not enrolled.');
    const raw=toBytes(root.public_key);
    if (raw.length!==32) throw Error('Invalid registered verification key.');
    const fp=hex(await cryptoApi.subtle.digest('SHA-256',raw));
    if (pins[proof.authority_id]!==fp || root.key_sha256!==fp || keys.has(fp))
      throw Error('Trusted root pin absent, changed or shared.');
    keys.add(fp);
    const signature=toBytes(proof.signature);
    if (signature.length!==64) throw Error('Invalid signature length.');
    const key=await cryptoApi.subtle.importKey('raw',raw,'Ed25519',false,['verify']);
    if (!await cryptoApi.subtle.verify('Ed25519',key,signature,new TextEncoder().encode(canonical)))
      throw Error('Cryptographic signature invalid.');
    if (p.role==='OWNER') ownerDecision=p.decision;
  }
  if (roles.size!==3 || !ROLES.every(r=>roles.has(r)) || !ownerDecision)
    throw Error('Issuer, independent witness and exact owner signature required.');
  return {scope,owner_decision:ownerDecision,authority_ids:[...identities],
    proof_hashes:await Promise.all(proofs.map(async p=>sha256(canonical614(p.payload),cryptoApi))),
    cryptographic_signatures_verified:true,original_provider_readback_verified:false,
    provider_action_authorized:false,release_gate:HOLD_614};
}
export async function ledgerHash614(previous,event,cryptoApi=globalThis.crypto) {
  if (!HASH.test(previous)) throw Error('Invalid predecessor hash.');
  return sha256(previous+'\n'+JSON.stringify(event),cryptoApi);
}
