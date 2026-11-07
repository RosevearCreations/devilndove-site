/* Build 623: externally signed evidence can enable a short-lived, stored-receipt
 * Meta Page identity VIEW. It never unlocks provider GET repetition or publishing. */
import {sha256} from './trustAuthority614.js';
import {verifySigner616} from './trustCheckpoint616.js';

export const HOLD_623='HOLD_ORIGINAL_META_AUTHORITY_ARCHIVE_CONTINUITY_AND_REAL_TEST_WINDOW';
export const COMPLETION_623='devilndove-original-meta-authority-completion-623-v1';
export const CONTINUITY_623='devilndove-independent-history-archive-continuity-623-v1';
export const ACTIVATION_623='devilndove-first-meta-page-id-readonly-test-window-623-v1';
const HASH=/^[a-f0-9]{64}$/,ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
const PAGE=/^[0-9]{1,25}$/;
const UTC=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
const COMPLETION_FIELDS=['format','grant_id','test_nonce','meta_closure_sha256',
  'archive_readback_sha256','issuer_authority_id','original_source_sha256','page_id',
  'scopes_sha256','owner_decision','nonce','issued_at','expires_at'];
const CONTINUITY_FIELDS=['format','history_manifest_sha256','first_archive_nonce',
  'first_readback_sha256','second_archive_nonce','second_readback_sha256',
  'original_source_sha256','owner_decision','nonce','issued_at','expires_at'];
const ACTIVATION_FIELDS=['format','completion_sha256','continuity_sha256',
  'meta_closure_sha256','grant_id','test_nonce','page_id','scopes_sha256',
  'history_manifest_sha256','owner_ledger_head_sha256','owner_decision',
  'nonce','issued_at','expires_at'];

