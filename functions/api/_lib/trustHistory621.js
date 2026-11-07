/* Build 621: hash every immutable Etsy history row, then verify independent signatures.
 * An in-app hash is not an external checkpoint, enrollment, or live provider receipt. */
import {sha256} from './trustAuthority614.js';
import {verifySigner616} from './trustCheckpoint616.js';
import {projectFullEtsyHistory620} from './trustAuditMeta620.js';

export const HOLD_621='HOLD_EXTERNAL_HISTORY_ANCHOR_META_ENROLLMENT_AND_ORIGINAL_TEST_WITNESS';
export const HISTORY_621='devilndove-complete-etsy-history-anchor-621-v1';
export const META_ACCEPT_621='devilndove-original-meta-page-get-witness-621-v1';
const HEX=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
const PAGE=/^[0-9]{1,25}$/;
const UTC=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
const TABLES=['dd618_original_test_grants','dd618_provider_test_attempts',
  'dd618_provider_test_outcomes','dd618_provider_test_acceptances',
  'dd619_etsy_failure_custody','dd619_etsy_failure_dispositions'];
const HISTORY_FIELDS=['format','history_sha256','counts_sha256','ledger_head_sha256',
  'ledger_sequence','checkpoint_sha256','original_source_sha256','external_receipt_sha256',
  'external_custody_ref','decision','nonce','issued_at','expires_at'];
const META_FIELDS=['format','grant_id','test_nonce','meta_approval_sha256','receipt_sha256',
  'expected_page_id','checkpoint_sha256','etsy_history_sha256','decision','nonce',
  'issued_at','expires_at'];
const REASONABLE_PAGE_SIZE=128;
const stableRow=row=>JSON.stringify(Object.keys(row).sort().map(key=>[key,row[key]]));

function signedPayload(p,fields,format,now){
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==fields.length||
    fields.some(k=>typeof p[k]!=='string')||Object.keys(p).some(k=>!fields.includes(k))||
    p.format!==format||!ID.test(p.nonce)||p.nonce.length<20||
    !UTC.test(p.issued_at)||!UTC.test(p.expires_at)||
    !Number.isFinite(Date.parse(p.issued_at))||!Number.isFinite(Date.parse(p.expires_at))||
    Date.parse(p.issued_at)>Date.parse(now)+300000||
    Date.parse(p.issued_at)<Date.parse(now)-1800000||
    Date.parse(p.expires_at)<=Date.parse(now)||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>1800000)
    throw Error('Original externally signed decision expired or malformed.');
  return JSON.stringify(Object.fromEntries(fields.map(k=>[k,p[k]])));
}
export function canonicalHistory621(p,now=new Date().toISOString()){
  const signed=signedPayload(p,HISTORY_FIELDS,HISTORY_621,now);
  if(![p.history_sha256,p.counts_sha256,p.ledger_head_sha256,p.checkpoint_sha256,
    p.original_source_sha256,p.external_receipt_sha256].every(x=>HEX.test(x))||
    !/^[1-9][0-9]{0,8}$/.test(p.ledger_sequence)||
    p.decision!=='ATTEST_COMPLETE_IMMUTABLE_ETSY_HISTORY_NO_PROVIDER_ACTION'||
    !/^https:\/\//.test(p.external_custody_ref)||
    p.external_custody_ref.length>220||
    /(?:token|password|secret|bearer|private[_-]?key|api[_-]?key)/i.test(p.external_custody_ref))
    throw Error('Non-original or unsafe Etsy history checkpoint.');
  const url=new URL(p.external_custody_ref);
  if(url.username||url.password||url.search||url.hash)throw Error('Unsafe external custody URL.');
  return signed;
}
export function canonicalMetaAcceptance621(p,now=new Date().toISOString()){
  const signed=signedPayload(p,META_FIELDS,META_ACCEPT_621,now);
  if(!ID.test(p.grant_id)||!ID.test(p.test_nonce)||!PAGE.test(p.expected_page_id)||
    ![p.meta_approval_sha256,p.receipt_sha256,p.checkpoint_sha256,
      p.etsy_history_sha256].every(x=>HEX.test(x))||
    p.decision!=='WITNESS_ONE_ACTUAL_META_PAGE_ID_GET_ONLY_NO_PUBLICATION')
    throw Error('Invalid exact Meta GET original witness scope.');
  return signed;
}
async function independentSignatures(bundle,signed,{roots,pins,cryptoApi}){
  if(!bundle||Object.keys(bundle).sort().join(',')!=='payload,signatures'||
    !Array.isArray(bundle.signatures)||bundle.signatures.length!==3)
    throw Error('Original issuer, separate witness and owner signatures required.');
  const ids=new Set(),fingerprints=new Set();
  for(const role of ['ISSUER','WITNESS','OWNER']){
    const proof=bundle.signatures.find(s=>s?.role===role);
    const fp=await verifySigner616(proof,role,signed,{authority:roots,pins,cryptoApi},ids);
    if(fingerprints.has(fp))throw Error('Reused independent public key.');
    fingerprints.add(fp);
  }
  return [...ids];
}
/* Keyset scan includes ALL historical rows, never last N. The bounded work limit
 * denies signing an incomplete snapshot instead of silently truncating it. */
