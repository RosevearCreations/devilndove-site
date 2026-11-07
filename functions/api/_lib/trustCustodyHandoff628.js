/* Build 628: append-only original Meta signed-decision custody verifier.
 * An external URL plus a signature is NOT an independent remote readback.
 * Neither custody nor review handoff permits operational provider activity. */
import {sha256} from './trustAuthority614.js';
import {verifySigner616} from './trustCheckpoint616.js';
import {verifyDecision627} from './trustChannelDecision627.js';

export const FORMAT_628='devilndove-original-meta-signed-decision-custody-628-v1';
export const DECISION_628='ARCHIVE_ONE_ORIGINAL_META_READONLY_DECISION_OWNER_REVIEW_ONLY';
export const HOLD_628='HOLD_EXTERNAL_ARCHIVE_READBACK_AND_SEPARATE_OWNER_GO_LIVE';
const FIELDS=['format','original_decision_sha256','original_packet_sha256',
  'witness_sha256','receipt_sha256','page_id','primary_custody_ref',
  'secondary_custody_ref','primary_packet_sha256','secondary_packet_sha256',
  'decision','nonce','issued_at','expires_at'];
const HASH=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
const UTC=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
const ref=x=>{
  if(typeof x!=='string'||x.length<15||x.length>220||
    /(?:password|token|secret|bearer|private[_-]?key|api[_-]?key)/i.test(x))
    throw Error('Custody URL missing or secret-like.');
  const u=new URL(x);
  if(u.protocol!=='https:'||!u.hostname||u.username||u.password||u.search||u.hash)
    throw Error('External archive reference must be credential-free HTTPS.');
  return u;
};

export function canonicalCustody628(p,now=new Date().toISOString()){
  if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).length!==FIELDS.length||
    Object.keys(p).some(k=>!FIELDS.includes(k))||
    FIELDS.some(k=>typeof p[k]!=='string')||p.format!==FORMAT_628||
    ![p.original_decision_sha256,p.original_packet_sha256,p.witness_sha256,
      p.receipt_sha256,p.primary_packet_sha256,
      p.secondary_packet_sha256].every(x=>HASH.test(x))||
    !/^[0-9]{1,25}$/.test(p.page_id)||
    !ID.test(p.nonce)||p.nonce.length<20||p.decision!==DECISION_628||
    !UTC.test(p.issued_at)||!UTC.test(p.expires_at)||
    !Number.isFinite(Date.parse(p.issued_at))||!Number.isFinite(Date.parse(p.expires_at))||
    Date.parse(p.issued_at)>Date.parse(now)+300000||
    Date.parse(p.issued_at)<Date.parse(now)-1800000||
    Date.parse(p.expires_at)<=Date.parse(now)||
    Date.parse(p.expires_at)<=Date.parse(p.issued_at)||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>600000)
    throw Error('Expired or overbroad original Meta custody attestation.');
  const a=ref(p.primary_custody_ref),b=ref(p.secondary_custody_ref);
  if(a.hostname===b.hostname||p.primary_custody_ref===p.secondary_custody_ref)
    throw Error('Two independent external archive custody domains required.');
  return JSON.stringify(Object.fromEntries(FIELDS.map(k=>[k,p[k]])));
}

export async function verifyCustody628(custodyBundle,{originalBundle,receipt,
  roots,pins,now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const signed=canonicalCustody628(custodyBundle?.payload,now);
  const p=custodyBundle.payload;
  if(!custodyBundle||Object.keys(custodyBundle).sort().join(',')!==
    'payload,signatures'||!Array.isArray(custodyBundle.signatures)||
    custodyBundle.signatures.length!==3)
    throw Error('Three original signatures required for external custody.');
  const decision=await verifyDecision627(originalBundle,{receipt,roots,pins,now,cryptoApi});
  const packetHash=await sha256(JSON.stringify(originalBundle),cryptoApi);
  if(p.original_decision_sha256!==decision.decision_sha256||
    p.original_packet_sha256!==packetHash||
    p.primary_packet_sha256!==packetHash||p.secondary_packet_sha256!==packetHash||
    p.witness_sha256!==originalBundle.payload.witness_sha256||
    p.receipt_sha256!==originalBundle.payload.receipt_sha256||
    p.page_id!==originalBundle.payload.page_id||
    Date.parse(p.expires_at)>Date.parse(originalBundle.payload.expires_at))
    throw Error('Original signed decision packet or archive digest changed.');
  const used=new Set(),keys=new Set();
  for(const role of ['ISSUER','WITNESS','OWNER']){
    const proof=custodyBundle.signatures.find(s=>s?.role===role);
    const old=originalBundle.signatures.find(s=>s?.role===role);
    if(!old||proof?.authority_id!==old.authority_id)
      throw Error('Custody signer differs from original independent authority.');
    const fp=await verifySigner616(proof,role,signed,
      {authority:roots,pins,cryptoApi},used);
    if(keys.has(fp))throw Error('Shared external custody signer key.');
    keys.add(fp);
  }
  return {custody_sha256:await sha256(signed,cryptoApi),
    original_decision_sha256:decision.decision_sha256,
    original_packet_sha256:packetHash,
    verified_original_custody_signatures:true,
    actual_original_meta_get_witness_reverified:true,
    distinct_archive_domains_declared:true,
    archive_contents_independently_read_back:false,
    original_signed_packet_retained_by_owners_required:true,
    signed_custody_eligible_for_storage:true,
    owner_handoff_review_candidate_only:true,
    go_live_eligible:false,provider_channel_connected:false,
    provider_get_performed:false,provider_write:false,
    token_refreshed:false,publishing_enabled:false,
    release_gate:HOLD_628};
}
