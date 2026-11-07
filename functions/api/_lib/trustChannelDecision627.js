/* Build 627: stateless verification of ORIGINAL three-party authority for a
 * historical genuine Meta Page GET. This is never an OAuth activation. */
import {sha256} from './trustAuthority614.js';
import {verifySigner616} from './trustCheckpoint616.js';

export const FORMAT_627='devilndove-original-meta-readonly-channel-decision-627-v1';
export const DECISION_627='ACCEPT_ONE_WITNESSED_META_PAGE_ID_GET_READ_ONLY_TEST_NO_CONNECTION';
export const HOLD_627='HOLD_ORIGINAL_META_CEREMONY_AND_CURRENT_SOURCE_WITNESS';
const FIELDS=['format','witness_sha256','authorization_id','enrollment_sha256',
  'test_nonce','page_id','receipt_sha256','window_sha256','owner_ledger_head_sha256',
  'decision','nonce','issued_at','expires_at'];
const HASH=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
const UTC=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;

export function canonicalDecision627(p,now=new Date().toISOString()){
  if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).length!==FIELDS.length||Object.keys(p).some(k=>!FIELDS.includes(k))||
    FIELDS.some(k=>typeof p[k]!=='string')||p.format!==FORMAT_627||
    ![p.witness_sha256,p.enrollment_sha256,p.receipt_sha256,
      p.window_sha256,p.owner_ledger_head_sha256].every(v=>HASH.test(v))||
    !ID.test(p.authorization_id)||!ID.test(p.test_nonce)||
    !ID.test(p.nonce)||p.nonce.length<20||
    !/^[0-9]{1,25}$/.test(p.page_id)||p.decision!==DECISION_627||
    !UTC.test(p.issued_at)||!UTC.test(p.expires_at)||
    !Number.isFinite(Date.parse(p.issued_at))||!Number.isFinite(Date.parse(p.expires_at))||
    Date.parse(p.issued_at)>Date.parse(now)+300000||
    Date.parse(p.issued_at)<Date.parse(now)-1800000||
    Date.parse(p.expires_at)<=Date.parse(now)||
    Date.parse(p.expires_at)<=Date.parse(p.issued_at)||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>600000)
    throw Error('Original Meta read-only decision malformed, expired or over-scoped.');
  return JSON.stringify(Object.fromEntries(FIELDS.map(k=>[k,p[k]])));
}

export async function verifyDecision627(bundle,{receipt,roots,pins,
  now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const message=canonicalDecision627(bundle?.payload,now),p=bundle.payload;
  if(!receipt?.original_source_verified||!receipt.actual_meta_get_verified||
    !receipt.witness_sha256||receipt.witness_sha256!==p.witness_sha256||
    receipt.authorization_id!==p.authorization_id||
    receipt.enrollment_sha256!==p.enrollment_sha256||
    receipt.test_nonce!==p.test_nonce||receipt.page_id!==p.page_id||
    receipt.receipt_sha256!==p.receipt_sha256||
    receipt.window_sha256!==p.window_sha256||
    receipt.owner_ledger_head_sha256!==p.owner_ledger_head_sha256||
    !Number.isFinite(Date.parse(receipt.window_expires_at))||
    Date.parse(p.expires_at)>Date.parse(receipt.window_expires_at)||
    Date.parse(receipt.window_expires_at)<=Date.parse(now)||
    !Array.isArray(receipt.original_signers)||receipt.original_signers.length!==3)
    throw Error('Original authenticated Meta GET and currently valid signed window required.');
  if(!bundle||Object.keys(bundle).sort().join(',')!=='payload,signatures'||
    !Array.isArray(bundle.signatures)||bundle.signatures.length!==3)
    throw Error('Three separate original source signatures required.');
  const seen=new Set(),fingerprints=new Set();
  for(const role of ['ISSUER','WITNESS','OWNER']){
    const proof=bundle.signatures.find(x=>x?.role===role);
    const original=receipt.original_signers.find(s=>s.role===role);
    if(!original||proof?.authority_id!==original.authority_id)
      throw Error('Original source signer identity changed.');
    const fp=await verifySigner616(proof,role,message,{authority:roots,pins,cryptoApi},seen);
    if(fingerprints.has(fp))throw Error('Signer fingerprint reused.');
    fingerprints.add(fp);
  }
  return {decision_sha256:await sha256(message,cryptoApi),
    verified_original_three_party_signatures:true,
    original_get_receipt_exact_match:true,original_window_current:true,
    approved_readonly_test_evidence_only:true,decision_not_persisted:true,
    provider_channel_connected:false,provider_get_performed:false,
    provider_write:false,token_refreshed:false,d1_mutation:false,
    status:'VERIFIED_ORIGINAL_META_ONE_GET_READ_ONLY_EVIDENCE_DECISION_NO_CHANNEL',
    release_gate:HOLD_627};
}
