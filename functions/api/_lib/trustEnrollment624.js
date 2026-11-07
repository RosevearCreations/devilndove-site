/* Build 624: immutable owner-supervised authorization of EXISTING encrypted Meta
 * credentials; only a distinct signed one-use grant can perform a Page-ID GET. */
import {sha256} from './trustAuthority614.js';
import {verifySigner616} from './trustCheckpoint616.js';
import {META_ENDPOINT_620} from './trustAuditMeta620.js';

export const HOLD_624='HOLD_ORIGINAL_META_ENCRYPTED_CUSTODY_LIVE_GET_AND_INDEPENDENT_WITNESS';
export const ENROLL_624='devilndove-original-meta-encrypted-credential-enrollment-624-v1';
export const RECHECK_624='devilndove-one-use-original-meta-live-reverification-624-v1';
export const ACCEPT_624='devilndove-original-meta-live-get-witness-renewal-624-v1';
const HASH=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/,
  PAGE=/^[0-9]{1,25}$/,
  UTC=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
const ENROLL_FIELDS=['format','window_sha256','meta_closure_sha256','page_id',
  'scopes_sha256','encrypted_credential_sha256','owner_ledger_head_sha256',
  'owner_decision','nonce','issued_at','expires_at'];
const RECHECK_FIELDS=['format','authorization_id','enrollment_sha256','window_sha256',
  'page_id','scopes_sha256','encrypted_credential_sha256','owner_ledger_head_sha256',
  'test_nonce','endpoint','owner_decision','nonce','issued_at','expires_at'];
const ACCEPT_FIELDS=['format','authorization_id','enrollment_sha256','test_nonce',
  'page_id','receipt_sha256','owner_decision','nonce','issued_at','expires_at'];

