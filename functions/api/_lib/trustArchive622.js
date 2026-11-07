/* Build 622: exact source-owned archive GET + independently signed actual Meta GET closure.
 * No provider call, archive fetch, or credential enrollment without original custody. */
import {sha256} from './trustAuthority614.js';
import {verifySigner616} from './trustCheckpoint616.js';

export const HOLD_622='HOLD_ORIGINAL_EXTERNAL_ARCHIVE_AND_GENUINE_META_TEST_CLOSURE';
export const ARCHIVE_GRANT_622='devilndove-one-original-external-archive-get-622-v1';
export const ARCHIVE_BYTES_622='devilndove-etsy-history-archive-622-v1';
export const META_CLOSE_622='devilndove-original-meta-provider-get-closure-622-v1';
const HEX=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
const PAGE=/^[0-9]{1,25}$/;
const UTC=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
const GRANT=['format','manifest_sha256','history_sha256','checkpoint_sha256',
  'archive_url','test_nonce','decision','issued_at','expires_at'];
const CLOSURE=['format','grant_id','test_nonce','meta_approval_sha256','meta_receipt_sha256',
  'witness_acceptance_sha256','expected_page_id','checkpoint_sha256','history_manifest_sha256',
  'archive_readback_sha256','decision','nonce','issued_at','expires_at'];
const ARCHIVE=['format','history_manifest_sha256','history_sha256','counts_sha256',
  'checkpoint_sha256','ledger_head_sha256','ledger_sequence','external_receipt_sha256',
  'archived_at'];

