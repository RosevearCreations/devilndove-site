/* Build 619: reconcile actual immutable Etsy GET records; Meta local permission preflight only. */
import {sha256} from './trustAuthority614.js';
import {verifySigner616} from './trustCheckpoint616.js';

export const HOLD_619='HOLD_ORIGINAL_PROVIDER_RECEIPT_AND_INDEPENDENT_META_AUTHORIZATION';
export const FAILURE_619='devilndove-spent-etsy-get-failure-619-v1';
const HASH=/^[0-9a-f]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_.:-]{3,119}$/;
const UTC=/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/;
const FAILURE_CODES=['TIMEOUT','NETWORK_ERROR','UNVERIFIED_PROVIDER_RESPONSE',
  'RECEIPT_PERSISTENCE_FAILED'];

export function classifyEtsyFailure619(error){
  if(error?.name==='AbortError')return 'TIMEOUT';
  if(error instanceof TypeError)return 'NETWORK_ERROR';
  return 'UNVERIFIED_PROVIDER_RESPONSE';
}
export function canonicalFailure619(p,now=new Date().toISOString()){
  const fields=['format','grant_id','test_nonce','failure_sha256','owner_decision',
    'nonce','issued_at','expires_at'];
  if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).length!==fields.length||Object.keys(p).some(k=>!fields.includes(k))||
    fields.some(k=>typeof p[k]!=='string')||p.format!==FAILURE_619||
    !ID.test(p.grant_id)||!ID.test(p.test_nonce)||!ID.test(p.nonce)||p.nonce.length<20||
    !HASH.test(p.failure_sha256)||p.owner_decision!=='ACKNOWLEDGE_SPENT_NONCE_NO_RETRY' ||
    !UTC.test(p.issued_at)||!UTC.test(p.expires_at)||
    Date.parse(p.issued_at)>Date.parse(now)+300000||
    Date.parse(p.issued_at)<Date.parse(now)-1800000||
    Date.parse(p.expires_at)<=Date.parse(now)||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>1800000)
    throw Error('Expired or altered independent failure disposition.');
  return JSON.stringify(Object.fromEntries(fields.map(k=>[k,p[k]])));
}
export async function failureFingerprint619({grant_id,test_nonce,code},cryptoApi=globalThis.crypto){
  if(!ID.test(grant_id)||!ID.test(test_nonce)||!FAILURE_CODES.includes(code))
    throw Error('Unrecognized one-use provider failure.');
  return sha256(JSON.stringify({build:619,grant_id,test_nonce,
    endpoint:'GET /v3/application/users/me',code}),cryptoApi);
}
export async function verifyFailureDisposition619(input,{failure,attempt,authority,pins,
  now=new Date().toISOString(),cryptoApi=globalThis.crypto}){
  const signed=canonicalFailure619(input?.payload,now),p=input.payload;
  if(!failure||!attempt||failure.test_nonce!==p.test_nonce||
    attempt.test_nonce!==p.test_nonce||attempt.grant_id!==p.grant_id||
    failure.failure_sha256!==p.failure_sha256||
    failure.status!=='SPENT_NONCE_NO_RETRY_PRESERVED'||
    !Array.isArray(input.signatures)||input.signatures.length!==2||
    Object.keys(input).sort().join(',')!=='payload,signatures')
    throw Error('No exact failed genuine one-use attempt to acknowledge.');
  const seen=new Set(),fingerprints=new Set();
  for(const role of ['WITNESS','OWNER']){
    const proof=input.signatures.find(x=>x?.role===role);
    const fp=await verifySigner616(proof,role,signed,{authority,pins,cryptoApi},seen);
    if(fingerprints.has(fp))throw Error('Independent signers share a key.');
    fingerprints.add(fp);
  }
  return {disposition_sha256:await sha256(signed,cryptoApi),test_nonce:p.test_nonce,
    grant_id:p.grant_id,failure_sha256:p.failure_sha256,signer_ids:[...seen],
    status:'WITNESSED_SPENT_NONCE_NO_RETRY',provider_contacted:false,
    retry_authorized:false,provider_write:false,release_gate:HOLD_619};
}
const rows=x=>Array.isArray(x)?x:[];
export function reconcileEtsy619({grants=[],attempts=[],outcomes=[],acceptances=[],
  failures=[],dispositions=[]}={}){
  const matches=(list,key,value)=>rows(list).filter(x=>x?.[key]===value);
  const result=[];let conflictCount=0,spentCount=0,acceptedCount=0;
  for(const grant of rows(grants).slice(0,100)){
    const nonce=grant.test_nonce,attempt=matches(attempts,'test_nonce',nonce);
    const outcome=matches(outcomes,'test_nonce',nonce);
    const failure=matches(failures,'test_nonce',nonce);
    const acceptance=matches(acceptances,'test_nonce',nonce);
    const disposition=matches(dispositions,'test_nonce',nonce);
    const hasAttempt=attempt.length===1&&attempt[0].grant_id===grant.grant_id&&
      attempt[0].status==='CLAIMED_EXACTLY_ONE_GET';
    let state='NOT_EXECUTED';
    if(attempt.length||outcome.length||failure.length||acceptance.length||disposition.length){
      spentCount++;
      const inconsistent=(grant.provider!=='ETSY'||
        grant.status!=='INDEPENDENTLY_APPROVED_SINGLE_READ_ONLY_GET'||
        !hasAttempt||outcome.length>1||failure.length>1||acceptance.length>1||
        disposition.length>1||(outcome.length&&failure.length)||
        (outcome.length&&(!HASH.test(outcome[0]?.provider_receipt_sha256)||
          outcome[0]?.status!=='ETSY_IDENTITY_GET_VERIFIED_PENDING_WITNESS_ACCEPTANCE'||
          !/^[0-9]{1,20}$/.test(String(outcome[0]?.remote_subject_id||''))||
          outcome[0]?.endpoint!=='GET /v3/application/users/me'))||
        (failure.length&&(!HASH.test(failure[0]?.failure_sha256)||
          failure[0]?.status!=='SPENT_NONCE_NO_RETRY_PRESERVED'||
          failure[0]?.grant_id!==grant.grant_id||
          !FAILURE_CODES.includes(failure[0]?.failure_code)))||
        (acceptance.length&&(!outcome.length||
          !HASH.test(acceptance[0]?.acceptance_sha256)||
          acceptance[0]?.status!=='EXACT_GENUINE_ETSY_GET_WITNESSED_NO_PUBLICATION'))||
        (disposition.length&&(!failure.length||
          disposition[0]?.failure_sha256!==failure[0]?.failure_sha256||
          disposition[0]?.status!=='WITNESSED_SPENT_NONCE_NO_RETRY')));
      if(inconsistent){state='CONFLICT_QUARANTINED';conflictCount++;}
      else if(failure.length)state=disposition.length?'FAILED_WITNESSED_NO_RETRY':'FAILED_NO_RETRY_PENDING_WITNESS';
      else if(outcome.length){state=acceptance.length?'GENUINE_GET_WITNESSED':'GENUINE_GET_PENDING_WITNESS';
        if(acceptance.length)acceptedCount++;}
      else state='SPENT_OUTCOME_MISSING_NO_RETRY';
    }
    result.push({grant_id:grant.grant_id,test_nonce:nonce,provider:'ETSY',state,
      spent:state!=='NOT_EXECUTED',retry_allowed:false,
      provider_receipt_sha256:outcome.length===1?outcome[0].provider_receipt_sha256:null,
      failure_sha256:failure.length===1?failure[0].failure_sha256:null});
  }
  const unknown=[...rows(attempts),...rows(outcomes),...rows(failures),
    ...rows(acceptances),...rows(dispositions)].some(row=>
      !rows(grants).some(g=>g.test_nonce===row.test_nonce));
  if(unknown)conflictCount++;
  return {receipts:result,grant_count:rows(grants).length,spent_count:spentCount,
    witnessed_get_count:acceptedCount,conflict_count:conflictCount,
    unlinked_records_detected:unknown,integrity_ok:conflictCount===0,
    all_provider_test_actions_authorized:false,automatic_retry:false,
    production_publish_allowed:false,release_gate:HOLD_619};
}
export function metaReadOnlyPreflight619(connection,now=Date.now()){
  const scopes=(()=>{try{const x=JSON.parse(connection?.scopes_json||'[]');
    return Array.isArray(x)?x.filter(y=>typeof y==='string'):[];}catch{return [];}})();
  const expiry=Date.parse(String(connection?.access_expires_at||''));
  const valid=connection?.provider_key==='meta'&&connection?.connection_status==='connected'&&
    Number.isFinite(expiry)&&expiry>now+120000&&
    typeof connection.remote_subject_id==='string'&&
    /^[0-9]{1,25}$/.test(connection.remote_subject_id);
  const missingPage=['pages_show_list','pages_read_engagement'].filter(x=>!scopes.includes(x));
  const missingIg=['instagram_basic',...missingPage].filter(x=>!scopes.includes(x));
  return {provider:'META',saved_oauth_candidate:!!valid,
    facebook_page_read_candidate:!!valid&&!missingPage.length,
    instagram_professional_read_candidate:!!valid&&!missingIg.length,
    missing_page_scopes:missingPage,missing_instagram_scopes:missingIg,
    provider_api_contacted:false,remote_page_identity_verified:false,
    remote_instagram_identity_verified:false,app_review_verified:false,
    marketplace_api_approved:false,provider_write:false,publishing_enabled:false,
    read_only_challenge_authorized:false,release_gate:HOLD_619};
}