function canonical(p,fields,format,now,ttl){
  if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).length!==fields.length||Object.keys(p).some(k=>!fields.includes(k))||
    fields.some(k=>typeof p[k]!=='string')||p.format!==format||
    !ID.test(p.nonce)||p.nonce.length<20||
    !UTC.test(p.issued_at)||!UTC.test(p.expires_at)||
    !Number.isFinite(Date.parse(p.issued_at))||!Number.isFinite(Date.parse(p.expires_at))||
    Date.parse(p.issued_at)>Date.parse(now)+300000||
    Date.parse(p.issued_at)<Date.parse(now)-1800000||
    Date.parse(p.expires_at)<=Date.parse(now)||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>ttl)
    throw Error('Missing, altered or expired original signed Meta authority.');
  return JSON.stringify(Object.fromEntries(fields.map(k=>[k,p[k]])));
}
export function canonicalEnrollment624(p,now=new Date().toISOString()){
  const text=canonical(p,ENROLL_FIELDS,ENROLL_624,now,600000);
  if(![p.window_sha256,p.meta_closure_sha256,p.scopes_sha256,
      p.encrypted_credential_sha256,p.owner_ledger_head_sha256].every(s=>HASH.test(s))||
    !PAGE.test(p.page_id)||
    p.owner_decision!=='ENROLL_ONLY_EXISTING_ENCRYPTED_META_PAGE_READ_CREDENTIAL')
    throw Error('Original encrypted Meta credential enrollment scope invalid.');
  return text;
}
export function canonicalRecheck624(p,now=new Date().toISOString()){
  const text=canonical(p,RECHECK_FIELDS,RECHECK_624,now,600000);
  if(!ID.test(p.authorization_id)||!ID.test(p.test_nonce)||p.test_nonce.length<20||
    !PAGE.test(p.page_id)||
    ![p.enrollment_sha256,p.window_sha256,p.scopes_sha256,
      p.encrypted_credential_sha256,p.owner_ledger_head_sha256].every(s=>HASH.test(s))||
    p.endpoint!==META_ENDPOINT_620||
    p.owner_decision!=='ONE_EXACT_LIVE_META_PAGE_ID_GET_NO_RETRY_NO_PUBLISH')
    throw Error('Original one-use live Page-ID GET authorization invalid.');
  return text;
}
export function canonicalAcceptance624(p,now=new Date().toISOString()){
  const text=canonical(p,ACCEPT_FIELDS,ACCEPT_624,now,600000);
  if(!ID.test(p.authorization_id)||!ID.test(p.test_nonce)||
    !HASH.test(p.enrollment_sha256)||!HASH.test(p.receipt_sha256)||
    !PAGE.test(p.page_id)||
    p.owner_decision!=='ACCEPT_ONE_ACTUAL_META_PAGE_GET_RECEIPT_NO_CONNECTION')
    throw Error('Independent live GET witness approval invalid.');
  return text;
}
async function signatures(bundle,text,issuer,{roots,pins,cryptoApi}){
  if(!bundle||Object.keys(bundle).sort().join(',')!=='payload,signatures'||
    !Array.isArray(bundle.signatures)||bundle.signatures.length!==3)
    throw Error('Three independent original signatures required.');
  const seen=new Set(),fps=new Set();
  for(const role of ['ISSUER','WITNESS','OWNER']){
    const s=bundle.signatures.find(x=>x?.role===role);
    if(role==='ISSUER'&&s?.authority_id!==issuer)
      throw Error('Not the originally approved Meta source issuer.');
    const fp=await verifySigner616(s,role,text,{authority:roots,pins,cryptoApi},seen);
    if(fps.has(fp))throw Error('Issuer/witness/owner key reused.');fps.add(fp);
  }
  return [...seen];
}
export async function verifyEnrollment624(bundle,{window,meta,ledger,issuer,roots,pins,
  now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const text=canonicalEnrollment624(bundle?.payload,now),p=bundle.payload;
  if(!window?.verified||window.window_sha256!==p.window_sha256||
    !meta||meta.page_id!==p.page_id||meta.scopes_sha256!==p.scopes_sha256||
    meta.encrypted_credential_sha256!==p.encrypted_credential_sha256||
    meta.page_read_candidate!==true||meta.token_present!==true||
    !Number.isFinite(Date.parse(meta.access_expires_at))||
    Date.parse(meta.access_expires_at)<=Date.parse(p.expires_at)+120000||
    !ledger||ledger.event_hash!==p.owner_ledger_head_sha256||
    !issuer||issuer.meta_closure_sha256!==p.meta_closure_sha256||
    issuer.page_id!==p.page_id||!ID.test(issuer.issuer_authority_id)||
    Date.parse(p.expires_at)>Date.parse(window.expires_at))
    throw Error('Original Meta window, encrypted credential, expiry or owner head drifted.');
  const signers=await signatures(bundle,text,issuer.issuer_authority_id,{roots,pins,cryptoApi});
  return {enrollment_sha256:await sha256(text,cryptoApi),signers,
    encrypted_credential_attested:true,token_values_emitted:false,
    token_refreshed:false,provider_get_performed:false,connected:false,
    status:'ORIGINAL_META_EXISTING_ENCRYPTED_READ_CREDENTIAL_ATTESTED',release_gate:HOLD_624};
}
export async function verifyRecheckGrant624(bundle,{enrollment,window,meta,ledger,issuer,
  roots,pins,now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const text=canonicalRecheck624(bundle?.payload,now),p=bundle.payload;
  if(!enrollment||enrollment.enrollment_sha256!==p.enrollment_sha256||
    enrollment.window_sha256!==p.window_sha256||
    enrollment.page_id!==p.page_id||enrollment.scopes_sha256!==p.scopes_sha256||
    enrollment.encrypted_credential_sha256!==p.encrypted_credential_sha256||
    enrollment.owner_ledger_head_sha256!==p.owner_ledger_head_sha256||
    enrollment.status!=='ORIGINAL_META_EXISTING_ENCRYPTED_READ_CREDENTIAL_ATTESTED'||
    Date.parse(p.expires_at)>Date.parse(JSON.parse(enrollment.signed_bundle_json).payload.expires_at)||
    !window?.verified||window.window_sha256!==p.window_sha256||
    Date.parse(p.expires_at)>Date.parse(window.expires_at)||
    !meta||meta.page_id!==p.page_id||meta.scopes_sha256!==p.scopes_sha256||
    meta.encrypted_credential_sha256!==p.encrypted_credential_sha256||
    meta.page_read_candidate!==true||meta.token_present!==true||
    Date.parse(meta.access_expires_at)<=Date.parse(p.expires_at)+120000||
    !ledger||ledger.event_hash!==p.owner_ledger_head_sha256||
    !issuer||!ID.test(issuer.issuer_authority_id))
    throw Error('Expiring original Meta enrollment or saved encrypted token has changed.');
  const signers=await signatures(bundle,text,issuer.issuer_authority_id,{roots,pins,cryptoApi});
  return {authorization_sha256:await sha256(text,cryptoApi),signers,
    one_nonce_only:true,provider_get_performed:false,
    provider_write:false,connected:false,
    status:'ORIGINAL_META_ONE_USE_LIVE_PAGE_ID_RECHECK_APPROVED',release_gate:HOLD_624};
}
export async function verifyWitness624(bundle,{grant,enrollment,attempt,outcome,failure,
  issuer,roots,pins,now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const text=canonicalAcceptance624(bundle?.payload,now),p=bundle.payload;
  if(!grant||grant.authorization_id!==p.authorization_id||
    grant.enrollment_sha256!==p.enrollment_sha256||
    grant.test_nonce!==p.test_nonce||grant.page_id!==p.page_id||
    grant.status!=='ORIGINAL_META_ONE_USE_LIVE_PAGE_ID_RECHECK_APPROVED'||
    !enrollment||enrollment.enrollment_sha256!==p.enrollment_sha256||
    !attempt||attempt.test_nonce!==p.test_nonce||
    attempt.authorization_id!==p.authorization_id||
    attempt.status!=='CLAIMED_ONE_ORIGINAL_META_PAGE_ID_GET_NO_RETRY'||
    !outcome||outcome.test_nonce!==p.test_nonce||
    outcome.remote_page_id!==p.page_id||outcome.receipt_sha256!==p.receipt_sha256||
    outcome.status!=='GENUINE_META_PAGE_ID_GET_PENDING_INDEPENDENT_WITNESS'||
    failure||!issuer||!ID.test(issuer.issuer_authority_id))
    throw Error('Actual spent original Meta GET receipt not independently verified.');
  const signers=await signatures(bundle,text,issuer.issuer_authority_id,{roots,pins,cryptoApi});
  return {witness_sha256:await sha256(text,cryptoApi),signers,
    actual_single_provider_get_receipt_verified:true,
    token_values_emitted:false,provider_get_replayed:false,connected:false,
    provider_write:false,publishing_enabled:false,
    status:'ORIGINAL_META_ONE_GENUINE_PAGE_GET_INDEPENDENTLY_WITNESSED',release_gate:HOLD_624};
}