export function exactArchiveUrl622(value,origin){
  if(typeof value!=='string'||value.length>220||!value.startsWith('https://')||
    /(?:token|password|secret|bearer|private[_-]?key|api[_-]?key)/i.test(value))
    throw Error('Unsafe original external archive reference.');
  const u=new URL(value),host=u.hostname.toLowerCase();
  if(u.protocol!=='https:'||u.port||u.username||u.password||u.search||u.hash||
    !host.includes('.')||/^\d+(?:\.\d+){3}$/.test(host)||host.includes(':')||
    /(?:^|\.)(?:localhost|local|internal|invalid|test)$/.test(host)||
    u.pathname==='/')throw Error('Archive origin or path is not publicly verified.');
  if(typeof origin!=='string'||u.origin!==origin)
    throw Error('Archive URL differs from original independent custodian pin.');
  return u.href;
}
function canonical(p,fields,format,now){
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==fields.length||
    Object.keys(p).some(k=>!fields.includes(k))||fields.some(k=>typeof p[k]!=='string')||
    p.format!==format||!ID.test(p.nonce||p.test_nonce)||
    (p.nonce||p.test_nonce).length<20||
    !UTC.test(p.issued_at)||!UTC.test(p.expires_at)||
    !Number.isFinite(Date.parse(p.issued_at))||!Number.isFinite(Date.parse(p.expires_at))||
    Date.parse(p.issued_at)>Date.parse(now)+300000||
    Date.parse(p.issued_at)<Date.parse(now)-1800000||
    Date.parse(p.expires_at)<=Date.parse(now)||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>1800000)
    throw Error('Original scoped signatures expired or malformed.');
  return JSON.stringify(Object.fromEntries(fields.map(k=>[k,p[k]])));
}
export function canonicalArchiveGrant622(p,now=new Date().toISOString()){
  const signed=canonical(p,GRANT,ARCHIVE_GRANT_622,now);
  if(![p.manifest_sha256,p.history_sha256,p.checkpoint_sha256].every(x=>HEX.test(x))||
    !ID.test(p.test_nonce)||p.test_nonce.length<20||
    p.decision!=='ONE_READ_ONLY_ORIGINAL_ARCHIVE_GET')
    throw Error('Unauthorized original archive read scope.');
  exactArchiveUrl622(p.archive_url,new URL(p.archive_url).origin);
  return signed;
}
export function canonicalMetaClosure622(p,now=new Date().toISOString()){
  const signed=canonical(p,CLOSURE,META_CLOSE_622,now);
  if(!ID.test(p.grant_id)||!ID.test(p.test_nonce)||!PAGE.test(p.expected_page_id)||
    ![p.meta_approval_sha256,p.meta_receipt_sha256,p.witness_acceptance_sha256,
      p.checkpoint_sha256,p.history_manifest_sha256,p.archive_readback_sha256]
      .every(x=>HEX.test(x))||
    p.decision!=='CLOSE_ONE_WITNESSED_META_PAGE_ID_GET_NO_CONNECTION_OR_PUBLISH')
    throw Error('Altered single real Meta GET closure decision.');
  return signed;
}
async function verifyThree(bundle,signed,{roots,pins,cryptoApi},expectedIssuer){
  if(!bundle||Object.keys(bundle).sort().join(',')!=='payload,signatures'||
    !Array.isArray(bundle.signatures)||bundle.signatures.length!==3)
    throw Error('Three independent original signatures required.');
  const ids=new Set(),keys=new Set();
  for(const role of ['ISSUER','WITNESS','OWNER']){
    const candidate=bundle.signatures.find(s=>s?.role===role);
    if(role==='ISSUER'&&candidate?.authority_id!==expectedIssuer)
      throw Error('Original provider issuer does not match.');
    const fp=await verifySigner616(candidate,role,signed,{authority:roots,pins,cryptoApi},ids);
    if(keys.has(fp))throw Error('Reused original independent verification key.');
    keys.add(fp);
  }
  return [...ids];
}
export async function verifyArchiveGrant622(bundle,{history,custodian,checkpoint,ledger,
  currentHistory,source,roots,pins,now=new Date().toISOString(),
  cryptoApi=globalThis.crypto}){
  const signed=canonicalArchiveGrant622(bundle?.payload,now),p=bundle.payload;
  if(!history||history.manifest_sha256!==p.manifest_sha256||
    history.history_sha256!==p.history_sha256||
    history.checkpoint_sha256!==p.checkpoint_sha256||
    history.external_custody_ref!==p.archive_url||
    history.status!=='ORIGINAL_HISTORY_SIGNED_EXTERNAL_ARCHIVE_READBACK_PENDING'||
    !currentHistory?.complete_history_read||
    currentHistory.history_sha256!==p.history_sha256||
    !checkpoint||checkpoint.checkpoint_sha256!==p.checkpoint_sha256||
    checkpoint.status!=='EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING'||
    !ledger||ledger.event_hash!==checkpoint.ledger_head_sha256||
    ledger.sequence!==checkpoint.ledger_sequence||
    !custodian||custodian.custodian_id!==checkpoint.custodian_id||
    custodian.status!=='INDEPENDENTLY_APPROVED'||
    !source||source.original_source_sha256!==history.original_source_sha256||
    source.status!=='INDEPENDENTLY_APPROVED_ORIGINAL_SOURCE'||
    checkpoint.original_issuer_source_sha256!==source.original_source_sha256)
    throw Error('Original source or whole-history external readback drift.');
  exactArchiveUrl622(p.archive_url,custodian.origin);
  const ids=await verifyThree(bundle,signed,{roots,pins,cryptoApi},source.authority_id);
  return {archive_grant_sha256:await sha256(signed,cryptoApi),test_nonce:p.test_nonce,
    original_custodian_verified:true,signers:ids,
    provider_called:false,provider_write:false,release_gate:HOLD_622};
}
export async function fetchOriginalArchive622({url,origin,history,fetchFn=globalThis.fetch,
  cryptoApi=globalThis.crypto}){
  exactArchiveUrl622(url,origin);
  if(!history||!HEX.test(history.manifest_sha256)||!HEX.test(history.history_sha256))
    throw Error('Missing exact independently signed source manifest.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
    const response=await fetchFn(url,{method:'GET',redirect:'manual',credentials:'omit',
      cache:'no-store',signal:controller.signal,headers:{Accept:'application/json'}});
    if(response.status!==200||!/^application\/json(?:\s*;|$)/i.test(
      response.headers.get('content-type')||'')||Number(response.headers.get('content-length')||0)>8192)
      throw Error('External archive did not serve authenticated bounded JSON.');
    const reader=response.body?.getReader();if(!reader)throw Error('No archive body.');
    const chunks=[];let size=0;
    while(true){const {done,value}=await reader.read();if(done)break;
      size+=value.byteLength;if(size>8192){await reader.cancel().catch(()=>{});
        throw Error('Oversized independent archive response.');}chunks.push(value);}
    if(!size)throw Error('Empty archive response.');
    const bytes=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    let payload;try{payload=JSON.parse(raw);}catch{throw Error('Invalid archive JSON.');}
    if(!payload||Array.isArray(payload)||typeof payload!=='object'||
      Object.keys(payload).sort().join(',')!==[...ARCHIVE].sort().join(',')||
      ARCHIVE.some(k=>typeof payload[k]!=='string')||
      payload.format!==ARCHIVE_BYTES_622||
      payload.history_manifest_sha256!==history.manifest_sha256||
      payload.history_sha256!==history.history_sha256||
      payload.counts_sha256!==history.counts_sha256||
      payload.checkpoint_sha256!==history.checkpoint_sha256||
      payload.external_receipt_sha256!==history.external_receipt_sha256||
      payload.ledger_head_sha256!==history.ledger_head_sha256||
      payload.ledger_sequence!==history.ledger_sequence||
      !UTC.test(payload.archived_at)||!Number.isFinite(Date.parse(payload.archived_at))||
      (history.signed_at&&Date.parse(payload.archived_at)<Date.parse(history.signed_at))||
      Date.parse(payload.archived_at)>Date.now()+300000)
      throw Error('External archive bytes differ from original complete source history.');
    return {archive_readback_sha256:await sha256(raw,cryptoApi),
      history_manifest_sha256:history.manifest_sha256,
      status:'EXTERNAL_ARCHIVE_GET_MATCHED_COMPLETE_HISTORY_NO_PROVIDER_AUTHORITY',
      external_archive_bytes_matched:true,external_archive_get_performed:true,
      provider_call_performed:false,provider_write:false,release_gate:HOLD_622};
  }finally{clearTimeout(timer);}
}
export function archiveFailure622(error){
  if(error?.name==='AbortError')return 'TIMEOUT';
  if(error instanceof TypeError)return 'NETWORK_ERROR';
  return 'MISMATCHED_EXTERNAL_BYTES';
}
export async function verifyMetaClosure622(bundle,{grant,attempt,receipt,failure,
  witnessed,archive,history,metaSource,roots,pins,now=new Date().toISOString(),
  cryptoApi=globalThis.crypto}){
  const signed=canonicalMetaClosure622(bundle?.payload,now),p=bundle.payload;
  if(!grant||grant.grant_id!==p.grant_id||grant.test_nonce!==p.test_nonce||
    grant.approval_sha256!==p.meta_approval_sha256||
    grant.expected_page_id!==p.expected_page_id||
    grant.checkpoint_sha256!==p.checkpoint_sha256||
    grant.status!=='INDEPENDENTLY_APPROVED_ONE_META_PAGE_READ'||
    !attempt||attempt.test_nonce!==p.test_nonce||attempt.grant_id!==p.grant_id||
    attempt.status!=='CLAIMED_EXACTLY_ONE_META_PAGE_GET'||
    !receipt||receipt.test_nonce!==p.test_nonce||receipt.receipt_sha256!==p.meta_receipt_sha256||
    receipt.remote_page_id!==p.expected_page_id||
    receipt.status!=='META_PAGE_ID_GET_RECEIPT_PENDING_INDEPENDENT_WITNESS'||failure||
    !witnessed||witnessed.test_nonce!==p.test_nonce||witnessed.grant_id!==p.grant_id||
    witnessed.acceptance_sha256!==p.witness_acceptance_sha256||
    witnessed.receipt_sha256!==p.meta_receipt_sha256||
    witnessed.history_manifest_sha256!==p.history_manifest_sha256||
    witnessed.status!=='WITNESSED_ONE_META_PAGE_ID_GET_NO_CONNECTED_CLAIM'||
    !archive||archive.manifest_sha256!==p.history_manifest_sha256||
    archive.archive_readback_sha256!==p.archive_readback_sha256||
    archive.status!=='EXTERNAL_ARCHIVE_GET_MATCHED_COMPLETE_HISTORY_NO_PROVIDER_AUTHORITY'||
    !history||history.manifest_sha256!==p.history_manifest_sha256||
    history.checkpoint_sha256!==p.checkpoint_sha256||
    !metaSource||metaSource.authority_id!==grant.issuer_authority_id||
    metaSource.original_source_sha256!==grant.original_source_sha256||
    metaSource.status!=='INDEPENDENTLY_APPROVED_ORIGINAL_META_SOURCE')
    throw Error('Original Meta source, genuine GET or external source archive cannot be reconciled.');
  const signers=await verifyThree(bundle,signed,{roots,pins,cryptoApi},grant.issuer_authority_id);
  return {closure_sha256:await sha256(signed,cryptoApi),test_nonce:p.test_nonce,
    signers,genuine_provider_test_receipt_witnessed:true,
    original_external_history_verified:true,status:'ORIGINAL_META_SINGLE_GET_WITNESSED_READ_ONLY_NO_CONNECTION',
    connected:false,provider_write:false,meta_publishing:false,
    release_gate:HOLD_622};
}