export async function digestFullHistory621(db,{cryptoApi=globalThis.crypto,
  maxPages=2048}={}){
  if(!db||!Number.isSafeInteger(maxPages)||maxPages<1)throw Error('Missing full history database.');
  const tables=[],ZERO='0'.repeat(64);
  for(const table of TABLES){
    const before=await db.prepare(`SELECT COUNT(*) AS n,MAX(rowid) AS last_id FROM ${table}`).first();
    if(!Number.isSafeInteger(before?.n)||before.n<0)throw Error('History count unavailable.');
    let cursor=0,seen=0,root=ZERO,pages=0;
    while(true){
      if(++pages>maxPages)throw Error('History exceeds bounded full-scan capacity; no signature allowed.');
      const page=await db.prepare(`SELECT rowid AS source_rowid,* FROM ${table}
        WHERE rowid>? ORDER BY rowid LIMIT ${REASONABLE_PAGE_SIZE}`).bind(cursor).all();
      const rows=page?.results;
      if(!Array.isArray(rows)||rows.length>REASONABLE_PAGE_SIZE)
        throw Error('Incomplete history scan.');
      if(!rows.length)break;
      const serialized=rows.map(row=>{
        if(!Number.isSafeInteger(row.source_rowid)||row.source_rowid<=cursor)
          throw Error('Non-monotonic immutable history row identity.');
        cursor=row.source_rowid;return stableRow(row);
      });
      const bytes=serialized.join('\n');
      if(bytes.length>512000)throw Error('History page exceeds safe source size.');
      root=await sha256(root+'\n'+table+'\n'+bytes,cryptoApi);
      seen+=rows.length;
      if(rows.length<REASONABLE_PAGE_SIZE)break;
    }
    const after=await db.prepare(`SELECT COUNT(*) AS n,MAX(rowid) AS last_id FROM ${table}`).first();
    if(before.n!==seen||after?.n!==seen||before.last_id!==after.last_id||
      (seen>0&&cursor!==after.last_id))
      throw Error('Concurrent, incomplete or altered immutable history readback.');
    tables.push({table,rows:seen,root_sha256:root});
  }
  return {history_sha256:await sha256(JSON.stringify({format:HISTORY_621,tables}),cryptoApi),
    tables,complete_history_read:true,external_witness_verified:false,
    provider_contacted:false,provider_write:false};
}
export async function verifyHistoryCheckpoint621(bundle,{snapshot,counts,ledger,checkpoint,
  originalSource,custodian,roots,pins,now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const signed=canonicalHistory621(bundle?.payload,now),p=bundle.payload;
  const reconciliation=projectFullEtsyHistory620(counts);
  const mapping=['grants','attempts','outcomes','acceptances','failures','dispositions'];
  const sameRows=snapshot?.tables?.length===TABLES.length&&
    snapshot.tables.every((t,i)=>t.table===TABLES[i]&&t.rows===counts[mapping[i]]);
  if(!reconciliation.source_record_consistent||!snapshot?.complete_history_read||
    !sameRows||
    snapshot.history_sha256!==p.history_sha256||
    await sha256(JSON.stringify(counts),cryptoApi)!==p.counts_sha256||
    !ledger||ledger.event_hash!==p.ledger_head_sha256||
    String(ledger.sequence)!==p.ledger_sequence||
    !checkpoint||checkpoint.checkpoint_sha256!==p.checkpoint_sha256||
    checkpoint.ledger_head_sha256!==p.ledger_head_sha256||
    String(checkpoint.ledger_sequence)!==p.ledger_sequence||
    checkpoint.original_issuer_source_sha256!==p.original_source_sha256||
    checkpoint.readback_sha256!==p.external_receipt_sha256||
    checkpoint.status!=='EXTERNAL_BYTES_WITNESSED_ORIGINAL_ISSUER_PENDING'||
    !custodian||custodian.custodian_id!==checkpoint.custodian_id||
    custodian.status!=='INDEPENDENTLY_APPROVED'||
    new URL(p.external_custody_ref).origin!==custodian.origin||
    !originalSource||originalSource.original_source_sha256!==p.original_source_sha256||
    originalSource.status!=='INDEPENDENTLY_APPROVED_ORIGINAL_SOURCE')
    throw Error('Complete current source or externally witnessed original custody differs.');
  const signers=await independentSignatures(bundle,signed,{roots,pins,cryptoApi});
  if(!signers.includes(originalSource.authority_id))
    throw Error('Original issuer has not signed exact all-row checkpoint.');
  return {manifest_sha256:await sha256(signed,cryptoApi),history_sha256:p.history_sha256,
    signers,status:'ORIGINAL_HISTORY_SIGNED_EXTERNAL_ARCHIVE_READBACK_PENDING',
    independent_signatures_verified:true,external_archive_readback_verified:false,
    provider_action_authorized:false,release_gate:HOLD_621};
}
export async function verifyMetaWitness621(bundle,{grant,attempt,receipt,failure,
  history,metaSource,roots,pins,now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const signed=canonicalMetaAcceptance621(bundle?.payload,now),p=bundle.payload;
  if(!grant||grant.grant_id!==p.grant_id||grant.test_nonce!==p.test_nonce||
    grant.approval_sha256!==p.meta_approval_sha256||
    grant.checkpoint_sha256!==p.checkpoint_sha256||
    grant.expected_page_id!==p.expected_page_id||
    grant.status!=='INDEPENDENTLY_APPROVED_ONE_META_PAGE_READ'||
    !attempt||attempt.test_nonce!==p.test_nonce||attempt.grant_id!==p.grant_id||
    attempt.status!=='CLAIMED_EXACTLY_ONE_META_PAGE_GET'||
    !receipt||receipt.test_nonce!==p.test_nonce||receipt.receipt_sha256!==p.receipt_sha256||
    receipt.remote_page_id!==p.expected_page_id||
    receipt.status!=='META_PAGE_ID_GET_RECEIPT_PENDING_INDEPENDENT_WITNESS'||failure||
    !history||history.history_sha256!==p.etsy_history_sha256||
    history.checkpoint_sha256!==p.checkpoint_sha256||
    history.status!=='ORIGINAL_HISTORY_SIGNED_EXTERNAL_ARCHIVE_READBACK_PENDING'||
    !metaSource||metaSource.authority_id!==grant.issuer_authority_id||
    metaSource.original_source_sha256!==grant.original_source_sha256||
    metaSource.status!=='INDEPENDENTLY_APPROVED_ORIGINAL_META_SOURCE')
    throw Error('Missing authentic spent one-use Meta GET or original checkpoint evidence.');
  const signers=await independentSignatures(bundle,signed,{roots,pins,cryptoApi});
  if(!signers.includes(grant.issuer_authority_id))
    throw Error('Original Meta issuer has not signed receipt acceptance.');
  return {acceptance_sha256:await sha256(signed,cryptoApi),test_nonce:p.test_nonce,
    witnessed_actual_meta_page_get:true,provider_write:false,meta_publishing:false,
    connected:false,signers,status:'WITNESSED_ONE_META_PAGE_ID_GET_NO_CONNECTED_CLAIM',
    release_gate:HOLD_621};
}