function canonical(p,fields,format,now,ttl=1800000){
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==fields.length||
    Object.keys(p).some(k=>!fields.includes(k))||fields.some(k=>typeof p[k]!=='string')||
    p.format!==format||!ID.test(p.nonce)||p.nonce.length<20||
    !UTC.test(p.issued_at)||!UTC.test(p.expires_at)||
    !Number.isFinite(Date.parse(p.issued_at))||!Number.isFinite(Date.parse(p.expires_at))||
    Date.parse(p.issued_at)>Date.parse(now)+300000||
    Date.parse(p.issued_at)<Date.parse(now)-1800000||
    Date.parse(p.expires_at)<=Date.parse(now)||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>ttl)
    throw Error('Original separately signed authority decision expired or malformed.');
  return JSON.stringify(Object.fromEntries(fields.map(k=>[k,p[k]])));
}
export function canonicalCompletion623(p,now=new Date().toISOString()){
  const signed=canonical(p,COMPLETION_FIELDS,COMPLETION_623,now);
  if(!ID.test(p.grant_id)||!ID.test(p.test_nonce)||!ID.test(p.issuer_authority_id)||
    !PAGE.test(p.page_id)||
    ![p.meta_closure_sha256,p.archive_readback_sha256,p.original_source_sha256,
      p.scopes_sha256].every(x=>HASH.test(x))||
    p.owner_decision!=='COMPLETE_ORIGINAL_META_CUSTODY_FOR_ONE_READ_ONLY_TEST_WINDOW')
    throw Error('Original Meta issuer completion scope is invalid.');
  return signed;
}
export function canonicalContinuity623(p,now=new Date().toISOString()){
  const signed=canonical(p,CONTINUITY_FIELDS,CONTINUITY_623,now);
  if(!ID.test(p.first_archive_nonce)||!ID.test(p.second_archive_nonce)||
    p.first_archive_nonce===p.second_archive_nonce||
    ![p.history_manifest_sha256,p.first_readback_sha256,p.second_readback_sha256,
      p.original_source_sha256].every(x=>HASH.test(x))||
    p.owner_decision!=='WITNESS_TWO_SEPARATE_ORIGINAL_ARCHIVE_READBACKS_NO_PROVIDER_ACTION')
    throw Error('Independent original archive continuity scope is invalid.');
  return signed;
}
export function canonicalActivation623(p,now=new Date().toISOString()){
  const signed=canonical(p,ACTIVATION_FIELDS,ACTIVATION_623,now,600000);
  if(!ID.test(p.grant_id)||!ID.test(p.test_nonce)||!PAGE.test(p.page_id)||
    ![p.completion_sha256,p.continuity_sha256,p.meta_closure_sha256,
      p.scopes_sha256,p.history_manifest_sha256,p.owner_ledger_head_sha256]
      .every(x=>HASH.test(x))||
    p.owner_decision!=='ONE_SHORT_LIVED_STORED_META_PAGE_ID_READ_ONLY_VIEW_NO_PROVIDER_CALL')
    throw Error('Meta Page identity window cannot authorize broader provider actions.');
  return signed;
}
async function verifyThree623(bundle,signed,{roots,pins,cryptoApi},issuer){
  if(!bundle||Object.keys(bundle).sort().join(',')!=='payload,signatures'||
    !Array.isArray(bundle.signatures)||bundle.signatures.length!==3)
    throw Error('Original issuer, independent witness and owner signatures required.');
  const ids=new Set(),keys=new Set();
  for(const role of ['ISSUER','WITNESS','OWNER']){
    const signer=bundle.signatures.find(x=>x?.role===role);
    if(role==='ISSUER'&&signer?.authority_id!==issuer)
      throw Error('Original source issuer does not match independently approved authority.');
    const fp=await verifySigner616(signer,role,signed,{authority:roots,pins,cryptoApi},ids);
    if(keys.has(fp))throw Error('Original authority witness keys cannot be shared.');
    keys.add(fp);
  }
  return [...ids];
}
export async function verifyOriginalCompletion623(bundle,{grant,closure,archive,metaSource,
  roots,pins,now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const signed=canonicalCompletion623(bundle?.payload,now),p=bundle.payload;
  if(!grant||grant.grant_id!==p.grant_id||grant.test_nonce!==p.test_nonce||
    grant.issuer_authority_id!==p.issuer_authority_id||
    grant.original_source_sha256!==p.original_source_sha256||
    grant.expected_page_id!==p.page_id||grant.scopes_sha256!==p.scopes_sha256||
    grant.status!=='INDEPENDENTLY_APPROVED_ONE_META_PAGE_READ'||
    !closure||closure.closure_sha256!==p.meta_closure_sha256||
    closure.test_nonce!==p.test_nonce||
    closure.archive_readback_sha256!==p.archive_readback_sha256||
    closure.status!=='ORIGINAL_META_SINGLE_GET_WITNESSED_READ_ONLY_NO_CONNECTION'||
    !archive||archive.archive_readback_sha256!==p.archive_readback_sha256||
    archive.status!=='EXTERNAL_ARCHIVE_GET_MATCHED_COMPLETE_HISTORY_NO_PROVIDER_AUTHORITY'||
    !metaSource||metaSource.authority_id!==p.issuer_authority_id||
    metaSource.original_source_sha256!==p.original_source_sha256||
    metaSource.status!=='INDEPENDENTLY_APPROVED_ORIGINAL_META_SOURCE')
    throw Error('Original Meta issuer, witnessed real GET closure or external archive missing.');
  const ids=await verifyThree623(bundle,signed,{roots,pins,cryptoApi},p.issuer_authority_id);
  return {completion_sha256:await sha256(signed,cryptoApi),signers:ids,
    original_authority_evidence_signed:true,root_enrolled_by_application:false,
    provider_connection_activated:false,
    status:'ORIGINAL_META_CUSTODY_SIGNED_PENDING_SEPARATE_ARCHIVE_CONTINUITY',
    release_gate:HOLD_623};
}
export async function verifyArchiveContinuity623(bundle,{history,first,second,
  firstFailure,secondFailure,originalSource,roots,pins,
  now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const signed=canonicalContinuity623(bundle?.payload,now),p=bundle.payload;
  if(!history||history.manifest_sha256!==p.history_manifest_sha256||
    history.original_source_sha256!==p.original_source_sha256||
    history.status!=='ORIGINAL_HISTORY_SIGNED_EXTERNAL_ARCHIVE_READBACK_PENDING'||
    !originalSource||originalSource.original_source_sha256!==p.original_source_sha256||
    originalSource.status!=='INDEPENDENTLY_APPROVED_ORIGINAL_SOURCE'||
    !first||first.test_nonce!==p.first_archive_nonce||
    first.archive_readback_sha256!==p.first_readback_sha256||
    first.manifest_sha256!==p.history_manifest_sha256||
    first.status!=='EXTERNAL_ARCHIVE_GET_MATCHED_COMPLETE_HISTORY_NO_PROVIDER_AUTHORITY'||
    !second||second.test_nonce!==p.second_archive_nonce||
    second.archive_readback_sha256!==p.second_readback_sha256||
    second.manifest_sha256!==p.history_manifest_sha256||
    second.status!=='EXTERNAL_ARCHIVE_GET_MATCHED_COMPLETE_HISTORY_NO_PROVIDER_AUTHORITY'||
    firstFailure||secondFailure||
    !Number.isFinite(Date.parse(first.created_at))||
    !Number.isFinite(Date.parse(second.created_at))||
    Date.parse(second.created_at)<=Date.parse(first.created_at)||
    Date.parse(second.created_at)-Date.parse(first.created_at)<30000)
    throw Error('Two original archive reads with different consumed nonces and chronology required.');
  const ids=await verifyThree623(bundle,signed,{roots,pins,cryptoApi},originalSource.authority_id);
  return {continuity_sha256:await sha256(signed,cryptoApi),signers:ids,
    two_separate_original_archive_receipts:true,provider_call_performed:false,
    status:'TWO_INDEPENDENT_ORIGINAL_ARCHIVE_READBACKS_SIGNED',release_gate:HOLD_623};
}
export async function verifyReadOnlyWindow623(bundle,{completion,continuity,closure,
  history,grant,ledger,meta,liveHistory,roots,pins,now=new Date().toISOString(),
  cryptoApi=globalThis.crypto}){
  const signed=canonicalActivation623(bundle?.payload,now),p=bundle.payload;
  if(!completion||completion.completion_sha256!==p.completion_sha256||
    completion.meta_closure_sha256!==p.meta_closure_sha256||
    ![continuity?.first_readback_sha256,continuity?.second_readback_sha256]
      .includes(completion.archive_readback_sha256)||
    completion.status!=='ORIGINAL_META_CUSTODY_SIGNED_PENDING_SEPARATE_ARCHIVE_CONTINUITY'||
    !continuity||continuity.continuity_sha256!==p.continuity_sha256||
    continuity.history_manifest_sha256!==p.history_manifest_sha256||
    continuity.status!=='TWO_INDEPENDENT_ORIGINAL_ARCHIVE_READBACKS_SIGNED'||
    !closure||closure.closure_sha256!==p.meta_closure_sha256||
    closure.test_nonce!==p.test_nonce||
    closure.archive_readback_sha256!==completion.archive_readback_sha256||
    closure.status!=='ORIGINAL_META_SINGLE_GET_WITNESSED_READ_ONLY_NO_CONNECTION'||
    !history||history.manifest_sha256!==p.history_manifest_sha256||
    !liveHistory?.complete_history_read||liveHistory.history_sha256!==history.history_sha256||
    !grant||grant.grant_id!==p.grant_id||grant.test_nonce!==p.test_nonce||
    grant.expected_page_id!==p.page_id||grant.scopes_sha256!==p.scopes_sha256||
    grant.issuer_authority_id!==completion.issuer_authority_id||
    grant.status!=='INDEPENDENTLY_APPROVED_ONE_META_PAGE_READ'||
    !ledger||ledger.event_hash!==p.owner_ledger_head_sha256||
    !meta||meta.provider_key!=='meta'||meta.remote_subject_id!==p.page_id||
    meta.scopes_sha256!==p.scopes_sha256||meta.page_read_candidate!==true)
    throw Error('Meta identity, archive continuity, signed authority or current ledger drifted.');
  const ids=await verifyThree623(bundle,signed,{roots,pins,cryptoApi},grant.issuer_authority_id);
  return {window_sha256:await sha256(signed,cryptoApi),signers:ids,
    expires_at:p.expires_at,verified_stored_meta_page_identity_view:true,
    status:'META_ORIGINAL_READ_ONLY_STORED_PAGE_ID_TEST_WINDOW',
    provider_get_performed:false,connected:false,provider_write:false,
    publishing_enabled:false,oauth_scopes_changed:false,release_gate:HOLD_623};
}
